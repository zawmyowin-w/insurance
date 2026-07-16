import React from 'react'
import DashboardLayout from '../../components/DashboardLayout'

const links = [
  { to: '/agent/dashboard',     icon: 'bi-speedometer2',         label: 'Dashboard'           },
  { to: '/agent/applications',  icon: 'bi-file-earmark-text',    label: 'Review Applications' },
  { to: '/agent/claims',        icon: 'bi-file-earmark-medical', label: 'Review Claims'       },
  { to: '/agent/messages',      icon: 'bi-envelope',             label: 'Messages'            },
  { to: '/agent/notifications', icon: 'bi-bell',                 label: 'Notifications'       },
  { to: '/agent/profile',       icon: 'bi-person-circle',        label: 'My Profile'          },
]

export default function AgentLayout() {
  return <DashboardLayout title="Agent Portal" links={links} />
}
