import React, { useEffect, useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../services/api'

const BASE_LINKS = [
  { to: '/admin/dashboard',     icon: 'bi-speedometer2',        label: 'Dashboard'          },
  { to: '/admin/packages',      icon: 'bi-box-seam',            label: 'Insurance Packages' },
  { to: '/admin/users',         icon: 'bi-people',              label: 'Manage Users'       },
  { to: '/admin/forms',         icon: 'bi-ui-checks',           label: 'Form Templates'     },
  { to: '/admin/applications',  icon: 'bi-file-earmark-text',   label: 'Applications'       },
  { to: '/admin/claims',        icon: 'bi-file-earmark-medical',label: 'Claims'             },
  { to: '/admin/payments',      icon: 'bi-credit-card',         label: 'Payments'           },
  { to: '/admin/feedback',      icon: 'bi-chat-heart',          label: 'Customer Feedback', badge: true },
  { to: '/admin/notifications', icon: 'bi-bell',                label: 'Notifications'      },
  { to: '/admin/reports',       icon: 'bi-bar-chart-line',      label: 'Reports'            },
  { to: '/admin/profile',       icon: 'bi-person-circle',       label: 'My Profile'         },
]

export default function AdminLayout() {
  const [unreadFeedback, setUnreadFeedback] = useState(0)

  useEffect(() => {
    const fetchCount = () => {
      api.get('/admin/feedback/unread-count')
        .then(res => setUnreadFeedback(res.data?.count ?? 0))
        .catch(() => {})
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [])

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
          {BASE_LINKS.map(link => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => { if (link.badge) setUnreadFeedback(0) }}>
              <i className={`bi ${link.icon}`}></i>
              <span style={{ flex: 1 }}>{link.label}</span>
              {link.badge && unreadFeedback > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: '#dc2626', color: '#fff', borderRadius: '999px',
                  fontSize: '0.68rem', fontWeight: 700, minWidth: 18, height: 18,
                  padding: '0 5px', lineHeight: 1
                }}>{unreadFeedback > 99 ? '99+' : unreadFeedback}</span>
              )}
            </NavLink>
          ))}
        </div>
        <div className="dashboard-content flex-grow-1"><Outlet /></div>
      </div>
    </div>
  )
}
