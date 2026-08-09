import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import DigitalSignatureCanvas from '../../components/DigitalSignatureCanvas'

const STATUS_LABEL = {
  PENDING_TRANSFEREE_SIGNATURE: { label: 'customer.statusAwaitingTransferee', color: '#d97706', bg: '#fef3c7' },
  PENDING_ADMIN_APPROVAL: { label: 'customer.statusAwaitingAdmin', color: '#1d4ed8', bg: '#eff6ff' },
  APPROVED: { label: 'customer.statusApproved', color: '#15803d', bg: '#f0fdf4' },
  REJECTED: { label: 'customer.statusRejected', color: '#dc2626', bg: '#fef2f2' },
}

const STATUS_KEY = {
  PENDING_TRANSFEREE_SIGNATURE: 'customer.statusAwaitingTransferee',
  PENDING_ADMIN_APPROVAL: 'customer.statusAwaitingAdmin',
  APPROVED: 'customer.statusApproved',
  REJECTED: 'customer.statusRejected',
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
    if (!fromSig) { toast.error(t('customer.drawSignature')); return }
    if (!emailValid) { toast.error(t('customer.invalidTransfereeEmail')); return }
    setSubmitting(true)
    try {
      await api.post('/customer/policy-transfers', { ...form, fromSignature: fromSig })
      toast.success(t('customer.transferSubmitted'))
      setShowForm(false)
      setForm({ applicationId: '', toEmail: '', relationship: '', reason: '' })
      setFromSig(null)
      setEmailValid(null)
      setEmailName('')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || t('customer.transferFailed'))
    } finally { setSubmitting(false) }
  }

  const handleAccept = async () => {
    if (!toSig) { toast.error(t('customer.drawSignature')); return }
    setSubmitting(true)
    try {
      await api.put(`/customer/policy-transfers/${showAcceptModal.id}/accept`, { toSignature: toSig })
      toast.success(t('customer.transferAccepted'))
      setShowAcceptModal(null)
      setToSig(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || t('customer.acceptFailed'))
    } finally { setSubmitting(false) }
  }

  const handleRejectTransferee = async (id) => {
    if (!window.confirm(t('customer.declineConfirm'))) return
    try {
      await api.put(`/customer/policy-transfers/${id}/reject`)
      toast.success(t('customer.transferDeclined'))
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || t('customer.declineFailed'))
    }
  }

  const downloadPdf = async (id) => {
    try {
      const res = await api.get(`/customer/policy-transfers/${id}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `transfer_contract_${id}.pdf`
      document.body.appendChild(a)
      a.click()
      setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a) }, 200)
    } catch {
      toast.error(t('customer.pdfDownloadFailed'))
    }
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
            <i className="bi bi-arrow-left-right me-2"></i>{t('customer.transferTitle')}
          </h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            {t('customer.transferSubtitle')}
          </p>
        </div>
        <button className="btn-primary-custom" onClick={() => setShowForm(true)}
          style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}>
          <i className="bi bi-plus-circle me-1"></i>{t('customer.newTransfer')}
        </button>
      </div>

      {/* Incoming requests */}
      {pendingForMe.length > 0 && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '0.5rem' }}>
            <i className="bi bi-bell-fill me-2"></i>{t('customer.pendingTransfers', { count: pendingForMe.length })}
          </div>
          {pendingForMe.map(transfer => (
            <div key={transfer.id} style={{ background: 'white', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.5rem', border: '1px solid #e0e7ff' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                {t('customer.wantsToTransfer', { name: transfer.fromCustomerName, policy: transfer.policyNumber || `#${transfer.applicationId}` })}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                {t('customer.package')}: {transfer.packageName} | {t('customer.relationship')}: {transfer.relationship}
              </div>
              <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 600 }}>{t('customer.reason')}: </span>{transfer.reason}
              </div>
              <div className="d-flex gap-2">
                <button className="btn-primary-custom" style={{ fontSize: '0.82rem', padding: '0.35rem 0.9rem' }}
                  onClick={() => setShowAcceptModal(transfer)}>
                  <i className="bi bi-pen me-1"></i>{t('customer.acceptSign')}
                </button>
                <button onClick={() => handleRejectTransferee(transfer.id)}
                  style={{ background: 'none', border: '1px solid #dc2626', color: '#dc2626', borderRadius: 6, padding: '0.35rem 0.9rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                  {t('customer.decline')}
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
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{t('customer.noTransfers')}</h5>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {transfers.map(transfer => {
            const s = STATUS_LABEL[transfer.status] || { label: transfer.status, color: '#64748b', bg: '#f1f5f9' }
            const isSender = transfer.fromCustomerId === myId
            return (
              <div key={transfer.id} className="card-custom">
                <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                      {transfer.policyNumber || `${t('customer.policy')} #${transfer.applicationId}`}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginLeft: 8 }}>
                      {transfer.packageName} ({transfer.packageType})
                    </span>
                    <span style={{
                      display: 'inline-block', marginLeft: 8, padding: '2px 10px', borderRadius: 20,
                      fontSize: '0.78rem', fontWeight: 600, color: s.color, background: s.bg
                    }}>{t(s.label)}</span>
                  </div>
                  {(transfer.status === 'APPROVED' || transfer.status === 'PENDING_ADMIN_APPROVAL') && (
                    <button onClick={() => downloadPdf(transfer.id)}
                      style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '0.3rem 0.8rem', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <i className="bi bi-file-earmark-pdf me-1"></i>{t('customer.downloadContract')}
                    </button>
                  )}
                </div>
                <div className="row g-2 mt-1" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div className="col-sm-6">
                    <span style={{ fontWeight: 600 }}>{t('customer.from')}: </span>{transfer.fromCustomerName} ({transfer.fromCustomerEmail})
                  </div>
                  <div className="col-sm-6">
                    <span style={{ fontWeight: 600 }}>{t('customer.to')}: </span>{transfer.toCustomerName} ({transfer.toCustomerEmail})
                  </div>
                  <div className="col-sm-6">
                    <span style={{ fontWeight: 600 }}>{t('customer.relationship')}: </span>{transfer.relationship}
                  </div>
                  <div className="col-sm-6">
                    <span style={{ fontWeight: 600 }}>{t('customer.submitted')}: </span>
                    {transfer.createdAt ? new Date(transfer.createdAt).toLocaleDateString() : '—'}
                  </div>
                  <div className="col-12">
                    <span style={{ fontWeight: 600 }}>{t('customer.reason')}: </span>{transfer.reason}
                  </div>
                  {transfer.adminNote && (
                    <div className="col-12" style={{ color: transfer.status === 'REJECTED' ? '#dc2626' : '#1d4ed8' }}>
                      <span style={{ fontWeight: 600 }}>{t('customer.adminNote')}: </span>{transfer.adminNote}
                    </div>
                  )}
                </div>
                <div className="d-flex gap-3 mt-2" style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {transfer.fromSignedAt && <span><i className="bi bi-pen-fill me-1" style={{ color: '#15803d' }}></i>{t('customer.originalOwnerSigned')} {new Date(transfer.fromSignedAt).toLocaleDateString()}</span>}
                  {transfer.toSignedAt && <span><i className="bi bi-pen-fill me-1" style={{ color: '#15803d' }}></i>{t('customer.transfereeSigned')} {new Date(transfer.toSignedAt).toLocaleDateString()}</span>}
                  {transfer.approvedAt && <span><i className="bi bi-check-circle-fill me-1" style={{ color: '#15803d' }}></i>{t('customer.approved')} {new Date(transfer.approvedAt).toLocaleDateString()}</span>}
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
              <h5 style={{ fontWeight: 700, margin: 0 }}>{t('customer.transferRequestTitle')}</h5>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>×</button>
            </div>

            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#92400e' }}>
              <i className="bi bi-info-circle me-1"></i>
              {t('customer.transferInfo')}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('customer.selectPolicy')} <span style={{ color: 'red' }}>*</span></label>
                {policies.length === 0 ? (
                  <div style={{ color: '#dc2626', fontSize: '0.85rem' }}>{t('customer.noApprovedPolicies')}</div>
                ) : (
                  <select className="form-control" value={form.applicationId} required
                    onChange={e => setForm(f => ({ ...f, applicationId: e.target.value }))}>
                    <option value="">{t('customer.selectPolicyPlaceholder')}</option>
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
                  {t('customer.transfereeEmail')} <span style={{ color: 'red' }}>*</span>
                </label>
                <input type="email" className="form-control" required
                  value={form.toEmail}
                  onChange={e => { setForm(f => ({ ...f, toEmail: e.target.value })); setEmailValid(null); setEmailName('') }}
                  onBlur={handleEmailBlur}
                  placeholder={t('customer.transfereeEmailPlaceholder')} />
                {emailChecking && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}><i className="bi bi-hourglass me-1"></i>{t('customer.checking')}</div>}
                {emailValid === true && <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: 4 }}><i className="bi bi-check-circle-fill me-1"></i>{t('customer.found')}: <strong>{emailName}</strong></div>}
                {emailValid === false && <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: 4 }}><i className="bi bi-x-circle-fill me-1"></i>{t('customer.noCustomerFound')}</div>}
              </div>

              <div className="mb-3">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('customer.relationshipWith')} <span style={{ color: 'red' }}>*</span></label>
                <select className="form-control" required value={form.relationship}
                  onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}>
                  <option value="">{t('customer.selectRelationship')}</option>
                  <option>{t('customer.spouse')}</option>
                  <option>{t('customer.child')}</option>
                  <option>{t('customer.parent')}</option>
                  <option>{t('customer.sibling')}</option>
                  <option>{t('customer.grandchild')}</option>
                  <option>{t('customer.otherRelative')}</option>
                  <option>{t('customer.businessPartner')}</option>
                  <option>{t('customer.other')}</option>
                </select>
              </div>

              <div className="mb-3">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('customer.reasonForTransfer')} <span style={{ color: 'red' }}>*</span></label>
                <textarea className="form-control" rows={3} required value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder={t('customer.reasonPlaceholder')} />
              </div>

              <div className="mb-3">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>{t('customer.yourSignature')} <span style={{ color: 'red' }}>*</span></label>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  {t('customer.signConfirm')}
                </p>
                <DigitalSignatureCanvas ref={fromSigRef} onChange={setFromSig} />
              </div>

              <div className="d-flex gap-2 justify-content-end mt-3">
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem 1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {t('customer.cancel')}
                </button>
                <button type="submit" className="btn-primary-custom" disabled={submitting || !emailValid}>
                  {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span>{t('customer.submitting')}</> : <><i className="bi bi-send me-1"></i>{t('customer.submitTransfer')}</>}
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
              <h5 style={{ fontWeight: 700, margin: 0 }}>{t('customer.acceptTransferTitle')}</h5>
              <button onClick={() => { setShowAcceptModal(null); setToSig(null) }}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>×</button>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <strong>{showAcceptModal.fromCustomerName}</strong> {t('customer.acceptTransferInfo', { name: showAcceptModal.fromCustomerName, policy: showAcceptModal.policyNumber || `#${showAcceptModal.applicationId}`, package: showAcceptModal.packageName })}
            </div>

              <div className="mb-3" style={{ fontSize: '0.85rem' }}>
                <div><span style={{ fontWeight: 600 }}>{t('customer.relationshipLabel')} </span>{showAcceptModal.relationship}</div>
                <div className="mt-1"><span style={{ fontWeight: 600 }}>{t('customer.reasonGivenLabel')} </span>{showAcceptModal.reason}</div>
              </div>

              <div className="mb-3">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>{t('customer.signToAccept')} <span style={{ color: 'red' }}>*</span></label>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  {t('customer.signAcceptConfirm')}
                </p>
              <DigitalSignatureCanvas ref={toSigRef} onChange={setToSig} />
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <button onClick={() => { setShowAcceptModal(null); setToSig(null) }}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem 1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {t('customer.cancel')}
                </button>
                <button className="btn-primary-custom" disabled={submitting} onClick={handleAccept}>
                  {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span>{t('customer.processing')}</> : <><i className="bi bi-check2-circle me-1"></i>{t('customer.acceptSignBtn')}</>}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

