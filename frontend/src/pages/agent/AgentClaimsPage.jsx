import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { toast } from 'react-toastify'
import FormDetailModal from '../../components/FormDetailModal'
import DigitalSignatureCanvas from '../../components/DigitalSignatureCanvas'
import { apiError } from '../../utils/apiError'

const FILTERS = ['ALL', 'PENDING', 'VERIFIED', 'APPROVED', 'REVISION_REQUESTED', 'REJECTED']

export default function AgentClaimsPage() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [claims, setClaims] = useState([])
  const [statusCounts, setStatusCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [rejectId, setRejectId] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [forwardId, setForwardId] = useState(null)
  const [forwardNote, setForwardNote] = useState('')
  const [reviseId, setReviseId] = useState(null)
  const [reviseNote, setReviseNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const [signatureData, setSignatureData] = useState(null)

  const filter = (() => { const f = searchParams.get('filter'); return FILTERS.includes(f) ? f : 'ALL' })()

  const locale = i18n.language
  const CLAIM_STATUS_MAP = {
    PENDING: t('agent.claims.statusPending'),
    VERIFIED: t('agent.claims.statusVerified'),
    APPROVED: t('agent.claims.statusApproved'),
    REVISION_REQUESTED: t('agent.claims.statusRevision'),
    REJECTED: t('agent.claims.statusRejected'),
  }

  const FILTER_LABELS = {
    ALL:                t('agent.apps.filterAll'),
    PENDING:            t('agent.apps.filterPending'),
    VERIFIED:           t('agent.apps.filterVerified'),
    APPROVED:           t('agent.apps.filterApproved'),
    REVISION_REQUESTED: t('agent.apps.filterRevision'),
    REJECTED:           t('agent.apps.filterRejected'),
  }

  const fetchClaims = () => {
    setLoading(true)
    const allUrl = '/agent/claims?status=ALL'
    const selectedUrl = filter !== 'ALL' ? `/agent/claims?status=${filter}` : allUrl
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
    fetchClaims()
    const refreshInterval = window.setInterval(fetchClaims, 30000)
    return () => window.clearInterval(refreshInterval)
  }, [filter])

  const clearActions = () => {
    setSelected(null); setNote('')
    setSignatureData(null)
    setRejectId(null); setRejectNote('')
    setForwardId(null); setForwardNote('')
    setReviseId(null); setReviseNote('')
  }

  const handleRevise = async (id) => {
    if (!reviseNote.trim()) { toast.error(t('agent.claims.reasonRequired')); return }
    setSubmitting(true)
    try {
      await api.put(`/agent/claims/${id}/request-revision`, { note: reviseNote })
      toast.success('Claim sent back to customer for revision.')
      clearActions(); fetchClaims()
    } catch (err) { apiError(err) } finally { setSubmitting(false) }
  }

  const handleVerify = async (id) => {
    if (!signatureData) { toast.error(t('agent.claims.signatureRequired')); return }
    setSubmitting(true)
    try {
      await api.put(`/agent/claims/${id}/verify`, { note, signature: signatureData })
      toast.success(t('agent.claims.verifySuccess'))
      clearActions(); fetchClaims()
    } catch (err) { apiError(err) } finally { setSubmitting(false) }
  }

  const handleReject = async (id) => {
    if (!rejectNote.trim()) { toast.error(t('agent.claims.reasonRequired')); return }
    setSubmitting(true)
    try {
      await api.put(`/agent/claims/${id}/reject`, { note: rejectNote })
      toast.success(t('agent.claims.rejectSuccess'))
      clearActions(); fetchClaims()
    } catch (err) { apiError(err) } finally { setSubmitting(false) }
  }

  const handleForward = async (id) => {
    setSubmitting(true)
    try {
      await api.put(`/agent/claims/${id}/request-revision`, { note: forwardNote })
      toast.success(t('agent.claims.forwardSuccess'))
      clearActions(); fetchClaims()
    } catch (err) { apiError(err) } finally { setSubmitting(false) }
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {t('agent.claims.title')}
        </h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
          {t('agent.claims.subtitle')}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="d-flex gap-2 flex-wrap mb-4">
        {FILTERS.map(f => {
          const count = statusCounts[f] || 0
          const isActive = filter === f
          return (
            <button key={f} onClick={() => setSearchParams(f === 'ALL' ? {} : { filter: f })} style={{
              padding: '0.35rem 0.7rem 0.35rem 0.85rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              border: `1.5px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
              background: isActive ? 'var(--primary)' : 'var(--bg-card)',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem'
            }}>
              {FILTER_LABELS[f] || f}
              {count > 0 && (
                <span style={{
                  minWidth: 18, height: 18, padding: '0 0.3rem', borderRadius: 99,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? '#fff' : '#dc2626', color: isActive ? 'var(--primary)' : '#fff',
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
          <i className="bi bi-check-circle" style={{ fontSize: '3rem', color: 'var(--secondary)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
            {t('agent.claims.empty')}
          </h5>
        </div>
      ) : (
        <div className="row g-4">
          {claims.map(claim => {
            const isRevision = claim.status === 'REVISION_REQUESTED'
            const isPending = claim.status === 'PENDING'
            const activeAction = selected === claim.id ? 'verify'
              : rejectId === claim.id ? 'reject'
              : forwardId === claim.id ? 'forward'
              : reviseId === claim.id ? 'revise'
              : null

            return (
              <div key={claim.id} className="col-12 col-lg-6">
                <div className="card-custom h-100">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {claim.customerName || claim.customer?.name}
                      </h6>
                      <small style={{ color: 'var(--text-muted)' }}>{claim.claimType}</small>
                    </div>
                     <span className={`badge-status badge-${claim.status?.toLowerCase()}`}>{CLAIM_STATUS_MAP[claim.status] || claim.status}</span>
                  </div>

                  {/* Admin revision note */}
                  {isRevision && claim.adminNote && (
                    <div style={{
                      padding: '0.6rem 0.875rem', borderRadius: 8, marginBottom: '0.75rem',
                      background: '#fefce8', border: '1px solid #fcd34d', fontSize: '0.82rem'
                    }}>
                      <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 2 }}>
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        {t('agent.claims.adminRevision')}
                      </div>
                      <div style={{ color: '#78350f' }}>{claim.adminNote}</div>
                    </div>
                  )}
                  {isRevision && claim.agentNote && (
                    <div style={{
                      padding: '0.6rem 0.875rem', borderRadius: 8, marginBottom: '0.75rem',
                      background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '0.82rem'
                    }}>
                      <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 2 }}>
                        <i className="bi bi-person me-1"></i>
                        {t('agent.claims.yourNote')}
                      </div>
                      <div style={{ color: '#1d4ed8' }}>{claim.agentNote}</div>
                    </div>
                  )}

                  <div className="row g-2 mb-3">
                    {[
                      { label: t('agent.claims.policyLabel'),   value: claim.policyName || claim.policy?.packageName },
                      { label: t('agent.claims.amountLabel'),   value: `${Number(claim.amount).toLocaleString(locale)} MMK` },
                       { label: t('agent.claims.incidentLabel'), value: claim.incidentDate ? new Date(claim.incidentDate).toLocaleDateString(locale) : t('formModal.na') },
                       { label: t('agent.claims.submittedLabel'),value: claim.createdAt ? new Date(claim.createdAt).toLocaleDateString(locale) : t('formModal.na') },
                    ].map(item => (
                      <div key={item.label} className="col-6">
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: '0.5rem 0.75rem' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.label}</div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => setViewItem(claim)} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '0.4rem 0.9rem', borderRadius: 8, border: '1.5px solid var(--border)',
                    background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.75rem', width: '100%', justifyContent: 'center'
                  }}>
                    <i className="bi bi-eye"></i>
                    {t('agent.claims.viewForm')}
                  </button>

                  {(isPending || isRevision) && (
                    <>
                      {isPending && activeAction === 'verify' && (
                        <div>
                          <DigitalSignatureCanvas label={t('agent.claims.signatureLabel')} required onChange={setSignatureData} height={120} />
                          <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical' }}
                            placeholder={t('agent.claims.verifyPlaceholder')} value={note} onChange={e => setNote(e.target.value)} />
                          <div className="d-flex gap-2">
                            <button className="btn-success-sm flex-grow-1" onClick={() => handleVerify(claim.id)} disabled={submitting}>
                              {submitting ? <span className="spinner-border spinner-border-sm"></span> : t('agent.claims.markVerified')}
                            </button>
                            <button className="btn-outline-custom" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={clearActions}>{t('agent.claims.cancel')}</button>
                          </div>
                        </div>
                      )}
                      {isPending && activeAction === 'reject' && (
                        <div>
                          <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical' }}
                            placeholder={t('agent.claims.rejectPlaceholder')} value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
                          <div className="d-flex gap-2">
                            <button className="btn-danger-sm flex-grow-1" onClick={() => handleReject(claim.id)} disabled={submitting}>{t('agent.claims.reject')}</button>
                            <button className="btn-outline-custom" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={clearActions}>{t('agent.claims.cancel')}</button>
                          </div>
                        </div>
                      )}
                      {isPending && activeAction === 'revise' && (
                        <div>
                          <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical' }}
                            placeholder="Describe what the customer needs to correct…" value={reviseNote} onChange={e => setReviseNote(e.target.value)} />
                          <div className="d-flex gap-2">
                            <button style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                              onClick={() => handleRevise(claim.id)} disabled={submitting}>
                              {submitting ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-pencil-square me-1"></i>Send for Revision</>}
                            </button>
                            <button className="btn-outline-custom" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={clearActions}>{t('agent.claims.cancel')}</button>
                          </div>
                        </div>
                      )}
                      {isRevision && activeAction === 'forward' && (
                        <div>
                          <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical' }}
                            placeholder={t('agent.claims.forwardPlaceholder')} value={forwardNote} onChange={e => setForwardNote(e.target.value)} />
                          <div className="d-flex gap-2">
                            <button style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: 8, border: 'none', background: '#d97706', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                              onClick={() => handleForward(claim.id)} disabled={submitting}>
                              {submitting ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-send me-1"></i>{t('agent.claims.notifyCustomer')}</>}
                            </button>
                            <button className="btn-outline-custom" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={clearActions}>{t('agent.claims.cancel')}</button>
                          </div>
                        </div>
                      )}
                      {activeAction === null && (
                        <div className="d-flex flex-column gap-2">
                          {isRevision ? (
                            <button onClick={() => setForwardId(claim.id)} style={{
                              width: '100%', padding: '0.5rem', borderRadius: 8, border: 'none',
                              background: '#d97706', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                            }}>
                              <i className="bi bi-send"></i>{t('agent.claims.forwardToCustomer')}
                            </button>
                          ) : (
                            <>
                              <div className="d-flex gap-2">
                                <button onClick={() => { setSelected(claim.id); setSignatureData(null) }} style={{
                                  flex: 1, padding: '0.5rem', borderRadius: 8, border: 'none',
                                  background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                }}>
                                  <i className="bi bi-check-circle"></i>{t('agent.claims.verify')}
                                </button>
                                <button onClick={() => setRejectId(claim.id)} style={{
                                  flex: 1, padding: '0.5rem', borderRadius: 8, border: 'none',
                                  background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                }}>
                                  <i className="bi bi-x-circle"></i>{t('agent.claims.reject')}
                                </button>
                              </div>
                              <button onClick={() => setReviseId(claim.id)} style={{
                                width: '100%', padding: '0.45rem', borderRadius: 8, border: '1.5px solid #7c3aed',
                                background: '#f5f3ff', color: '#7c3aed', fontWeight: 700, fontSize: '0.85rem',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                              }}>
                                <i className="bi bi-pencil-square"></i>Revise (Send to Customer)
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <FormDetailModal
        show={!!viewItem} onClose={() => setViewItem(null)}
        type="claim" item={viewItem} role="agent" />
    </div>
  )
}
