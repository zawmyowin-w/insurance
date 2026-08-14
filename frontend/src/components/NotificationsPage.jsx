import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { toast } from 'react-toastify'
import { useNotifCount } from '../context/NotifCountContext'
import { useTranslation } from 'react-i18next'

const ICON_MAP  = {
  APPROVAL:  'bi-check-circle-fill',
  REJECTION: 'bi-x-circle-fill',
  PAYMENT:   'bi-credit-card-fill',
  CLAIM:     'bi-file-earmark-medical-fill',
  INFO:      'bi-info-circle-fill',
  REMINDER:  'bi-bell-fill',
  ADVERTISE: 'bi-megaphone-fill',
}
const COLOR_MAP = {
  APPROVAL:  '#16a34a',
  REJECTION: '#dc2626',
  PAYMENT:   '#1d4ed8',
  CLAIM:     '#f59e0b',
  INFO:      '#6b7280',
  REMINDER:  '#9333ea',
  ADVERTISE: '#0891b2',
}

const notifIcon  = type => ICON_MAP[type]  || 'bi-bell-fill'
const notifColor = type => COLOR_MAP[type] || '#6b7280'

// ── Package Detail Popup for ADVERTISE notifications ───────────────────────
function AdvertisePopup({ notif, onClose }) {
  const navigate = useNavigate()
  const [pkg, setPkg] = useState(null)
  const [loading, setLoading] = useState(!!notif.referenceId)

  useEffect(() => {
    if (!notif.referenceId) return
    api.get('/packages/public')
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : []
        const found = list.find(p => p.id === notif.referenceId || p.id === Number(notif.referenceId))
        setPkg(found || null)
      })
      .catch(() => setPkg(null))
      .finally(() => setLoading(false))
  }, [notif.referenceId])

  const handleApply = () => {
    onClose()
    if (notif.referenceId) {
      navigate(`/customer/apply?package=${notif.referenceId}`)
    } else {
      navigate('/customer/apply')
    }
  }

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 540 }}>
        <div className="modal-content" style={{ borderRadius: 16, overflow: 'hidden', border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #0891b2, #0e7490)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-megaphone-fill" style={{ color: '#fff', fontSize: '0.9rem' }}></i>
                </div>
                <h5 style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{notif.title}</h5>
              </div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.82)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                {notif.message}
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', flexShrink: 0 }}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Package details body */}
          <div style={{ padding: '1.25rem 1.5rem' }}>
            {loading ? (
              <div className="text-center py-3"><span className="spinner-border spinner-border-sm" style={{ color: '#0891b2' }}></span></div>
            ) : pkg ? (
              <>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                  <i className="bi bi-box-seam me-1"></i>Package Details
                </div>
                <div style={{ background: '#f0f9ff', border: '1.5px solid #7dd3fc', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0c4a6e', marginBottom: 4 }}>{pkg.packageName || pkg.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#0369a1', marginBottom: 10 }}>{pkg.type || pkg.packageType}</div>
                  <div className="row g-2 mb-3">
                    {[
                      { label: 'Coverage', value: pkg.minCoverage ? `${Number(pkg.minCoverage).toLocaleString()} – ${Number(pkg.maxCoverage).toLocaleString()} MMK` : pkg.coverageAmount ? `${Number(pkg.coverageAmount).toLocaleString()} MMK` : '—' },
                      { label: 'Duration', value: pkg.durationYears ? `${pkg.durationYears} year${pkg.durationYears > 1 ? 's' : ''}` : pkg.duration ? `${pkg.duration} yr` : '—' },
                      { label: 'Premium Rate', value: pkg.premiumRate ? `${(pkg.premiumRate * 100).toFixed(2)}%` : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="col-4">
                        <div style={{ background: '#fff', borderRadius: 8, padding: '0.45rem 0.6rem', border: '1px solid #bae6fd' }}>
                          <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>{label}</div>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0c4a6e' }}>{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {pkg.description && (
                    <p style={{ fontSize: '0.82rem', color: '#334155', margin: '0 0 8px', lineHeight: 1.5 }}>{pkg.description}</p>
                  )}
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem 0' }}>
                <i className="bi bi-info-circle me-1"></i>
                Tap "Apply Now" to explore this insurance package.
              </p>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '0 1.5rem 1.25rem', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '0.45rem 1.1rem', borderRadius: 9, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              Close
            </button>
            <button onClick={handleApply} style={{ padding: '0.45rem 1.3rem', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, #0891b2, #0e7490)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="bi bi-arrow-right-circle-fill"></i> Apply Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Shared notification list used by customer and agent portals.
 * subtitle – optional description line under the heading.
 * role     – 'customer' | 'agent' (enables ADVERTISE popup only for customer)
 */
export default function NotificationsPage({ subtitle, role }) {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [advertisePopup, setAdvertisePopup] = useState(null)
  const { refreshUnread } = useNotifCount()

  const fetchNotifications = () => {
    api.get('/notifications')
      .then(res => setNotifications(Array.isArray(res.data) ? res.data : []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchNotifications() }, [])

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
      refreshUnread()
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(ns => ns.map(n => ({ ...n, read: true })))
      refreshUnread()
      toast.success(t('notif.markedAllRead'))
    } catch {}
  }

  const handleNotifClick = async (n) => {
    if (!n.read) await markRead(n.id)
    // For ADVERTISE notifications on the customer portal, open the detail popup
    if (n.type === 'ADVERTISE' && role === 'customer') {
      setAdvertisePopup(n)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {t('notif.title')}
            {unreadCount > 0 && (
              <span style={{ background: '#dc2626', color: '#fff', borderRadius: 20, fontSize: '0.72rem', padding: '0.15rem 0.5rem', marginLeft: 6 }}>
                {unreadCount}
              </span>
            )}
          </h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{subtitle}</p>
        </div>
         {unreadCount > 0 && (
           <button className="btn-primary-sm" onClick={markAllRead}>{t('notif.markAllRead')}</button>
         )}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : notifications.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-bell" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
           <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{t('notif.empty')}</h5>
        </div>
      ) : (
        <div className="card-custom p-0">
          {notifications.map(n => {
            const isAdvert = n.type === 'ADVERTISE' && role === 'customer'
            return (
              <div key={n.id}
                className={`notification-item ${n.read ? '' : 'unread'}`}
                onClick={() => handleNotifClick(n)}
                style={{ cursor: (!n.read || isAdvert) ? 'pointer' : 'default' }}>
                <div className="d-flex align-items-start gap-3">
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: notifColor(n.type) + '20',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <i className={`bi ${notifIcon(n.type)}`} style={{ color: notifColor(n.type), fontSize: '0.95rem' }}></i>
                  </div>
                  <div className="flex-grow-1">
                    <div style={{ fontWeight: n.read ? 400 : 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{n.title}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{n.message}</div>
                    {isAdvert && (
                      <div style={{ marginTop: '0.35rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 600, color: '#0891b2', background: '#e0f2fe', borderRadius: 6, padding: '0.18rem 0.55rem' }}>
                          <i className="bi bi-arrow-right-circle"></i> View Details &amp; Apply
                        </span>
                      </div>
                    )}
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                    </div>
                  </div>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1d4ed8', flexShrink: 0, marginTop: 4 }}></div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {advertisePopup && (
        <AdvertisePopup
          notif={advertisePopup}
          onClose={() => setAdvertisePopup(null)}
        />
      )}
    </div>
  )
}
