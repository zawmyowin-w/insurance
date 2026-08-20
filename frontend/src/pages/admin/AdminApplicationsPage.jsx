import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { toast } from 'react-toastify'
import FormDetailModal from '../../components/FormDetailModal'
import DigitalSignatureCanvas from '../../components/DigitalSignatureCanvas'
import { apiError } from '../../utils/apiError'

const STATUS_KEYS = ['ALL', 'PENDING', 'VERIFIED', 'APPROVED', 'REJECTED', 'EMERGENCY']

export default function AdminApplicationsPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [apps, setApps] = useState([])
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

  // Cancel policy state
  const [cancelItem, setCancelItem] = useState(null)
  const [cancelNote, setCancelNote] = useState('')
  const [cancelling, setCancelling] = useState(false)

  // Waiver review state
  const [waiverItem, setWaiverItem] = useState(null)
  const [waiverNote, setWaiverNote] = useState('')
  const [waiverSignature, setWaiverSignature] = useState(null)
  const [waiverSubmitting, setWaiverSubmitting] = useState(false)
  const [maturityItem, setMaturityItem] = useState(null)
  const [maturitySignature, setMaturitySignature] = useState(null)
  const [maturitySubmitting, setMaturitySubmitting] = useState(false)

  const statusLabel = (key) => key === 'EMERGENCY' ? '🚨 Emergency' : t(`admin.applications.status_${key}`)

  const fetchApps = () => {
    // EMERGENCY filter: fetch ALL, then client-side filter by emergencyStatus=PENDING
    const allUrl = '/admin/applications'
    const selectedUrl = (filter === 'EMERGENCY' || filter === 'ALL')
      ? allUrl
      : `/admin/applications?status=${filter}`
    const selectedRequest = api.get(selectedUrl)
    const allRequest = (filter === 'EMERGENCY' || filter === 'ALL')
      ? selectedRequest
      : api.get(allUrl)

    Promise.all([selectedRequest, allRequest])
      .then(([selectedRes, allRes]) => {
        let selectedApps = Array.isArray(selectedRes.data) ? selectedRes.data : []
        const allApps = Array.isArray(allRes.data) ? allRes.data : []
        if (filter === 'EMERGENCY') {
          selectedApps = selectedApps.filter(a => a.emergencyStatus === 'PENDING')
        }

        const counts = allApps.reduce((result, app) => {
          result.ALL += 1
          result[app.status] = (result[app.status] || 0) + 1
          if (app.emergencyStatus === 'PENDING') result.EMERGENCY += 1
          return result
        }, { ALL: 0, EMERGENCY: 0 })

        setApps(selectedApps)
        setStatusCounts(counts)
      })
      .catch(() => {
        setApps([])
        setStatusCounts({})
      })
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    setLoading(true)
    fetchApps()
    const refreshInterval = window.setInterval(fetchApps, 30000)
    return () => window.clearInterval(refreshInterval)
  }, [filter])

  const handleWaiverApprove = async (id) => {
    if (!waiverSignature) { toast.error('Admin signature is required'); return }
    setWaiverSubmitting(true)
    try {
      await api.post(`/admin/applications/${id}/waiver/approve`, {
        adminSignature: waiverSignature,
        note: waiverNote.trim() || undefined,
      })
      toast.success('Waiver approved — all remaining premiums have been waived.')
      setWaiverItem(null); setWaiverNote(''); setWaiverSignature(null); fetchApps()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to approve waiver') }
    finally { setWaiverSubmitting(false) }
  }

  const handleWaiverReject = async (id) => {
    setWaiverSubmitting(true)
    try {
      await api.post(`/admin/applications/${id}/waiver/reject`, {
        note: waiverNote.trim() || undefined,
      })
      toast.success('Emergency declaration rejected.')
      setWaiverItem(null); setWaiverNote(''); setWaiverSignature(null); fetchApps()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to reject waiver') }
    finally { setWaiverSubmitting(false) }
  }

  const handleMaturityPayout = async (id) => {
    if (!maturitySignature) { toast.error('Admin signature is required'); return }
    setMaturitySubmitting(true)
    try {
      await api.post(`/admin/applications/${id}/waiver/maturity-payout`, {
        adminSignature: maturitySignature,
      })
      toast.success('Maturity payout issued — claim created and customer notified.')
      setMaturityItem(null); setMaturitySignature(null); fetchApps()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to issue maturity payout') }
    finally { setMaturitySubmitting(false) }
  }

  const handleAction = async (id, action) => {
    if ((action === 'reject' || action === 'revise') && !actionNote.trim()) {
      toast.error(t('admin.applications.reasonRequired')); return
    }
    if (action === 'approve' && !signatureData) {
      toast.error(t('admin.applications.signatureRequired')); return
    }
    setSubmitting(true)
    try {
      await api.put(`/admin/applications/${id}/${action}`, {
        note: actionNote,
        ...(action === 'approve' ? { signature: signatureData } : {}),
      })
      toast.success(
        action === 'approve' ? t('admin.applications.approvedSuccess')
        : action === 'reject' ? t('admin.applications.rejectedSuccess')
        : t('admin.applications.revisedSuccess')
      )
      setSelected(null); setActionNote(''); setSignatureData(null); fetchApps()
    } catch (err) { apiError(err) } finally { setSubmitting(false) }
  }

  const handleCancelPolicy = async () => {
    if (!cancelItem) return
    setCancelling(true)
    try {
      await api.post(`/admin/applications/${cancelItem.id}/cancel-overdue`, {
        note: cancelNote.trim() || undefined,
      })
      toast.success('Policy cancelled successfully.')
      setCancelItem(null); setCancelNote(''); fetchApps()
    } catch (err) { apiError(err) } finally { setCancelling(false) }
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('admin.applications.title')}</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{t('admin.applications.subtitle')}</p>
      </div>

      {/* Status filter buttons */}
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
              {statusLabel(f)}
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
      ) : apps.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-file-earmark-check" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
            {t('admin.applications.noFound')} "{statusLabel(filter)}"
          </h5>
        </div>
      ) : (
        <div className="row g-4">
          {apps.map(app => (
            <div key={app.id} className="col-12">
              <div className="card-custom">
                <div className="row align-items-start">
                  <div className="col-12 col-md-8">
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <div>
                        <h6 style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          #{app.id} — {app.customerName || app.customer?.name}
                        </h6>
                        <small style={{ color: 'var(--text-muted)' }}>{app.customerEmail || app.customer?.email}</small>
                      </div>
                      <span className={`badge-status badge-${app.status?.toLowerCase()}`}>
                        {statusLabel(app.status) || app.status}
                      </span>
                      {app.emergencyStatus === 'PENDING' && (
                        <span style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <i className="bi bi-exclamation-triangle-fill"></i> Emergency
                        </span>
                      )}
                      {app.emergencyStatus === 'APPROVED' && app.premiumWaiverBenefit && (
                        <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #6ee7b7', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <i className="bi bi-shield-check"></i> Waiver Active
                        </span>
                      )}
                    </div>
                    <div className="d-flex gap-3 flex-wrap mb-2">
                      {[
                        { label: t('admin.applications.planLabel'),     value: app.packageName || app.package?.name },
                        { label: t('admin.applications.typeLabel'),     value: app.packageType || app.package?.type },
                        { label: t('admin.applications.coverageLabel'), value: `${Number(app.coverageAmount).toLocaleString()} MMK` },
                        { label: t('admin.applications.durationLabel'), value: `${app.duration} ${t('admin.applications.yearSuffix')}` },
                        { label: t('admin.applications.agentLabel'),    value: app.agentName || app.agent?.name || t('admin.common.na') },
                        { label: t('admin.applications.appliedLabel'),  value: app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—' },
                      ].map(item => (
                        <div key={item.label} style={{ minWidth: 100 }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.label}</div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {/* View button */}
                    <button onClick={() => setViewItem(app)} style={{
                      padding: '0.3rem 0.8rem', borderRadius: 7, border: '1.5px solid var(--border)',
                      background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
                      fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4
                    }}>
                      <i className="bi bi-eye"></i> {t('admin.applications.viewDetails')}
                    </button>
                    {app.agentNote && (
                      <p style={{ color: '#1d4ed8', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>
                        {t('admin.applications.agentNote')}: {app.agentNote}
                      </p>
                    )}
                  </div>

                  {/* Right column — actions */}
                  <div className="col-12 col-md-4 mt-3 mt-md-0">
                    {/* VERIFIED → review panel */}
                    {app.status === 'VERIFIED' && (
                      selected === app.id ? (
                        <div>
                          <DigitalSignatureCanvas
                            label={t('admin.applications.signatureLabel')}
                            required
                            onChange={setSignatureData}
                            height={120}
                          />
                          <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical' }}
                            placeholder={t('admin.applications.notePlaceholder')}
                            value={actionNote} onChange={e => setActionNote(e.target.value)} />
                          <div className="d-flex gap-1 flex-wrap">
                            <button className="btn-success-sm" onClick={() => handleAction(app.id, 'approve')} disabled={submitting}>
                              {submitting ? <span className="spinner-border spinner-border-sm"></span> : `✓ ${t('admin.common.approve')}`}
                            </button>
                            <button className="btn-danger-sm" onClick={() => handleAction(app.id, 'reject')} disabled={submitting}>
                              ✗ {t('admin.common.reject')}
                            </button>
                            <button style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 0.7rem', fontSize: '0.82rem', cursor: 'pointer' }}
                              onClick={() => handleAction(app.id, 'revise')} disabled={submitting}>
                              ↩ {t('admin.common.revise')}
                            </button>
                            <button className="btn-outline-custom" style={{ padding: '0.3rem 0.6rem', fontSize: '0.82rem' }}
                              onClick={() => setSelected(null)}>
                              {t('admin.common.cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn-primary-custom" style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                           onClick={() => { setSelected(app.id); setActionNote(''); setSignatureData(null) }}>
                          {t('admin.applications.reviewApplication')}
                        </button>
                      )
                    )}

                    {/* EMERGENCY → waiver review panel */}
                    {app.emergencyStatus === 'PENDING' && (
                      waiverItem === app.id ? (
                        <div>
                          <div style={{ marginBottom: '0.5rem', fontSize: '0.82rem', color: '#c2410c', fontWeight: 700 }}>
                            <i className="bi bi-exclamation-triangle-fill me-1 text-warning"></i>
                            Emergency Declaration — Premium Waiver Review
                          </div>
                          {app.emergencyFormData && (() => {
                            try {
                              const fd = typeof app.emergencyFormData === 'string' ? JSON.parse(app.emergencyFormData) : app.emergencyFormData
                              const entries = Object.entries(fd).filter(([,v]) => v)
                              if (entries.length > 0) return (
                                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '0.5rem 0.75rem', marginBottom: '0.5rem', fontSize: '0.78rem' }}>
                                  {entries.map(([k, v]) => <div key={k}><strong>{k}:</strong> {String(v)}</div>)}
                                </div>
                              )
                            } catch {}
                            return null
                          })()}
                          <DigitalSignatureCanvas
                            label="Your Signature (required for approval)"
                            required
                            onChange={setWaiverSignature}
                            height={100}
                          />
                          <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical' }}
                            placeholder="Admin note (optional)"
                            value={waiverNote} onChange={e => setWaiverNote(e.target.value)} />
                          <div className="d-flex gap-1 flex-wrap">
                            <button style={{ background: '#0891b2', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 0.8rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                              onClick={() => handleWaiverApprove(app.id)} disabled={waiverSubmitting}>
                              {waiverSubmitting ? <span className="spinner-border spinner-border-sm"></span> : '✓ Approve Waiver'}
                            </button>
                            <button className="btn-danger-sm"
                              onClick={() => handleWaiverReject(app.id)} disabled={waiverSubmitting}>
                              ✗ Reject
                            </button>
                            <button className="btn-outline-custom" style={{ padding: '0.3rem 0.6rem', fontSize: '0.82rem' }}
                              onClick={() => { setWaiverItem(null); setWaiverNote(''); setWaiverSignature(null) }}>
                              {t('admin.common.cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setWaiverItem(app.id); setWaiverNote(''); setWaiverSignature(null) }}
                          style={{ background: '#fff7ed', color: '#c2410c', border: '1.5px solid #fed7aa', borderRadius: 8, padding: '0.45rem 1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, marginBottom: '0.5rem' }}>
                          <i className="bi bi-exclamation-triangle-fill"></i> Review Emergency Declaration
                        </button>
                      )
                    )}

                    {/* APPROVED + waiver approved → Issue Maturity Payout */}
                    {app.status === 'APPROVED' && app.emergencyStatus === 'APPROVED' && (
                      maturityItem === app.id ? (
                        <div style={{ marginTop: '0.5rem' }}>
                          <div style={{ marginBottom: '0.5rem', fontSize: '0.82rem', color: '#0369a1', fontWeight: 700 }}>
                            <i className="bi bi-cash-coin me-1"></i> Issue Maturity Payout
                          </div>
                          <DigitalSignatureCanvas
                            label="Admin Signature (required)"
                            required
                            onChange={setMaturitySignature}
                            height={100}
                          />
                          <div className="d-flex gap-1 flex-wrap mt-2">
                            <button style={{ background: '#0369a1', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 0.8rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                              onClick={() => handleMaturityPayout(app.id)} disabled={maturitySubmitting}>
                              {maturitySubmitting ? <span className="spinner-border spinner-border-sm"></span> : '✓ Confirm Payout'}
                            </button>
                            <button className="btn-outline-custom" style={{ padding: '0.3rem 0.6rem', fontSize: '0.82rem' }}
                              onClick={() => { setMaturityItem(null); setMaturitySignature(null) }}>
                              {t('admin.common.cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setMaturityItem(app.id); setMaturitySignature(null) }}
                          style={{ background: '#eff6ff', color: '#1d4ed8', border: '1.5px solid #bfdbfe', borderRadius: 8, padding: '0.4rem 0.9rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, marginTop: '0.4rem' }}>
                          <i className="bi bi-cash-coin"></i> Issue Maturity Payout
                        </button>
                      )
                    )}

                    {/* APPROVED → cancel policy button */}
                    {app.status === 'APPROVED' && (
                      cancelItem?.id === app.id ? (
                        <div>
                          <div style={{ marginBottom: '0.5rem', fontSize: '0.82rem', color: '#92400e', fontWeight: 600 }}>
                            <i className="bi bi-exclamation-triangle-fill me-1 text-warning"></i>
                            Cancel this policy due to non-payment?
                          </div>
                          <textarea
                            rows={2}
                            className="form-control-custom w-100 mb-2"
                            style={{ resize: 'vertical' }}
                            placeholder="Reason (optional)"
                            value={cancelNote}
                            onChange={e => setCancelNote(e.target.value)}
                          />
                          <div className="d-flex gap-1 flex-wrap">
                            <button
                              onClick={handleCancelPolicy}
                              disabled={cancelling}
                              style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 0.8rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              {cancelling ? <span className="spinner-border spinner-border-sm"></span> : '✗ Confirm Cancel'}
                            </button>
                            <button
                              className="btn-outline-custom"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.82rem' }}
                              onClick={() => { setCancelItem(null); setCancelNote('') }}
                            >
                              {t('admin.common.cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setCancelItem(app); setCancelNote('') }}
                          style={{
                            background: 'transparent', color: '#dc2626',
                            border: '1.5px solid #dc2626', borderRadius: 8,
                            padding: '0.45rem 1rem', fontSize: '0.85rem', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                          }}
                        >
                          <i className="bi bi-x-circle-fill"></i> Cancel Policy
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormDetailModal
        show={!!viewItem} onClose={() => setViewItem(null)}
        type="application" item={viewItem} role="admin" />
    </div>
  )
}
