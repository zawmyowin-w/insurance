import { useEffect, useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import Navbar from './Navbar'
import api from '../services/api'

/**
 * Shared sidebar layout for Admin, Agent, and Customer dashboards.
 *
 * Props:
 *   title        — sidebar heading (e.g. "Admin Panel")
 *   links        — array of { to, icon, label, badge? }
 *   badgeApi     — optional { url } — polls for unread count; renders badge on link with badge:true
 *   externalBadge — when provided (number), skips internal polling (used by CustomerLayout)
 */
export default function DashboardLayout({ title, links, badgeApi, externalBadge }) {
  const [badge, setBadge] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Internal polling — only runs when badgeApi is set AND no externalBadge override
  useEffect(() => {
    if (!badgeApi || externalBadge !== undefined) return
    const fetch = () => {
      api.get(badgeApi.url)
        .then(res => setBadge(res.data?.count ?? 0))
        .catch(() => {})
    }
    fetch()
    const id = setInterval(fetch, 30000)
    return () => clearInterval(id)
  }, [badgeApi, externalBadge])

  useEffect(() => {
    if (externalBadge !== undefined) setBadge(externalBadge)
  }, [externalBadge])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const sidebarContent = (
    <>
      <div style={{ padding: '0 1rem 1rem' }}>
        <div style={{
          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
          color: 'var(--text-muted)', textTransform: 'uppercase',
          padding: '0.5rem 0.25rem',
        }}>
          {title}
        </div>
      </div>

      {links.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={() => { setDrawerOpen(false); if (link.badge) setBadge(0) }}
        >
          <i className={`bi ${link.icon}`}></i>
          <span style={{ flex: 1 }}>{link.label}</span>
          {link.badge && badge > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: '#dc2626', color: '#fff', borderRadius: '999px',
              fontSize: '0.68rem', fontWeight: 700, minWidth: 18, height: 18,
              padding: '0 5px', lineHeight: 1,
            }}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </NavLink>
      ))}
    </>
  )

  return (
    <div>
      <Navbar />

      {/* ── Mobile slide-out drawer ─────────────────────── */}
      {/* Backdrop */}
      <div
        className={`sidebar-drawer-overlay${drawerOpen ? ' open' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />
      {/* Drawer panel */}
      <div className={`sidebar-drawer${drawerOpen ? ' open' : ''}`}>
        <div className="sidebar-drawer-header">
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
            color: 'var(--text-muted)', textTransform: 'uppercase',
          }}>
            {title}
          </div>
          <button className="icon-btn" onClick={() => setDrawerOpen(false)}>
            <i className="bi bi-x-lg" style={{ fontSize: '1rem' }}></i>
          </button>
        </div>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => { setDrawerOpen(false); if (link.badge) setBadge(0) }}
          >
            <i className={`bi ${link.icon}`}></i>
            <span style={{ flex: 1 }}>{link.label}</span>
            {link.badge && badge > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: '#dc2626', color: '#fff', borderRadius: '999px',
                fontSize: '0.68rem', fontWeight: 700, minWidth: 18, height: 18,
                padding: '0 5px', lineHeight: 1,
              }}>
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* ── Main layout ─────────────────────────────────── */}
      <div className="d-flex">
        {/* Desktop / tablet sidebar */}
        <div className="sidebar d-none d-md-block" style={{ width: 230, flexShrink: 0 }}>
          {sidebarContent}
        </div>

        {/* Content area */}
        <div className="dashboard-content flex-grow-1">
          {/* Mobile top bar — hamburger + panel title */}
          <div className="mobile-dashboard-header d-flex d-md-none">
            <button className="icon-btn" onClick={() => setDrawerOpen(true)}>
              <i className="bi bi-list" style={{ fontSize: '1.4rem' }}></i>
            </button>
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {title}
            </span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
