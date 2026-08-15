import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useNotifCount } from '../../context/NotifCountContext'

export default function AdminNotificationsPage() {
  const { t } = useTranslation()
  const { refreshUnread } = useNotifCount()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ targetRole: 'ALL', targetUserId: '', title: '', message: '', type: 'INFO' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState([])
  const [received, setReceived] = useState([])
  const [activeSection, setActiveSection] = useState('received')

  const fetchReceived = () =>
    api.get('/notifications').then(res => setReceived(Array.isArray(res.data) ? res.data : [])).catch(() => {})

  useEffect(() => {
    api.get('/admin/users').then(res => setUsers(Array.isArray(res.data) ? res.data : [])).catch(() => {})
    api.get('/admin/notifications/sent').then(res => setSent(Array.isArray(res.data) ? res.data : [])).catch(() => {})
    fetchReceived()
  }, [])

  // Mark all received notifications as read when this page is opened
  useEffect(() => {
    api.put('/notifications/read-all')
      .then(() => refreshUnread())
      .catch(() => {})
  }, [])

  const markOneRead = (id) => {
    api.put(`/notifications/${id}/read`).then(() => {
      setReceived(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      refreshUnread()
    }).catch(() => {})
  }

  const handleSend = async e => {
    e.preventDefault()
    setSending(true)
    try {
      await api.post('/admin/notifications/send', form)
      toast.success(t('admin.notifications.sentSuccess'))
      setForm({ targetRole: 'ALL', targetUserId: '', title: '', message: '', type: 'INFO' })
      api.get('/admin/notifications/sent').then(res => setSent(Array.isArray(res.data) ? res.data : [])).catch(() => {})
    } catch (err) { toast.error(err.response?.data?.message || t('admin.notifications.sendFailed')) } finally { setSending(false) }
  }

  const typeColors = { INFO: '#6b7280', APPROVAL: '#16a34a', REJECTION: '#dc2626', PAYMENT: '#1d4ed8', CLAIM: '#f59e0b', REMINDER: '#9333ea' }
  const unreadCount = received.filter(n => !n.read).length

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('admin.notifications.title')}</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{t('admin.notifications.subtitle')}</p>
      </div>

      {/* Section tabs */}
      <div className="d-flex gap-1 mb-4" style={{ background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 12, width: 'fit-content' }}>
        {[
          { key: 'received', label: t('admin.notifications.tabReceived') || 'Received', icon: 'bi-bell' },
          { key: 'send',     label: t('admin.notifications.tabSend') || 'Send',         icon: 'bi-send' },
          { key: 'history',  label: t('admin.notifications.tabHistory') || 'History',   icon: 'bi-clock-history' },
        ].map(tab => (
          <button key={tab.key} type="button" onClick={() => setActiveSection(tab.key)}
            style={{
              padding: '0.45rem 1.1rem', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.85rem', transition: 'all .15s',
              display: 'flex', alignItems: 'center', gap: 7,
              background: activeSection === tab.key ? 'var(--bg-primary)' : 'transparent',
              color: activeSection === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeSection === tab.key ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
            }}>
            <i className={`bi ${tab.icon}`}></i>
            {tab.label}
            {tab.key === 'received' && unreadCount > 0 && (
              <span style={{ background: '#dc2626', color: '#fff', borderRadius: 99, fontSize: '0.7rem', fontWeight: 800, padding: '0.05rem 0.45rem', minWidth: 20, textAlign: 'center' }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Received Notifications ── */}
      {activeSection === 'received' && (
        <div className="card-custom p-0">
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {t('admin.notifications.tabReceived') || 'Received Notifications'}
            </h6>
            {received.some(n => !n.read) && (
              <button type="button" onClick={() => {
                api.put('/notifications/read-all').then(() => {
                  setReceived(prev => prev.map(n => ({ ...n, read: true })))
                  refreshUnread()
                  toast.success(t('admin.notifications.allMarkedRead') || 'All marked as read')
                }).catch(() => {})
              }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.3rem 0.75rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <i className="bi bi-check2-all me-1"></i>
                {t('admin.notifications.markAllRead') || 'Mark all as read'}
              </button>
            )}
          </div>
          {received.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-bell" style={{ fontSize: '2.5rem', color: 'var(--border)' }}></i>
              <p style={{ color: 'var(--text-muted)', margin: '1rem 0 0' }}>{t('admin.notifications.noReceived') || 'No notifications'}</p>
            </div>
          ) : (
            <div>
              {received.map((n, i) => (
                <div key={n.id || i}
                  onClick={() => !n.read && markOneRead(n.id)}
                  style={{
                    padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)',
                    background: n.read ? 'transparent' : 'var(--bg-secondary)',
                    cursor: n.read ? 'default' : 'pointer',
                    transition: 'background 0.15s',
                  }}>
                  <div className="d-flex align-items-start gap-3">
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: (typeColors[n.type] || '#6b7280') + '20',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={`bi ${
                        n.type === 'APPROVAL' ? 'bi-check-circle-fill' :
                        n.type === 'REJECTION' ? 'bi-x-circle-fill' :
                        n.type === 'PAYMENT' ? 'bi-credit-card-fill' :
                        n.type === 'CLAIM' ? 'bi-file-medical-fill' :
                        n.type === 'REMINDER' ? 'bi-alarm-fill' : 'bi-info-circle-fill'
                      }`} style={{ color: typeColors[n.type] || '#6b7280', fontSize: '0.95rem' }}></i>
                    </div>
                    <div className="flex-grow-1 min-width-0">
                      <div className="d-flex align-items-center gap-2">
                        {!n.read && (
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', flexShrink: 0, display: 'inline-block' }}></span>
                        )}
                        <span style={{ fontWeight: n.read ? 600 : 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{n.title}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: 99, background: (typeColors[n.type] || '#6b7280') + '20', color: typeColors[n.type] || '#6b7280', flexShrink: 0 }}>{n.type}</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', marginTop: 2 }}>{n.message}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.73rem', marginTop: 3 }}>
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Send Notification ── */}
      {activeSection === 'send' && (
        <div className="card-custom">
          <h6 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>{t('admin.notifications.formTitle')}</h6>
          <form onSubmit={handleSend}>
            <div className="mb-3">
              <label className="form-label-custom">{t('admin.notifications.sendTo')}</label>
              <select className="form-select-custom w-100" value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value, targetUserId: '' }))}>
                <option value="ALL">{t('admin.notifications.allUsers')}</option>
                <option value="CUSTOMER">{t('admin.notifications.allCustomers')}</option>
                <option value="AGENT">{t('admin.notifications.allAgents')}</option>
                <option value="SPECIFIC_AGENT">{t('admin.notifications.specificAgent')}</option>
                <option value="SPECIFIC">{t('admin.notifications.specificUser')}</option>
              </select>
            </div>
            {(form.targetRole === 'SPECIFIC' || form.targetRole === 'SPECIFIC_AGENT') && (
              <div className="mb-3">
                <label className="form-label-custom">
                  {form.targetRole === 'SPECIFIC_AGENT' ? t('admin.notifications.selectAgent') : t('admin.notifications.selectUser')}
                </label>
                <select required className="form-select-custom w-100" value={form.targetUserId} onChange={e => setForm(f => ({ ...f, targetUserId: e.target.value }))}>
                  <option value="">{form.targetRole === 'SPECIFIC_AGENT' ? t('admin.notifications.chooseAgent') : t('admin.notifications.chooseUser')}</option>
                  {users
                    .filter(u => form.targetRole === 'SPECIFIC_AGENT' ? u.role === 'AGENT' : true)
                    .map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
            )}
            <div className="mb-3">
              <label className="form-label-custom">{t('admin.notifications.type')}</label>
              <select className="form-select-custom w-100" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {['INFO', 'APPROVAL', 'REJECTION', 'PAYMENT', 'CLAIM', 'REMINDER'].map(tp => <option key={tp} value={tp}>{tp}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label-custom">{t('admin.notifications.titleLabel')}</label>
              <input required className="form-control-custom w-100" placeholder={t('admin.notifications.titlePlaceholder')} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="form-label-custom">{t('admin.notifications.messageLabel')}</label>
              <textarea required rows={4} className="form-control-custom w-100" style={{ resize: 'vertical' }}
                placeholder={t('admin.notifications.messagePlaceholder')}
                value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
            </div>
            <button type="submit" disabled={sending} className="btn-primary-custom w-100" style={{ justifyContent: 'center' }}>
              {sending
                ? <><span className="spinner-border spinner-border-sm me-2"></span>{t('admin.notifications.sending')}</>
                : <><i className="bi bi-send me-2"></i>{t('admin.notifications.sendBtn')}</>}
            </button>
          </form>
        </div>
      )}

      {/* ── Sent History ── */}
      {activeSection === 'history' && (
        <div className="card-custom p-0">
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('admin.notifications.history')}</h6>
          </div>
          {sent.length === 0 ? (
            <div className="text-center py-5"><p style={{ color: 'var(--text-muted)', margin: 0 }}>{t('admin.notifications.noHistory')}</p></div>
          ) : (
            <div>
              {sent.map((n, i) => (
                <div key={n.id || i} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
                  <div className="d-flex align-items-start gap-2">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: typeColors[n.type] || '#6b7280', flexShrink: 0, marginTop: 6 }}></div>
                    <div className="flex-grow-1">
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{n.title}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>{n.message}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        {t('admin.notifications.to')}: {n.targetRole === 'SPECIFIC_AGENT' ? t('admin.notifications.specificAgent') : n.targetRole === 'SPECIFIC' ? t('admin.notifications.specificUser') : n.targetRole || 'Specific'} · {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
