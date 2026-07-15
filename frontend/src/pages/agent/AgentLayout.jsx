import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'

const sidebarLinks = [
  { to: '/agent/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
  { to: '/agent/applications', icon: 'bi-file-earmark-text', label: 'Review Applications' },
  { to: '/agent/claims', icon: 'bi-file-earmark-medical', label: 'Review Claims' },
  { to: '/agent/notifications', icon: 'bi-bell', label: 'Notifications' },
  { to: '/agent/profile', icon: 'bi-person-circle', label: 'My Profile' },
]

export default function AgentLayout() {
  return (
    <div>
      <Navbar />
      <div className="d-flex">
        <div className="sidebar d-none d-md-block" style={{ width: 220, flexShrink: 0 }}>
          <div style={{ padding: '0 1rem 1rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.5rem 0.25rem' }}>
              Agent Portal
            </div>
          </div>
          {sidebarLinks.map(link => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className={`bi ${link.icon}`}></i>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>
        <div className="dashboard-content flex-grow-1"><Outlet /></div>
      </div>
    </div>
  )
}
