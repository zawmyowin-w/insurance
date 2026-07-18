import React, { useEffect, useState, useRef } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import PaymentMethodIcon, { PAYMENT_METHODS as FALLBACK_METHODS } from '../../components/PaymentMethodIcon'
import DigitalSignatureCanvas from '../../components/DigitalSignatureCanvas'

const BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export default function MyPaymentsPage() {
  const [activeTab, setActiveTab] = useState('pending') // 'pending' | 'history'
  const [payments, setPayments] = useState([])
  const [pendingPolicies, setPendingPolicies] = useState([])
  const [payMethods, setPayMethods] = useState([])  // from API
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [payForm, setPayForm] = useState({ applicationId: '', paymentMethod: '', screenshot: null, notes: '' })
  const [paySignature, setPaySignature] = useState(null)
  const paySignatureRef = useRef()
  const [submitting, setSubmitting] = useState(false)

  const fetchData = () => {
    Promise.all([
      api.get('/customer/payments').catch(() => ({ data: [] })),
      api.get('/customer/applications?status=APPROVED').catch(() => ({ data: [] })),
      api.get('/payment-methods/public').catch(() => ({ data: [] })),
    ]).then(([paymentsRes, policiesRes, methodsRes]) => {
      const allPayments = Array.isArray(paymentsRes.data) ? paymentsRes.data : []
      const allApproved = Array.isArray(policiesRes.data) ? policiesRes.data : []
      const dbMethods   = Array.isArray(methodsRes.data)  ? methodsRes.data  : []

      // Find approved policies that have NO pending/verified payment
      const paidAppIds = new Set(
        allPayments
          .filter(p => p.status === 'PENDING' || p.status === 'VERIFIED')
          .map(p => p.applicationId || p.application?.id)
          .filter(Boolean)
      )
      const toPay = allApproved.filter(a => !paidAppIds.has(a.id))

      setPayments(allPayments)
      setPendingPolicies(toPay)
      // Use DB methods if available, else static fallback list
      setPayMethods(dbMethods.length > 0 ? dbMethods : FALLBACK_METHODS.map(m => ({
        id: m.id, methodKey: m.id, name: m.label, color: m.color, hasQr: false, hasLogo: false
      })))
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const openModal = (appId = '') => {
    setPayForm({ applicationId: appId, paymentMethod: '', screenshot: null, notes: '' })
    setPaySignature(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setPaySignature(null)
    if (paySignatureRef.current) paySignatureRef.current.clear?.()
  }

  const handleSubmitPayment = async e => {
    e.preventDefault()
    if (!payForm.applicationId) { toast.error('Policy ရွေးချယ်ပါ'); return }
    if (!payForm.paymentMethod) { toast.error('ငွေပေးချေနည်း ရွေးချယ်ပါ'); return }
    if (!payForm.screenshot)    { toast.error('ငွေပေးချေမှု screenshot upload လုပ်ပါ'); return }
    if (!paySignature)          { toast.error('လက်မှတ်ရေးထိုးပါ — Digital Signature လိုအပ်သည်'); return }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('applicationId', payForm.applicationId)
      fd.append('paymentMethod', payForm.paymentMethod)
      fd.append('screenshot',    payForm.screenshot)
      fd.append('notes',         payForm.notes)
      fd.append('signature',     paySignature)
      await api.post('/customer/payments', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('ငွေပေးချေမှု တင်ပြပြီးပါပြီ! Admin မှ စစ်ဆေးပေးမည်ဖြစ်သည်')
      closeModal()
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit payment')
    } finally { setSubmitting(false) }
  }

  // resolved method object for the currently selected method in the modal
  const selectedMethod = payMethods.find(m => (m.methodKey || m.id) === payForm.paymentMethod)

  const statusColor = s => ({ PENDING: '#d97706', VERIFIED: '#16a34a', REJECTED: '#dc2626' }[s] || '#64748b')
  const statusBg    = s => ({ PENDING: '#fef3c7', VERIFIED: '#dcfce7', REJECTED: '#fee2e2' }[s] || '#f1f5f9')

  // Split payments into tabs
  const historyPayments = payments
  const unpaidPolicies  = pendingPolicies

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Payments</h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Premium ငွေပေးချေမှုများ စီမံပါ
          </p>
        </div>
        {unpaidPolicies.length > 0 && (
          <button className="btn-primary-custom" style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}
            onClick={() => { setActiveTab('pending'); openModal() }}>
            <i className="bi bi-credit-card me-1"></i>Pay Premium
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="d-flex gap-1 mb-4" style={{
        background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 12, width: 'fit-content'
      }}>
        {[
          { key: 'pending', label: 'ငွေပေးချေရမည်', icon: 'bi-clock-history',
            count: unpaidPolicies.length, badgeColor: '#d97706', badgeBg: '#fef3c7' },
          { key: 'history', label: 'Payment History', icon: 'bi-receipt',
            count: historyPayments.length, badgeColor: 'var(--primary)', badgeBg: '#eff6ff' },
        ].map(tab => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.45rem 1.1rem', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.85rem', transition: 'all .15s',
              display: 'flex', alignItems: 'center', gap: 7,
              background: activeTab === tab.key ? 'var(--bg-primary)' : 'transparent',
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
            }}>
            <i className={`bi ${tab.icon}`}></i>
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                background: tab.badgeBg, color: tab.badgeColor,
                borderRadius: 99, fontSize: '0.7rem', fontWeight: 800,
                padding: '0.05rem 0.45rem', minWidth: 20, textAlign: 'center',
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : (
        <>
          {/* ── TAB: ငွေပေးချေရမည် ── */}
          {activeTab === 'pending' && (
            <div className="fade-in">
              {unpaidPolicies.length === 0 ? (
                <div className="card-custom text-center py-5">
                  <i className="bi bi-check-circle" style={{ fontSize: '3rem', color: '#16a34a' }}></i>
                  <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>ငွေပေးချေရမည့် Policy မရှိပါ</h5>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Approved Policy အားလုံး ငွေပေးချေပြီးပါပြီ
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {/* Info banner */}
                  <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 10, padding: '0.75rem 1rem' }}>
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-exclamation-triangle-fill" style={{ color: '#d97706' }}></i>
                      <span style={{ fontWeight: 600, color: '#92400e', fontSize: '0.88rem' }}>
                        {unpaidPolicies.length} ခုသော Approved Policy { unpaidPolicies.length === 1 ? '' : 'များ' } Premium ငွေပေးချေရန် ကျန်သေးသည်
                      </span>
                    </div>
                  </div>

                  {unpaidPolicies.map(policy => (
                    <div key={policy.id} className="card-custom">
                      <div className="row align-items-center g-3">
                        <div className="col-12 col-md-6">
                          <div className="d-flex align-items-center gap-3">
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <i className="bi bi-shield-check" style={{ fontSize: '1.4rem', color: 'var(--primary)' }}></i>
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                                {policy.packageName || 'Insurance Policy'}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Policy #{policy.policyNumber || policy.id}
                                {policy.packageType && <span style={{ marginLeft: 8, background: '#eff6ff', color: 'var(--primary)', padding: '0.1rem 0.4rem', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700 }}>{policy.packageType}</span>}
                              </div>
                              {policy.duration && (
                                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                                  <i className="bi bi-calendar me-1"></i>{policy.duration} year{policy.duration !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="col-12 col-md-3">
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Premium Amount</div>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                            {policy.premiumAmount != null ? `${Number(policy.premiumAmount).toLocaleString()} MMK` : '—'}
                          </div>
                        </div>
                        <div className="col-12 col-md-3 text-md-end">
                          <button className="btn-primary-custom w-100" style={{ justifyContent: 'center', maxWidth: 160 }}
                            onClick={() => openModal(String(policy.id))}>
                            <i className="bi bi-credit-card me-1"></i>Pay Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Payment History ── */}
          {activeTab === 'history' && (
            <div className="fade-in">
              {historyPayments.length === 0 ? (
                <div className="card-custom text-center py-5">
                  <i className="bi bi-receipt" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
                  <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>ငွေပေးချေမှု မှတ်တမ်းမရှိသေးပါ</h5>
                </div>
              ) : (
                <div className="card-custom p-0">
                  <div className="table-custom">
                    <table className="w-100">
                      <thead>
                        <tr>
                          {['#', 'Policy', 'Amount (MMK)', 'Method', 'Status', 'Date', 'Verified By'].map(h => <th key={h}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {historyPayments.map(p => {
                          const method = payMethods.find(m => (m.methodKey || m.id) === p.paymentMethod)
                          return (
                            <tr key={p.id}>
                              <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>#{p.id}</td>
                              <td style={{ fontWeight: 500, maxWidth: 160 }}>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {p.policyName || p.packageName || '—'}
                                </div>
                                {p.policyNumber && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>#{p.policyNumber}</div>}
                              </td>
                              <td style={{ fontWeight: 600 }}>{p.amount != null ? Number(p.amount).toLocaleString() : '—'}</td>
                              <td>
                                {p.paymentMethod ? (
                                  <div className="d-flex align-items-center gap-2">
                                    {method?.hasLogo ? (
                                      <PaymentMethodIcon method={p.paymentMethod} size={22}
                                        logoUrl={`${BASE}/payment-methods/${method.id}/logo`}
                                        color={method.color} label={method.name} />
                                    ) : (
                                      <PaymentMethodIcon method={p.paymentMethod} size={22}
                                        color={method?.color} label={method?.name} />
                                    )}
                                    <span style={{ fontSize: '0.8rem' }}>{method?.name || p.paymentMethod}</span>
                                  </div>
                                ) : <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.paymentType}</span>}
                              </td>
                              <td>
                                <span style={{
                                  fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem',
                                  borderRadius: 99, background: statusBg(p.status), color: statusColor(p.status)
                                }}>{p.status}</span>
                              </td>
                              <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                              </td>
                              <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                                {p.verifiedBy || '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Payment Modal ── */}
      {showModal && (
        <div className="modal show d-block modal-custom" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  <i className="bi bi-credit-card me-2" style={{ color: 'var(--primary)' }}></i>Premium ငွေပေးချေမည်
                </h5>
                <button className="icon-btn" onClick={closeModal}><i className="bi bi-x-lg"></i></button>
              </div>

              <form onSubmit={handleSubmitPayment}>
                <div className="modal-body">
                  {/* Policy select */}
                  <div className="mb-4">
                    <label className="form-label-custom">Policy ရွေးချယ်မည် *</label>
                    <select required className="form-select-custom w-100"
                      value={payForm.applicationId}
                      onChange={e => setPayForm(f => ({ ...f, applicationId: e.target.value }))}>
                      <option value="">Policy ရွေးပါ...</option>
                      {unpaidPolicies.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.packageName || `Policy #${p.id}`}
                          {p.premiumAmount ? ` — ${Number(p.premiumAmount).toLocaleString()} MMK` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Method select */}
                  <div className="mb-4">
                    <label className="form-label-custom">ငွေပေးချေနည်း ရွေးချယ်မည် *</label>
                    <div className="row g-2">
                      {payMethods.map(m => {
                        const key   = m.methodKey || m.id
                        const selected = payForm.paymentMethod === key
                        return (
                          <div key={key} className="col-6 col-sm-4">
                            <button type="button"
                              onClick={() => setPayForm(f => ({ ...f, paymentMethod: key }))}
                              style={{
                                width: '100%', padding: '0.65rem 0.5rem',
                                borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                                border: `2px solid ${selected ? m.color : 'var(--border)'}`,
                                background: selected ? `${m.color}14` : 'var(--bg-secondary)',
                                transition: 'all .15s', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: 6,
                              }}>
                              {m.hasLogo ? (
                                <img src={`${BASE}/payment-methods/${m.id}/logo`} alt={m.name}
                                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${m.color}40` }}
                                  onError={e => e.target.style.display = 'none'} />
                              ) : (
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1rem' }}>
                                  {m.name.charAt(0)}
                                </div>
                              )}
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: selected ? m.color : 'var(--text-primary)' }}>
                                {m.name}
                              </span>
                              {selected && <i className="bi bi-check-circle-fill" style={{ color: m.color, fontSize: '0.85rem' }}></i>}
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    {/* QR Code display */}
                    {selectedMethod && (
                      <div className="fade-in mt-3" style={{
                        borderRadius: 12, padding: '1rem',
                        background: `linear-gradient(135deg, ${selectedMethod.color}12, ${selectedMethod.color}05)`,
                        border: `1.5px solid ${selectedMethod.color}40`,
                        textAlign: 'center',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: '0.75rem' }}>
                          <i className="bi bi-exclamation-circle-fill" style={{ color: selectedMethod.color, fontSize: '1rem' }}></i>
                          <span style={{ fontWeight: 700, color: selectedMethod.color, fontSize: '0.88rem' }}>
                            {selectedMethod.name} QR Code ဖြင့် ငွေပေးချေပါ
                          </span>
                        </div>

                        {selectedMethod.hasQr ? (
                          <div>
                            <img
                              src={`${BASE}/payment-methods/${selectedMethod.id}/qr`}
                              alt={`${selectedMethod.name} QR Code`}
                              style={{
                                maxWidth: 220, maxHeight: 220, borderRadius: 12,
                                border: `2px solid ${selectedMethod.color}40`,
                                background: '#fff', padding: 8,
                              }}
                            />
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
                              QR Code ကိုဖတ်၍ ငွေပေးချေပြီး screenshot ကို အောက်တွင် upload လုပ်ပါ
                            </p>
                          </div>
                        ) : (
                          <div style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <i className="bi bi-qr-code" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem', opacity: 0.3 }}></i>
                            QR Code မရှိသေးပါ — Admin မှ မကြာမီ ထည့်သွင်းပေးမည်
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Screenshot upload */}
                  <div className="mb-3">
                    <label className="form-label-custom">
                      <i className="bi bi-image me-1"></i>ငွေပေးချေမှု Screenshot *
                    </label>
                    <input type="file" accept="image/*" required className="form-control-custom w-100"
                      onChange={e => setPayForm(f => ({ ...f, screenshot: e.target.files[0] }))} />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      ငွေပေးချေပြီးသော {selectedMethod?.name || 'ငွေပေးချေနည်း'} transaction ၏ screenshot ကို upload လုပ်ပါ
                    </small>
                  </div>

                  {/* Notes */}
                  <div className="mb-3">
                    <label className="form-label-custom">မှတ်ချက် (optional)</label>
                    <textarea rows={2} className="form-control-custom w-100" style={{ resize: 'vertical' }}
                      value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Transaction reference, မှတ်ချက် စသည်..." />
                  </div>

                  {/* Digital Signature */}
                  <div className="mb-2">
                    <div style={{ padding: '0.55rem 0.85rem', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: '0.6rem', fontSize: '0.8rem', color: '#1e40af' }}>
                      <i className="bi bi-pen me-2"></i>
                      <strong>Digital Signature</strong> — ငွေပေးချေမှုကို တရားဝင်အတည်ပြုရန် လက်မှတ်ရေးထိုးပါ
                    </div>
                    <DigitalSignatureCanvas
                      ref={paySignatureRef}
                      label="ငွေပေးသူ လက်မှတ်"
                      required
                      onChange={data => setPaySignature(data)}
                      height={140}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-outline-custom" onClick={closeModal}>Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary-custom" style={{ justifyContent: 'center' }}>
                    {submitting
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</>
                      : <><i className="bi bi-send me-2"></i>Submit Payment</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
