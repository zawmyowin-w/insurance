import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [stats, setStats] = useState({ totalCustomers: 0, totalAgents: 0, pendingApplications: 0, pendingClaims: 0, verifiedApplications: 0, verifiedClaims: 0, totalPackages: 0, monthlyRevenue: 0 })
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard/stats').catch(() => ({ data: stats })),
      api.get('/admin/recent-activities').catch(() => ({ data: [] })),
    ]).then(([s, a]) => {
      setStats(s.data)
      setRecentActivities(Array.isArray(a.data) ? a.data.slice(0, 8) : [])
    }).finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: t('admin.dashboard.totalCustomers'),       value: stats.totalCustomers,       icon: 'bi-people-fill',               grad: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', link: '/admin/users?tab=CUSTOMER' },
    { label: t('admin.dashboard.totalAgents'),          value: stats.totalAgents,          icon: 'bi-person-badge-fill',         grad: 'linear-gradient(135deg,#a855f7,#7c3aed)', link: '/admin/users?tab=AGENT' },
    { label: t('admin.dashboard.pendingApplications'),  value: stats.pendingApplications,  icon: 'bi-file-earmark-text-fill',    grad: 'linear-gradient(135deg,#f59e0b,#d97706)', link: '/admin/applications?filter=PENDING' },
    { label: t('admin.dashboard.pendingClaims'),        value: stats.pendingClaims,        icon: 'bi-file-earmark-medical-fill', grad: 'linear-gradient(135deg,#ef4444,#dc2626)', link: '/admin/claims?filter=PENDING' },
    { label: t('admin.dashboard.verifiedApplications'), value: stats.verifiedApplications, icon: 'bi-file-earmark-check-fill',   grad: 'linear-gradient(135deg,#22c55e,#16a34a)', link: '/admin/applications?filter=VERIFIED' },
    { label: t('admin.dashboard.verifiedClaims'), value: stats.verifiedClaims, icon: 'bi-shield-fill-check', grad: 'linear-gradient(135deg,#06b6d4,#0891b2)', link: '/admin/claims?filter=VERIFIED' },
    { label: t('admin.dashboard.totalPackages'),  value: stats.totalPackages,  icon: 'bi-box-seam-fill', grad: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', link: '/admin/packages' },
    { label: t('admin.dashboard.monthlyRevenue'), value: stats.monthlyRevenue ? Number(stats.monthlyRevenue).toLocaleString() : '0', icon: 'bi-cash-coin', grad: 'linear-gradient(135deg,#f59e0b,#b45309)', link: '#' },
  ]

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? t('admin.dashboard.greetingMorning') : hour < 17 ? t('admin.dashboard.greetingAfternoon') : t('admin.dashboard.greetingEvening')

  return (
    <div className="fade-in">

      {/* ── Dashboard Welcome Banner ── */}
      <div className="dashboard-banner mb-4">
        <div className="dashboard-banner-orb dashboard-banner-orb-1" />
        <div className="dashboard-banner-orb dashboard-banner-orb-2" />
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3" style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              {greeting}
            </div>
            <h4 style={{ fontWeight: 800, color: '#fff', margin: 0, fontSize: '1.4rem' }}>
              {user?.name} &nbsp;<span style={{ opacity: 0.7, fontWeight: 400, fontSize: '1rem' }}>— {t('admin.dashboard.systemOverview')}</span>
            </h4>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
              {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <div className="dashboard-banner-badge">
              <i className="bi bi-shield-fill-check me-1"></i> {t('admin.dashboard.adminBadge')}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="row g-3 mb-4">
        {statCards.map(card => (
          <div key={card.label} className="col-6 col-lg-4 col-xl-3">
            <Link to={card.link} style={{ textDecoration: 'none' }}>
              <div className="stat-card-3d">
                <div className="stat-card-3d-icon-wrap" style={{ background: card.grad }}>
                  <i className={`bi ${card.icon}`} style={{ fontSize: '1.3rem', color: '#fff' }}></i>
                  <div className="stat-card-3d-shine" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                    {loading ? <span className="stat-loading-bar" /> : card.value}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', fontWeight: 500 }}>{card.label}</div>
                </div>
                <i className="bi bi-arrow-right-short stat-card-arrow"></i>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="card-custom mb-4">
        <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="bi bi-lightning-fill" style={{ color: '#f59e0b' }}></i> {t('admin.dashboard.quickActions')}
        </h6>
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/admin/packages?action=new" className="btn-primary-custom" style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>
            <i className="bi bi-plus-circle me-1"></i>{t('admin.dashboard.addPackage')}
          </Link>
          <Link to="/admin/users?tab=AGENT&action=create" className="btn-primary-sm" style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>
            <i className="bi bi-person-plus me-1"></i>{t('admin.dashboard.addAgent')}
          </Link>
          <Link to="/admin/applications?filter=ALL" className="btn-primary-sm" style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem', background: '#f59e0b' }}>
            <i className="bi bi-file-earmark-check me-1"></i>{t('admin.dashboard.reviewApplications')}
          </Link>
          <Link to="/admin/claims?filter=ALL" className="btn-danger-sm" style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>
            <i className="bi bi-file-earmark-medical me-1"></i>{t('admin.dashboard.reviewClaims')}
          </Link>
          <Link to="/admin/payments?filter=ALL" className="btn-primary-sm" style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem', background: '#0891b2' }}>
            <i className="bi bi-credit-card me-1"></i>{t('admin.dashboard.reviewPayments')}
          </Link>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="card-custom">
        <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="bi bi-activity" style={{ color: 'var(--primary)' }}></i> {t('admin.dashboard.recentActivity')}
        </h6>
        {loading ? (
          <div className="text-center py-3"><div className="spinner-border" style={{ color: 'var(--primary)', width: 28, height: 28 }}></div></div>
        ) : recentActivities.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>{t('admin.dashboard.noRecentActivity')}</p>
        ) : (
          <div>
            {recentActivities.map((act, i) => (
              <div key={i} className="d-flex align-items-start gap-3 pb-3 mb-3" style={{ borderBottom: i < recentActivities.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),#2d5986)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`bi ${act.icon || 'bi-activity'}`} style={{ color: '#fff', fontSize: '0.85rem' }}></i>
                </div>
                <div className="flex-grow-1">
                  <div style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{act.description}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{act.createdAt ? new Date(act.createdAt).toLocaleString() : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
