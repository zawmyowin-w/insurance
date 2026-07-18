import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import api from '../services/api'
import { getTypeMeta } from '../utils/typeMeta'

const OCCUPATIONS = ['Employee', 'Business Owner', 'Driver', 'Student', 'Teacher', 'Engineer', 'Doctor', 'Freelancer', 'Other']

function fmt(n) {
  const num = parseFloat(n)
  if (!num || isNaN(num)) return '—'
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function calcPremium(coverage, rate, intervalMonths) {
  if (!coverage || !rate) return null
  const annual = parseFloat(coverage) * parseFloat(rate)
  const perPayment = annual / (12 / (intervalMonths || 1))
  return { annual, perPayment }
}

// Returns reasonKey instead of hardcoded text so JSX can call t()
function recommendPlans(age, occupation, income) {
  const a = parseInt(age) || 0, inc = parseInt(income) || 0
  const occ = (occupation || '').toLowerCase()
  const rec = []
  if (a >= 18) rec.push({ type: 'LIFE',      reasonKey: 'recLife' })
  if (a >= 16) rec.push({ type: 'HEALTH',    reasonKey: 'recHealth' })
  if (occ.includes('driver') || occ.includes('vehicle')) rec.push({ type: 'VEHICLE', reasonKey: 'recVehicle' })
  if (occ.includes('student')) rec.push({ type: 'EDUCATION', reasonKey: 'recEducation' })
  if (inc > 500000) rec.push({ type: 'PROPERTY', reasonKey: 'recProperty' })
  rec.push({ type: 'TRAVEL', reasonKey: 'recTravel' })
  const seen = new Set()
  return rec.filter(r => { if (seen.has(r.type)) return false; seen.add(r.type); return true }).slice(0, 3)
}

export default function PlansPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [detailPlan, setDetailPlan] = useState(null)
  const [recAge, setRecAge] = useState('')
  const [recOcc, setRecOcc] = useState('')
  const [recIncome, setRecIncome] = useState('')
  const [recommendations, setRecommendations] = useState([])
  const [showRec, setShowRec] = useState(false)

  useEffect(() => {
    api.get('/packages/public')
      .then(res => setPlans(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = plans.filter(p => {
    const typeOk = typeFilter === 'ALL' || p.type === typeFilter
    const recOk = recommendations.length === 0 || !showRec || recommendations.some(r => r.type === p.type)
    return typeOk && recOk
  })

  const handleRecommend = () => {
    setRecommendations(recommendPlans(recAge, recOcc, recIncome))
    setShowRec(true)
    setTypeFilter('ALL')
  }

  const handleApply = plan => {
    if (!user) { navigate('/login'); return }
    navigate('/customer/apply', { state: { planId: plan.id } })
  }

  const freqLabel = freq => t(`plans.freq${freq}`, freq || '—')

  return (
    <div>
      <Navbar />

      {/* Plan Detail Modal */}
      {detailPlan && (
        <PlanDetailModal
          plan={detailPlan}
          onClose={() => setDetailPlan(null)}
          onApply={() => { setDetailPlan(null); handleApply(detailPlan) }}
          user={user}
          t={t}
          freqLabel={freqLabel}
        />
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Header */}
        <div className="text-center mb-5">
          <h2 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {t('plans.header')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            {t('plans.headerSub')}
          </p>
        </div>

        {/* Recommendation Widget */}
        <div className="card-custom mb-5" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)', border: 'none' }}>
          <div className="row align-items-center g-3">
            <div className="col-12 col-md-3">
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8, marginBottom: 4 }}>
                  {t('plans.recommenderLabel')}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.3 }}>
                  {t('plans.recommenderTitle')}
                </div>
                <div style={{ fontSize: '0.82rem', opacity: 0.8, marginTop: 4 }}>
                  {t('plans.recommenderSub')}
                </div>
              </div>
            </div>
            <div className="col-12 col-md-7">
              <div className="row g-2">
                <div className="col-4">
                  <input type="number"
                    className="form-control-custom w-100"
                    style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
                    placeholder={t('plans.agePlaceholder')}
                    value={recAge} onChange={e => setRecAge(e.target.value)} min={0} max={100} />
                </div>
                <div className="col-4">
                  <select
                    className="form-select-custom w-100"
                    style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
                    value={recOcc} onChange={e => setRecOcc(e.target.value)}>
                    <option value="">{t('plans.occupationPlaceholder')}</option>
                    {OCCUPATIONS.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
                  </select>
                </div>
                <div className="col-4">
                  <input type="number"
                    className="form-control-custom w-100"
                    style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
                    placeholder={t('plans.incomePlaceholder')}
                    value={recIncome} onChange={e => setRecIncome(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="col-12 col-md-2">
              <button onClick={handleRecommend} className="btn-primary-custom w-100"
                style={{ justifyContent: 'center', background: '#fff', color: '#1d4ed8', border: 'none' }}>
                <i className="bi bi-magic me-2"></i>{t('plans.findBtn')}
              </button>
            </div>
          </div>

          {showRec && recommendations.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                {t('plans.recommendedFor')}
              </div>
              <div className="d-flex gap-2 flex-wrap">
                {recommendations.map(rec => (
                  <button key={rec.type} onClick={() => setTypeFilter(rec.type)} style={{
                    padding: '0.35rem 0.85rem', borderRadius: 99,
                    border: '1.5px solid rgba(255,255,255,0.5)',
                    background: typeFilter === rec.type ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                    color: typeFilter === rec.type ? '#1d4ed8' : '#fff',
                    cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                  }}>
                    <i className={`bi ${getTypeMeta(rec.type).icon} me-1`}></i>
                    {getTypeMeta(rec.type).label}
                    <span style={{ opacity: 0.7, fontSize: '0.72rem', marginLeft: 4 }}>
                      — {t(`plans.${rec.reasonKey}`)}
                    </span>
                  </button>
                ))}
                <button onClick={() => { setShowRec(false); setRecommendations([]); setTypeFilter('ALL') }} style={{
                  padding: '0.35rem 0.75rem', borderRadius: 99,
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  background: 'transparent', color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer', fontSize: '0.78rem',
                }}>
                  {t('plans.clearFilter')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Type Filter */}
        <div className="d-flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
          {['ALL', ...[...new Set(plans.map(p => p.type))]].map(type => {
            const meta = type === 'ALL' ? null : getTypeMeta(type)
            return (
              <button key={type} onClick={() => setTypeFilter(type)} style={{
                padding: '0.4rem 1rem', borderRadius: 99,
                border: `2px solid ${typeFilter === type ? (meta?.color || 'var(--primary)') : 'var(--border)'}`,
                cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                background: typeFilter === type ? (meta?.bg || 'var(--bg-secondary)') : 'transparent',
                color: typeFilter === type ? (meta?.color || 'var(--primary)') : 'var(--text-secondary)',
              }}>
                {meta && <i className={`bi ${meta.icon} me-1`}></i>}
                {type === 'ALL' ? t('plans.allPlansBtn') : meta?.label || type}
              </button>
            )
          })}
        </div>

        {/* Plan Cards */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--primary)' }}></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-custom text-center py-5">
            <i className="bi bi-search" style={{ fontSize: '2.5rem', color: 'var(--border)' }}></i>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem' }}>{t('plans.notFound')}</p>
          </div>
        ) : (
          <div className="row g-4">
            {filtered.map(plan => {
              const meta = getTypeMeta(plan.type)
              const tiers = Array.isArray(plan.durationTiers) && plan.durationTiers.length > 0 ? plan.durationTiers : []
              const minRate = tiers.length > 0 ? Math.min(...tiers.map(tier => tier.premiumRate)) : plan.premiumRate
              return (
                <div key={plan.id} className="col-12 col-md-6 col-xl-4">
                  <div className="card-custom h-100"
                    style={{ display: 'flex', flexDirection: 'column', border: `2px solid var(--border)`, transition: 'border-color 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.boxShadow = `0 8px 24px ${meta.color}22` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = '' }}>

                    {/* Card Header */}
                    <div className="d-flex align-items-start gap-3 mb-3">
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className={`bi ${meta.icon}`} style={{ color: meta.color, fontSize: '1.4rem' }}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{meta.label}</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1.3 }}>{plan.name}</div>
                      </div>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '0.85rem' }}>{plan.description}</p>

                    {/* Key Stats */}
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div style={{ background: meta.bg, borderRadius: 8, padding: '0.5rem 0.65rem' }}>
                          <div style={{ fontSize: '0.67rem', color: meta.color, textTransform: 'uppercase', fontWeight: 700 }}>
                            {t('plans.premiumRate')}
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                            {minRate ? `${(minRate * 100).toFixed(1)}%` : '—'}/yr{tiers.length > 1 ? '+' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.5rem 0.65rem' }}>
                          <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                            {t('plans.payment')}
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                            {freqLabel(plan.paymentFrequency)}
                          </div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.5rem 0.65rem' }}>
                          <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                            {t('plans.coverageRange')}
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            {fmt(plan.coverageMin)} – {fmt(plan.coverageMax)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Duration Tags */}
                    {tiers.length > 0 && (
                      <div className="mb-3">
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' }}>
                          {t('plans.availDurations')}
                        </div>
                        <div className="d-flex gap-1 flex-wrap">
                          {tiers.map(tier => (
                            <span key={tier.years} style={{ padding: '0.2rem 0.55rem', borderRadius: 6, background: meta.bg, color: meta.color, fontSize: '0.75rem', fontWeight: 700 }}>
                              {tier.years} {t('plans.yearsUnit')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Benefits preview */}
                    {(plan.benefits || []).length > 0 && (
                      <div className="mb-2">
                        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                          {t('plans.benefitsLabel')}
                        </div>
                        {(plan.benefits || []).slice(0, 3).map((b, i) => (
                          <div key={i} style={{ display: 'flex', gap: 6, fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 3 }}>
                            <i className="bi bi-check-circle-fill" style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }}></i>{b}
                          </div>
                        ))}
                        {(plan.benefits || []).length > 3 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            +{(plan.benefits || []).length - 3} {t('plans.moreOtherBenefits')}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-auto pt-3 d-flex gap-2">
                      <button onClick={() => setDetailPlan(plan)} style={{
                        padding: '0.5rem 0.85rem', borderRadius: 8,
                        border: `1.5px solid ${meta.color}`, background: 'transparent',
                        color: meta.color, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                      }}>
                        <i className="bi bi-eye me-1"></i>{t('plans.detailBtn')}
                      </button>
                      <button onClick={() => handleApply(plan)} className="btn-primary-custom flex-grow-1"
                        style={{ justifyContent: 'center', background: meta.color, borderColor: meta.color }}>
                        <i className="bi bi-check-circle me-2"></i>{t('plans.applyBtn')}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!user && (
          <div className="card-custom text-center mt-5 py-4">
            <i className="bi bi-person-lock" style={{ fontSize: '2rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}></i>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {t('plans.loginPrompt')}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {t('plans.loginPromptSub')}
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <Link to="/register" className="btn-primary-custom">{t('plans.createAccountBtn')}</Link>
              <Link to="/login" className="btn-outline-custom">{t('plans.logInBtn')}</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Plan Detail Modal ──────────────────────────────────────────────────────────
function PlanDetailModal({ plan, onClose, onApply, user, t, freqLabel }) {
  const meta = getTypeMeta(plan.type)
  const tiers = Array.isArray(plan.durationTiers) && plan.durationTiers.length > 0 ? plan.durationTiers : []
  const [calcCoverage, setCalcCoverage] = useState('')
  const [calcDuration, setCalcDuration] = useState(tiers[0]?.years || '')
  const [activeTab, setActiveTab] = useState('overview')

  const selectedTier = tiers.find(tier => String(tier.years) === String(calcDuration)) || tiers[0]
  const calcResult = calcCoverage && selectedTier?.premiumRate
    ? calcPremium(calcCoverage, selectedTier.premiumRate, plan.paymentIntervalMonths || 1) : null

  const freq = freqLabel(plan.paymentFrequency)
  const thS = { padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }
  const tdS = { padding: '0.55rem 0.75rem', verticalAlign: 'middle', fontSize: '0.84rem' }

  const TABS = [
    { id: 'overview',  label: t('plans.tabOverview'),  icon: 'bi-grid' },
    { id: 'tiers',     label: t('plans.tabTiers'),     icon: 'bi-calendar3' },
    { id: 'benefits',  label: t('plans.tabBenefits'),  icon: 'bi-check-circle' },
    { id: 'docs',      label: t('plans.tabDocs'),      icon: 'bi-file-earmark' },
    { id: 'rules',     label: t('plans.tabRules'),     icon: 'bi-file-text' },
  ]

  const quickStats = [
    { label: t('plans.coverageMinLabel'), value: `MMK ${fmt(plan.coverageMin)}`,  icon: 'bi-shield',           color: '#1d4ed8' },
    { label: t('plans.coverageMaxLabel'), value: `MMK ${fmt(plan.coverageMax)}`,  icon: 'bi-shield-fill-check', color: '#16a34a' },
    { label: t('plans.maxClaimLabel'),    value: plan.maxClaimAmount ? `MMK ${fmt(plan.maxClaimAmount)}` : t('plans.onCoverage'), icon: 'bi-cash-stack', color: '#d97706' },
    { label: t('plans.paymentModeLabel'), value: freq,                             icon: 'bi-credit-card',      color: '#7c3aed' },
  ]

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg-primary)', borderRadius: 18, width: '100%', maxWidth: 820, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 70px rgba(0,0,0,0.35)' }}>

        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', background: `linear-gradient(135deg, ${meta.color}15, ${meta.bg})`, borderBottom: '1px solid var(--border)', borderRadius: '18px 18px 0 0' }}>
          <div className="d-flex align-items-start gap-3">
            <div style={{ width: 52, height: 52, borderRadius: 14, background: meta.bg, border: `2px solid ${meta.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`bi ${meta.icon}`} style={{ color: meta.color, fontSize: '1.5rem' }}></i>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{meta.label}</div>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.15rem', lineHeight: 1.2 }}>{plan.name}</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: 4, marginBottom: 0 }}>{plan.description}</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.3rem', flexShrink: 0, lineHeight: 1 }}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Quick stats */}
          <div className="row g-2 mt-3">
            {quickStats.map((s, i) => (
              <div key={i} className="col-6 col-md-3">
                <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '0.5rem 0.75rem', backdropFilter: 'blur(4px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: '0.8rem' }}></i>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</span>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '0.75rem 1.1rem', border: 'none', background: 'transparent', cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 700 : 500, fontSize: '0.82rem',
              color: activeTab === tab.id ? meta.color : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id ? `2.5px solid ${meta.color}` : '2.5px solid transparent',
              whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <i className={`bi ${tab.icon}`}></i>{tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ overflowY: 'auto', padding: '1.25rem 1.5rem', flex: 1 }}>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="d-flex flex-column gap-3">
              {plan.eligibility && (
                <div style={{ background: '#eff6ff', borderRadius: 10, padding: '1rem', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1d4ed8', marginBottom: '0.5rem' }}>
                    <i className="bi bi-person-check me-1"></i>{t('plans.eligibility')}
                  </div>
                  <p style={{ fontSize: '0.84rem', color: '#1e40af', whiteSpace: 'pre-line', margin: 0 }}>{plan.eligibility}</p>
                </div>
              )}
              {plan.exclusions && (
                <div style={{ background: '#fef2f2', borderRadius: 10, padding: '1rem', border: '1px solid #fecaca' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#dc2626', marginBottom: '0.5rem' }}>
                    <i className="bi bi-x-circle me-1"></i>{t('plans.exclusions')}
                  </div>
                  <p style={{ fontSize: '0.84rem', color: '#991b1b', whiteSpace: 'pre-line', margin: 0 }}>{plan.exclusions}</p>
                </div>
              )}
              {plan.beneficiaryInfo && (
                <div style={{ background: '#faf5ff', borderRadius: 10, padding: '1rem', border: '1px solid #e9d5ff' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#7c3aed', marginBottom: '0.5rem' }}>
                    <i className="bi bi-people me-1"></i>{t('plans.beneficiary')}
                  </div>
                  <p style={{ fontSize: '0.84rem', color: '#5b21b6', whiteSpace: 'pre-line', margin: 0 }}>{plan.beneficiaryInfo}</p>
                </div>
              )}
              {!plan.eligibility && !plan.exclusions && !plan.beneficiaryInfo && (
                <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  <i className="bi bi-info-circle" style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}></i>
                  {t('plans.overviewEmpty')}
                </div>
              )}
            </div>
          )}

          {/* TIERS TAB */}
          {activeTab === 'tiers' && (
            <div className="d-flex flex-column gap-4">
              {tiers.length > 0 ? (
                <>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                      <i className="bi bi-table me-1" style={{ color: meta.color }}></i>{t('plans.durationTiers')}
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={thS}>{t('plans.durationCol')}</th>
                            <th style={thS}>{t('plans.premiumRateCol')}</th>
                            <th style={thS}>{t('plans.annualSampleCol')}</th>
                            <th style={thS}>{freq} {t('plans.perPaymentCol')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tiers.map((tier, i) => {
                            const sample = calcPremium(10000000, tier.premiumRate, plan.paymentIntervalMonths || 1)
                            return (
                              <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-secondary)' }}>
                                <td style={tdS}><strong style={{ color: meta.color }}>{tier.years} {t('plans.yearsUnit')}</strong></td>
                                <td style={tdS}>
                                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>{(tier.premiumRate * 100).toFixed(2)}%</span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>/year</span>
                                </td>
                                <td style={tdS}>{sample ? `MMK ${fmt(sample.annual)}` : '—'}</td>
                                <td style={tdS}><strong style={{ color: '#16a34a', fontSize: '0.95rem' }}>{sample ? `MMK ${fmt(sample.perPayment)}` : '—'}</strong></td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                      {t('plans.sampleNote')}
                    </p>
                  </div>

                  {/* Premium Calculator */}
                  <div style={{ background: `linear-gradient(135deg, ${meta.bg}, #f0fdf4)`, borderRadius: 14, padding: '1.25rem', border: `1px solid ${meta.color}30` }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                      <i className="bi bi-calculator me-1" style={{ color: meta.color }}></i>{t('plans.calcTitle2')}
                    </div>
                    <div className="row g-3">
                      <div className="col-12 col-md-5">
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                          {t('plans.coverageAmountLabel')}
                        </label>
                        <input type="number" className="form-control-custom w-100"
                          placeholder={`${fmt(plan.coverageMin)} – ${fmt(plan.coverageMax)}`}
                          min={plan.coverageMin} max={plan.coverageMax}
                          value={calcCoverage} onChange={e => setCalcCoverage(e.target.value)} />
                      </div>
                      <div className="col-12 col-md-4">
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                          {t('plans.selectDurationLabel')}
                        </label>
                        <select className="form-select-custom w-100" value={calcDuration} onChange={e => setCalcDuration(e.target.value)}>
                          {tiers.map(tier => (
                            <option key={tier.years} value={tier.years}>
                              {tier.years} {t('plans.yearsUnit')} — {(tier.premiumRate * 100).toFixed(2)}%/yr
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-12 col-md-3">
                        {calcResult ? (
                          <div style={{ background: '#fff', borderRadius: 12, padding: '0.75rem 1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: `1px solid ${meta.color}30` }}>
                            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 }}>
                              {freq} {t('plans.payPer')}
                            </div>
                            <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '1.15rem', lineHeight: 1.2 }}>
                              MMK {fmt(calcResult.perPayment)}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                              {t('plans.annualTotal')}: MMK {fmt(calcResult.annual)}
                            </div>
                          </div>
                        ) : (
                          <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 12, padding: '0.75rem 1rem', border: '1.5px dashed var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                            <i className="bi bi-calculator" style={{ fontSize: '1.2rem' }}></i>
                            {t('plans.enterCoverage')}
                          </div>
                        )}
                      </div>
                    </div>
                    {calcResult && (
                      <div className="row g-2 mt-2">
                        {[
                          { l: t('plans.calcCoverageRow'), v: `MMK ${fmt(calcCoverage)}` },
                          { l: t('plans.calcDurationRow'), v: `${calcDuration} ${t('plans.yearsUnit')}` },
                          { l: t('plans.calcRateRow'),     v: `${((selectedTier?.premiumRate || 0) * 100).toFixed(2)}%/yr` },
                          { l: t('plans.calcTotalRow'),    v: `MMK ${fmt(calcResult.annual * calcDuration)}` },
                        ].map((s, i) => (
                          <div key={i} className="col-6 col-md-3">
                            <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 8, padding: '0.4rem 0.6rem', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{s.l}</div>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{s.v}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  {t('plans.noTiers')}
                </div>
              )}
            </div>
          )}

          {/* BENEFITS TAB */}
          {activeTab === 'benefits' && (
            <div>
              {(plan.benefits || []).length > 0 ? (
                <div className="row g-2">
                  {(plan.benefits || []).map((b, i) => (
                    <div key={i} className="col-12 col-md-6">
                      <div style={{ display: 'flex', gap: 10, padding: '0.65rem 0.9rem', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', alignItems: 'flex-start' }}>
                        <i className="bi bi-check-circle-fill" style={{ color: '#16a34a', fontSize: '1rem', flexShrink: 0, marginTop: 1 }}></i>
                        <span style={{ fontSize: '0.85rem', color: '#14532d', fontWeight: 500 }}>{b}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  {t('plans.benefitsEmpty')}
                </div>
              )}
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'docs' && (
            <div>
              {(plan.requiredDocuments || []).length > 0 ? (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    <i className="bi bi-info-circle me-1" style={{ color: 'var(--primary)' }}></i>
                    {t('plans.docsNote')}
                  </p>
                  <div className="d-flex flex-column gap-2">
                    {(plan.requiredDocuments || []).map((d, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: '0.75rem 1rem', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', alignItems: 'center' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className="bi bi-file-earmark-text" style={{ color: '#d97706' }}></i>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#92400e', fontSize: '0.88rem' }}>{d}</div>
                          <div style={{ fontSize: '0.72rem', color: '#b45309' }}>{t('plans.documentLabel')} {i + 1}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  {t('plans.docsEmpty')}
                </div>
              )}
            </div>
          )}

          {/* RULES & TERMS TAB */}
          {activeTab === 'rules' && (
            <div className="d-flex flex-column gap-3">
              {plan.termsAndConditions ? (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                    <i className="bi bi-file-earmark-text me-1" style={{ color: 'var(--primary)' }}></i>
                    {t('plans.termsTitle')}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.9 }}>
                    {plan.termsAndConditions}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  {t('plans.termsEmpty')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, justifyContent: 'flex-end', background: 'var(--bg-secondary)', borderRadius: '0 0 18px 18px' }}>
          <button onClick={onClose} className="btn-outline-custom" style={{ fontSize: '0.88rem' }}>
            {t('plans.closeBtn')}
          </button>
          <button onClick={onApply} className="btn-primary-custom"
            style={{ justifyContent: 'center', background: meta.color, borderColor: meta.color, minWidth: 140 }}>
            <i className="bi bi-check-circle me-2"></i>
            {user ? t('plans.applyBtn') : t('plans.loginToApply')}
          </button>
        </div>
      </div>
    </div>
  )
}
