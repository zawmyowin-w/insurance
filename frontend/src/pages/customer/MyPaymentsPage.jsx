import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { toast } from 'react-toastify'
import PaymentMethodIcon, { PAYMENT_METHODS } from '../../components/PaymentMethodIcon'

export default function MyPaymentsPage() {
  const { t } = useTranslation()
  const [payments, setPayments] = useState([])
  const [pendingPolicies, setPendingPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [payForm, setPayForm] = useState({ applicationId: '', paymentMethod: '', screenshot: null, notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchData = () => {
    Promise.all([
      api.get('/customer/payments').catch(() => ({ data: [] })),
      api.get('/customer/applications?status=APPROVED&unpaid=true').catch(() => ({ data: [] })),
    ]).then(([paymentsRes, policiesRes]) => {
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : [])
      setPendingPolicies(Array.isArray(policiesRes.data) ? policiesRes.data : [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmitPayment = async e => {
    e.preventDefault()
    if (!payForm.applicationId) { toast.error('Select a policy'); return }
    if (!payForm.paymentMethod) { toast.error('Select a payment method'); return }
    if (!payForm.screenshot) { toast.error('Upload payment proof screenshot'); return }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('applicationId', payForm.applicationId)
      fd.append('paymentMethod', payForm.paymentMethod)
      fd.append('screenshot', payForm.screenshot)
      fd.append('notes', payForm.notes)
      await api.post('/customer/payments', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Payment submitted! Awaiting admin verification.')
      setShowModal(false)
      setPayForm({ applicationId: '', paymentMethod: '', screenshot: null, notes: '' })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit payment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Payments</h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Manage your premium payments</p>
        </div>
        {pendingPolicies.length > 0 && (
          <button className="btn-primary-custom" style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }} onClick={() => setShowModal(true)}>
            <i className="bi bi-credit-card me-1"></i>Pay Premium
          </button>
        )}
      </div>

      {/* Pending payments alert */}
      {pendingPolicies.length > 0 && (
        <div className="mb-4 p-3" style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 10 }}>
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill" style={{ color: '#d97706' }}></i>
            <span style={{ fontWeight: 600, color: '#92400e', fontSize: '0.9rem' }}>
              {pendingPolicies.length} approved {pendingPolicies.length === 1 ? 'policy requires' : 'policies require'} payment to activate
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : payments.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-credit-card" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No payment history</h5>
        </div>
      ) : (
        <div className="card-custom p-0">
          <div className="table-custom">
            <table className="w-100">
              <thead>
                <tr>
                  {['#', 'Policy', 'Amount (MMK)', 'Method', 'Status', 'Submitted', 'Verified By'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>#{p.id}</td>
                    <td style={{ fontWeight: 500 }}>{p.policyName || p.application?.packageName}</td>
                    <td>{p.amount != null ? Number(p.amount).toLocaleString() : '—'}</td>
                    <td>
                      {p.paymentMethod ? (
                        <div className="d-flex align-items-center gap-2">
                          <PaymentMethodIcon method={p.paymentMethod} size={22} />
                          <span style={{ fontSize: '0.8rem' }}>{PAYMENT_METHODS.find(m => m.id === p.paymentMethod)?.label || p.paymentMethod}</span>
                        </div>
                      ) : <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.paymentType}</span>}
                    </td>
                    <td><span className={`badge-status badge-${p.status?.toLowerCase()}`}>{p.status}</span></td>
                    <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{p.verifiedBy || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showModal && (
        <div className="modal show d-block modal-custom" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Submit Premium Payment</h5>
                <button className="icon-btn" onClick={() => setShowModal(false)}><i className="bi bi-x-lg"></i></button>
              </div>
              <form onSubmit={handleSubmitPayment}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label-custom">Select Policy *</label>
                    <select required className="form-select-custom w-100"
                      value={payForm.applicationId}
                      onChange={e => setPayForm(f => ({ ...f, applicationId: e.target.value }))}>
                      <option value="">Choose policy...</option>
                      {pendingPolicies.map(p => (
                        <option key={p.id} value={p.id}>{p.packageName || p.package?.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label-custom">Payment Method *</label>
                    <div className="d-flex gap-2 flex-wrap">
                      {PAYMENT_METHODS.map(m => (
                        <button type="button" key={m.id}
                          onClick={() => setPayForm(f => ({ ...f, paymentMethod: m.id }))}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '0.5rem 0.85rem',
                            borderRadius: 10, cursor: 'pointer', flex: '1 1 30%', minWidth: 110,
                            border: `2px solid ${payForm.paymentMethod === m.id ? m.color : 'var(--border)'}`,
                            background: payForm.paymentMethod === m.id ? `${m.color}14` : 'var(--bg-secondary)',
                          }}>
                          <div className="d-flex align-items-center gap-2">
                            <PaymentMethodIcon method={m.id} size={28} />
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: payForm.paymentMethod === m.id ? m.color : 'var(--text-primary)' }}>{m.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {payForm.paymentMethod && (() => {
                      const meta = PAYMENT_METHODS.find(m => m.id === payForm.paymentMethod)
                      return (
                        <div key={payForm.paymentMethod} className="fade-in mt-2" style={{
                          borderRadius: 12, padding: '0.7rem 0.9rem',
                          background: `linear-gradient(135deg, ${meta.color}1a, ${meta.color}05)`,
                          border: `1px solid ${meta.color}40`,
                        }}>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <PaymentMethodIcon method={meta.id} size={20} />
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: meta.color, letterSpacing: '0.02em' }}>
                              Send payment to this {meta.label} number
                            </span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <input type="text" readOnly value="09458596558"
                              style={{
                                flex: 1, border: `1.5px solid ${meta.color}55`, borderRadius: 8,
                                padding: '0.45rem 0.7rem', fontWeight: 700, fontSize: '0.95rem',
                                letterSpacing: '0.04em', color: meta.color, background: 'var(--bg-primary)',
                                outline: 'none',
                              }} />
                            <button type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText('09458596558')
                                toast.success('Number copied!')
                              }}
                              title="Copy number"
                              style={{
                                border: 'none', borderRadius: 8, width: 36, height: 36,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: meta.color, color: '#fff', cursor: 'pointer',
                                transition: 'transform 0.15s ease',
                              }}
                              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <i className="bi bi-clipboard-check" style={{ fontSize: '0.95rem' }}></i>
                            </button>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                  <div className="mb-3">
                    <label className="form-label-custom">Payment Proof Screenshot *</label>
                    <input type="file" accept="image/*" required className="form-control-custom w-100"
                      onChange={e => setPayForm(f => ({ ...f, screenshot: e.target.files[0] }))} />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Upload the screenshot of your {payForm.paymentMethod ? PAYMENT_METHODS.find(m => m.id === payForm.paymentMethod)?.label : 'mobile payment'} transaction</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label-custom">Notes</label>
                    <textarea rows={2} className="form-control-custom w-100" style={{ resize: 'vertical' }}
                      value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Transaction reference, bank name, etc." />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-outline-custom" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary-custom" style={{ justifyContent: 'center' }}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</> : 'Submit Payment'}
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
