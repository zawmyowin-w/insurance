import { useEffect, useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

const STATUS_LABEL = {
  PENDING_TRANSFEREE_SIGNATURE: { label: 'Awaiting Transferee Signature', color: '#d97706', bg: '#fef3c7' },
  PENDING_ADMIN_APPROVAL: { label: 'Awaiting Admin Approval', color: '#1d4ed8', bg: '#eff6ff' },
  APPROVED: { label: 'Approved', color: '#15803d', bg: '#f0fdf4' },
  REJECTED: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2' },
}

export default function AdminPolicyTransfersPage() {
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [actionModal, setActionModal] = useState(null) // { type: 'approve'|'reject', transfer }
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = () => {
    setLoading(true)
    api.get(`/admin/policy-transfers${filter !== 'ALL' ? `?status=${filter}` : ''}`)
      .then(res => setTransfers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setTransfers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [filter])

  const handleAction = async () => {
    if (!actionModal) return
    setSubmitting(true)
    try {
      const endpoint = `/admin/policy-transfers/${actionModal.transfer.id}/${actionModal.type}`
      await api.put(endpoint, { note })
      toast.success(actionModal.type === 'approve' ? 'Transfer approved. Policy ownership transferred.' : 'Transfer rejected.')
      setActionModal(null)
      setNote('')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally { setSubmitting(false) }
  }

  const downloadPdf = (id) => {
    api.get(`/admin/policy-transfers/${id}/pdf`, { responseType: 'blob' })
      .then(res => {
        const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
        const a = document.createElement('a')
        a.href = url; a.download = `transfer_contract_${id}.pdf`; a.click()
        URL.revokeObjectURL(url)
      }).catch(() => toast.error('Failed to download PDF'))
  }

  const pending = transfers.filter(t => t.status === 'PENDING_ADMIN_APPROVAL')

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            <i className="bi bi-arrow-left-right me-2"></i>Policy Ownership Transfers
          </h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Review and approve/reject policy ownership transfer requests
          </p>
        </div>
        {pending.length > 0 && (
          <span style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 20, padding: '4px 14px', fontWeight: 700, fontSize: '0.9rem' }}>
            {pending.length} Pending Approval
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {['ALL', 'PENDING_ADMIN_APPROVAL', 'PENDING_TRANSFEREE_SIGNATURE', 'APPROVED', 'REJECTED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              padding: '0.4rem 1rem', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
              background: filter === s ? 'var(--primary)' : 'var(--bg-secondary)',
              color: filter === s ? 'white' : 'var(--text-secondary)'
            }}>
            {s === 'ALL' ? 'All' : STATUS_LABEL[s]?.label || s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : transfers.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-arrow-left-right" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No transfer requests found</h5>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {transfers.map(t => {
            const s = STATUS_LABEL[t.status] || { label: t.status, color: '#64748b', bg: '#f1f5f9' }
            const isPending = t.status === 'PENDING_ADMIN_APPROVAL'
            return (
              <div key={t.id} className="card-custom" style={isPending ? { borderLeft: '4px solid #1d4ed8' } : {}}>
                <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-2">
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>Transfer #{t.id}</span>
                    <span style={{ marginLeft: 8, fontWeight: 600, color: 'var(--primary)' }}>
                      {t.policyNumber || `Policy #${t.applicationId}`}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginLeft: 8 }}>
                      {t.packageName} ({t.packageType})
                    </span>
                    <span style={{
                      display: 'inline-block', marginLeft: 8, padding: '2px 10px', borderRadius: 20,
                      fontSize: '0.78rem', fontWeight: 600, color: s.color, background: s.bg
                    }}>{s.label}</span>
                  </div>
                  <div className="d-flex gap-2">
                    {(t.status === 'APPROVED' || t.status === 'PENDING_ADMIN_APPROVAL') && (
                      <button onClick={() => downloadPdf(t.id)}
                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '0.3rem 0.8rem', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <i className="bi bi-file-earmark-pdf me-1"></i>PDF
                      </button>
                    )}
                    {isPending && (
                      <>
                        <button onClick={() => { setActionModal({ type: 'approve', transfer: t }); setNote('') }}
                          style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: 6, padding: '0.3rem 0.9rem', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>
                          <i className="bi bi-check-circle me-1"></i>Approve
                        </button>
                        <button onClick={() => { setActionModal({ type: 'reject', transfer: t }); setNote('') }}
                          style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, padding: '0.3rem 0.9rem', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>
                          <i className="bi bi-x-circle me-1"></i>Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Transfer parties */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 2 }}>FROM (Current Owner)</div>
                    <div style={{ fontWeight: 700 }}>{t.fromCustomerName}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{t.fromCustomerEmail}</div>
                    {t.fromSignedAt && <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: 2 }}><i className="bi bi-pen-fill me-1"></i>Signed {new Date(t.fromSignedAt).toLocaleDateString()}</div>}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '1.5rem', color: 'var(--primary)' }}>
                    <i className="bi bi-arrow-right-circle-fill"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 2 }}>TO (New Owner)</div>
                    <div style={{ fontWeight: 700 }}>{t.toCustomerName}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{t.toCustomerEmail}</div>
                    {t.toSignedAt && <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: 2 }}><i className="bi bi-pen-fill me-1"></i>Signed {new Date(t.toSignedAt).toLocaleDateString()}</div>}
                  </div>
                </div>

                <div className="row g-2" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div className="col-sm-4">
                    <span style={{ fontWeight: 600 }}>Relationship: </span>{t.relationship}
                  </div>
                  <div className="col-sm-4">
                    <span style={{ fontWeight: 600 }}>Submitted: </span>
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                  </div>
                  {t.approvedAt && (
                    <div className="col-sm-4">
                      <span style={{ fontWeight: 600 }}>Decided: </span>{new Date(t.approvedAt).toLocaleDateString()}
                      {t.approvedByName && <> by {t.approvedByName}</>}
                    </div>
                  )}
                  <div className="col-12">
                    <span style={{ fontWeight: 600 }}>Reason: </span>{t.reason}
                  </div>
                  {t.adminNote && (
                    <div className="col-12" style={{ color: t.status === 'REJECTED' ? '#dc2626' : '#1d4ed8' }}>
                      <span style={{ fontWeight: 600 }}>Admin note: </span>{t.adminNote}
                    </div>
                  )}
                </div>

                {isPending && (
                  <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: '#fef3c7', borderRadius: 6, fontSize: '0.82rem', color: '#92400e' }}>
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    Both parties have signed. Approving will permanently transfer policy ownership and reassign future payments to the new owner.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Action modal */}
      {actionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, width: '100%', maxWidth: 480, padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h5 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
              {actionModal.type === 'approve' ? '✅ Approve Transfer' : '❌ Reject Transfer'}
            </h5>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {actionModal.type === 'approve'
                ? `This will permanently transfer policy ${actionModal.transfer.policyNumber || `#${actionModal.transfer.applicationId}`} from ${actionModal.transfer.fromCustomerName} to ${actionModal.transfer.toCustomerName}. Future payments will be reassigned to the new owner.`
                : `Rejecting this transfer will notify both parties. The policy will remain with ${actionModal.transfer.fromCustomerName}.`}
            </p>
            <div className="mb-3">
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Admin Note {actionModal.type === 'reject' ? '(required)' : '(optional)'}
              </label>
              <textarea className="form-control" rows={3} value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={actionModal.type === 'approve' ? 'Any notes for the parties...' : 'Reason for rejection...'} />
            </div>
            <div className="d-flex gap-2 justify-content-end">
              <button onClick={() => { setActionModal(null); setNote('') }}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem 1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                Cancel
              </button>
              <button disabled={submitting || (actionModal.type === 'reject' && !note.trim())}
                onClick={handleAction}
                style={{
                  background: actionModal.type === 'approve' ? '#15803d' : '#dc2626', color: 'white',
                  border: 'none', borderRadius: 8, padding: '0.5rem 1.4rem', cursor: 'pointer', fontWeight: 600,
                  opacity: (submitting || (actionModal.type === 'reject' && !note.trim())) ? 0.6 : 1
                }}>
                {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span>Processing...</> :
                  actionModal.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
