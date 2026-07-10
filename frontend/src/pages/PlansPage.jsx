import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../services/api'

const FALLBACK_PLANS = [
  {
    id: 1, name: 'Basic Life Protection', type: 'LIFE',
    description: 'Essential life coverage for individuals and families.',
    coverageMin: 5000000, coverageMax: 50000000, premiumRate: 0.02,
    benefits: ['Death benefit payout', 'Accidental death coverage', '24/7 support', 'Digital policy documents'],
    durations: [1, 2, 3, 5],
  },
  {
    id: 2, name: 'Comprehensive Health Plan', type: 'HEALTH',
    description: 'Full medical coverage including hospitalization and outpatient care.',
    coverageMin: 2000000, coverageMax: 30000000, premiumRate: 0.025,
    benefits: ['Hospitalization', 'Outpatient treatment', 'Surgery coverage', 'Emergency evacuation'],
    durations: [1, 2, 3],
  },
  {
    id: 3, name: 'Vehicle Protect Plus', type: 'VEHICLE',
    description: 'Comprehensive vehicle insurance for cars, motorcycles and commercial vehicles.',
    coverageMin: 3000000, coverageMax: 80000000, premiumRate: 0.03,
    benefits: ['Accident repair', 'Theft protection', 'Third-party liability', 'Roadside assistance'],
    durations: [1, 2, 3],
  },
  {
    id: 4, name: 'Home & Property Shield', type: 'PROPERTY',
    description: 'Protect your home and valuables against damage, theft and natural disasters.',
    coverageMin: 10000000, coverageMax: 500000000, premiumRate: 0.015,
    benefits: ['Fire & disaster coverage', 'Theft protection', 'Contents coverage', 'Temporary accommodation'],
    durations: [1, 2, 3, 5],
  },
]

const typeColors = {
  LIFE: { icon: '❤️', bg: '#fff0f0', color: '#dc2626' },
  HEALTH: { icon: '🏥', bg: '#f0fdf4', color: '#16a34a' },
  VEHICLE: { icon: '🚗', bg: '#eff6ff', color: '#1d4ed8' },
  PROPERTY: { icon: '🏠', bg: '#fefce8', color: '#ca8a04' },
}

export default function PlansPage() {
  const { t } = useTranslation()
  const [plans, setPlans] = useState(FALLBACK_PLANS)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [coverage, setCoverage] = useState(10000000)
  const [duration, setDuration] = useState(1)
  const [result, setResult] = useState(null)
  const [filterType, setFilterType] = useState('ALL')

  useEffect(() => {
    api.get('/packages/public')
      .then(res => { if (res.data?.length) setPlans(res.data) })
      .catch(() => {})
  }, [])

  const filteredPlans = filterType === 'ALL' ? plans : plans.filter(p => p.type === filterType)

  const calculate = () => {
    if (!selectedPlan) return
    const annual = coverage * selectedPlan.premiumRate
    const total = annual * duration
    const monthly = annual / 12
    setResult({ annual, total, monthly })
  }

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan)
    setCoverage(plan.coverageMin)
    setResult(null)
  }

  const formatMMK = (n) => new Intl.NumberFormat('en-MM').format(Math.round(n))

  return (
    <div>
      <Navbar />

      {/* Header */}
      <section style={{ background: 'var(--bg)', padding: '3.5rem 0 2rem', borderBottom: '1px solid var(--border)' }}>
        <div className="container text-center">
          <h1 className="section-title">{t('plans.title')}</h1>
          <p className="section-subtitle mx-auto">{t('plans.subtitle')}</p>
        </div>
      </section>

      {/* Plans & Calculator */}
      <section style={{ background: 'var(--bg-secondary)', padding: '3rem 0' }}>
        <div className="container">
          <div className="row g-4">

            {/* ── Left: Calculator ── */}
            <div className="col-12 col-lg-4">
              <div className="card-calculator">
                <div className="card-calculator-header">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <i className="bi bi-calculator" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
                    <h5 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t('plans.calcTitle')}
                    </h5>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {t('plans.calcSubtitle')}
                  </p>
                </div>

                <div style={{ padding: '1.5rem' }}>
                  <div className="mb-3">
                    <label className="form-label-custom">{t('plans.selectPlan')}</label>
                    <select
                      className="form-select-custom w-100"
                      value={selectedPlan?.id || ''}
                      onChange={e => {
                        const p = plans.find(pl => pl.id === Number(e.target.value))
                        if (p) handlePlanSelect(p)
                        else { setSelectedPlan(null); setResult(null) }
                      }}
                    >
                      <option value="">{t('plans.choosePlan')}</option>
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label-custom">{t('plans.coverageLabel')}</label>
                    <input
                      type="number"
                      className="form-control-custom w-100"
                      value={coverage}
                      min={selectedPlan?.coverageMin || 1000000}
                      max={selectedPlan?.coverageMax || 500000000}
                      step={1000000}
                      onChange={e => { setCoverage(Number(e.target.value)); setResult(null) }}
                    />
                    {selectedPlan && (
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {formatMMK(selectedPlan.coverageMin)} – {formatMMK(selectedPlan.coverageMax)} MMK
                      </small>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="form-label-custom">{t('plans.durationLabel')}</label>
                    <select
                      className="form-select-custom w-100"
                      value={duration}
                      onChange={e => { setDuration(Number(e.target.value)); setResult(null) }}
                    >
                      {(selectedPlan?.durations || [1, 2, 3, 5]).map(d => (
                        <option key={d} value={d}>
                          {d} {d === 1 ? t('plans.year') : t('plans.years')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={calculate}
                    disabled={!selectedPlan}
                    style={{
                      width: '100%', padding: '0.65rem', borderRadius: 8, border: 'none',
                      background: selectedPlan ? '#4f79d4' : '#c0c9e0',
                      color: '#fff', fontWeight: 600, fontSize: '0.95rem', cursor: selectedPlan ? 'pointer' : 'not-allowed',
                      transition: 'background 0.15s'
                    }}
                  >
                    {t('plans.calcBtn')}
                  </button>

                  {result && (
                    <div className="premium-result mt-3 fade-in">
                      <div className="premium-result-label">{t('plans.annualPremium')}</div>
                      <div className="premium-result-amount">{formatMMK(result.annual)} <span style={{ fontSize: '1rem' }}>MMK</span></div>
                      <div className="divider" style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '0.75rem 0' }}></div>
                      <div className="d-flex justify-content-between" style={{ fontSize: '0.85rem', opacity: 0.85 }}>
                        <span>{t('plans.monthly')}: <strong>{formatMMK(result.monthly)} MMK</strong></span>
                        <span>{t('plans.total')}: <strong>{formatMMK(result.total)} MMK</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right: Plan details ── */}
            <div className="col-12 col-lg-8">
              {/* Filter */}
              <div className="d-flex gap-2 mb-4 flex-wrap">
                {['ALL', 'LIFE', 'HEALTH', 'VEHICLE', 'PROPERTY'].map(f => (
                  <button key={f} onClick={() => setFilterType(f)} style={{
                    padding: '0.4rem 1rem', borderRadius: 20, border: '1px solid',
                    borderColor: filterType === f ? 'var(--primary)' : 'var(--border)',
                    background: filterType === f ? 'var(--primary)' : 'var(--bg-card)',
                    color: filterType === f ? '#fff' : 'var(--text-secondary)',
                    fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}>
                    {f === 'ALL' ? t('plans.all') : f}
                  </button>
                ))}
              </div>

              {!selectedPlan ? (
                <div className="plan-detail-panel">
                  <i className="bi bi-calculator" style={{ fontSize: '3rem', color: 'var(--border)', marginBottom: '1rem' }}></i>
                  <h5 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{t('plans.selectToView')}</h5>
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', maxWidth: 320 }}>
                    {t('plans.selectToViewDesc')}
                  </p>
                </div>
              ) : (
                <div className="plan-detail-panel" style={{ alignItems: 'stretch', justifyContent: 'flex-start' }}>
                  <div className="plan-detail-content fade-in">
                    <div className="d-flex align-items-start gap-3 mb-3">
                      <div className="insurance-icon-box" style={{
                        background: typeColors[selectedPlan.type]?.bg,
                        color: typeColors[selectedPlan.type]?.color,
                        marginBottom: 0
                      }}>
                        {typeColors[selectedPlan.type]?.icon}
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{selectedPlan.name}</h4>
                        <span style={{
                          background: 'var(--bg-secondary)', padding: '0.2rem 0.6rem',
                          borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)'
                        }}>{selectedPlan.type}</span>
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{selectedPlan.description}</p>

                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.85rem' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Min Coverage</div>
                          <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatMMK(selectedPlan.coverageMin)} MMK</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.85rem' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Max Coverage</div>
                          <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatMMK(selectedPlan.coverageMax)} MMK</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.85rem' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Premium Rate</div>
                          <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{(selectedPlan.premiumRate * 100).toFixed(1)}% / year</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.85rem' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Duration Options</div>
                          <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            {selectedPlan.durations?.join(', ')} yrs
                          </div>
                        </div>
                      </div>
                    </div>

                    <h6 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Key Benefits</h6>
                    <div className="row g-2">
                      {selectedPlan.benefits?.map(b => (
                        <div key={b} className="col-12 col-sm-6">
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-check-circle-fill" style={{ color: 'var(--secondary)', fontSize: '0.9rem', flexShrink: 0 }}></i>
                            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{b}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Plan Cards Grid */}
          <div className="mt-5">
            <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
              {t('plans.allPlans')}
            </h4>
            <div className="row g-4">
              {filteredPlans.map(plan => {
                const tc = typeColors[plan.type] || typeColors.LIFE
                return (
                  <div key={plan.id} className="col-12 col-sm-6 col-lg-4">
                    <div
                      className={`card-custom h-100 ${selectedPlan?.id === plan.id ? 'border-primary' : ''}`}
                      style={{ cursor: 'pointer', borderColor: selectedPlan?.id === plan.id ? 'var(--primary)' : 'var(--border)' }}
                      onClick={() => handlePlanSelect(plan)}
                    >
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div style={{ fontSize: '1.3rem' }}>{tc.icon}</div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: tc.color, background: tc.bg, padding: '0.15rem 0.5rem', borderRadius: 20 }}>
                          {plan.type}
                        </span>
                      </div>
                      <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{plan.name}</h6>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', marginBottom: '1rem' }}>{plan.description}</p>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Rate: <strong style={{ color: 'var(--accent)' }}>{(plan.premiumRate * 100).toFixed(1)}%/yr</strong>
                      </div>
                      {selectedPlan?.id === plan.id && (
                        <div className="mt-2">
                          <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                            <i className="bi bi-check-circle-fill me-1"></i>Selected
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
