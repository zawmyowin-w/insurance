import { useTranslation } from 'react-i18next'

/**
 * Popup modal showing all review notes (admin + agent) with author labels.
 * Works for both applications and claims.
 *
 * Props:
 *   show      — boolean
 *   onClose   — fn
 *   adminNote — string | null
 *   agentNote — string | null
 *   adminName — string | null  (optional, e.g. "Admin")
 *   agentName — string | null  (optional, e.g. agent's name)
 *   title     — string | null  (optional modal title override)
 */
export default function NotesModal({ show, onClose, adminNote, agentNote, adminName, agentName, title }) {
  const { t } = useTranslation()
  if (!show) return null

  const notes = [
    adminNote && {
      author: adminName || t('notes.adminLabel', 'Admin'),
      role: 'admin',
      text: adminNote,
      icon: 'bi-person-gear',
      color: '#1d4ed8',
      bg: '#eff6ff',
      border: '#93c5fd',
    },
    agentNote && {
      author: agentName || t('notes.agentLabel', 'Agent'),
      role: 'agent',
      text: agentNote,
      icon: 'bi-person-badge',
      color: '#0369a1',
      bg: '#f0f9ff',
      border: '#7dd3fc',
    },
  ].filter(Boolean)

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ background: 'rgba(0,0,0,0.45)', zIndex: 1055 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 520 }}>
        <div className="modal-content" style={{ borderRadius: 16, overflow: 'hidden', border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #1d4ed8, #4338ca)', padding: '1.2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h5 style={{ margin: 0, color: '#fff', fontWeight: 700 }}>
                <i className="bi bi-chat-left-text-fill me-2"></i>
                {title || t('notes.title', 'Review Notes')}
              </h5>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', marginTop: 2 }}>
                {t('notes.subtitle', 'Notes written by reviewers')}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', fontSize: '1rem' }}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.5rem' }}>
            {notes.length === 0 ? (
              <div className="text-center py-4">
                <i className="bi bi-chat-left-dots" style={{ fontSize: '2.5rem', color: 'var(--border)' }}></i>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', fontSize: '0.9rem' }}>
                  {t('notes.noNotes', 'No review notes yet.')}
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {notes.map((note, i) => (
                  <div key={i} style={{ background: note.bg, border: `1.5px solid ${note.border}`, borderRadius: 12, padding: '1rem 1.1rem' }}>
                    {/* Author row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: note.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className={`bi ${note.icon}`} style={{ color: '#fff', fontSize: '0.9rem' }}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: note.color }}>{note.author}</div>
                        <div style={{ fontSize: '0.72rem', color: note.color, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {note.role === 'admin' ? t('notes.roleAdmin', 'Administrator') : t('notes.roleAgent', 'Agent')}
                        </div>
                      </div>
                    </div>
                    {/* Note text */}
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#1e3a5f', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {note.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '0 1.5rem 1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} className="btn-outline-custom" style={{ padding: '0.4rem 1.2rem' }}>
              {t('common.close', 'Close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
