import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const insuranceTypes = [
  { icon: '❤️', bg: 'linear-gradient(135deg,#fff0f0,#ffe4e4)', color: '#dc2626', key: 'life',     accent: '#dc2626' },
  { icon: '🏥', bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', color: '#16a34a', key: 'health',   accent: '#16a34a' },
  { icon: '🚗', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', color: '#1d4ed8', key: 'vehicle',  accent: '#1d4ed8' },
  { icon: '🏠', bg: 'linear-gradient(135deg,#fefce8,#fef08a)', color: '#ca8a04', key: 'property', accent: '#ca8a04' },
]

export default function HomePage() {
  const { t } = useTranslation()

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
        {/* Animated orbs */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        {/* Mesh grid overlay */}
        <div className="hero-mesh" />

        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center" style={{ minHeight: 'calc(100vh - 70px)' }}>
            {/* Left – text */}
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
                {/* Trust row */}
                <div className="d-flex align-items-center gap-3 mt-5 flex-wrap">
                  {['SSL Secured','ISO Certified','Bank-grade Encryption'].map(label => (
                    <div key={label} className="hero-trust-pill">
                      <i className="bi bi-check-circle-fill me-1" style={{ color: '#4ade80', fontSize: '0.8rem' }}></i>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right – 3D illustration */}
            <div className="col-12 col-lg-6 d-flex justify-content-center align-items-center py-5">
              <div className="hero-3d-scene fade-in">
                <svg viewBox="0 0 480 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-3d-svg">
                  {/* Definitions */}
                  <defs>
                    <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#3b82f6"/>
                      <stop offset="100%" stopColor="#1a3a5c"/>
                    </linearGradient>
                    <linearGradient id="shieldLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.3)"/>
                      <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
                    </linearGradient>
                    <linearGradient id="cardGrad1" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#6366f1"/>
                      <stop offset="100%" stopColor="#4f46e5"/>
                    </linearGradient>
                    <linearGradient id="cardGrad2" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9"/>
                      <stop offset="100%" stopColor="#0284c7"/>
                    </linearGradient>
                    <linearGradient id="cardGrad3" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981"/>
                      <stop offset="100%" stopColor="#059669"/>
                    </linearGradient>
                    <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="20" stdDeviation="15" floodColor="rgba(0,0,0,0.35)"/>
                    </filter>
                    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="rgba(0,0,0,0.3)"/>
                    </filter>
                    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="8" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>

                  {/* Shadow on ground */}
                  <ellipse cx="240" cy="455" rx="120" ry="18" fill="rgba(0,0,0,0.18)"/>

                  {/* ── Main 3D Shield ── */}
                  {/* Back / depth layer */}
                  <path d="M240 52L128 90V178C128 248 178 308 240 328C302 308 352 248 352 178V90L240 52Z"
                    fill="#0f2540" transform="translate(8,12)" opacity="0.6"/>
                  {/* Main shield body */}
                  <path d="M240 52L128 90V178C128 248 178 308 240 328C302 308 352 248 352 178V90L240 52Z"
                    fill="url(#shieldGrad)" filter="url(#shadow3d)"/>
                  {/* Shine overlay */}
                  <path d="M240 52L128 90V178C128 248 178 308 240 328C302 308 352 248 352 178V90L240 52Z"
                    fill="url(#shieldLight)" opacity="0.5"/>
                  {/* Inner bevel ring */}
                  <path d="M240 75L148 107V178C148 238 190 291 240 309C290 291 332 238 332 178V107L240 75Z"
                    fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2"/>
                  {/* Checkmark */}
                  <path d="M200 190L225 215L285 155" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)"/>
                  {/* Lock icon at bottom of shield */}
                  <rect x="228" y="292" width="24" height="18" rx="4" fill="rgba(255,255,255,0.25)"/>
                  <path d="M234 292V287C234 283.7 236.7 281 240 281C243.3 281 246 283.7 246 287V292" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

                  {/* ── Floating card 1 – Policy card (top-left) ── */}
                  <g transform="translate(42,80) rotate(-12,0,0)" className="hero-float-1">
                    <rect width="145" height="90" rx="14" fill="url(#cardGrad1)" filter="url(#cardShadow)"/>
                    <rect width="145" height="90" rx="14" fill="url(#shieldLight)" opacity="0.3"/>
                    {/* Card chip */}
                    <rect x="14" y="18" width="28" height="22" rx="5" fill="rgba(255,255,255,0.35)"/>
                    <rect x="18" y="22" width="20" height="14" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                    {/* Card text lines */}
                    <rect x="14" y="54" width="60" height="6" rx="3" fill="rgba(255,255,255,0.6)"/>
                    <rect x="14" y="66" width="40" height="5" rx="2.5" fill="rgba(255,255,255,0.35)"/>
                    <rect x="14" y="76" width="50" height="4" rx="2" fill="rgba(255,255,255,0.25)"/>
                    {/* Logo dot */}
                    <circle cx="125" cy="22" r="12" fill="rgba(255,255,255,0.2)"/>
                    <circle cx="125" cy="22" r="8" fill="rgba(255,255,255,0.15)"/>
                    <text x="122" y="27" fill="white" fontSize="9" fontWeight="bold">✦</text>
                  </g>

                  {/* ── Floating card 2 – Claim status (right) ── */}
                  <g transform="translate(315,135) rotate(10,0,0)" className="hero-float-2">
                    <rect width="140" height="110" rx="14" fill="url(#cardGrad2)" filter="url(#cardShadow)"/>
                    <rect width="140" height="110" rx="14" fill="url(#shieldLight)" opacity="0.25"/>
                    {/* Header */}
                    <rect x="0" y="0" width="140" height="30" rx="14" fill="rgba(0,0,0,0.15)"/>
                    <rect x="0" y="16" width="140" height="14" fill="rgba(0,0,0,0.15)"/>
                    <circle cx="20" cy="15" r="8" fill="rgba(255,255,255,0.3)"/>
                    <text x="16" y="19" fill="white" fontSize="9">✓</text>
                    <rect x="34" y="10" width="70" height="5" rx="2.5" fill="rgba(255,255,255,0.7)"/>
                    {/* Bars */}
                    <rect x="14" y="42" width="110" height="8" rx="4" fill="rgba(255,255,255,0.15)"/>
                    <rect x="14" y="42" width="80" height="8" rx="4" fill="rgba(255,255,255,0.5)"/>
                    <rect x="14" y="58" width="110" height="8" rx="4" fill="rgba(255,255,255,0.15)"/>
                    <rect x="14" y="58" width="50" height="8" rx="4" fill="rgba(255,255,255,0.4)"/>
                    <rect x="14" y="74" width="110" height="8" rx="4" fill="rgba(255,255,255,0.15)"/>
                    <rect x="14" y="74" width="95" height="8" rx="4" fill="rgba(255,255,255,0.45)"/>
                    <rect x="14" y="90" width="75" height="14" rx="7" fill="rgba(255,255,255,0.25)"/>
                    <text x="28" y="101" fill="white" fontSize="8" fontWeight="600">APPROVED</text>
                  </g>

                  {/* ── Floating card 3 – Premium payment (bottom-left) ── */}
                  <g transform="translate(50,300) rotate(-8,0,0)" className="hero-float-3">
                    <rect width="155" height="80" rx="14" fill="url(#cardGrad3)" filter="url(#cardShadow)"/>
                    <rect width="155" height="80" rx="14" fill="url(#shieldLight)" opacity="0.2"/>
                    <circle cx="22" cy="22" r="14" fill="rgba(255,255,255,0.2)"/>
                    <text x="15" y="27" fill="white" fontSize="13">💎</text>
                    <rect x="46" y="14" width="80" height="6" rx="3" fill="rgba(255,255,255,0.7)"/>
                    <rect x="46" y="24" width="55" height="5" rx="2.5" fill="rgba(255,255,255,0.4)"/>
                    <rect x="14" y="50" width="55" height="20" rx="8" fill="rgba(255,255,255,0.2)"/>
                    <rect x="14" y="50" width="55" height="20" rx="8" fill="rgba(255,255,255,0.08)"/>
                    <text x="21" y="63" fill="white" fontSize="9" fontWeight="700">PAID ✓</text>
                    <rect x="80" y="50" width="65" height="20" rx="8" fill="rgba(0,0,0,0.15)"/>
                    <text x="88" y="63" fill="rgba(255,255,255,0.8)" fontSize="9">24 Jul 2026</text>
                  </g>

                  {/* ── Floating badge – notification (top-right) ── */}
                  <g transform="translate(355,55)" className="hero-float-badge">
                    <rect width="100" height="44" rx="22" fill="white" filter="url(#cardShadow)"/>
                    <circle cx="22" cy="22" r="15" fill="#dcfce7"/>
                    <text x="15" y="27" fontSize="14">🔔</text>
                    <rect x="42" y="12" width="48" height="6" rx="3" fill="#e5e7eb"/>
                    <rect x="42" y="23" width="38" height="5" rx="2.5" fill="#e5e7eb"/>
                    {/* Red dot */}
                    <circle cx="30" cy="10" r="6" fill="#ef4444"/>
                    <text x="27" y="14" fill="white" fontSize="7" fontWeight="bold">3</text>
                  </g>

                  {/* ── Small floating dots ── */}
                  <circle cx="88" cy="240" r="8" fill="rgba(59,130,246,0.4)" className="hero-dot-1"/>
                  <circle cx="395" cy="280" r="6" fill="rgba(16,185,129,0.45)" className="hero-dot-2"/>
                  <circle cx="155" cy="395" r="5" fill="rgba(245,158,11,0.5)" className="hero-dot-3"/>
                  <circle cx="350" cy="400" r="9" fill="rgba(139,92,246,0.35)" className="hero-dot-1"/>

                  {/* ── Geometric accent rings ── */}
                  <circle cx="60" cy="400" r="30" stroke="rgba(99,102,241,0.2)" strokeWidth="2" fill="none"/>
                  <circle cx="60" cy="400" r="20" stroke="rgba(99,102,241,0.15)" strokeWidth="1.5" fill="none"/>
                  <circle cx="420" cy="350" r="25" stroke="rgba(16,185,129,0.2)" strokeWidth="2" fill="none"/>
                </svg>
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

      {/* ─── Insurance Types ─── */}
      <section style={{ padding: '5rem 0', background: 'var(--bg)' }}>
        <div className="container">
          <div className="text-center mb-5">
            <div className="section-label">{t('home.typesLabel')}</div>
            <h2 className="section-title">{t('home.typesTitle')}</h2>
            <p className="section-subtitle">{t('home.typesSubtitle')}</p>
          </div>
          <div className="row g-4">
            {insuranceTypes.map(type => (
              <div key={type.key} className="col-12 col-sm-6 col-lg-3">
                <div className="insurance-card-3d">
                  <div className="insurance-card-3d-icon" style={{ background: type.bg }}>
                    <span style={{ fontSize: '2rem' }}>{type.icon}</span>
                    <div className="insurance-card-3d-glow" style={{ background: type.accent }} />
                  </div>
                  <div style={{ padding: '0 0.25rem' }}>
                    <h5 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                      {t(`insuranceTypes.${type.key}.title`)}
                    </h5>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                      {t(`insuranceTypes.${type.key}.desc`)}
                    </p>
                    <Link to="/plans" className="insurance-card-3d-link" style={{ color: type.accent }}>
                      {t('home.learnMore')} <i className="bi bi-arrow-right ms-1"></i>
                    </Link>
                  </div>
                  <div className="insurance-card-3d-accent" style={{ background: type.accent }} />
                </div>
              </div>
            ))}
          </div>
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
    </div>
  )
}
