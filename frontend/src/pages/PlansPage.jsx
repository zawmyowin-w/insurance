import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import api from '../services/api'

const ALL_TYPES = ['LIFE', 'HEALTH', 'TRAVEL', 'MOTOR', 'EDUCATION', 'VEHICLE', 'PROPERTY']

const TYPE_META = {
  LIFE:      { color: '#dc2626', bg: '#fef2f2',  icon: 'bi-heart-pulse',   label: 'Life Insurance',      desc: 'Financial protection for your family' },
  HEALTH:    { color: '#16a34a', bg: '#f0fdf4',  icon: 'bi-hospital',      label: 'Health Insurance',    desc: 'Medical coverage & hospitalization' },
  TRAVEL:    { color: '#0891b2', bg: '#ecfeff',  icon: 'bi-airplane',      label: 'Travel Insurance',    desc: 'International & domestic travel protection' },
  MOTOR:     { color: '#d97706', bg: '#fffbeb',  icon: 'bi-car-front',     label: 'Motor Insurance',     desc: 'Vehicle accident & theft coverage' },
  EDUCATION: { color: '#7c3aed', bg: '#f5f3ff',  icon: 'bi-mortarboard',   label: 'Education Insurance', desc: 'Secure your children\'s educational future' },
  VEHICLE:   { color: '#2563eb', bg: '#eff6ff',  icon: 'bi-truck',         label: 'Vehicle Insurance',   desc: 'Comprehensive vehicle protection' },
  PROPERTY:  { color: '#ca8a04', bg: '#fefce8',  icon: 'bi-house-check',   label: 'Property Insurance',  desc: 'Home & commercial property coverage' },
}

const OCCUPATIONS = ['Employee', 'Business Owner', 'Driver', 'Student', 'Teacher', 'Engineer', 'Doctor', 'Freelancer', 'Other']

function recommendPlans(age, occupation, income) {
  const a = parseInt(age) || 0, inc = parseInt(income) || 0
  const occ = (occupation || '').toLowerCase()
  const rec = []
  if (a >= 18) rec.push({ type: 'LIFE', reason: 'Essential family financial protection' })
  if (a >= 16) rec.push({ type: 'HEALTH', reason: 'Medical coverage at any age' })
  if (occ.includes('driver') || occ.includes('car') || occ.includes('vehicle')) rec.push({ type: 'MOTOR', reason: 'Protect your vehicle from accidents' })
  if (occ.includes('student')) rec.push({ type: 'EDUCATION', reason: 'Secure your educational goals' })
  if (inc > 500000) rec.push({ type: 'PROPERTY', reason: 'Protect your valuable assets' })
  rec.push({ type: 'TRAVEL', reason: 'Coverage for international travel' })
  const seen = new Set()
  return rec.filter(r => { if (seen.has(r.type)) return false; seen.add(r.type); return true }).slice(0, 3)
}

export default function PlansPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [expandedId, setExpandedId] = useState(null)
  // Recommendation
  const [recAge, setRecAge] = useState('')
  const [recOcc, setRecOcc] = useState('')
  const [recIncome, setRecIncome] = useState('')
  const [recommendations, setRecommendations] = useState([])
  const [showRec, setShowRec] = useState(false)

  useEffect(() => {
    api.get('/packages/public').then(res => setPlans(Array.isArray(res.data) ? res.data : [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = plans.filter(p => {
    const typeOk = typeFilter === 'ALL' || p.type === typeFilter
    const recOk = recommendations.length === 0 || !showRec || recommendations.some(r => r.type === p.type)
    return typeOk && recOk
  })

  const handleRecommend = () => {
    const recs = recommendPlans(recAge, recOcc, recIncome)
    setRecommendations(recs)
    setShowRec(true)
    setTypeFilter('ALL')
  }

  const handleApply = (plan) => {
    if (!user) { navigate('/login'); return }
    navigate('/customer/apply', { state: { planId: plan.id } })
  }

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div className="text-center mb-5">
          <h2 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Insurance Plans</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>Choose the right coverage for you and your family</p>
        </div>

        {/* Plan Recommendation Widget */}
        <div className="card-custom mb-5" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)', border: 'none' }}>
          <div className="row align-items-center g-3">
            <div className="col-12 col-md-3">
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8, marginBottom: 4 }}>Plan Recommender</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.3 }}>Find the right plan for you</div>
                <div style={{ fontSize: '0.82rem', opacity: 0.8, marginTop: 4 }}>Based on your profile</div>
              </div>
            </div>
            <div className="col-12 col-md-7">
              <div className="row g-2">
                <div className="col-4">
                  <input type="number" className="form-control-custom w-100" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
                    placeholder="Age" value={recAge} onChange={e => setRecAge(e.target.value)} min={0} max={100} />
                </div>
                <div className="col-4">
                  <select className="form-select-custom w-100" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
                    value={recOcc} onChange={e => setRecOcc(e.target.value)}>
                    <option value="">Occupation</option>
                    {OCCUPATIONS.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
                  </select>
                </div>
                <div className="col-4">
                  <input type="number" className="form-control-custom w-100" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
                    placeholder="Monthly Income (MMK)" value={recIncome} onChange={e => setRecIncome(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="col-12 col-md-2">
              <button onClick={handleRecommend} className="btn-primary-custom w-100" style={{ justifyContent: 'center', background: '#fff', color: '#1d4ed8', border: 'none' }}>
                <i className="bi bi-magic me-2"></i>Recommend
              </button>
            </div>
          </div>
          {showRec && recommendations.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem', marginBottom: '0.5rem' }}>Recommended for you:</div>
              <div className="d-flex gap-2 flex-wrap">
                {recommendations.map(rec => (
                  <button key={rec.type} onClick={() => setTypeFilter(rec.type)} style={{ padding: '0.35rem 0.85rem', borderRadius: 99, border: '1.5px solid rgba(255,255,255,0.5)', background: typeFilter === rec.type ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)', color: typeFilter === rec.type ? '#1d4ed8' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.15s' }}>
                    <i className={`bi ${TYPE_META[rec.type]?.icon} me-1`}></i>{TYPE_META[rec.type]?.label}
                    <span style={{ opacity: 0.7, fontSize: '0.72rem', marginLeft: 4 }}>— {rec.reason}</span>
                  </button>
                ))}
                <button onClick={() => { setShowRec(false); setRecommendations([]); setTypeFilter('ALL') }} style={{ padding: '0.35rem 0.75rem', borderRadius: 99, border: '1.5px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.78rem' }}>
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Type Filter Tabs */}
        <div className="d-flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
          {['ALL', ...ALL_TYPES].map(t => {
            const meta = TYPE_META[t]
            return (
              <button key={t} onClick={() => setTypeFilter(t)} style={{
                padding: '0.4rem 1rem', borderRadius: 99, border: `2px solid ${typeFilter === t ? (meta?.color || 'var(--primary)') : 'var(--border)'}`,
                cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.15s',
                background: typeFilter === t ? (meta?.bg || 'var(--bg-secondary)') : 'transparent',
                color: typeFilter === t ? (meta?.color || 'var(--primary)') : 'var(--text-secondary)',
              }}>
                {meta && <i className={`bi ${meta.icon} me-1`}></i>}{t === 'ALL' ? 'All Plans' : meta?.label || t}
              </button>
            )
          })}
        </div>

        {/* Plan Cards */}
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
        ) : filtered.length === 0 ? (
          <div className="card-custom text-center py-5">
            <i className="bi bi-search" style={{ fontSize: '2.5rem', color: 'var(--border)' }}></i>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem' }}>No plans found for this type</p>
          </div>
        ) : (
          <div className="row g-4">
            {filtered.map(plan => {
              const meta = TYPE_META[plan.type] || { color: '#6b7280', bg: '#f3f4f6', icon: 'bi-shield', label: plan.type }
              const expanded = expandedId === plan.id
              return (
                <div key={plan.id} className="col-12 col-md-6 col-xl-4">
                  <div className="card-custom h-100" style={{ display: 'flex', flexDirection: 'column', border: `2px solid ${expanded ? meta.color : 'var(--border)'}`, transition: 'border-color 0.2s' }}>
                    {/* Header */}
                    <div className="d-flex align-items-start gap-3 mb-3">
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className={`bi ${meta.icon}`} style={{ color: meta.color, fontSize: '1.4rem' }}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{meta.label}</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1.3 }}>{plan.name}</div>
                      </div>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', flexGrow: 0 }}>{plan.description}</p>

                    {/* Key stats */}
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.5rem 0.65rem' }}>
                          <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Premium Rate</div>
                          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>{(plan.premiumRate * 100).toFixed(1)}% / yr</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.5rem 0.65rem' }}>
                          <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Policy Term</div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{plan.policyTerm ? `Up to ${plan.policyTerm} yrs` : 'Flexible'}</div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.5rem 0.65rem' }}>
                          <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coverage Range (MMK)</div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                            {Number(plan.coverageMin).toLocaleString()} – {Number(plan.coverageMax).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Benefits preview */}
                    {(plan.benefits || []).length > 0 && (
                      <div className="mb-2">
                        {(plan.benefits || []).slice(0, expanded ? 20 : 3).map((b, i) => (
                          <div key={i} style={{ display: 'flex', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                            <i className="bi bi-check-circle-fill" style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }}></i>{b}
                          </div>
                        ))}
                        {!expanded && (plan.benefits || []).length > 3 && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>+{(plan.benefits || []).length - 3} more benefits</div>
                        )}
                      </div>
                    )}

                    {/* Expanded details */}
                    {expanded && (
                      <div className="fade-in">
                        {plan.eligibility && (
                          <div className="mb-3 mt-2">
                            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                              <i className="bi bi-person-check me-1" style={{ color: '#1d4ed8' }}></i>Eligibility
                            </div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>{plan.eligibility}</p>
                          </div>
                        )}
                        {plan.exclusions && (
                          <div className="mb-3">
                            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                              <i className="bi bi-x-circle me-1" style={{ color: '#dc2626' }}></i>Exclusions
                            </div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>{plan.exclusions}</p>
                          </div>
                        )}
                        {(plan.durations || []).length > 0 && (
                          <div className="mb-2">
                            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Available Durations</div>
                            <div className="d-flex gap-1 flex-wrap">
                              {(plan.durations || []).map(d => (
                                <span key={d} style={{ padding: '0.2rem 0.55rem', borderRadius: 6, background: meta.bg, color: meta.color, fontSize: '0.78rem', fontWeight: 700 }}>{d} yr</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-auto pt-3 d-flex gap-2">
                      <button onClick={() => setExpandedId(expanded ? null : plan.id)} style={{ padding: '0.5rem 0.85rem', borderRadius: 8, border: `1.5px solid ${meta.color}`, background: 'transparent', color: meta.color, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.15s' }}>
                        <i className={`bi bi-chevron-${expanded ? 'up' : 'down'} me-1`}></i>{expanded ? 'Less' : 'Details'}
                      </button>
                      <button onClick={() => handleApply(plan)} className="btn-primary-custom flex-grow-1" style={{ justifyContent: 'center', background: meta.color, borderColor: meta.color }}>
                        <i className="bi bi-check-circle me-2"></i>Apply Now
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Not logged in hint */}
        {!user && (
          <div className="card-custom text-center mt-5 py-4">
            <i className="bi bi-person-lock" style={{ fontSize: '2rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}></i>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Ready to apply?</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Create an account or log in to apply for any plan</p>
            <div className="d-flex gap-2 justify-content-center">
              <Link to="/register" className="btn-primary-custom">Create Account</Link>
              <Link to="/login" className="btn-outline-custom">Log In</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
