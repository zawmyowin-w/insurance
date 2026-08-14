import { useTranslation } from 'react-i18next'
import DashboardLayout from '../../components/DashboardLayout'
import { useNotifCount } from '../../context/NotifCountContext'

export default function AgentLayout() {
  const { t } = useTranslation()
  const { unreadCount } = useNotifCount()

  const links = [
    { to: '/agent/dashboard',     icon: 'bi-speedometer2',         label: t('agent.layout.dashboard')     },
    { to: '/agent/applications',  icon: 'bi-file-earmark-text',    label: t('agent.layout.applications')  },
    { to: '/agent/claims',        icon: 'bi-file-earmark-medical', label: t('agent.layout.claims')        },
    { to: '/agent/messages',      icon: 'bi-envelope',             label: t('agent.layout.messages')      },
    { to: '/agent/notifications', icon: 'bi-bell',                 label: t('agent.layout.notifications'), notif: true },
    { to: '/agent/profile',       icon: 'bi-person-circle',        label: t('agent.layout.profile')       },
  ]

  return <DashboardLayout title={t('agent.layout.title')} links={links} notifBadge={unreadCount} />
}
