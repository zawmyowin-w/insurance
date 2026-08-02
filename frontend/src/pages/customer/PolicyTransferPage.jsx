import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import DigitalSignatureCanvas from '../../components/DigitalSignatureCanvas'

const STATUS_LABEL = {
  PENDING_TRANSFEREE_SIGNATURE: { label: 'Awaiting Transferee Signature', color: '#d97706', bg: '#fef3c7' },
  PENDING_ADMIN_APPROVAL: { label: 'Awaiting Admin Approval', color: '#1d4ed8', bg: '#eff6ff' },
  APPROVED: { label: 'Approved', color: '#15803d', bg: '#f0fdf4' },
  REJECTED: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2' },
}

export default function PolicyTransferPage() {
  const { t } = useTranslation()
  const [transfers, setTransfers] = useState([])
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(null) // transfer object
  const [submitting, setSubmitting] = useState(false)
  const [emailChecking, setEmailChecking] = useState(false)
  const [emailValid, setEmailValid] = useState(null) // null | true | false
  const [emailName, setEmailName] = useState('')

  const [form, setForm] = useState({ applicationId: '', toEmail: '', relationship: '', reason: '' })
  const [fromSig, setFromSig] = useState(null)
  const fromSigRef = useRef()

  const [toSig, setToSig] = useState(null)
  const toSigRef = useRef()

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get('/customer/policy-transfers'),
      api.get('/customer/applications?status=APPROVED'),
    ]).then(([t, p]) => {
      setTransfers(Array.isArray(t.data) ? t.data : [])
      setPolicies(Array.isArray(p.data) ? p.data : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const checkEmail = async (email) => {
    if (!email || !email.includes('@')) { setEmailValid(null); setEmailName(''); return }
    setEmailChecking(true)
    try {
      const res = await api.get(`/customer/policy-transfers/check-email?email=${encodeURIComponent(email)}`)
      setEmailValid(res.data.valid)
      setEmailName(res.data.name || '')
    } catch { setEmailValid(false); setEmailName('') }
    finally { setEmailChecking(false) }
  }

  const handleEmailBlur = (e) => checkEmail(e.target.value)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fromSig) { toast.error('Please draw your digital signature'); return }
    if (!emailValid) { toast.error('Transferee email is not a valid customer account'); return }
    setSubmitting(true)
    try {
      await api.post('/customer/policy-transfers', { ...form, fromSignature: fromSig })
      toast.success('Transfer request submitted successfully')
      setShowForm(false)
      setForm({ applicationId: '', toEmail: '', relationship: '', reason: '' })
      setFromSig(null)
      setEmailValid(null)
      setEmailName('')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit transfer request')
    } finally { setSubmitting(false) }
  }

  const handleAccept = async () => {
    if (!toSig) { toast.error('Please draw your digital signature to accept'); return }
    setSubmitting(true)
    try {
      await api.put(`/customer/policy-transfers/${showAcceptModal.id}/accept`, { toSignature: toSig })
      toast.success('Transfer accepted and sent to admin for approval')
      setShowAcceptModal(null)
      setToSig(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept transfer')
    } finally { setSubmitting(false) }
  }

  const handleRejectTransferee = async (id) => {
    if (!window.confirm('Are you sure you want to decline this transfer request?')) return
    try {
      await api.put(`/customer/policy-transfers/${id}/reject`)
      toast.success('Transfer declined')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline')
    }
  }

  const downloadPdf = (id) => {
    api.get(`/customer/policy-transfers/${id}/pdf`, { responseType: 'blob' })
      .then(res => {
        const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
        const a = document.createElement('a')
        a.href = url; a.download = `transfer_contract_${id}.pdf`; a.click()
        URL.revokeObjectURL(url)
      }).catch(() => toast.error('Failed to download PDF'))
  }

  const { user } = useAuth()
  const myId = user?.id

  const pendingForMe = transfers.filter(t =>
    t.status === 'PENDING_TRANSFEREE_SIGNATURE' && t.toCustomerId === myId)

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            <i className="bi bi-arrow-left-right me-2"></i>Policy Ownership Transfer
          </h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Transfer your policy ownership to another registered customer
          </p>
        </div>
        <button className="btn-primary-custom" onClick={() => setShowForm(true)}
          style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}>
          <i className="bi bi-plus-circle me-1"></i>New Transfer Request
        </button>
      </div>

      {/* Incoming requests */}
      {pendingForMe.length > 0 && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '0.5rem' }}>
            <i className="bi bi-bell-fill me-2"></i>You have {pendingForMe.length} pending transfer request(s)
          </div>
          {pendingForMe.map(t => (
            <div key={t.id} style={{ background: 'white', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.5rem', border: '1px solid #e0e7ff' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                {t.fromCustomerName} wants to transfer policy <strong>{t.policyNumber || `#${t.applicationId}`}</strong> to you
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Package: {t.packageName} | Relationship: {t.relationship}
              </div>
              <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 600 }}>Reason: </span>{t.reason}
              </div>
              <div className="d-flex gap-2">
                <button className="btn-primary-custom" style={{ fontSize: '0.82rem', padding: '0.35rem 0.9rem' }}
                  onClick={() => setShowAcceptModal(t)}>
                  <i className="bi bi-pen me-1"></i>Accept & Sign
                </button>
                <button onClick={() => handleRejectTransferee(t.id)}
                  style={{ background: 'none', border: '1px solid #dc2626', color: '#dc2626', borderRadius: 6, padding: '0.35rem 0.9rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transfer history */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : transfers.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-arrow-left-right" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No transfer requests yet</h5>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {transfers.map(t => {
            const s = STATUS_LABEL[t.status] || { label: t.status, color: '#64748b', bg: '#f1f5f9' }
            const isSender = t.fromCustomerId === myId
            return (
              <div key={t.id} className="card-custom">
                <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>
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
                  {(t.status === 'APPROVED' || t.status === 'PENDING_ADMIN_APPROVAL') && (
                    <button onClick={() => downloadPdf(t.id)}
                      style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '0.3rem 0.8rem', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <i className="bi bi-file-earmark-pdf me-1"></i>Download Contract
                    </button>
                  )}
                </div>
                <div className="row g-2 mt-1" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div className="col-sm-6">
                    <span style={{ fontWeight: 600 }}>From: </span>{t.fromCustomerName} ({t.fromCustomerEmail})
                  </div>
                  <div className="col-sm-6">
                    <span style={{ fontWeight: 600 }}>To: </span>{t.toCustomerName} ({t.toCustomerEmail})
                  </div>
                  <div className="col-sm-6">
                    <span style={{ fontWeight: 600 }}>Relationship: </span>{t.relationship}
                  </div>
                  <div className="col-sm-6">
                    <span style={{ fontWeight: 600 }}>Submitted: </span>
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                  </div>
                  <div className="col-12">
                    <span style={{ fontWeight: 600 }}>Reason: </span>{t.reason}
                  </div>
                  {t.adminNote && (
                    <div className="col-12" style={{ color: t.status === 'REJECTED' ? '#dc2626' : '#1d4ed8' }}>
                      <span style={{ fontWeight: 600 }}>Admin note: </span>{t.adminNote}
                    </div>
                  )}
                </div>
                <div className="d-flex gap-3 mt-2" style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {t.fromSignedAt && <span><i className="bi bi-pen-fill me-1" style={{ color: '#15803d' }}></i>Original owner signed {new Date(t.fromSignedAt).toLocaleDateString()}</span>}
                  {t.toSignedAt && <span><i className="bi bi-pen-fill me-1" style={{ color: '#15803d' }}></i>Transferee signed {new Date(t.toSignedAt).toLocaleDateString()}</span>}
                  {t.approvedAt && <span><i className="bi bi-check-circle-fill me-1" style={{ color: '#15803d' }}></i>Approved {new Date(t.approvedAt).toLocaleDateString()}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── New Transfer Modal ─────────────────────────────── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, width: '100%', maxWidth: 640, padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 style={{ fontWeight: 700, margin: 0 }}>Policy Ownership Transfer Request</h5>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>×</button>
            </div>

            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#92400e' }}>
              <i className="bi bi-info-circle me-1"></i>
              Once approved by admin, ownership permanently transfers. The new owner takes over all remaining premium payments.
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Select Policy to Transfer <span style={{ color: 'red' }}>*</span></label>
                {policies.length === 0 ? (
                  <div style={{ color: '#dc2626', fontSize: '0.85rem' }}>No approved policies found to transfer.</div>
                ) : (
                  <select className="form-control" value={form.applicationId} required
                    onChange={e => setForm(f => ({ ...f, applicationId: e.target.value }))}>
                    <option value="">— Select a policy —</option>
                    {policies.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.policyNumber || `#${p.id}`} — {p.packageName} ({p.packageType})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="mb-3">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Transferee Email (must be a registered customer) <span style={{ color: 'red' }}>*</span>
                </label>
                <input type="email" className="form-control" required
                  value={form.toEmail}
                  onChange={e => { setForm(f => ({ ...f, toEmail: e.target.value })); setEmailValid(null); setEmailName('') }}
                  onBlur={handleEmailBlur}
                  placeholder="Enter transferee's registered email" />
                {emailChecking && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}><i className="bi bi-hourglass me-1"></i>Checking...</div>}
                {emailValid === true && <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: 4 }}><i className="bi bi-check-circle-fill me-1"></i>Found: <strong>{emailName}</strong></div>}
                {emailValid === false && <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: 4 }}><i className="bi bi-x-circle-fill me-1"></i>No registered customer found with this email</div>}
              </div>

              <div className="mb-3">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Relationship with Transferee <span style={{ color: 'red' }}>*</span></label>
                <select className="form-control" required value={form.relationship}
                  onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}>
                  <option value="">— Select relationship —</option>
                  <option>Spouse</option>
                  <option>Child</option>
                  <option>Parent</option>
                  <option>Sibling</option>
                  <option>Grandchild</option>
                  <option>Other Relative</option>
                  <option>Business Partner</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="mb-3">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Reason for Transfer <span style={{ color: 'red' }}>*</span></label>
                <textarea className="form-control" rows={3} required value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Please explain why you are transferring this policy..." />
              </div>

              <div className="mb-3">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Your Digital Signature <span style={{ color: 'red' }}>*</span></label>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  By signing, you confirm this transfer request and agree to relinquish ownership upon approval.
                </p>
                <DigitalSignatureCanvas ref={fromSigRef} onSave={setFromSig} />
              </div>

              <div className="d-flex gap-2 justify-content-end mt-3">
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem 1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-custom" disabled={submitting || !emailValid}>
                  {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span>Submitting...</> : 'Submit Transfer Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Accept & Sign Modal ────────────────────────────── */}
      {showAcceptModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, width: '100%', maxWidth: 600, padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 style={{ fontWeight: 700, margin: 0 }}>Accept Policy Transfer</h5>
              <button onClick={() => { setShowAcceptModal(null); setToSig(null) }}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>×</button>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <strong>{showAcceptModal.fromCustomerName}</strong> is transferring policy&nbsp;
              <strong>{showAcceptModal.policyNumber || `#${showAcceptModal.applicationId}`}</strong>&nbsp;
              ({showAcceptModal.packageName}) to you. By accepting, you become the new policy owner and take responsibility for future premium payments.
            </div>

            <div className="mb-3" style={{ fontSize: '0.85rem' }}>
              <div><span style={{ fontWeight: 600 }}>Relationship: </span>{showAcceptModal.relationship}</div>
              <div className="mt-1"><span style={{ fontWeight: 600 }}>Reason given: </span>{showAcceptModal.reason}</div>
            </div>

            <div className="mb-3">
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Your Digital Signature to Accept <span style={{ color: 'red' }}>*</span></label>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Sign to confirm you accept this policy transfer and its obligations.
              </p>
              <DigitalSignatureCanvas ref={toSigRef} onSave={setToSig} />
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <button onClick={() => { setShowAcceptModal(null); setToSig(null) }}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem 1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                Cancel
              </button>
              <button className="btn-primary-custom" disabled={submitting} onClick={handleAccept}>
                {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span>Processing...</> : 'Accept & Sign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
