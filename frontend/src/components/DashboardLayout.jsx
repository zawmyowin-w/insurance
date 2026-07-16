import React, { useEffect, useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import Navbar from './Navbar'
import api from '../services/api'

/**
 * Shared sidebar layout for Admin, Agent, and Customer dashboards.
 *
 * Props:
 *   title    — sidebar heading (e.g. "Admin Panel")
 *   links    — array of { to, icon, label, badge? }
 *   badgeApi — optional { url } — polls this endpoint for an unread count
 *              and renders a red pill on the link that has badge:true
 */
export default function DashboardLayout({ title, links, badgeApi }) {
  const [badge, setBadge] = useState(0)

  useEffect(() => {
    if (!badgeApi) return
    const fetch = () => {
      api.get(badgeApi.url)
        .then(res => setBadge(res.data?.count ?? 0))
        .catch(() => {})
    }
    fetch()
    const id = setInterval(fetch, 30000)
    return () => clearInterval(id)
  }, [badgeApi])

  return (
    <div>
      <Navbar />
      <div className="d-flex">
        <div className="sidebar d-none d-md-block" style={{ width: 230, flexShrink: 0 }}>
          <div style={{ padding: '0 1rem 1rem' }}>
            <div style={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
              color: 'var(--text-muted)', textTransform: 'uppercase',
              padding: '0.5rem 0.25rem'
            }}>
              {title}
            </div>
          </div>

          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => { if (link.badge) setBadge(0) }}
            >
              <i className={`bi ${link.icon}`}></i>
              <span style={{ flex: 1 }}>{link.label}</span>
              {link.badge && badge > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: '#dc2626', color: '#fff', borderRadius: '999px',
                  fontSize: '0.68rem', fontWeight: 700, minWidth: 18, height: 18,
                  padding: '0 5px', lineHeight: 1
                }}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        <div className="dashboard-content flex-grow-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
