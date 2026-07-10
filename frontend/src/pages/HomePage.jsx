import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const insuranceTypes = [
  { icon: '❤️', bg: '#fff0f0', color: '#dc2626', key: 'life', title: 'Life Insurance', desc: 'Financial protection for your family in case of unexpected loss of life.' },
  { icon: '🏥', bg: '#f0fdf4', color: '#16a34a', key: 'health', title: 'Health Insurance', desc: 'Coverage for medical expenses, hospitalization, and treatments.' },
  { icon: '🚗', bg: '#eff6ff', color: '#1d4ed8', key: 'vehicle', title: 'Vehicle Insurance', desc: 'Protect your vehicle against accidents, theft, and damages.' },
  { icon: '🏠', bg: '#fefce8', color: '#ca8a04', key: 'property', title: 'Property Insurance', desc: 'Safeguard your home and assets from unforeseen events.' },
]

const stats = [
  { value: '1M+', label: 'Families Protected' },
  { value: '50+', label: 'Insurance Plans' },
  { value: '99%', label: 'Claim Approval Rate' },
  { value: '24/7', label: 'Customer Support' },
]

const steps = [
  { num: 1, icon: 'bi-search', title: 'Choose Your Plan', desc: 'Browse our transparent insurance plans and select the one that fits your needs and budget.' },
  { num: 2, icon: 'bi-file-earmark-text', title: 'Submit Application', desc: 'Fill in the application form and submit it to your assigned insurance agent for review.' },
  { num: 3, icon: 'bi-check-circle', title: 'Get Approved', desc: 'Our agents verify and forward your application to admin. You will be notified once approved.' },
  { num: 4, icon: 'bi-shield-check', title: "You're Protected", desc: 'Make your premium payment and receive your official insurance contract as a PDF.' },
]

export default function HomePage() {
  const { t } = useTranslation()

  return (
    <div>
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="hero-section">
        {/* Background shield */}
        <svg className="hero-shield-bg" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 5L15 38V105C15 153 52 195 100 210C148 195 185 153 185 105V38L100 5Z"
            fill="var(--primary)" />
          <path d="M82 122L58 98L67 89L82 104L133 53L142 62L82 122Z" fill="white" />
        </svg>

        <div className="container position-relative" style={{ zIndex: 1 }}>
          <div className="row">
            <div className="col-12 col-lg-7">
              <div className="fade-in">
                <div className="hero-badge">
                  <i className="bi bi-shield-fill-check" style={{ fontSize: '0.85rem' }}></i>
                  {t('hero.badge')}
                </div>
                <h1 className="hero-title">{t('hero.title')}</h1>
                <p className="hero-subtitle">{t('hero.subtitle')}</p>
                <div className="d-flex flex-wrap gap-3">
                  <Link to="/plans" className="btn-primary-custom">
                    {t('hero.cta1')} <i className="bi bi-arrow-right"></i>
                  </Link>
                  <Link to="/how-it-works" className="btn-outline-custom">
                    {t('hero.cta2')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section style={{ background: 'var(--primary)', padding: '2.5rem 0' }}>
        <div className="container">
          <div className="row g-3">
            {stats.map(stat => (
              <div key={stat.label} className="col-6 col-md-3">
                <div className="stat-card">
                  <div className="stat-number" style={{ color: '#fff' }}>{stat.value}</div>
                  <div className="stat-label" style={{ color: 'rgba(255,255,255,0.75)' }}>{stat.label}</div>
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
                <div className="insurance-type-card">
                  <div className="insurance-icon-box" style={{ background: type.bg, color: type.color }}>
                    {type.icon}
                  </div>
                  <h5 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    {t(`insuranceTypes.${type.key}.title`, type.title)}
                  </h5>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                    {t(`insuranceTypes.${type.key}.desc`, type.desc)}
                  </p>
                  <Link to="/plans" style={{ color: 'var(--primary)', fontSize: '0.88rem', fontWeight: 500, textDecoration: 'none' }}>
                    {t('home.learnMore')} <i className="bi bi-arrow-right"></i>
                  </Link>
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
                <div className="card-custom h-100">
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <div className="step-number">{step.num}</div>
                    <i className={`bi ${step.icon}`} style={{ fontSize: '1.4rem', color: 'var(--accent)', marginTop: '0.1rem' }}></i>
                  </div>
                  <h5 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    {step.title}
                  </h5>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                    {step.desc}
                  </p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="d-none d-lg-flex justify-content-end align-items-center pe-2" style={{ marginTop: '-40px' }}>
                  </div>
                )}
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
                { icon: 'bi-shield-check', title: t('home.why1Title'), desc: t('home.why1Desc') },
                { icon: 'bi-lightning-charge', title: t('home.why2Title'), desc: t('home.why2Desc') },
                { icon: 'bi-people', title: t('home.why3Title'), desc: t('home.why3Desc') },
                { icon: 'bi-graph-up-arrow', title: t('home.why4Title'), desc: t('home.why4Desc') },
              ].map(item => (
                <div key={item.title} className="d-flex gap-3 mb-3">
                  <div style={{
                    width: 40, height: 40, background: 'var(--bg-secondary)',
                    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <i className={`bi ${item.icon}`} style={{ color: 'var(--primary)' }}></i>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="col-12 col-lg-6">
              <div style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, #2d5986 100%)',
                borderRadius: 20, padding: '3rem 2.5rem', color: '#fff'
              }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>{t('home.ctaBoxTitle')}</h3>
                <p style={{ opacity: 0.85, marginBottom: '2rem', lineHeight: 1.7 }}>{t('home.ctaBoxDesc')}</p>
                <div className="d-flex flex-column gap-2">
                  <Link to="/register" style={{
                    background: '#fff', color: 'var(--primary)', padding: '0.75rem 1.5rem',
                    borderRadius: 8, fontWeight: 600, textDecoration: 'none', textAlign: 'center',
                    fontSize: '0.95rem'
                  }}>
                    {t('home.ctaBoxBtn1')}
                  </Link>
                  <Link to="/plans" style={{
                    border: '2px solid rgba(255,255,255,0.4)', color: '#fff', padding: '0.75rem 1.5rem',
                    borderRadius: 8, fontWeight: 600, textDecoration: 'none', textAlign: 'center',
                    fontSize: '0.95rem'
                  }}>
                    {t('home.ctaBoxBtn2')}
                  </Link>
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
