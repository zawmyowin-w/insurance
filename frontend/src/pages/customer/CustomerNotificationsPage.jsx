import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

export default function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = () => {
    api.get('/customer/notifications')
      .then(res => setNotifications(Array.isArray(res.data) ? res.data : []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchNotifications() }, [])

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(ns => ns.map(n => ({ ...n, read: true })))
      toast.success('All notifications marked as read')
    } catch {}
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const notifIcon = (type) => {
    const map = { APPROVAL: 'bi-check-circle-fill', REJECTION: 'bi-x-circle-fill', PAYMENT: 'bi-credit-card-fill', CLAIM: 'bi-file-earmark-medical-fill', INFO: 'bi-info-circle-fill', REMINDER: 'bi-bell-fill' }
    return map[type] || 'bi-bell-fill'
  }
  const notifColor = (type) => {
    const map = { APPROVAL: '#16a34a', REJECTION: '#dc2626', PAYMENT: '#1d4ed8', CLAIM: '#f59e0b', INFO: '#6b7280', REMINDER: '#9333ea' }
    return map[type] || '#6b7280'
  }

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Notifications {unreadCount > 0 && <span style={{ background: '#dc2626', color: '#fff', borderRadius: 20, fontSize: '0.72rem', padding: '0.15rem 0.5rem', marginLeft: 6 }}>{unreadCount}</span>}
          </h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Stay updated on your applications and claims</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-primary-sm" onClick={markAllRead}>Mark all as read</button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : notifications.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-bell" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No notifications yet</h5>
        </div>
      ) : (
        <div className="card-custom p-0">
          {notifications.map(n => (
            <div key={n.id} className={`notification-item ${n.read ? '' : 'unread'}`}
              onClick={() => !n.read && markRead(n.id)}
              style={{ cursor: n.read ? 'default' : 'pointer' }}>
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
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                  </div>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1d4ed8', flexShrink: 0, marginTop: 4 }}></div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
