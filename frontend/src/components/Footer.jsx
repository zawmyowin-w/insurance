import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="footer-custom">
      <div className="container">
        <div className="row g-4 pb-4">
          {/* Brand */}
          <div className="col-12 col-md-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div style={{
                width: 36, height: 36, background: 'rgba(255,255,255,0.15)',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <i className="bi bi-shield-check text-white"></i>
              </div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                {t('brand')}
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.7, maxWidth: 260 }}>
              {t('footer.tagline')}
            </p>
            <div className="d-flex gap-2 mt-3">
              {['facebook', 'twitter', 'linkedin', 'instagram'].map(s => (
                <a key={s} href="#" style={{
                  width: 34, height: 34, background: 'rgba(255,255,255,0.1)',
                  borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#94a3b8', fontSize: '0.9rem'
                }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                  <i className={`bi bi-${s}`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="col-6 col-md-2">
            <h6 style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.75rem' }}>
              {t('footer.company')}
            </h6>
            <ul className="list-unstyled mb-0" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['/', '/how-it-works', '/plans', '/contact'].map((path, i) => (
                <li key={path}>
                  <Link to={path}>{[t('footer.home'), t('footer.howItWorks'), t('footer.plans'), t('footer.contact')][i]}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-6 col-md-2">
            <h6 style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.75rem' }}>
              {t('footer.insurance')}
            </h6>
            <ul className="list-unstyled mb-0" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[t('footer.life'), t('footer.health'), t('footer.vehicle'), t('footer.property')].map(item => (
                <li key={item}><a href="#">{item}</a></li>
              ))}
            </ul>
          </div>

          <div className="col-12 col-md-4">
            <h6 style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.75rem' }}>
              {t('footer.contact')}
            </h6>
            <ul className="list-unstyled mb-0" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: 'geo-alt', text: 'Yangon, Myanmar' },
                { icon: 'telephone', text: '+95 9 123 456 789' },
                { icon: 'envelope', text: 'info@dicp.com.mm' },
                { icon: 'clock', text: 'Mon – Fri, 9 AM – 5 PM' },
              ].map(item => (
                <li key={item.icon} className="d-flex align-items-center gap-2" style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
                  <i className={`bi bi-${item.icon}`} style={{ color: '#64748b' }}></i>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-top pt-3" style={{ borderColor: 'rgba(255,255,255,0.1) !important' }}>
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>
              © {new Date().getFullYear()} Digital Insurance Claim and Premiums. All rights reserved.
            </p>
            <div className="d-flex gap-3">
              {['Privacy Policy', 'Terms of Service'].map(item => (
                <a key={item} href="#" style={{ fontSize: '0.82rem' }}>{item}</a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
