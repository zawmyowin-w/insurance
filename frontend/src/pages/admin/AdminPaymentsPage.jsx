import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { apiError } from '../../utils/apiError'
import PaymentMethodIcon, { PAYMENT_METHODS } from '../../components/PaymentMethodIcon'

export default function AdminPaymentsPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [payments, setPayments] = useState([])
  const [statusCounts, setStatusCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(() => {
    const f = searchParams.get('filter')
    return f && ['ALL','PENDING','VERIFIED','APPROVED','REJECTED'].includes(f) ? f : 'ALL'
  })
  const [actionId, setActionId] = useState(null)
  const [actionNote, setActionNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [screenshotFor, setScreenshotFor] = useState(null)
  const [screenshotUrl, setScreenshotUrl] = useState(null)
  const [screenshotLoading, setScreenshotLoading] = useState(false)
  const [expandedBatch, setExpandedBatch] = useState(null) // batchRef of expanded batch
  const [search, setSearch] = useState('')

  const fetchPayments = () => {
    const allUrl = '/admin/payments'
    const selectedUrl = filter === 'ALL' ? allUrl : `${allUrl}?status=${filter}`
    const selectedRequest = api.get(selectedUrl)
    const allRequest = filter === 'ALL' ? selectedRequest : api.get(allUrl)

    Promise.all([selectedRequest, allRequest])
      .then(([selectedRes, allRes]) => {
        const selectedPayments = Array.isArray(selectedRes.data) ? selectedRes.data : []
        const allPayments = Array.isArray(allRes.data) ? allRes.data : []
        const counts = allPayments.reduce((result, payment) => {
          result.ALL += 1
          result[payment.status] = (result[payment.status] || 0) + 1
          return result
        }, { ALL: 0 })

        setPayments(selectedPayments)
        setStatusCounts(counts)
      })
      .catch(() => {
        setPayments([])
        setStatusCounts({})
      })
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    setLoading(true)
    fetchPayments()
    const refreshInterval = window.setInterval(fetchPayments, 30000)
    return () => window.clearInterval(refreshInterval)
  }, [filter])

  const filtered = search.trim()
    ? payments.filter(p => {
        const q = search.toLowerCase()
        return (
          p.customerName?.toLowerCase().includes(q) ||
          p.policyNumber?.toLowerCase().includes(q) ||
          p.periodLabel?.toLowerCase().includes(q) ||
          p.batchPeriods?.some(bp => bp.periodLabel?.toLowerCase().includes(q))
        )
      })
    : payments

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
      const res = await api.get(`/admin/payments/${payment.id}/screenshot`, { responseType: 'blob' })
      setScreenshotUrl(URL.createObjectURL(res.data))
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

      {/* Period / customer search */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: 8, alignItems: 'center', maxWidth: 440 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}></i>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('payments.periodSearchPlaceholder')}
            style={{ width: '100%', paddingLeft: 32, paddingRight: search ? 32 : 10, height: 36, borderRadius: 20, border: '1.5px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem', padding: 0 }}>
              <i className="bi bi-x-circle-fill"></i>
            </button>
          )}
        </div>
        {search && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filtered.length} {t('admin.common.results') || 'results'}
          </span>
        )}
      </div>

      <div className="d-flex gap-2 mb-4 flex-wrap">
        {[
          { key: 'ALL',      label: t('admin.payments.filterAll') },
          { key: 'PENDING',  label: t('admin.payments.filterPending') },
          { key: 'VERIFIED', label: t('admin.payments.filterVerified') },
          { key: 'REJECTED', label: t('admin.payments.filterRejected') },
        ].map(({ key, label }) => {
          const count = statusCounts[key] || 0
          const isActive = filter === key
          return (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '0.4rem 1rem', borderRadius: 20, border: '1px solid',
             borderColor: isActive ? 'var(--primary)' : 'var(--border)',
             background: isActive ? 'var(--primary)' : 'var(--bg-card)',
             color: isActive ? '#fff' : 'var(--text-secondary)',
             fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
             display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
           }}>
             {label}
             {count > 0 && (
               <span style={{
                 minWidth: 18, height: 18, padding: '0 0.3rem', borderRadius: 99,
                 display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                 background: isActive ? '#fff' : '#dc2626',
                 color: isActive ? 'var(--primary)' : '#fff',
                 fontSize: '0.67rem', fontWeight: 800, lineHeight: 1,
               }}>
                 {count > 99 ? '99+' : count}
               </span>
             )}
           </button>
          )
        })}
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
                    t('admin.payments.tablePeriods'),
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
                {filtered.map(p => {
                  const isBatch = p.batchSize > 1
                  const isBatchExpanded = expandedBatch === p.batchRef

                  return (
                    <tr key={p.batchRef || p.id} style={{ background: isBatch ? 'rgba(59,130,246,0.03)' : undefined }}>
                      {/* ID */}
                      <td style={{ color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        #{p.id}
                        {isBatch && (
                          <div style={{ fontSize: '0.68rem', color: '#3b82f6', fontWeight: 700, marginTop: 1 }}>
                            <i className="bi bi-collection me-1"></i>×{p.batchSize}
                          </div>
                        )}
                      </td>

                      {/* Customer */}
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.customerEmail}</div>
                      </td>

                      {/* Policy */}
                      <td style={{ fontSize: '0.85rem' }}>
                        {p.policyName}
                        <span style={{ color: 'var(--text-muted)' }}> ({p.policyNumber})</span>
                      </td>

                      {/* Periods covered — key new column */}
                      <td style={{ maxWidth: 200 }}>
                        {isBatch ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                              {(isBatchExpanded
                                ? p.batchPeriods
                                : p.batchPeriods.slice(0, 2)
                              ).map((bp, i) => (
                                <span key={i} style={{
                                  fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.45rem',
                                  borderRadius: 6, background: '#eff6ff', color: '#1d4ed8',
                                  border: '1px solid #bfdbfe', whiteSpace: 'nowrap',
                                }}>
                                  {bp.periodLabel || `Period ${bp.periodNumber}`}
                                </span>
                              ))}
                              {!isBatchExpanded && p.batchPeriods.length > 2 && (
                                <button type="button" onClick={() => setExpandedBatch(p.batchRef)}
                                  style={{ fontSize: '0.7rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700 }}>
                                  +{p.batchPeriods.length - 2} {t('admin.payments.more') || 'more'}
                                </button>
                              )}
                              {isBatchExpanded && p.batchPeriods.length > 2 && (
                                <button type="button" onClick={() => setExpandedBatch(null)}
                                  style={{ fontSize: '0.7rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                  {t('admin.payments.collapse') || 'less'}
                                </button>
                              )}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#3b82f6', marginTop: 3, fontWeight: 600 }}>
                              <i className="bi bi-layers me-1"></i>
                              {t('admin.payments.batchPayment') || 'Batch Payment'} · {p.batchSize} {t('admin.payments.periods') || 'periods'}
                            </div>
                          </div>
                        ) : (
                          <span style={{
                            fontSize: '0.78rem', fontWeight: 600, padding: '0.15rem 0.5rem',
                            borderRadius: 6, background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                          }}>
                            {p.periodLabel || (p.periodNumber ? `Period ${p.periodNumber}` : <span style={{ color: 'var(--text-muted)' }}>—</span>)}
                          </span>
                        )}
                      </td>

                      {/* Expected installment amount */}
                      <td style={{ fontSize: '0.85rem' }}>
                        {p.amount != null ? (
                          <div>
                            <div>{Number(p.amount).toLocaleString()} MMK</div>
                            {isBatch && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {t('admin.payments.perPeriod') || 'per period'}
                              </div>
                            )}
                          </div>
                        ) : '—'}
                      </td>

                      {/* Actual transfer amount */}
                      <td style={{ fontSize: '0.85rem' }}>
                        {p.transactionAmount != null ? (
                          <div>
                            <span style={{
                              fontWeight: 700,
                              color: (() => {
                                const expected = isBatch
                                  ? Number(p.amount) * p.batchSize
                                  : Number(p.amount)
                                const actual = Number(p.transactionAmount)
                                return expected > 0 && Math.abs(actual - expected) / expected > 0.01
                                  ? '#dc2626' : '#16a34a'
                              })(),
                            }}>
                              {Number(p.transactionAmount).toLocaleString()} MMK
                            </span>
                            {isBatch && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {t('admin.payments.totalTransferred') || 'total'}
                              </div>
                            )}
                          </div>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>

                      {/* Last 6 digits */}
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

                      {/* Method */}
                      <td>
                        {p.paymentMethod ? (
                          <div className="d-flex align-items-center gap-2">
                            <PaymentMethodIcon method={p.paymentMethod} size={22} />
                            <span style={{ fontSize: '0.8rem' }}>{PAYMENT_METHODS.find(m => m.id === p.paymentMethod)?.label || p.paymentMethod}</span>
                          </div>
                        ) : '—'}
                      </td>

                      {/* Proof */}
                      <td>
                        {p.hasScreenshot ? (
                          <button className="btn-outline-custom" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }} onClick={() => openScreenshot(p)}>
                            <i className="bi bi-image me-1"></i>{t('admin.payments.viewBtn')}
                          </button>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('admin.payments.noneLabel')}</span>}
                      </td>

                      {/* Status */}
                      <td><span className={`badge-status badge-${p.status?.toLowerCase()}`}>{p.status}</span></td>

                      {/* Date */}
                      <td style={{ fontSize: '0.82rem' }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>

                      {/* Actions */}
                      <td>
                        {p.status === 'PENDING' ? (
                          actionId === (p.batchRef || p.id) ? (
                            <div style={{ minWidth: 200 }}>
                              <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical', fontSize: '0.8rem' }}
                                placeholder={t('admin.payments.notePlaceholder')}
                                value={actionNote} onChange={e => setActionNote(e.target.value)} />
                              {isBatch && (
                                <div style={{ fontSize: '0.72rem', color: '#1d4ed8', background: '#eff6ff', borderRadius: 6, padding: '0.3rem 0.5rem', marginBottom: '0.5rem' }}>
                                  <i className="bi bi-info-circle me-1"></i>
                                  {t('admin.payments.batchActionNote') || `This will apply to all ${p.batchSize} periods in this batch.`}
                                </div>
                              )}
                              <div className="d-flex gap-1">
                                <button className="btn-success-sm" disabled={submitting} onClick={() => handleAction(p.id, 'verify')}>{t('admin.payments.verify')}</button>
                                <button className="btn-danger-sm" disabled={submitting} onClick={() => handleAction(p.id, 'reject')}>{t('admin.payments.reject')}</button>
                                <button className="btn-outline-custom" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }} onClick={() => { setActionId(null); setActionNote('') }}>{t('admin.common.cancel')}</button>
                              </div>
                            </div>
                          ) : (
                            <button className="btn-outline-custom" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
                              onClick={() => setActionId(p.batchRef || p.id)}>
                              {t('admin.payments.reviewBtn')}
                            </button>
                          )
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.verifiedBy || '—'}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Screenshot + transaction detail modal */}
      {screenshotFor && (
        <div className="modal show d-block modal-custom" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 580 }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {t('admin.payments.proofModalTitle')} — #{screenshotFor.id}
                  {screenshotFor.batchSize > 1 && (
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#3b82f6', marginLeft: 8 }}>
                      <i className="bi bi-collection me-1"></i>Batch ×{screenshotFor.batchSize}
                    </span>
                  )}
                </h5>
                <button className="icon-btn" onClick={closeScreenshot}><i className="bi bi-x-lg"></i></button>
              </div>

              {/* Periods covered strip (for batches) */}
              {screenshotFor.batchSize > 1 && (
                <div style={{ padding: '0.65rem 1.25rem', background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 700, marginBottom: 4 }}>
                    <i className="bi bi-layers me-1"></i>
                    {t('admin.payments.periodsCovered') || 'Periods covered in this batch'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {screenshotFor.batchPeriods?.map((bp, i) => (
                      <span key={i} style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 6, background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' }}>
                        {bp.periodLabel || `Period ${bp.periodNumber}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
                    <code style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--text-primary)', background: 'var(--bg-card)', padding: '0.2rem 0.55rem', borderRadius: 6, display: 'inline-block' }}>
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
                      color: (() => {
                        const expected = screenshotFor.batchSize > 1
                          ? Number(screenshotFor.amount) * screenshotFor.batchSize
                          : Number(screenshotFor.amount)
                        const actual = Number(screenshotFor.transactionAmount)
                        return expected > 0 && Math.abs(actual - expected) / expected > 0.01 ? '#dc2626' : '#16a34a'
                      })(),
                    }}>
                      {Number(screenshotFor.transactionAmount).toLocaleString()} MMK
                    </span>
                  ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>}
                  {screenshotFor.amount != null && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
                      {t('admin.payments.tableAmount')}: {Number(screenshotFor.amount).toLocaleString()} MMK
                      {screenshotFor.batchSize > 1 && ` × ${screenshotFor.batchSize} = ${(Number(screenshotFor.amount) * screenshotFor.batchSize).toLocaleString()} MMK`}
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
