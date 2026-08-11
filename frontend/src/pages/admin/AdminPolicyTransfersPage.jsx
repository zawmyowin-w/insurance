import { useEffect, useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import { downloadBlob } from '../../utils/download'

const STATUS_LABEL = {
  PENDING_TRANSFEREE_SIGNATURE: { labelKey: 'statusPENDING_TRANSFEREE_SIGNATURE', color: '#d97706', bg: '#fef3c7' },
  PENDING_ADMIN_APPROVAL: { labelKey: 'statusPENDING_ADMIN_APPROVAL', color: '#1d4ed8', bg: '#eff6ff' },
  APPROVED: { labelKey: 'statusAPPROVED', color: '#15803d', bg: '#f0fdf4' },
  REJECTED: { labelKey: 'statusREJECTED', color: '#dc2626', bg: '#fef2f2' },
}

export default function AdminPolicyTransfersPage() {
  const { t } = useTranslation()
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [actionModal, setActionModal] = useState(null)
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
      toast.success(actionModal.type === 'approve' ? t('admin.transfers.approveSuccess') : t('admin.transfers.rejectSuccess'))
      setActionModal(null)
      setNote('')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.transfers.actionFailed'))
    } finally { setSubmitting(false) }
  }

  const downloadPdf = async (id) => {
    try {
      const res = await api.get(`/admin/policy-transfers/${id}/pdf`, { responseType: 'blob' })
      await downloadBlob(res.data, `transfer_contract_${id}.pdf`, 'application/pdf')
    } catch {
      toast.error(t('admin.transfers.pdfFailed'))
    }
  }

  const pending = transfers.filter(t => t.status === 'PENDING_ADMIN_APPROVAL')

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            <i className="bi bi-arrow-left-right me-2"></i>{t('admin.transfers.title')}
          </h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            {t('admin.transfers.subtitle')}
          </p>
        </div>
        {pending.length > 0 && (
          <span style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 20, padding: '4px 14px', fontWeight: 700, fontSize: '0.9rem' }}>
            {pending.length} {t('admin.transfers.approvalPending')}
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {['ALL', 'PENDING_ADMIN_APPROVAL', 'PENDING_TRANSFEREE_SIGNATURE', 'APPROVED', 'REJECTED'].map(s => {
          const label = s === 'ALL' ? t('admin.transfers.tabAll') : t(`admin.transfers.${STATUS_LABEL[s]?.labelKey}`)
          return (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                padding: '0.4rem 1rem', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                background: filter === s ? 'var(--primary)' : 'var(--bg-secondary)',
                color: filter === s ? 'white' : 'var(--text-secondary)'
              }}>
              {label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : transfers.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-arrow-left-right" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{t('admin.transfers.noData')}</h5>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {transfers.map(t => {
            const s = STATUS_LABEL[t.status] || { labelKey: null, color: '#64748b', bg: '#f1f5f9' }
            const isPending = t.status === 'PENDING_ADMIN_APPROVAL'
            const statusLabel = s.labelKey ? t(`admin.transfers.${s.labelKey}`) : t.status
            return (
              <div key={t.id} className="card-custom" style={isPending ? { borderLeft: '4px solid #1d4ed8' } : {}}>
                <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-2">
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{t('admin.transfers.transferId', { id: t.id })}</span>
                    <span style={{ marginLeft: 8, fontWeight: 600, color: 'var(--primary)' }}>
                      {t.policyNumber || `Policy #${t.applicationId}`}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginLeft: 8 }}>
                      {t.packageName} ({t.packageType})
                    </span>
                    <span style={{
                      display: 'inline-block', marginLeft: 8, padding: '2px 10px', borderRadius: 20,
                      fontSize: '0.78rem', fontWeight: 600, color: s.color, background: s.bg
                    }}>{statusLabel}</span>
                  </div>
                  <div className="d-flex gap-2">
                    {(t.status === 'APPROVED' || t.status === 'PENDING_ADMIN_APPROVAL') && (
                      <button onClick={() => downloadPdf(t.id)}
                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '0.3rem 0.8rem', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <i className="bi bi-file-earmark-pdf me-1"></i>{t('admin.transfers.pdfBtn')}
                      </button>
                    )}
                    {isPending && (
                      <>
                        <button onClick={() => { setActionModal({ type: 'approve', transfer: t }); setNote('') }}
                          style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: 6, padding: '0.3rem 0.9rem', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>
                          <i className="bi bi-check-circle me-1"></i>{t('admin.transfers.approveBtn')}
                        </button>
                        <button onClick={() => { setActionModal({ type: 'reject', transfer: t }); setNote('') }}
                          style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, padding: '0.3rem 0.9rem', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>
                          <i className="bi bi-x-circle me-1"></i>{t('admin.transfers.rejectBtn')}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Transfer parties */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 2 }}>{t('admin.transfers.fromLabel')}</div>
                    <div style={{ fontWeight: 700 }}>{t.fromCustomerName}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{t.fromCustomerEmail}</div>
                    {t.fromSignedAt && <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: 2 }}><i className="bi bi-pen-fill me-1"></i>{t('admin.transfers.signedOn', { date: new Date(t.fromSignedAt).toLocaleDateString() })}</div>}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '1.5rem', color: 'var(--primary)' }}>
                    <i className="bi bi-arrow-right-circle-fill"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 2 }}>{t('admin.transfers.toLabel')}</div>
                    <div style={{ fontWeight: 700 }}>{t.toCustomerName}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{t.toCustomerEmail}</div>
                    {t.toSignedAt && <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: 2 }}><i className="bi bi-pen-fill me-1"></i>{t('admin.transfers.signedOn', { date: new Date(t.toSignedAt).toLocaleDateString() })}</div>}
                  </div>
                </div>

                <div className="row g-2" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div className="col-sm-4">
                    <span style={{ fontWeight: 600 }}>{t('admin.transfers.relationship')}: </span>{t.relationship}
                  </div>
                  <div className="col-sm-4">
                    <span style={{ fontWeight: 600 }}>{t('admin.transfers.submitted')}: </span>
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                  </div>
                  {t.approvedAt && (
                    <div className="col-sm-4">
                      <span style={{ fontWeight: 600 }}>{t('admin.transfers.decided')}: </span>{new Date(t.approvedAt).toLocaleDateString()}
                      {t.approvedByName && <> {t('admin.transfers.byLabel')} {t.approvedByName}</>}
                    </div>
                  )}
                  <div className="col-12">
                    <span style={{ fontWeight: 600 }}>{t('admin.transfers.reasonLabel')}: </span>{t.reason}
                  </div>
                  {t.adminNote && (
                    <div className="col-12" style={{ color: t.status === 'REJECTED' ? '#dc2626' : '#1d4ed8' }}>
                      <span style={{ fontWeight: 600 }}>{t('admin.transfers.adminNoteLabel')}: </span>{t.adminNote}
                    </div>
                  )}
                </div>

                {isPending && (
                  <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: '#fef3c7', borderRadius: 6, fontSize: '0.82rem', color: '#92400e' }}>
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    {t('admin.transfers.bothSignedWarning')}
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
              {actionModal.type === 'approve' ? t('admin.transfers.confirmApprove') : t('admin.transfers.confirmReject')}
            </h5>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {actionModal.type === 'approve'
                ? t('admin.transfers.approveConfirmBody', { policy: actionModal.transfer.policyNumber || `#${actionModal.transfer.applicationId}`, from: actionModal.transfer.fromCustomerName, to: actionModal.transfer.toCustomerName })
                : t('admin.transfers.rejectConfirmBody', { from: actionModal.transfer.fromCustomerName })}
            </p>
            <div className="mb-3">
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                {t('admin.transfers.adminNoteLabelModal')} {actionModal.type === 'reject' ? t('admin.transfers.noteRequired') : t('admin.transfers.noteOptional')}
              </label>
              <textarea className="form-control" rows={3} value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={actionModal.type === 'approve' ? t('admin.transfers.noteApprovePlaceholder') : t('admin.transfers.noteRejectPlaceholder')} />
            </div>
            <div className="d-flex gap-2 justify-content-end">
              <button onClick={() => { setActionModal(null); setNote('') }}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem 1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                {t('admin.transfers.cancelBtn')}
              </button>
              <button disabled={submitting || (actionModal.type === 'reject' && !note.trim())}
                onClick={handleAction}
                style={{
                  background: actionModal.type === 'approve' ? '#15803d' : '#dc2626', color: 'white',
                  border: 'none', borderRadius: 8, padding: '0.5rem 1.4rem', cursor: 'pointer', fontWeight: 600,
                  opacity: (submitting || (actionModal.type === 'reject' && !note.trim())) ? 0.6 : 1
                }}>
                {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span>{t('admin.transfers.processing')}</> :
                  actionModal.type === 'approve' ? t('admin.transfers.confirmApprovalBtn') : t('admin.transfers.confirmRejectionBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
