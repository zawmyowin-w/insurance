import React from 'react'
import DashboardLayout from '../../components/DashboardLayout'

const links = [
  { to: '/admin/dashboard',       icon: 'bi-speedometer2',         label: 'Dashboard'          },
  { to: '/admin/insurance-types', icon: 'bi-tags',                 label: 'Insurance Types'    },
  { to: '/admin/packages',        icon: 'bi-box-seam',             label: 'Insurance Packages' },
  { to: '/admin/users',           icon: 'bi-people',               label: 'Manage Users'       },
  { to: '/admin/forms',         icon: 'bi-ui-checks',            label: 'Form Templates'     },
  { to: '/admin/applications',  icon: 'bi-file-earmark-text',    label: 'Applications'       },
  { to: '/admin/claims',        icon: 'bi-file-earmark-medical', label: 'Claims'             },
  { to: '/admin/payments',          icon: 'bi-credit-card',          label: 'Payments'           },
  { to: '/admin/premium-schedule', icon: 'bi-calendar2-check',      label: 'Premium Schedule'   },
  { to: '/admin/payment-methods',  icon: 'bi-qr-code',              label: 'Payment Methods'    },
  { to: '/admin/feedback',      icon: 'bi-chat-heart',           label: 'Customer Feedback', badge: true },
  { to: '/admin/notifications', icon: 'bi-bell',                 label: 'Notifications'      },
  { to: '/admin/reports',       icon: 'bi-bar-chart-line',       label: 'Reports'            },
  { to: '/admin/profile',       icon: 'bi-person-circle',        label: 'My Profile'         },
]

export default function AdminLayout() {
  return (
    <DashboardLayout
      title="Admin Panel"
      links={links}
      badgeApi={{ url: '/admin/feedback/unread-count' }}
    />
  )
}
