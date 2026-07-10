import React, { useEffect, useState } from 'react'
import api from '../../services/api'

export default function AgentNotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/agent/notifications').then(res => setNotifications(Array.isArray(res.data) ? res.data : [])).catch(() => setNotifications([])).finally(() => setLoading(false))
  }, [])

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Notifications</h4>
      </div>
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : notifications.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-bell" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No notifications</h5>
        </div>
      ) : (
        <div className="card-custom p-0">
          {notifications.map(n => (
            <div key={n.id} className={`notification-item ${n.read ? '' : 'unread'}`}>
              <div style={{ fontWeight: n.read ? 400 : 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{n.title}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{n.message}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.3rem' }}>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
