import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function CustomerDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [stats, setStats] = useState({ applications: 0, activePolicies: 0, pendingClaims: 0, notifications: 0 })
  const [recentApps, setRecentApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/customer/dashboard/stats').catch(() => ({ data: stats })),
      api.get('/customer/applications?limit=5').catch(() => ({ data: [] })),
    ]).then(([statsRes, appsRes]) => {
      setStats(statsRes.data)
      setRecentApps(Array.isArray(appsRes.data) ? appsRes.data.slice(0, 5) : [])
    }).finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: t('dash.totalApplications'), value: stats.applications, icon: 'bi-file-earmark-text', color: '#1d4ed8', bg: '#eff6ff', link: '/customer/applications' },
    { label: t('dash.activePolicies'), value: stats.activePolicies, icon: 'bi-shield-check', color: '#16a34a', bg: '#f0fdf4', link: '/customer/policies' },
    { label: t('dash.pendingClaims'), value: stats.pendingClaims, icon: 'bi-file-earmark-medical', color: '#f59e0b', bg: '#fefce8', link: '/customer/claims' },
    { label: t('dash.notifications'), value: stats.notifications, icon: 'bi-bell', color: '#dc2626', bg: '#fff0f0', link: '/customer/notifications' },
  ]

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          {t('dash.welcome')}, {user?.name} 👋
        </h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
          {t('dash.customerSubtitle')}
        </p>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {statCards.map(card => (
          <div key={card.label} className="col-6 col-lg-3">
            <Link to={card.link} style={{ textDecoration: 'none' }}>
              <div className="card-custom h-100" style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`bi ${card.icon}`} style={{ color: card.color, fontSize: '1.1rem' }}></i>
                  </div>
                  <i className="bi bi-arrow-right-short" style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}></i>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {loading ? '—' : card.value}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{card.label}</div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card-custom mb-4">
        <h6 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>{t('dash.quickActions')}</h6>
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/customer/apply" className="btn-primary-custom" style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}>
            <i className="bi bi-plus-circle me-2"></i>{t('dash.applyPolicy')}
          </Link>
          <Link to="/customer/submit-claim" className="btn-primary-sm" style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}>
            <i className="bi bi-file-earmark-plus me-2"></i>{t('dash.submitClaim')}
          </Link>
          <Link to="/customer/payments" className="btn-primary-sm" style={{ fontSize: '0.88rem', padding: '0.45rem 1rem', background: '#0891b2' }}>
            <i className="bi bi-credit-card me-2"></i>{t('dash.payments')}
          </Link>
          <Link to="/plans" style={{ padding: '0.45rem 1rem', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="bi bi-search"></i>{t('dash.browsePlans')}
          </Link>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="card-custom">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t('dash.recentApplications')}</h6>
          <Link to="/customer/applications" style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>
            {t('dash.viewAll')} <i className="bi bi-arrow-right"></i>
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-4"><div className="spinner-border" style={{ color: 'var(--primary)', width: 28, height: 28 }}></div></div>
        ) : recentApps.length === 0 ? (
          <div className="text-center py-4">
            <i className="bi bi-file-earmark-text" style={{ fontSize: '2.5rem', color: 'var(--border)' }}></i>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>{t('dash.noApplications')}</p>
            <Link to="/customer/apply" className="btn-primary-sm mt-1">{t('dash.applyNow')}</Link>
          </div>
        ) : (
          <div className="table-custom">
            <table className="w-100">
              <thead>
                <tr>
                  {[t('dash.planCol'), t('dash.coverageCol'), t('dash.durationCol'), t('dash.statusCol'), t('dash.dateCol')].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentApps.map(app => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 500 }}>{app.packageName || app.package?.name}</td>
                    <td>{Number(app.coverageAmount).toLocaleString()}</td>
                    <td>{app.duration} {app.duration > 1 ? t('dash.years') : t('dash.year')}</td>
                    <td><span className={`badge-status badge-${app.status?.toLowerCase()}`}>{app.status}</span></td>
                    <td>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
