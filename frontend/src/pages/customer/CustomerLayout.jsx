import React from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useNotifCount } from '../../context/NotifCountContext'

const links = [
  { to: '/customer/dashboard',     icon: 'bi-speedometer2',         label: 'Dashboard'        },
  { to: '/customer/policies',      icon: 'bi-shield-check',          label: 'My Policies'      },
  { to: '/customer/applications',  icon: 'bi-file-earmark-text',    label: 'My Applications'  },
  { to: '/customer/apply',         icon: 'bi-plus-circle',           label: 'Apply for Policy' },
  { to: '/customer/claims',        icon: 'bi-file-earmark-medical', label: 'My Claims'        },
  { to: '/customer/submit-claim',  icon: 'bi-plus-circle-dotted',   label: 'Submit Claim'     },
  { to: '/customer/payments',      icon: 'bi-credit-card',           label: 'Payments'         },
  { to: '/customer/notifications', icon: 'bi-bell',                  label: 'Notifications', badge: true },
  { to: '/customer/feedback',      icon: 'bi-chat-heart',            label: 'Send Feedback'    },
  { to: '/customer/profile',       icon: 'bi-person-circle',         label: 'My Profile'       },
]

export default function CustomerLayout() {
  const { unreadCount } = useNotifCount()
  return <DashboardLayout title="Customer Portal" links={links} externalBadge={unreadCount} />
}
