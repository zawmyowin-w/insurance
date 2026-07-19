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

            {/* Right – Hero illustration */}
            <div className="col-12 col-lg-6 d-flex justify-content-center align-items-center py-4 py-lg-0">
              <div className="hero-img-scene fade-in">
                <img
                  src="/hero-illustration.jpg"
                  alt="Insurance illustration"
                  className="hero-img-main"
                />
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
