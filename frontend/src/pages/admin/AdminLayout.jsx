import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import Navbar from '../../components/Navbar'

const sidebarLinks = [
  { to: '/admin/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
  { to: '/admin/packages', icon: 'bi-box-seam', label: 'Insurance Packages' },
  { to: '/admin/users', icon: 'bi-people', label: 'Manage Users' },
  { to: '/admin/applications', icon: 'bi-file-earmark-text', label: 'Applications' },
  { to: '/admin/claims', icon: 'bi-file-earmark-medical', label: 'Claims' },
  { to: '/admin/notifications', icon: 'bi-bell', label: 'Notifications' },
]

export default function AdminLayout() {
  return (
    <div>
      <Navbar />
      <div className="d-flex">
        <div className="sidebar d-none d-md-block" style={{ width: 230, flexShrink: 0 }}>
          <div style={{ padding: '0 1rem 1rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.5rem 0.25rem' }}>
              Admin Panel
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
