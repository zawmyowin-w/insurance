import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { apiError } from '../../utils/apiError'
import { fetchBlobUrl } from '../../utils/download'
import PaymentMethodIcon, { PAYMENT_METHODS } from '../../components/PaymentMethodIcon'
import { fmtDateIntl, fmtMoney } from '../../utils/format'

export default function AdminPaymentsPage() {
  const { t } = useTranslation()
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
    if (action === 'reject' && !actionNote.trim()) { toast.error(t('admin.payments.rejectionReason')); return }
    setSubmitting(true)
    try {
      await api.put(`/admin/payments/${id}/${action}`, { note: actionNote })
      toast.success(action === 'verify' ? t('admin.payments.verifiedSuccess') : t('admin.payments.rejectedSuccess'))
      setActionId(null); setActionNote(''); fetchPayments()
    } catch (err) {
      apiError(err)
    } finally {
      setSubmitting(false)
    }
  }

  const openScreenshot = async (payment) => {
    setScreenshotFor(payment)
    setScreenshotLoading(true)
    try {
      setScreenshotUrl(await fetchBlobUrl(`/admin/payments/${payment.id}/screenshot`))
    } catch {
      toast.error(t('admin.payments.screenshotFailed'))
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
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('admin.payments.title')}</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{t('admin.payments.subtitle')}</p>
      </div>

      <div className="d-flex gap-2 mb-4 flex-wrap">
        {[
          { key: 'ALL',      label: t('admin.payments.filterAll') },
          { key: 'PENDING',  label: t('admin.payments.filterPending') },
          { key: 'VERIFIED', label: t('admin.payments.filterVerified') },
          { key: 'REJECTED', label: t('admin.payments.filterRejected') },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '0.4rem 1rem', borderRadius: 20, border: '1px solid',
            borderColor: filter === key ? 'var(--primary)' : 'var(--border)',
            background: filter === key ? 'var(--primary)' : 'var(--bg-card)',
            color: filter === key ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.85rem', cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : payments.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-credit-card" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{t('admin.payments.noFound')} "{filter}"</h5>
        </div>
      ) : (
        <div className="card-custom p-0">
          <div className="table-custom">
            <table className="w-100">
              <thead>
                <tr>
                  {[
                    t('admin.payments.tableId'),
                    t('admin.payments.tableCustomer'),
                    t('admin.payments.tablePolicy'),
                    t('admin.payments.tableAmount'),
                    t('admin.payments.tableTxAmount'),
                    t('admin.payments.tableLastSix'),
                    t('admin.payments.tableMethod'),
                    t('admin.payments.tableProof'),
                    t('admin.payments.tableStatus'),
                    t('admin.payments.tableSubmitted'),
                    t('admin.payments.tableActions'),
                  ].map(h => <th key={h}>{h}</th>)}
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
                    {/* Expected installment amount */}
                    <td style={{ fontSize: '0.85rem' }}>
                      {p.amount != null ? fmtMoney(p.amount) : '—'}
                    </td>
                    {/* Actual transfer amount from customer */}
                    <td style={{ fontSize: '0.85rem' }}>
                      {p.transactionAmount != null ? (
                        <span style={{
                          fontWeight: 700,
                          color: (p.amount != null && Math.abs(Number(p.transactionAmount) - Number(p.amount)) / Number(p.amount) > 0.01)
                            ? '#dc2626' : '#16a34a'
                        }}>
                          {fmtMoney(p.transactionAmount)}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    {/* Last 6 digits of transaction ID */}
                    <td style={{ fontSize: '0.85rem' }}>
                      {p.transactionLastSixDigits ? (
                        <code style={{
                          background: 'var(--bg-secondary)', padding: '0.15rem 0.45rem',
                          borderRadius: 5, fontSize: '0.82rem', fontWeight: 700,
                          color: 'var(--text-primary)', letterSpacing: '0.08em',
                        }}>
                          ···{p.transactionLastSixDigits}
                        </code>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
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
                          <i className="bi bi-image me-1"></i>{t('admin.payments.viewBtn')}
                        </button>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('admin.payments.noneLabel')}</span>}
                    </td>
                    <td><span className={`badge-status badge-${p.status?.toLowerCase()}`}>{p.status}</span></td>
                    <td style={{ fontSize: '0.82rem' }}>{fmtDateIntl(p.createdAt, undefined, '—')}</td>
                    <td>
                      {p.status === 'PENDING' ? (
                        actionId === p.id ? (
                          <div style={{ minWidth: 200 }}>
                            <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical', fontSize: '0.8rem' }}
                              placeholder={t('admin.payments.notePlaceholder')}
                              value={actionNote} onChange={e => setActionNote(e.target.value)} />
                            <div className="d-flex gap-1">
                              <button className="btn-success-sm" disabled={submitting} onClick={() => handleAction(p.id, 'verify')}>{t('admin.payments.verify')}</button>
                              <button className="btn-danger-sm" disabled={submitting} onClick={() => handleAction(p.id, 'reject')}>{t('admin.payments.reject')}</button>
                              <button className="btn-outline-custom" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }} onClick={() => { setActionId(null); setActionNote('') }}>{t('admin.common.cancel')}</button>
                            </div>
                          </div>
                        ) : (
                          <button className="btn-outline-custom" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }} onClick={() => setActionId(p.id)}>
                            {t('admin.payments.reviewBtn')}
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

      {/* Screenshot + transaction detail modal */}
      {screenshotFor && (
        <div className="modal show d-block modal-custom" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 560 }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {t('admin.payments.proofModalTitle')} — #{screenshotFor.id}
                </h5>
                <button className="icon-btn" onClick={closeScreenshot}><i className="bi bi-x-lg"></i></button>
              </div>

              {/* Transaction detail summary strip */}
              <div style={{
                display: 'flex', gap: '0.75rem', padding: '0.75rem 1.25rem',
                background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
                flexWrap: 'wrap',
              }}>
                {/* Last 6 digits */}
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('admin.payments.txLastSixLabel')}
                  </div>
                  {screenshotFor.transactionLastSixDigits ? (
                    <code style={{
                      fontSize: '1rem', fontWeight: 800, letterSpacing: '0.12em',
                      color: 'var(--text-primary)', background: 'var(--bg-card)',
                      padding: '0.2rem 0.55rem', borderRadius: 6, display: 'inline-block',
                    }}>
                      ···{screenshotFor.transactionLastSixDigits}
                    </code>
                  ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>}
                </div>

                {/* Transfer amount */}
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('admin.payments.txAmountLabel')}
                  </div>
                  {screenshotFor.transactionAmount != null ? (
                    <span style={{
                      fontSize: '1rem', fontWeight: 800,
                      color: (screenshotFor.amount != null &&
                        Math.abs(Number(screenshotFor.transactionAmount) - Number(screenshotFor.amount)) / Number(screenshotFor.amount) > 0.01)
                        ? '#dc2626' : '#16a34a',
                    }}>
                      {fmtMoney(screenshotFor.transactionAmount)}
                    </span>
                  ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>}
                  {screenshotFor.amount != null && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
                      {t('admin.payments.tableAmount')}: {fmtMoney(screenshotFor.amount)}
                    </div>
                  )}
                </div>

                {/* Payment method */}
                <div style={{ flex: 1, minWidth: 100 }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('admin.payments.method')}
                  </div>
                  {screenshotFor.paymentMethod ? (
                    <div className="d-flex align-items-center gap-1">
                      <PaymentMethodIcon method={screenshotFor.paymentMethod} size={18} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {PAYMENT_METHODS.find(m => m.id === screenshotFor.paymentMethod)?.label || screenshotFor.paymentMethod}
                      </span>
                    </div>
                  ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>}
                </div>

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
