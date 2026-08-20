import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { toast } from 'react-toastify'
import FormDetailModal from '../../components/FormDetailModal'
import DigitalSignatureCanvas from '../../components/DigitalSignatureCanvas'
import { apiError } from '../../utils/apiError'
import PdfDropdownButton from '../../components/PdfDropdownButton'

const STATUS_KEYS = ['ALL', 'PENDING', 'VERIFIED', 'APPROVED', 'REJECTED']

export default function AdminClaimsPage() {
  const { t } = useTranslation()

  const [searchParams] = useSearchParams()
  const [claims, setClaims] = useState([])
  const [statusCounts, setStatusCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(() => {
    const f = searchParams.get('filter')
    return f && STATUS_KEYS.includes(f) ? f : 'ALL'
  })
  const [selected, setSelected] = useState(null)
  const [actionNote, setActionNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const [signatureData, setSignatureData] = useState(null)
  const fetchClaims = () => {
    const allUrl = '/admin/claims'
    const selectedUrl = filter !== 'ALL' ? `${allUrl}?status=${filter}` : allUrl
    const selectedRequest = api.get(selectedUrl)
    const allRequest = filter === 'ALL' ? selectedRequest : api.get(allUrl)

    Promise.all([selectedRequest, allRequest])
      .then(([selectedRes, allRes]) => {
        const selectedClaims = Array.isArray(selectedRes.data) ? selectedRes.data : []
        const allClaims = Array.isArray(allRes.data) ? allRes.data : []
        const counts = allClaims.reduce((result, claim) => {
          result.ALL += 1
          result[claim.status] = (result[claim.status] || 0) + 1
          return result
        }, { ALL: 0 })

        setClaims(selectedClaims)
        setStatusCounts(counts)
      })
      .catch(() => {
        setClaims([])
        setStatusCounts({})
      })
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    setLoading(true)
    fetchClaims()
    const refreshInterval = window.setInterval(fetchClaims, 30000)
    return () => window.clearInterval(refreshInterval)
  }, [filter])

  const handleAction = async (id, action) => {
    if ((action === 'reject' || action === 'revise') && !actionNote.trim()) { toast.error(t('admin.claims.reasonRequired')); return }
    if (action === 'approve' && !signatureData) {
      toast.error(t('admin.claims.signatureRequired')); return
    }
    setSubmitting(true)
    try {
      await api.put(`/admin/claims/${id}/${action}`, {
        note: actionNote,
        ...(action === 'approve' ? { signature: signatureData } : {}),
      })
      toast.success(action === 'approve' ? t('admin.claims.approvedSuccess') : action === 'reject' ? t('admin.claims.rejectedSuccess') : t('admin.claims.revisedSuccess'))
      setSelected(null); setActionNote(''); setSignatureData(null); fetchClaims()
    } catch (err) { apiError(err) } finally { setSubmitting(false) }
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('admin.claims.title')}</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{t('admin.claims.subtitle')}</p>
      </div>
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {STATUS_KEYS.map(f => {
          const count = statusCounts[f] || 0
          const isActive = filter === f
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '0.4rem 0.75rem 0.4rem 1rem', borderRadius: 20, border: '1px solid',
              borderColor: isActive ? 'var(--primary)' : 'var(--border)',
              background: isActive ? 'var(--primary)' : 'var(--bg-card)',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem'
            }}>
              {t(`admin.claims.status_${f}`)}
              {count > 0 && (
                <span style={{
                  minWidth: 18, height: 18, padding: '0 0.3rem', borderRadius: 99,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? '#fff' : '#dc2626',
                  color: isActive ? 'var(--primary)' : '#fff',
                  fontSize: '0.67rem', fontWeight: 800, lineHeight: 1
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
      ) : claims.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-file-earmark-medical" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{t('admin.claims.noFound')} "{filter}"</h5>
        </div>
      ) : (
        <div className="row g-4">
          {claims.map(claim => (
            <div key={claim.id} className="col-12">
              <div className="card-custom">
                <div className="row align-items-start">
                  <div className="col-12 col-md-8">
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <div>
                        <h6 style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          #{claim.id} — {claim.customerName || claim.customer?.name}
                        </h6>
                        <small style={{ color: 'var(--text-muted)' }}>{claim.claimType}</small>
                      </div>
                      <span className={`badge-status badge-${claim.status?.toLowerCase()}`}>{claim.status}</span>
                    </div>
                    <div className="d-flex gap-3 flex-wrap mb-2">
                      {[
                        { label: t('admin.claims.policyLabel'), value: claim.policyName || claim.policy?.packageName },
                        { label: t('admin.claims.claimAmountLabel'), value: `${Number(claim.amount).toLocaleString()} MMK` },
                        claim.coverageAmount ? { label: t('admin.claims.coverageLimitLabel'), value: `${Number(claim.coverageAmount).toLocaleString()} MMK` } : null,
                        { label: t('admin.claims.incidentDateLabel'), value: claim.incidentDate ? new Date(claim.incidentDate).toLocaleDateString() : '—' },
                        { label: t('admin.claims.submittedLabel'), value: claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : '—' },
                        { label: t('admin.claims.claimAgentLabel'), value: claim.agentName || claim.agent?.name || t('admin.common.na') },
                      ].filter(Boolean).map(item => (
                        <div key={item.label} style={{ minWidth: 100 }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.label}</div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setViewItem(claim)} style={{
                      padding: '0.3rem 0.8rem', borderRadius: 7, border: '1.5px solid var(--border)',
                      background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
                      fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4
                    }}>
                      <i className="bi bi-eye"></i> {t('admin.claims.viewDetails')}
                    </button>
                    {claim.agentNote && <p style={{ color: '#1d4ed8', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>{t('admin.claims.agentNote')}: {claim.agentNote}</p>}
                    {claim.status === 'APPROVED' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: '0.6rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.35rem 0.75rem', borderRadius: 8, background: '#f0fdf4', border: '1px solid #86efac', fontSize: '0.82rem', color: '#15803d', fontWeight: 600 }}>
                          <i className="bi bi-arrow-up-right-circle-fill"></i>
                          {t('admin.claims.payout')}: {Number(claim.amount).toLocaleString()} MMK — {t('admin.claims.recorded')}
                        </div>
                        <PdfDropdownButton
                          fetchPdf={() => api.get(`/admin/claims/${claim.id}/payout-voucher`, { responseType: 'blob' }).then(r => r.data)}
                          filename={`payout_voucher_claim_${claim.id}.pdf`}
                          label={t('admin.claims.downloadVoucher')}
                          variant="success"
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                  {claim.status === 'VERIFIED' && (
                    <div className="col-12 col-md-4 mt-3 mt-md-0">
                      {selected === claim.id ? (
                        <div>
                          <DigitalSignatureCanvas
                            label={t('admin.claims.signatureLabel')}
                            required
                            onChange={setSignatureData}
                            height={120}
                          />
                          <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical' }}
                            placeholder={t('admin.claims.notePlaceholder')} value={actionNote} onChange={e => setActionNote(e.target.value)} />
                          <div className="d-flex gap-1 flex-wrap">
                            <button className="btn-success-sm" onClick={() => handleAction(claim.id, 'approve')} disabled={submitting}>
                              {submitting ? <span className="spinner-border spinner-border-sm"></span> : `✓ ${t('admin.common.approve')}`}
                            </button>
                            <button className="btn-danger-sm" onClick={() => handleAction(claim.id, 'reject')} disabled={submitting}>✗ {t('admin.common.reject')}</button>
                            <button style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 0.7rem', fontSize: '0.82rem', cursor: 'pointer' }}
                              onClick={() => handleAction(claim.id, 'revise')} disabled={submitting}>↩ {t('admin.common.revise')}</button>
                            <button className="btn-outline-custom" style={{ padding: '0.3rem 0.6rem', fontSize: '0.82rem' }} onClick={() => setSelected(null)}>{t('admin.common.cancel')}</button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn-primary-custom" style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                           onClick={() => { setSelected(claim.id); setActionNote(''); setSignatureData(null) }}>
                          {t('admin.claims.reviewClaim')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormDetailModal
        show={!!viewItem} onClose={() => setViewItem(null)}
        type="claim" item={viewItem} role="admin" />
    </div>
  )
}
