import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()

  const companyLinks = [
    { to: '/',             label: t('footer.home') },
    { to: '/how-it-works', label: t('footer.howItWorks') },
    { to: '/plans',        label: t('footer.plans') },
  ]

  const insuranceLinks = [
    t('footer.life'),
    t('footer.health'),
    t('footer.vehicle'),
    t('footer.property'),
  ]

  return (
    <footer className="footer-custom">
      <div className="container">

        {/* ── Main row ── */}
        <div className="row g-4 pb-4 align-items-start">

          {/* Brand */}
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div style={{
                width: 38, height: 38,
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className="bi bi-shield-check" style={{ color: '#fff', fontSize: '1.1rem' }}></i>
              </div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3 }}>
                {t('brand')}
              </span>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.75, marginBottom: '1.25rem', maxWidth: 300 }}>
              {t('footer.tagline')}
            </p>

            {/* Social icons */}
            <div className="d-flex gap-2">
              {[
                { id: 'facebook',  icon: 'facebook' },
                { id: 'twitter',   icon: 'twitter-x' },
                { id: 'linkedin',  icon: 'linkedin' },
                { id: 'instagram', icon: 'instagram' },
              ].map(s => (
                <a
                  key={s.id}
                  href="#"
                  aria-label={s.id}
                  style={{
                    width: 34, height: 34,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 7,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#94a3b8',
                    fontSize: '0.88rem',
                    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                    textDecoration: 'none',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.18)'
                    e.currentTarget.style.color = '#fff'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.color = '#94a3b8'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  }}
                >
                  <i className={`bi bi-${s.icon}`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Spacer on large screens */}
          <div className="d-none d-lg-block col-lg-2" />

          {/* Company links */}
          <div className="col-6 col-sm-3 col-lg-3">
            <h6 style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.82rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              {t('footer.company')}
            </h6>
            <ul className="list-unstyled mb-0" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {companyLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    style={{ color: '#94a3b8', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.color = '#fff'}
                    onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Insurance links */}
          <div className="col-6 col-sm-3 col-lg-3">
            <h6 style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.82rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              {t('footer.insurance')}
            </h6>
            <ul className="list-unstyled mb-0" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insuranceLinks.map(item => (
                <li key={item}>
                  <a
                    href="#"
                    style={{ color: '#94a3b8', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.color = '#fff'}
                    onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* ── Bottom bar ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.09)', paddingTop: '1.25rem' }}>
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
            <p style={{ color: '#475569', fontSize: '0.8rem', margin: 0 }}>
              © {new Date().getFullYear()} Digital Insurance Claim and Premiums. All rights reserved.
            </p>
            <div className="d-flex gap-4">
              {['Privacy Policy', 'Terms of Service'].map(item => (
                <a
                  key={item}
                  href="#"
                  style={{ color: '#64748b', fontSize: '0.8rem', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.color = '#94a3b8'}
                  onMouseOut={e => e.currentTarget.style.color = '#64748b'}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}
