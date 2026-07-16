import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import { toast } from 'react-toastify'
import PaymentMethodIcon, { PAYMENT_METHODS } from '../../components/PaymentMethodIcon'

export default function AdminPaymentsPage() {
  const [searchParams] = useSearchParams()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(() => {
    const f = searchParams.get('filter')
    return f && ['ALL','PENDING','VERIFIED','APPROVED','REJECTED'].includes(f) ? f : 'PENDING'
  })
  const [actionId, setActionId] = useState(null)
  const [actionNote, setActionNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [screenshotFor, setScreenshotFor] = useState(null)
  const [screenshotUrl, setScreenshotUrl] = useState(null)
  const [screenshotLoading, setScreenshotLoading] = useState(false)

  const fetchPayments = () => {
    api.get(`/admin/payments${filter !== 'ALL' ? `?status=${filter}` : ''}`)
      .then(res => setPayments(Array.isArray(res.data) ? res.data : []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { setLoading(true); fetchPayments() }, [filter])

  const handleAction = async (id, action) => {
    if (action === 'reject' && !actionNote.trim()) { toast.error('Provide a reason for rejection'); return }
    setSubmitting(true)
    try {
      await api.put(`/admin/payments/${id}/${action}`, { note: actionNote })
      toast.success(`Payment ${action === 'verify' ? 'verified' : 'rejected'}`)
      setActionId(null); setActionNote(''); fetchPayments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  const openScreenshot = async (payment) => {
    setScreenshotFor(payment)
    setScreenshotLoading(true)
    try {
      const res = await api.get(`/admin/payments/${payment.id}/screenshot`, { responseType: 'blob' })
      setScreenshotUrl(URL.createObjectURL(res.data))
    } catch {
      toast.error('Failed to load screenshot')
      setScreenshotFor(null)
    } finally {
      setScreenshotLoading(false)
    }
  }

  const closeScreenshot = () => {
    if (screenshotUrl) URL.revokeObjectURL(screenshotUrl)
    setScreenshotUrl(null)
    setScreenshotFor(null)
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Payments Management</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Review mobile payment proofs and verify premium payments</p>
      </div>

      <div className="d-flex gap-2 mb-4 flex-wrap">
        {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '0.4rem 1rem', borderRadius: 20, border: '1px solid',
            borderColor: filter === f ? 'var(--primary)' : 'var(--border)',
            background: filter === f ? 'var(--primary)' : 'var(--bg-card)',
            color: filter === f ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.85rem', cursor: 'pointer',
          }}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : payments.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-credit-card" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No payments found for "{filter}"</h5>
        </div>
      ) : (
        <div className="card-custom p-0">
          <div className="table-custom">
            <table className="w-100">
              <thead>
                <tr>
                  {['#', 'Customer', 'Policy', 'Amount (MMK)', 'Method', 'Proof', 'Status', 'Submitted', 'Actions'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>#{p.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.customerEmail}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{p.policyName} <span style={{ color: 'var(--text-muted)' }}>({p.policyNumber})</span></td>
                    <td>{p.amount != null ? Number(p.amount).toLocaleString() : '—'}</td>
                    <td>
                      {p.paymentMethod ? (
                        <div className="d-flex align-items-center gap-2">
                          <PaymentMethodIcon method={p.paymentMethod} size={22} />
                          <span style={{ fontSize: '0.8rem' }}>{PAYMENT_METHODS.find(m => m.id === p.paymentMethod)?.label || p.paymentMethod}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      {p.hasScreenshot ? (
                        <button className="btn-outline-custom" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }} onClick={() => openScreenshot(p)}>
                          <i className="bi bi-image me-1"></i>View
                        </button>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>}
                    </td>
                    <td><span className={`badge-status badge-${p.status?.toLowerCase()}`}>{p.status}</span></td>
                    <td style={{ fontSize: '0.82rem' }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>
                    <td>
                      {p.status === 'PENDING' ? (
                        actionId === p.id ? (
                          <div style={{ minWidth: 200 }}>
                            <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical', fontSize: '0.8rem' }}
                              placeholder="Note (required to reject)"
                              value={actionNote} onChange={e => setActionNote(e.target.value)} />
                            <div className="d-flex gap-1">
                              <button className="btn-success-sm" disabled={submitting} onClick={() => handleAction(p.id, 'verify')}>Verify</button>
                              <button className="btn-danger-sm" disabled={submitting} onClick={() => handleAction(p.id, 'reject')}>Reject</button>
                              <button className="btn-outline-custom" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }} onClick={() => { setActionId(null); setActionNote('') }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button className="btn-outline-custom" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }} onClick={() => setActionId(p.id)}>
                            Review
                          </button>
                        )
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.verifiedBy || '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {screenshotFor && (
        <div className="modal show d-block modal-custom" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  Payment Proof — #{screenshotFor.id}
                </h5>
                <button className="icon-btn" onClick={closeScreenshot}><i className="bi bi-x-lg"></i></button>
              </div>
              <div className="modal-body text-center">
                {screenshotLoading ? (
                  <div className="spinner-border" style={{ color: 'var(--primary)' }}></div>
                ) : screenshotUrl ? (
                  <img src={screenshotUrl} alt="Payment proof" style={{ maxWidth: '100%', borderRadius: 8 }} />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
