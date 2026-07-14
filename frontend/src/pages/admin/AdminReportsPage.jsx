import React, { useEffect, useState } from 'react'
import api from '../../services/api'

const TYPE_COLORS = {
  LIFE: '#dc2626', HEALTH: '#16a34a', TRAVEL: '#0891b2',
  MOTOR: '#d97706', EDUCATION: '#7c3aed', VEHICLE: '#2563eb', PROPERTY: '#ca8a04',
}

export default function AdminReportsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/reports')
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
  if (!data) return <div className="card-custom text-center py-5"><p style={{ color: 'var(--text-muted)' }}>Failed to load reports</p></div>

  const statCards = [
    { label: 'Total Customers',      value: data.totalCustomers,       icon: 'bi-people',              color: '#1d4ed8', bg: '#eff6ff' },
    { label: 'Total Agents',          value: data.totalAgents,          icon: 'bi-person-badge',         color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Active Policies',       value: data.activePolicies,       icon: 'bi-shield-check',         color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Total Applications',    value: data.totalApplications,    icon: 'bi-file-earmark-text',    color: '#2563eb', bg: '#eff6ff' },
    { label: 'Pending Applications',  value: data.pendingApplications,  icon: 'bi-hourglass-split',      color: '#d97706', bg: '#fffbeb' },
    { label: 'Rejected Applications', value: data.rejectedApplications, icon: 'bi-x-circle',             color: '#dc2626', bg: '#fef2f2' },
    { label: 'Total Claims',          value: data.totalClaims,          icon: 'bi-file-earmark-medical', color: '#0891b2', bg: '#ecfeff' },
    { label: 'Approved Claims',       value: data.approvedClaims,       icon: 'bi-check-circle',         color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Pending Claims',        value: data.pendingClaims,        icon: 'bi-clock',                color: '#d97706', bg: '#fffbeb' },
    { label: 'Rejected Claims',       value: data.rejectedClaims,       icon: 'bi-dash-circle',          color: '#dc2626', bg: '#fef2f2' },
  ]

  const byType = data.policiesByType || {}
  const byTypeTotal = Object.values(byType).reduce((a, b) => a + Number(b), 0) || 1

  const byMonth = data.applicationsByMonth || {}
  const monthMax = Math.max(...Object.values(byMonth).map(Number), 1)

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Reports & Analytics</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>System-wide statistics and performance overview</p>
      </div>

      {/* Revenue Hero */}
      <div className="card-custom mb-4" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)', border: 'none' }}>
        <div className="row align-items-center">
          <div className="col-12 col-md-6">
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Total Verified Revenue</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
              {data.totalRevenue ? Number(data.totalRevenue).toLocaleString() : '0'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', marginTop: 4 }}>MMK — from verified premium payments</div>
          </div>
          <div className="col-12 col-md-6 d-flex justify-content-end align-items-center gap-4 mt-3 mt-md-0">
            <div className="text-center">
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{data.totalCustomers}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Customers</div>
            </div>
            <div className="text-center">
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{data.activePolicies}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Active Policies</div>
            </div>
            <div className="text-center">
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{data.approvedClaims}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Claims Approved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {statCards.map(card => (
          <div key={card.label} className="col-6 col-md-4 col-xl-2">
            <div className="card-custom text-center" style={{ padding: '1rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem' }}>
                <i className={`bi ${card.icon}`} style={{ color: card.color, fontSize: '1.1rem' }}></i>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{card.value ?? '—'}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Policies by Type */}
        <div className="col-12 col-lg-6">
          <div className="card-custom h-100">
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              <i className="bi bi-pie-chart me-2" style={{ color: 'var(--primary)' }}></i>Active Policies by Type
            </h6>
            {Object.keys(byType).length === 0 ? (
              <div className="text-center py-4"><p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>No active policies yet</p></div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {Object.entries(byType).sort((a, b) => Number(b[1]) - Number(a[1])).map(([type, count]) => {
                  const pct = Math.round((Number(count) / byTypeTotal) * 100)
                  const clr = TYPE_COLORS[type] || '#6b7280'
                  return (
                    <div key={type}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: clr, marginRight: 8 }}></span>
                          {type}
                        </span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: clr, borderRadius: 99, transition: 'width 0.8s ease' }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Applications by Month */}
        <div className="col-12 col-lg-6">
          <div className="card-custom h-100">
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              <i className="bi bi-bar-chart me-2" style={{ color: 'var(--primary)' }}></i>Applications (Last 6 Months)
            </h6>
            {Object.keys(byMonth).length === 0 ? (
              <div className="text-center py-4"><p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>No recent applications</p></div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, paddingBottom: 24, position: 'relative' }}>
                {Object.entries(byMonth).map(([month, count]) => {
                  const h = Math.max(((Number(count) / monthMax) * 100), 8)
                  return (
                    <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{count}</div>
                      <div style={{ width: '100%', height: `${h}%`, background: 'var(--primary)', borderRadius: '4px 4px 0 0', transition: 'height 0.6s ease', minHeight: 8 }}></div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2, marginTop: 2 }}>{month.split(' ')[0]}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Claims Overview */}
        <div className="col-12">
          <div className="card-custom">
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              <i className="bi bi-file-earmark-medical me-2" style={{ color: 'var(--primary)' }}></i>Claims Overview
            </h6>
            <div className="row g-3">
              {[
                { label: 'Total Claims', value: data.totalClaims, color: '#2563eb' },
                { label: 'Pending / Under Review', value: data.pendingClaims, color: '#d97706' },
                { label: 'Approved & Paid', value: data.approvedClaims, color: '#16a34a' },
                { label: 'Rejected', value: data.rejectedClaims, color: '#dc2626' },
              ].map(item => (
                <div key={item.label} className="col-6 col-md-3">
                  <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: item.color }}>{item.value ?? 0}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
