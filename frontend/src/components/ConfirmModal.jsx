import { useEffect, useRef } from 'react'

/**
 * ConfirmModal — Generic centered confirmation dialog.
 *
 * Props:
 *   open         {boolean}  — whether the modal is visible
 *   title        {string}   — headline
 *   message      {string}   — body text
 *   icon         {string}   — bootstrap-icon class name (default: bi-question-circle-fill)
 *   confirmLabel {string}   — confirm button label (default: "OK")
 *   cancelLabel  {string}   — cancel button label (default: "Cancel")
 *   onConfirm    {fn}       — called when confirm is clicked
 *   onCancel     {fn}       — called when cancel or backdrop is clicked
 *   loading      {boolean}  — shows spinner on confirm button while working
 *   variant      {string}   — "primary" | "success" | "warning" | "danger" (default: "primary")
 */
export default function ConfirmModal({
  open,
  title = 'သေချာပြီလား?',
  message = '',
  icon = 'bi-question-circle-fill',
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'primary',
}) {
  const confirmRef = useRef(null)

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => confirmRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape' && !loading) onCancel?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, loading, onCancel])

  if (!open) return null

  const VARIANTS = {
    primary: { color: '#2563eb', bg: '#eff6ff', ring: 'rgba(37,99,235,0.15)', btn: 'linear-gradient(135deg,#3b82f6 0%,#2563eb 60%,#1d4ed8 100%)' },
    success: { color: '#16a34a', bg: '#f0fdf4', ring: 'rgba(22,163,74,0.15)',  btn: 'linear-gradient(135deg,#22c55e 0%,#16a34a 60%,#15803d 100%)' },
    warning: { color: '#d97706', bg: '#fffbeb', ring: 'rgba(217,119,6,0.15)',  btn: 'linear-gradient(135deg,#f59e0b 0%,#d97706 60%,#b45309 100%)' },
    danger:  { color: '#dc2626', bg: '#fef2f2', ring: 'rgba(220,38,38,0.15)',  btn: 'linear-gradient(135deg,#ef4444 0%,#dc2626 60%,#b91c1c 100%)' },
  }
  const v = VARIANTS[variant] ?? VARIANTS.primary

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1060,
        background: 'rgba(15,23,42,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'confirmBackdropIn 0.18s ease',
      }}
      onClick={() => { if (!loading) onCancel?.() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <style>{`
        @keyframes confirmBackdropIn { from { opacity:0 } to { opacity:1 } }
        @keyframes confirmCardIn { from { opacity:0; transform:scale(0.93) translateY(12px) } to { opacity:1; transform:scale(1) translateY(0) } }
        .confirm-modal-card { animation: confirmCardIn 0.22s cubic-bezier(.34,1.56,.64,1) both; }
        .confirm-modal-btn-cancel:hover { background: var(--bg-secondary,#f1f5f9) !important; }
        .confirm-modal-btn-confirm { transition: filter .15s, transform .1s; }
        .confirm-modal-btn-confirm:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
        .confirm-modal-btn-confirm:active:not(:disabled) { filter: brightness(.95); transform: translateY(0); }
      `}</style>

      <div
        className="confirm-modal-card"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card, #fff)',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(15,23,42,0.18), 0 4px 16px rgba(15,23,42,0.08)',
          width: '100%',
          maxWidth: '420px',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: v.bg,
            boxShadow: `0 0 0 8px ${v.ring}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className={`bi ${icon}`} style={{ fontSize: '2rem', color: v.color }} />
          </div>
        </div>

        {/* Text */}
        <h5 id="confirm-modal-title" style={{
          fontWeight: 700, fontSize: '1.15rem',
          color: 'var(--text-primary, #0f172a)',
          marginBottom: '0.5rem',
        }}>
          {title}
        </h5>
        {message && (
          <p style={{
            color: 'var(--text-muted, #64748b)',
            fontSize: '0.92rem',
            lineHeight: 1.6,
            margin: '0 0 1.5rem',
          }}>
            {message}
          </p>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-color, #e2e8f0)', margin: '1.25rem 0' }} />

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1, padding: '0.65rem 1rem', borderRadius: '10px',
              border: '1.5px solid var(--border-color, #e2e8f0)',
              background: 'transparent',
              color: 'var(--text-primary, #0f172a)',
              fontWeight: 600, fontSize: '0.9rem',
              cursor: 'pointer', transition: 'background .15s',
            }}
            className="confirm-modal-btn-cancel"
          >
            <i className="bi bi-x-lg me-1" />
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: '0.65rem 1rem', borderRadius: '10px',
              border: 'none',
              background: v.btn,
              color: '#fff',
              fontWeight: 600, fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1,
              boxShadow: `0 4px 12px ${v.ring}`,
            }}
            className="confirm-modal-btn-confirm"
          >
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" role="status" />{confirmLabel}…</>
              : <><i className="bi bi-check-lg me-1" />{confirmLabel}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
