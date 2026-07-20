import React from 'react'
import DashboardLayout from '../../components/DashboardLayout'

const links = [
  { to: '/agent/dashboard',     icon: 'bi-speedometer2',         label: 'ဒက်ရှ်ဘုတ် · Dashboard'              },
  { to: '/agent/applications',  icon: 'bi-file-earmark-text',    label: 'လျှောက်လွှာ စစ်ဆေး · Applications'   },
  { to: '/agent/claims',        icon: 'bi-file-earmark-medical', label: 'Claim စစ်ဆေး · Claims'               },
  { to: '/agent/messages',      icon: 'bi-envelope',             label: 'စာများ · Messages'                   },
  { to: '/agent/notifications', icon: 'bi-bell',                 label: 'အကြောင်းကြားချက် · Notifications'   },
  { to: '/agent/profile',       icon: 'bi-person-circle',        label: 'ကိုယ်ရေး · My Profile'               },
]

export default function AgentLayout() {
  return <DashboardLayout title="Agent Portal · Agent ပေါ်တယ်" links={links} />
}
