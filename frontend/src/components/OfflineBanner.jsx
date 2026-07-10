import React, { useState, useEffect } from 'react'
import api from '../services/api'

// Probes the backend once and shows a banner when it is offline.
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Quick health-check — if it errors with a network/502 we know the backend is down
    api.get('/auth/me')
      .catch(err => {
        if (!err.response || err.response.status >= 500) setOffline(true)
      })
  }, [])

  if (!offline || dismissed) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'linear-gradient(135deg, #1a3a5c 0%, #0f2540 100%)',
      color: '#fff', padding: '0.6rem 1.25rem',
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      fontSize: '0.85rem', boxShadow: '0 -2px 12px rgba(0,0,0,.25)'
    }}>
      <i className="bi bi-database-x" style={{ fontSize: '1.1rem', color: '#f59e0b', flexShrink: 0 }}></i>
      <span style={{ flex: 1 }}>
        <strong>Demo mode</strong> — backend not running. Auth, navigation & sample data work fully.
        Real data will appear once the Spring Boot backend is connected.
      </span>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none', border: '1px solid rgba(255,255,255,.3)', color: '#fff',
          borderRadius: 6, padding: '0.2rem 0.65rem', cursor: 'pointer',
          fontSize: '0.8rem', flexShrink: 0, whiteSpace: 'nowrap'
        }}
      >
        Got it
      </button>
    </div>
  )
}
