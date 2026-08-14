import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { downloadPdfFromApi } from '../../utils/download'
import { getTypeMeta } from '../../utils/typeMeta'
import ConfirmModal from '../../components/ConfirmModal'
import { apiError } from '../../utils/apiError'
import { fmtDateIntl, fmtMoney } from '../../utils/format'

const RISK_META = {
  LOW:    { color: '#16a34a', bg: '#f0fdf4', icon: 'bi-shield-check'       },
  MEDIUM: { color: '#d97706', bg: '#fffbeb', icon: 'bi-shield-exclamation' },
  HIGH:   { color: '#dc2626', bg: '#fef2f2', icon: 'bi-shield-x'          },
}

function PolicyCertificate({ policy, onClose }) {
  const { t } = useTranslation()
  return (
    <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content certificate-modal-content">
          <div className="modal-header" style={{ background: 'linear-gradient(135deg, #1d4ed8, #4338ca)', borderRadius: '16px 16px 0 0' }}>
            <div>
              <h5 className="modal-title" style={{ color: '#fff', fontWeight: 700 }}>{t('policies.certTitle')}</h5>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>{t('policies.certSubtitle')}</div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', color: '#fff', cursor: 'pointer' }}><i className="bi bi-x-lg"></i></button>
          </div>
          <div className="modal-body" style={{ padding: '2rem' }}>
            <div className="certificate-body">
              <div className="text-center mb-4">
                <i className="bi bi-shield-fill-check" style={{ fontSize: '2.5rem', color: '#1d4ed8' }}></i>
                <div style={{ fontWeight: 800, fontSize: '1.3rem', color: '#1d4ed8', marginTop: 8 }}>{t('policies.certHeader')}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('policies.certActive')}</div>
              </div>
              <div className="row g-3">
                {[
                  [t('policies.certPolicyNumber'), policy.policyNumber || t('policies.certPending')],
                  [t('policies.certType'), policy.packageType],
                  [t('policies.certPlan'), policy.packageName],
                  [t('policies.certCoverage'), fmtMoney(policy.coverageAmount)],
                  [t('policies.certDuration'), `${policy.duration} ${policy.duration > 1 ? t('policies.years') : t('policies.year')}`],
                  [t('policies.certRisk'), policy.riskLevel || '—'],
                  [t('policies.certPremium'), policy.premiumAmount ? fmtMoney(policy.premiumAmount) : '—'],
                  [t('policies.certIssue'), fmtDateIntl(policy.createdAt, undefined, '—')],
                  [t('policies.certStatus'), policy.status === 'CLAIMED' ? t('customer.policyUsed') : t('policies.active')],
                ].map(([label, value]) => (
                  <div key={label} className="col-6">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-outline-custom" onClick={onClose}>{t('policies.close')}</button>
            <button className="btn-primary-custom" style={{ justifyContent: 'center' }} onClick={() => window.print()}>
              <i className="bi bi-printer me-2"></i>{t('policies.printDownload')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CustomerPoliciesPage() {
  const { t } = useTranslation()
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [certPolicy, setCertPolicy] = useState(null)
  const [renewing, setRenewing] = useState(null)
  const [verifiedPaymentIds, setVerifiedPaymentIds] = useState(new Set())
  const [renewConfirmId, setRenewConfirmId] = useState(null)

  const fetchPolicies = () => {
    Promise.all([
      api.get('/customer/policies').catch(() => ({ data: [] })),
      api.get('/customer/payments').catch(() => ({ data: [] })),
    ]).then(([policiesRes, paymentsRes]) => {
      setPolicies(Array.isArray(policiesRes.data) ? policiesRes.data : [])
      const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : []
      setVerifiedPaymentIds(new Set(
        payments.filter(p => p.status === 'VERIFIED').map(p => p.applicationId)
      ))
    }).catch(() => setPolicies([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetchPolicies() }, [])

  const [downloading, setDownloading] = useState(null)

  const handleRenew = async (id) => { setRenewConfirmId(id) }

  const doRenew = async () => {
    const id = renewConfirmId
    setRenewing(id)
    try {
      await api.post(`/customer/applications/${id}/renew`)
      toast.success(t('policies.renewSuccess'))
    } catch (err) {
      apiError(err, t('policies.renewFailed'))
    } finally {
      setRenewing(null)
      setRenewConfirmId(null)
    }
  }

  const handleDownloadCertificate = async (policy) => {
    setDownloading(policy.id)
    try {
      await downloadPdfFromApi(`/customer/applications/${policy.id}/policy-contract`, `policy_certificate_${policy.policyNumber || policy.id}.pdf`)
    } catch {
      toast.error(t('customer.certDownloadFailed'))
    } finally { setDownloading(null) }
  }

  const activePolicies = policies.filter(p => p.status === 'APPROVED')
  const usedPolicies   = policies.filter(p => p.status === 'CLAIMED')

  const renderPolicyCard = (policy, isUsed = false) => {
    const typeMeta = getTypeMeta(policy.packageType)
    const riskMeta = RISK_META[policy.riskLevel] || RISK_META['LOW']
    return (
      <div key={policy.id} className="col-12 col-md-6">
        <div className="card-custom h-100" style={{
          border: `2px solid ${isUsed ? '#94a3b833' : typeMeta.color + '30'}`,
          opacity: isUsed ? 0.85 : 1
        }}>
          {/* Header */}
          <div className="d-flex align-items-start justify-content-between mb-3">
            <div className="d-flex align-items-center gap-3">
              <div style={{ width: 48, height: 48, borderRadius: 12, background: isUsed ? '#f1f5f9' : typeMeta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`bi ${isUsed ? 'bi-shield-slash' : typeMeta.icon}`} style={{ color: isUsed ? '#94a3b8' : typeMeta.color, fontSize: '1.4rem' }}></i>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isUsed ? '#94a3b8' : typeMeta.color, textTransform: 'uppercase' }}>{policy.packageType}</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{policy.packageName}</div>
              </div>
            </div>
            {isUsed ? (
              <span style={{ padding: '0.25rem 0.65rem', borderRadius: 99, background: '#f1f5f9', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                <i className="bi bi-check-circle-fill me-1" style={{ color: '#15803d' }}></i>{t('customer.claimPaid')}
              </span>
            ) : (
              <span style={{ padding: '0.25rem 0.65rem', borderRadius: 99, background: '#dcfce7', color: '#16a34a', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{t('policies.active')}</span>
            )}
          </div>

          {/* Policy Number */}
          <div className="mb-3 p-2" style={{ background: 'var(--bg-secondary)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('policies.policyNumber')}</div>
            <div style={{ fontWeight: 700, fontFamily: 'monospace', color: isUsed ? '#64748b' : 'var(--primary)', fontSize: '0.95rem' }}>{policy.policyNumber || t('policies.pendingAssignment')}</div>
          </div>

          {/* Stats grid */}
          <div className="row g-2 mb-3">
            <div className="col-6">
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.45rem 0.65rem' }}>
                <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>{t('policies.coverage')}</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{fmtMoney(policy.coverageAmount)}</div>
              </div>
            </div>
            <div className="col-6">
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.45rem 0.65rem' }}>
                <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>{t('policies.totalPremium')}</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{policy.premiumAmount ? Number(policy.premiumAmount).toLocaleString() : '—'} MMK</div>
              </div>
            </div>
            <div className="col-6">
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.45rem 0.65rem' }}>
                <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>{t('policies.duration')}</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{policy.duration} {policy.duration > 1 ? t('policies.years') : t('policies.year')}</div>
              </div>
            </div>
            <div className="col-6">
              <div style={{ background: isUsed ? 'var(--bg-secondary)' : riskMeta.bg, borderRadius: 8, padding: '0.45rem 0.65rem' }}>
                <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>{t('policies.riskLevel')}</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isUsed ? '#64748b' : riskMeta.color }}>
                  <i className={`bi ${isUsed ? 'bi-dash-circle' : riskMeta.icon} me-1`}></i>{policy.riskLevel || '—'}
                </div>
              </div>
            </div>
          </div>

          {policy.agentName && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <i className="bi bi-person-badge me-1"></i>{t('policies.agent')}: {policy.agentName}
            </div>
          )}

          {/* Used policy notice */}
          {isUsed && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.6rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.82rem', color: '#15803d' }}>
              <i className="bi bi-check-circle-fill me-1"></i>
              {t('customer.claimPaidDesc')}
            </div>
          )}

          {/* Actions */}
          <div className="d-flex flex-wrap gap-2 mt-auto">
            <button onClick={() => setCertPolicy(policy)} className="btn-primary-sm" style={{ flex: '1 1 auto' }}>
              <i className="bi bi-file-earmark-text me-1"></i>{t('policies.certificate')}
            </button>
            <button
              onClick={() => handleDownloadCertificate(policy)}
              disabled={downloading === policy.id}
              style={{ flex: '1 1 auto', padding: '0.4rem 0.85rem', borderRadius: 8, border: '1.5px solid #1d4ed8', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
            >
              {downloading === policy.id
                ? <span className="spinner-border spinner-border-sm"></span>
                : <><i className="bi bi-download me-1"></i>PDF</>}
            </button>
            {!isUsed && (() => {
              // Claim action logic:
              // 1. claimEligibleFrom set and in the past/today → can claim now
              // 2. claimEligibleFrom set and in the future → must wait (transferred policy
              //    with waiting period, or regular policy with waiting period)
              // 3. Transferred policy with no waiting period always has claimEligibleFrom = today (set by admin)
              // 4. claimEligibleFrom not set → fall back to verifiedPayments check (payfirst)
              const eligibleFrom = policy.claimEligibleFrom ? new Date(policy.claimEligibleFrom) : null
              const today = new Date(); today.setHours(0, 0, 0, 0)
              const canClaimByDate = eligibleFrom !== null && eligibleFrom <= today
              const waitingByDate  = eligibleFrom !== null && eligibleFrom > today
              const hasVerified    = verifiedPaymentIds.has(policy.id)
              // Transferred policies always show claim or wait — never pay-first
              const isTransferred  = !!policy.isTransferred

              if (canClaimByDate || (!eligibleFrom && hasVerified)) {
                return (
                  <Link to="/customer/submit-claim" className="btn-outline-custom" style={{ textDecoration: 'none', padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
                    <i className="bi bi-file-earmark-plus me-1"></i>{t('policies.claim')}
                  </Link>
                )
              } else if (waitingByDate) {
                const msRemaining   = eligibleFrom.getTime() - today.getTime()
                const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))
                return (
                  <div style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1.5px solid #93c5fd', background: '#eff6ff' }}>
                    {isTransferred && (
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="bi bi-arrow-left-right"></i>
                        {t('policies.transferredPolicyLabel')}
                      </div>
                    )}
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className="bi bi-hourglass-split"></i>
                      {t('policies.waitingPeriodTitle')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#1d4ed8', marginTop: '0.2rem' }}>
                      {t('policies.claimEligibleFromLabel')} <strong>{eligibleFrom.toLocaleDateString()}</strong>
                    </div>
                    {policy.claimWaitingPeriodMonths > 0 && (
                      <div style={{ fontSize: '0.73rem', color: '#475569', marginTop: '0.15rem' }}>
                        {t('policies.waitingPeriodMonthsDuration', { months: policy.claimWaitingPeriodMonths })}
                      </div>
                    )}
                    <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '0.15rem' }}>
                      {t('policies.waitingPeriodDaysLeft', { days: daysRemaining })}
                    </div>
                  </div>
                )
              } else if (isTransferred) {
                // Safety net: transferred policy but claimEligibleFrom not set yet — allow claim
                return (
                  <Link to="/customer/submit-claim" className="btn-outline-custom" style={{ textDecoration: 'none', padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
                    <i className="bi bi-file-earmark-plus me-1"></i>{t('policies.claim')}
                  </Link>
                )
              } else {
                return (
                  <span title={t('policies.claimPaymentRequired')}
                    style={{ padding: '0.4rem 0.85rem', borderRadius: 8, border: '1.5px solid #fcd34d', background: '#fef9c3', color: '#92400e', fontSize: '0.82rem', fontWeight: 600, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <i className="bi bi-credit-card me-1"></i>{t('policies.payFirst')}
                  </span>
                )
              }
            })()}
            {!isUsed && (
              <button onClick={() => handleRenew(policy.id)} disabled={renewing === policy.id}
                style={{ padding: '0.4rem 0.85rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                {renewing === policy.id ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-arrow-repeat me-1"></i>{t('policies.renew')}</>}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('policies.title')}</h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{t('policies.subtitle')}</p>
        </div>
        <Link to="/customer/apply" className="btn-primary-custom" style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}>
          <i className="bi bi-plus-circle me-1"></i>{t('policies.newPolicy')}
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : policies.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-shield-check" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{t('policies.noPolicies')}</h5>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('policies.noPoliciesDesc')}</p>
          <Link to="/customer/apply" className="btn-primary-custom mt-2" style={{ display: 'inline-flex' }}>{t('policies.applyNow')}</Link>
        </div>
      ) : (
        <>
          {/* Active policies */}
          {activePolicies.length > 0 && (
            <>
              {usedPolicies.length > 0 && (
                <h6 style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  <i className="bi bi-shield-check me-2" style={{ color: '#16a34a' }}></i>{t('customer.activePolicies')} ({activePolicies.length})
                </h6>
              )}
              <div className="row g-4 mb-4">
                {activePolicies.map(p => renderPolicyCard(p, false))}
              </div>
            </>
          )}

          {/* Used / claimed policies */}
          {usedPolicies.length > 0 && (
            <>
              <div style={{ borderTop: '1px solid var(--border)', marginBottom: '1.5rem', paddingTop: '1.5rem' }}>
                <h6 style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  <i className="bi bi-clock-history me-2"></i>{t('customer.policyHistory')} ({usedPolicies.length})
                  <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                    {t('customer.policyHistoryDesc')}
                  </span>
                </h6>
              </div>
              <div className="row g-4">
                {usedPolicies.map(p => renderPolicyCard(p, true))}
              </div>
            </>
          )}

          {activePolicies.length === 0 && usedPolicies.length > 0 && (
            <div className="card-custom text-center py-4 mb-4" style={{ background: '#f8fafc' }}>
              <i className="bi bi-shield-plus" style={{ fontSize: '2rem', color: 'var(--border)' }}></i>
              <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>{t('customer.noActivePolicies')}</div>
              <Link to="/customer/apply" className="btn-primary-custom mt-3" style={{ display: 'inline-flex' }}>{t('policies.applyNow')}</Link>
            </div>
          )}
        </>
      )}

      {certPolicy && <PolicyCertificate policy={certPolicy} onClose={() => setCertPolicy(null)} />}

      <ConfirmModal
        open={renewConfirmId !== null}
        title={t('policies.renewConfirm')}
        message=""
        icon="bi-arrow-repeat"
        confirmLabel={t('policies.renew')}
        cancelLabel={t('customer.cancelLabel')}
        variant="primary"
        loading={renewing !== null}
        onConfirm={doRenew}
        onCancel={() => setRenewConfirmId(null)}
      />
    </div>
  )
}
