import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useState, useRef } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../services/api'
import { getTypeMeta } from '../utils/typeMeta'

// ── AI Chat Widget ──────────────────────────────────────────────────────────

function AiChatWidget() {
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState('')
  const [messages, setMessages] = useState([
    { from: 'ai', text: 'မင်္ဂလာပါ! ကျွန်ုပ်သည် DICP Insurance Assistant ဖြစ်ပါသည်။ အာမခံအမျိုးအစားများ၊ Plan များ၊ Benefits နှင့်ပတ်သက်၍ မေးမြန်းနိုင်ပါသည်။' }
  ])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()

  useEffect(() => {
    if (open && bottomRef.current)
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async () => {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { from: 'user', text: msg }])
    setLoading(true)
    try {
      const res = await api.post('/ai/chat', { message: msg })
      setMessages(prev => [...prev, { from: 'ai', text: res.data.reply }])
    } catch {
      setMessages(prev => [...prev, { from: 'ai', text: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 1200,
          width: 340, maxWidth: 'calc(100vw - 48px)',
          background: 'var(--bg)', border: '1.5px solid var(--border)',
          borderRadius: 18, boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'fadeInUp .25s ease',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
            padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
              🤖
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Insurance AI Assistant</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem' }}>Ask about plans, benefits & more</div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.8, padding: '0.2rem' }}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem 0.9rem', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 240, maxHeight: 340 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.from === 'ai' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', marginRight: 6, flexShrink: 0, marginTop: 2 }}>
                    🤖
                  </div>
                )}
                <div style={{
                  maxWidth: '78%', padding: '0.55rem 0.8rem', borderRadius: m.from === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.from === 'user' ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: m.from === 'user' ? '#fff' : 'var(--text-primary)',
                  fontSize: '0.83rem', lineHeight: 1.55, whiteSpace: 'pre-wrap',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>🤖</div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '14px 14px 14px 4px', padding: '0.55rem 0.9rem', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'inline-flex', gap: 3 }}>
                    <span style={{ animation: 'bounce 1.2s infinite 0s', display: 'inline-block' }}>●</span>
                    <span style={{ animation: 'bounce 1.2s infinite .2s', display: 'inline-block' }}>●</span>
                    <span style={{ animation: 'bounce 1.2s infinite .4s', display: 'inline-block' }}>●</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '0.6rem 0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="မေးလိုသည့် မေးခွန်းကို ရိုက်ပါ..."
              style={{
                flex: 1, resize: 'none', border: '1.5px solid var(--border)', borderRadius: 10,
                padding: '0.5rem 0.7rem', fontSize: '0.83rem', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit',
                transition: 'border-color .15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button onClick={send} disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: input.trim() && !loading ? 'var(--primary)' : 'var(--border)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.95rem', flexShrink: 0, transition: 'background .15s', alignSelf: 'flex-end',
              }}>
              <i className="bi bi-send-fill" style={{ fontSize: '0.8rem' }}></i>
            </button>
          </div>
        </div>
      )}

      {/* Bubble Toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1200,
          width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
          boxShadow: '0 6px 24px rgba(99,102,241,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', transition: 'transform .2s, box-shadow .2s',
        }}
        title="Ask AI about insurance"
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open ? '✕' : '🤖'}
      </button>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}

// ── Main HomePage ───────────────────────────────────────────────────────────

export default function HomePage() {
  const { t } = useTranslation()
  const [insuranceTypes, setInsuranceTypes] = useState([])
  const [typesLoading, setTypesLoading]     = useState(true)
  const [expandedType, setExpandedType]     = useState(null)

  useEffect(() => {
    api.get('/insurance-types/public')
      .then(res => setInsuranceTypes(Array.isArray(res.data) ? res.data : []))
      .catch(() => setInsuranceTypes([]))
      .finally(() => setTypesLoading(false))
  }, [])

  const stats = [
    { value: '1M+', labelKey: 'home.stat1', icon: 'bi-people-fill' },
    { value: '50+', labelKey: 'home.stat2', icon: 'bi-grid-fill' },
    { value: '99%', labelKey: 'home.stat3', icon: 'bi-star-fill' },
    { value: '24/7', labelKey: 'home.stat4', icon: 'bi-headset' },
  ]

  const steps = [
    { num: 1, icon: 'bi-search',            titleKey: 'home.step1Title', descKey: 'home.step1Desc', color: '#1d4ed8' },
    { num: 2, icon: 'bi-file-earmark-text', titleKey: 'home.step2Title', descKey: 'home.step2Desc', color: '#7c3aed' },
    { num: 3, icon: 'bi-check-circle',      titleKey: 'home.step3Title', descKey: 'home.step3Desc', color: '#059669' },
    { num: 4, icon: 'bi-shield-check',      titleKey: 'home.step4Title', descKey: 'home.step4Desc', color: '#f59e0b' },
  ]

  return (
    <div>
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="hero-section-new">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        <div className="hero-mesh" />

        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center" style={{ minHeight: 'calc(100vh - 70px)' }}>
            <div className="col-12 col-lg-6 py-5">
              <div className="fade-in">
                <div className="hero-badge-new">
                  <i className="bi bi-shield-fill-check me-1"></i>
                  {t('hero.badge')}
                </div>
                <h1 className="hero-title-new">{t('hero.title')}</h1>
                <p className="hero-subtitle-new">{t('hero.subtitle')}</p>
                <div className="d-flex flex-wrap gap-3 mt-4">
                  <Link to="/plans" className="hero-btn-primary">
                    {t('hero.cta1')} <i className="bi bi-arrow-right ms-1"></i>
                  </Link>
                  <Link to="/how-it-works" className="hero-btn-ghost">
                    {t('hero.cta2')}
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-6 d-flex justify-content-center align-items-center py-4 py-lg-0">
              <div className="hero-img-scene fade-in">
                <img src="/hero-illustration.jpg" alt="Insurance illustration" className="hero-img-main" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="stats-section-new">
        <div className="container">
          <div className="row g-3">
            {stats.map(stat => (
              <div key={stat.labelKey} className="col-6 col-md-3">
                <div className="stat-card-new">
                  <i className={`bi ${stat.icon} stat-card-icon`}></i>
                  <div className="stat-card-value">{stat.value}</div>
                  <div className="stat-card-label">{t(stat.labelKey)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Insurance Types (dynamic from API) ─── */}
      <section style={{ padding: '5rem 0', background: 'var(--bg)' }}>
        <div className="container">
          <div className="text-center mb-5">
            <div className="section-label">{t('home.typesLabel')}</div>
            <h2 className="section-title">{t('home.typesTitle')}</h2>
            <p className="section-subtitle">{t('home.typesSubtitle')}</p>
          </div>

          {typesLoading ? (
            <div className="text-center py-4">
              <span className="spinner-border" style={{ color: 'var(--primary)' }}></span>
            </div>
          ) : insuranceTypes.length === 0 ? (
            <div className="text-center py-5" style={{ color: 'var(--text-muted)' }}>
              <i className="bi bi-shield" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 10 }}></i>
              <p>Insurance types are being configured. Please check back soon.</p>
            </div>
          ) : (
            <div className="row g-4">
              {insuranceTypes.map(type => {
                const meta = getTypeMeta(type.name)
                const isOpen = expandedType === type.id
                const hasDetails = type.description || type.benefits || type.rules
                return (
                  <div key={type.id} className="col-12 col-sm-6 col-lg-3">
                    <div
                      className="insurance-card-3d"
                      style={{ cursor: hasDetails ? 'pointer' : 'default', transition: 'box-shadow .2s' }}
                      onClick={() => hasDetails && setExpandedType(isOpen ? null : type.id)}
                    >
                      <div className="insurance-card-3d-icon" style={{ background: meta.gradientBg }}>
                        <span style={{ fontSize: '2rem' }}>{meta.emoji}</span>
                        <div className="insurance-card-3d-glow" style={{ background: meta.color }} />
                      </div>
                      <div style={{ padding: '0 0.25rem' }}>
                        <h5 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                          {type.name.charAt(0) + type.name.slice(1).toLowerCase().replace(/_/g, ' ')}
                          {' '}Insurance
                        </h5>
                        {type.description ? (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.85rem', lineHeight: 1.55 }}>
                            {type.description}
                          </p>
                        ) : (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.85rem' }}>
                            {t(`insuranceTypes.${type.name.toLowerCase()}.desc`, { defaultValue: 'Comprehensive insurance coverage tailored for you.' })}
                          </p>
                        )}

                        {/* Expandable Details */}
                        {isOpen && hasDetails && (
                          <div className="fade-in" style={{ marginBottom: '0.85rem' }}>
                            {type.benefits && (
                              <div style={{ marginBottom: '0.6rem' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.74rem', color: '#16a34a', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  <i className="bi bi-check2-circle me-1"></i>Benefits
                                </div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: '#f0fdf4', borderRadius: 8, padding: '0.5rem 0.6rem', border: '1px solid #bbf7d0' }}>
                                  {type.benefits}
                                </div>
                              </div>
                            )}
                            {type.rules && (
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.74rem', color: '#f59e0b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  <i className="bi bi-file-text me-1"></i>Rules & Conditions
                                </div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: '#fffbeb', borderRadius: 8, padding: '0.5rem 0.6rem', border: '1px solid #fde68a' }}>
                                  {type.rules}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="d-flex align-items-center gap-2">
                          <Link to="/plans" className="insurance-card-3d-link" style={{ color: meta.color }}>
                            {t('home.learnMore')} <i className="bi bi-arrow-right ms-1"></i>
                          </Link>
                          {hasDetails && (
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); setExpandedType(isOpen ? null : type.id) }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.76rem', color: meta.color, fontWeight: 600, padding: 0 }}
                            >
                              {isOpen ? 'ပိတ်မည်' : 'အသေးစိတ် ▾'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="insurance-card-3d-accent" style={{ background: meta.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section style={{ padding: '5rem 0', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="text-center mb-5">
            <div className="section-label">{t('home.howLabel')}</div>
            <h2 className="section-title">{t('home.howTitle')}</h2>
            <p className="section-subtitle">{t('home.howSubtitle')}</p>
          </div>
          <div className="row g-4">
            {steps.map((step, idx) => (
              <div key={step.num} className="col-12 col-sm-6 col-lg-3">
                <div className="step-card-3d" style={{ '--step-color': step.color }}>
                  <div className="step-card-num">{step.num}</div>
                  {idx < steps.length - 1 && <div className="step-connector d-none d-lg-block" />}
                  <div className="step-card-icon-box" style={{ background: step.color + '18', color: step.color }}>
                    <i className={`bi ${step.icon}`} style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <h5 style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--text-primary)', marginBottom: '0.4rem', marginTop: '1rem' }}>
                    {t(step.titleKey)}
                  </h5>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.87rem', margin: 0 }}>
                    {t(step.descKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-5">
            <Link to="/how-it-works" className="btn-primary-custom">
              {t('home.learnMoreProcess')} <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Why Choose Us ─── */}
      <section style={{ padding: '5rem 0', background: 'var(--bg)' }}>
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-12 col-lg-6">
              <div className="section-label">{t('home.whyLabel')}</div>
              <h2 className="section-title">{t('home.whyTitle')}</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                {t('home.whySubtitle')}
              </p>
              {[
                { icon: 'bi-shield-check',    titleKey: 'home.why1Title', descKey: 'home.why1Desc', color: '#1d4ed8' },
                { icon: 'bi-lightning-charge', titleKey: 'home.why2Title', descKey: 'home.why2Desc', color: '#f59e0b' },
                { icon: 'bi-people',           titleKey: 'home.why3Title', descKey: 'home.why3Desc', color: '#059669' },
                { icon: 'bi-graph-up-arrow',   titleKey: 'home.why4Title', descKey: 'home.why4Desc', color: '#7c3aed' },
              ].map(item => (
                <div key={item.titleKey} className="why-feature-row">
                  <div className="why-feature-icon" style={{ background: item.color + '18', color: item.color }}>
                    <i className={`bi ${item.icon}`}></i>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{t(item.titleKey)}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.87rem' }}>{t(item.descKey)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="col-12 col-lg-6">
              <div className="cta-box-3d">
                <div className="cta-box-orb cta-box-orb-1" />
                <div className="cta-box-orb cta-box-orb-2" />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
                  <h3 style={{ fontWeight: 800, marginBottom: '1rem', fontSize: '1.4rem' }}>{t('home.ctaBoxTitle')}</h3>
                  <p style={{ opacity: 0.85, marginBottom: '2rem', lineHeight: 1.7, fontSize: '0.95rem' }}>{t('home.ctaBoxDesc')}</p>
                  <div className="d-flex flex-column gap-2">
                    <Link to="/register" className="cta-box-btn-primary">{t('home.ctaBoxBtn1')}</Link>
                    <Link to="/plans"    className="cta-box-btn-ghost">{t('home.ctaBoxBtn2')}</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* ─── AI Chat Widget (floating) ─── */}
      <AiChatWidget />
    </div>
  )
}
