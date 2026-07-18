import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function AgentDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ pending: 0, verified: 0, pendingClaims: 0, verifiedClaims: 0 })
  const [recentApps, setRecentApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/agent/dashboard/stats').catch(() => ({ data: stats })),
      api.get('/agent/applications?limit=5').catch(() => ({ data: [] })),
    ]).then(([s, a]) => {
      setStats(s.data)
      setRecentApps(Array.isArray(a.data) ? a.data.slice(0, 5) : [])
    }).finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Pending Applications', value: stats.pending, icon: 'bi-file-earmark-text', color: '#f59e0b', bg: '#fefce8' },
    { label: 'Verified Applications', value: stats.verified, icon: 'bi-check-circle', color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Pending Claims', value: stats.pendingClaims, icon: 'bi-file-earmark-medical', color: '#dc2626', bg: '#fff0f0' },
    { label: 'Verified Claims', value: stats.verifiedClaims, icon: 'bi-shield-check', color: '#1d4ed8', bg: '#eff6ff' },
  ]

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Welcome, {user?.name} 👋</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Agent Dashboard — Review and verify customer submissions</p>
      </div>
      <div className="row g-3 mb-4">
        {statCards.map(card => (
          <div key={card.label} className="col-6 col-lg-3">
            <div className="card-custom">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <i className={`bi ${card.icon}`} style={{ color: card.color, fontSize: '1.1rem' }}></i>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{loading ? '—' : card.value}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="d-flex gap-2 mb-4">
        <Link to="/agent/applications" className="btn-primary-custom" style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}>
          <i className="bi bi-file-earmark-text me-2"></i>Check Applications
        </Link>
        <Link to="/agent/claims" className="btn-primary-sm" style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}>
          <i className="bi bi-file-earmark-medical me-2"></i>Check Claims
        </Link>
      </div>
      <div className="card-custom">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Recent Applications</h6>
          <Link to="/agent/applications" style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'none' }}>View all →</Link>
        </div>
        {loading ? (
          <div className="text-center py-3"><div className="spinner-border" style={{ color: 'var(--primary)', width: 28, height: 28 }}></div></div>
        ) : recentApps.length === 0 ? (
          <div className="text-center py-3"><p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>No applications to review</p></div>
        ) : (
          <div className="table-custom">
            <table className="w-100">
              <thead><tr>{['Customer', 'Plan', 'Coverage', 'Status', 'Date'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {recentApps.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500 }}>{a.customerName || a.customer?.name}</td>
                    <td>{a.packageName || a.package?.name}</td>
                    <td>{Number(a.coverageAmount).toLocaleString()} MMK</td>
                    <td><span className={`badge-status badge-${a.status?.toLowerCase()}`}>{a.status}</span></td>
                    <td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}</td>
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
