import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ totalCustomers: 0, totalAgents: 0, pendingApplications: 0, pendingClaims: 0, totalPackages: 0, monthlyRevenue: 0 })
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
    { label: 'Total Customers', value: stats.totalCustomers, icon: 'bi-people', color: '#1d4ed8', bg: '#eff6ff', link: '/admin/users?tab=CUSTOMER' },
    { label: 'Total Agents', value: stats.totalAgents, icon: 'bi-person-badge', color: '#9333ea', bg: '#faf5ff', link: '/admin/users?tab=AGENT' },
    { label: 'Pending Applications', value: stats.pendingApplications, icon: 'bi-file-earmark-text', color: '#f59e0b', bg: '#fefce8', link: '/admin/applications?filter=PENDING' },
    { label: 'Pending Claims', value: stats.pendingClaims, icon: 'bi-file-earmark-medical', color: '#dc2626', bg: '#fff0f0', link: '/admin/claims?filter=PENDING' },
    { label: 'Insurance Packages', value: stats.totalPackages, icon: 'bi-box-seam', color: '#16a34a', bg: '#f0fdf4', link: '/admin/packages' },
    { label: 'Monthly Revenue (MMK)', value: stats.monthlyRevenue ? Number(stats.monthlyRevenue).toLocaleString() : '0', icon: 'bi-cash-coin', color: '#0891b2', bg: '#ecfeff', link: '#' },
  ]

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Admin Dashboard</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Welcome, {user?.name} — System Overview</p>
      </div>

      <div className="row g-3 mb-4">
        {statCards.map(card => (
          <div key={card.label} className="col-6 col-lg-4 col-xl-2">
            <Link to={card.link} style={{ textDecoration: 'none' }}>
              <div className="card-custom h-100">
                <div style={{ width: 40, height: 40, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <i className={`bi ${card.icon}`} style={{ color: card.color, fontSize: '1.1rem' }}></i>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{loading ? '—' : card.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{card.label}</div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card-custom mb-4">
        <h6 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Quick Actions</h6>
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/admin/packages" className="btn-primary-custom" style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>
            <i className="bi bi-plus-circle me-1"></i>Add Package
          </Link>
          <Link to="/admin/users" className="btn-primary-sm" style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>
            <i className="bi bi-person-plus me-1"></i>Add Agent
          </Link>
          <Link to="/admin/applications" className="btn-primary-sm" style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem', background: '#f59e0b' }}>
            <i className="bi bi-file-earmark-check me-1"></i>Review Applications
          </Link>
          <Link to="/admin/claims" className="btn-danger-sm" style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>
            <i className="bi bi-file-earmark-medical me-1"></i>Review Claims
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card-custom">
        <h6 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Recent Activity</h6>
        {loading ? (
          <div className="text-center py-3"><div className="spinner-border" style={{ color: 'var(--primary)', width: 28, height: 28 }}></div></div>
        ) : recentActivities.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>No recent activity</p>
        ) : (
          <div>
            {recentActivities.map((act, i) => (
              <div key={i} className="d-flex align-items-start gap-3 pb-3 mb-3" style={{ borderBottom: i < recentActivities.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`bi ${act.icon || 'bi-activity'}`} style={{ color: 'var(--primary)', fontSize: '0.85rem' }}></i>
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
