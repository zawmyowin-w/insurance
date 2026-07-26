import { useEffect, useRef, useState } from 'react'
import { PWD_RULES } from '../utils/validation'

/**
 * Reusable password-requirements checklist.
 *
 * Props:
 *   password  – current password string
 *   lang      – 'en' | 'my'  (defaults to 'en')
 *   compact   – slightly smaller padding (for modals / inline)
 *   popup     – when true, renders as a floating popup anchored to the
 *               nearest `position:relative` ancestor (the input wrapper).
 *               Use together with `show` to control visibility.
 *   show      – (popup mode) whether the popup is visible
 */
export default function PasswordStrengthWidget({
  password,
  lang = 'en',
  compact = false,
  popup = false,
  show = true,
}) {
  const popupRef = useRef(null)
  const [above, setAbove] = useState(false)

  /* Flip popup above the input if it would overflow the viewport bottom */
  useEffect(() => {
    if (!popup || !show || !popupRef.current) return
    const rect = popupRef.current.getBoundingClientRect()
    setAbove(rect.bottom > window.innerHeight - 16)
  }, [popup, show, password])

  const listContent = (
    <>
      {PWD_RULES.map((r, idx) => {
        const ok = r.test(password)
        return (
          <div
            key={r.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              marginBottom: idx < PWD_RULES.length - 1 ? '0.35rem' : 0,
              fontSize: compact || popup ? '0.82rem' : '0.84rem',
              color: ok ? '#16a34a' : 'var(--text-muted)',
              transition: 'color 0.2s',
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: ok ? '#16a34a' : 'transparent',
                border: `1.5px solid ${ok ? '#16a34a' : 'var(--text-muted)'}`,
                transition: 'all 0.2s',
              }}
            >
              {ok && (
                <i
                  className="bi bi-check"
                  style={{ color: '#fff', fontSize: '0.55rem', lineHeight: 1 }}
                />
              )}
            </div>
            {r.label[lang] ?? r.label.en}
          </div>
        )
      })}
    </>
  )

  /* ── Popup mode ── */
  if (popup) {
    if (!show) return null
    return (
      <div
        ref={popupRef}
        style={{
          position: 'absolute',
          left: 0,
          ...(above
            ? { bottom: 'calc(100% + 6px)' }
            : { top: 'calc(100% + 6px)' }),
          zIndex: 200,
          minWidth: 230,
          maxWidth: 310,
          width: '100%',
          padding: '0.75rem 1rem',
          background: 'var(--bg-primary, #fff)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
          pointerEvents: 'none', /* don't steal blur events */
        }}
      >
        {/* Small arrow pointing up (or down when flipped) */}
        <div
          style={{
            position: 'absolute',
            left: 18,
            ...(above
              ? { bottom: -6, borderWidth: '6px 6px 0', borderColor: 'var(--border) transparent transparent' }
              : { top: -6, borderWidth: '0 6px 6px', borderColor: 'transparent transparent var(--border)' }),
            width: 0,
            height: 0,
            borderStyle: 'solid',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 19,
            ...(above
              ? { bottom: -5, borderWidth: '5px 5px 0', borderColor: 'var(--bg-primary, #fff) transparent transparent' }
              : { top: -5, borderWidth: '0 5px 5px', borderColor: 'transparent transparent var(--bg-primary, #fff)' }),
            width: 0,
            height: 0,
            borderStyle: 'solid',
          }}
        />
        {listContent}
      </div>
    )
  }

  /* ── Inline mode (original) ── */
  return (
    <div
      style={{
        marginTop: '0.5rem',
        padding: compact ? '0.6rem 0.85rem' : '0.75rem 1rem',
        background: 'var(--bg-secondary, #f8fafc)',
        border: '1px solid var(--border)',
        borderRadius: compact ? 9 : 10,
      }}
    >
      {listContent}
    </div>
  )
}
