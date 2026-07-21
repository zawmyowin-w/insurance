import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import ProfileAvatar from '../../components/ProfileAvatar'

const Field = ({ label, value }) => (
  <div className="col-12 col-md-6">
    <label className="form-label-custom">{label}</label>
    <input disabled className="form-control-custom w-100" value={value || '—'} style={{ opacity: 0.7, cursor: 'not-allowed' }} />
  </div>
)

export default function AgentProfilePage() {
  const { user } = useAuth()
  const { t } = useTranslation()

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {t('agent.profile.title')}
        </h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
          {t('agent.profile.subtitle')}
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
                  {t('agent.profile.adminPhotoNote')}
                </div>
              </div>
            </div>
            <div className="d-flex align-items-start gap-2 mb-3" style={{
              background: 'var(--bg-hover, rgba(29,78,216,0.06))', border: '1px solid var(--border)',
              borderRadius: 10, padding: '0.75rem 1rem'
            }}>
              <i className="bi bi-info-circle" style={{ color: '#1d4ed8', marginTop: 2 }}></i>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {t('agent.profile.infoNote')}
              </div>
            </div>
            <div className="row g-3">
              <Field label={t('agent.profile.nameLabel')}          value={user?.name} />
              <Field label={t('agent.profile.emailLabel')}         value={user?.email} />
              <Field label={t('agent.profile.phoneLabel')}         value={user?.phone} />
              <Field label={t('agent.profile.insuranceTypeLabel')} value={user?.insuranceType} />
              <Field label={t('agent.profile.addressLabel')}       value={user?.address} />
              <Field label={t('agent.profile.statusLabel')}        value={user?.active ? t('agent.profile.statusActive') : t('agent.profile.statusInactive')} />
              <Field label={t('agent.profile.joinedLabel')}        value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
