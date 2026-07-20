import React from 'react'
import { useAuth } from '../../context/AuthContext'
import ProfileAvatar from '../../components/ProfileAvatar'

const Field = ({ label, value }) => (
  <div className="col-12 col-md-6">
    <label className="form-label-custom">{label}</label>
    <input disabled className="form-control-custom w-100" value={value || '—'} style={{ opacity: 0.7, cursor: 'not-allowed' }} />
  </div>
)

export default function AgentProfilePage() {
  const { user } = useAuth()

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          ကိုယ်ရေးအချက်အလက်
          <span style={{ fontWeight: 400, fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 8 }}>· My Profile</span>
        </h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
          Admin မှ သတ်မှတ်ထားသော သင့်အကောင့် အသေးစိတ်
          <span style={{ opacity: 0.7 }}> · Your account details as set up by the admin</span>
        </p>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card-custom">
            <div className="d-flex align-items-center gap-3 mb-4">
              <ProfileAvatar
                fetchUrl="/auth/profile/picture"
                hasPicture={user?.hasProfilePicture}
                name={user?.name}
                size={80}
              />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Admin သာ ဓာတ်ပုံပြောင်းနိုင်သည် · Only an admin can change your photo
                </div>
              </div>
            </div>
            <div className="d-flex align-items-start gap-2 mb-3" style={{
              background: 'var(--bg-hover, rgba(29,78,216,0.06))', border: '1px solid var(--border)',
              borderRadius: 10, padding: '0.75rem 1rem'
            }}>
              <i className="bi bi-info-circle" style={{ color: '#1d4ed8', marginTop: 2 }}></i>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Agent ကိုယ်ရေးအချက်အလက်ကို Admin သာ ပြင်နိုင်သည်။ မည်သည့်အချက်အလက်ကိုမဆို ပြင်ဆင်ရန် Admin ထံ ဆက်သွယ်ပါ ·{' '}
                Agent profiles can only be edited by an admin. Please contact your administrator to update any of these details.
              </div>
            </div>
            <div className="row g-3">
              <Field label="အမည် · Full Name"               value={user?.name} />
              <Field label="အီးမေးလ် · Email"              value={user?.email} />
              <Field label="ဖုန်းနံပါတ် · Phone"           value={user?.phone} />
              <Field label="အာမခံ အမျိုးအစား · Insurance Type" value={user?.insuranceType} />
              <Field label="လိပ်စာ · Address"              value={user?.address} />
              <Field label="အခြေအနေ · Status"              value={user?.active ? 'တက်ကြွဆဲ · Active' : 'တာဝန်မထမ်းဆောင်တော့ · Inactive'} />
              <Field label="ပါဝင်ဖွဲ့စည်းသည့်ရက် · Joined"   value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
