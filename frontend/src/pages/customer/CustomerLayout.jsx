import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'

const sidebarLinks = [
  { to: '/customer/dashboard',     icon: 'bi-speedometer2',        labelKey: 'sidebar.dashboard'   },
  { to: '/customer/policies',      icon: 'bi-shield-check',         label: 'My Policies'            },
  { to: '/customer/applications',  icon: 'bi-file-earmark-text',    labelKey: 'sidebar.applications' },
  { to: '/customer/apply',         icon: 'bi-plus-circle',          labelKey: 'sidebar.apply'       },
  { to: '/customer/claims',        icon: 'bi-file-earmark-medical', labelKey: 'sidebar.claims'      },
  { to: '/customer/submit-claim',  icon: 'bi-plus-circle-dotted',   labelKey: 'sidebar.submitClaim' },
  { to: '/customer/payments',      icon: 'bi-credit-card',          labelKey: 'sidebar.payments'    },
  { to: '/customer/notifications', icon: 'bi-bell',                 labelKey: 'sidebar.notifications' },
]

export default function CustomerLayout() {
  const { t } = useTranslation()
  return (
    <div>
      <Navbar />
      <div className="d-flex">
        {/* Sidebar */}
        <div className="sidebar d-none d-md-block" style={{ width: 220, flexShrink: 0 }}>
          <div style={{ padding: '0 1rem 1rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.5rem 0.25rem', marginBottom: '0.25rem' }}>
              Customer Portal
            </div>
          </div>
          {sidebarLinks.map(link => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className={`bi ${link.icon}`}></i>
              <span>{link.label || t(link.labelKey)}</span>
            </NavLink>
          ))}
        </div>
        {/* Content */}
        <div className="dashboard-content flex-grow-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
