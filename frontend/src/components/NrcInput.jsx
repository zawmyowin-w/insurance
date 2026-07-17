import React from 'react'
import { NRC_DATA, NRC_CITIZEN_TYPES, getTownships, resolveToCode } from '../data/nrcData'

/**
 * Myanmar NRC input component.
 *
 * Stored format : "10/ခဆန(နိုင်)123456"
 *                  ──  ────  ────  ──────
 *                  state code type  digits
 *
 * The township field stores the 3-char code (e.g. ခဆန), NOT the full name.
 * Old records that stored a full name are silently migrated on first render
 * via resolveToCode().
 *
 * Props
 *   value    : NRC string (controlled)
 *   onChange : (nrcString) => void
 *   required : bool
 *   readOnly : bool
 */
export default function NrcInput({ value, onChange, required, readOnly }) {
  const parsed = parseNrc(value || '')

  // Migrate legacy full-name township to code on the fly
  const resolvedCode = parsed.state
    ? resolveToCode(parsed.state, parsed.township)
    : parsed.township

  const handleChange = (part, val) => {
    const next = { ...parsed, township: resolvedCode, [part]: val }
    if (part === 'state') next.township = ''
    onChange(formatNrc(next))
  }

  const townships = getTownships(parsed.state)

  const inputStyle = readOnly
    ? { background: 'var(--bg-secondary)', cursor: 'not-allowed', color: 'var(--text-muted)' }
    : {}

  return (
    <div>
      <div className="d-flex gap-1 align-items-center flex-wrap">

        {/* ── State number ── */}
        <select
          className="form-select-custom"
          style={{ width: 70, flexShrink: 0, ...inputStyle }}
          value={parsed.state}
          disabled={readOnly}
          required={required && !readOnly}
          onChange={e => handleChange('state', e.target.value)}
        >
          <option value="">နံပါတ်</option>
          {Object.keys(NRC_DATA).map(k => (
            <option key={k} value={k}>{k}/</option>
          ))}
        </select>

        {/* ── Township code ── */}
        <select
          className="form-select-custom"
          style={{ flex: '1 1 190px', minWidth: 160, ...inputStyle }}
          value={resolvedCode}
          disabled={readOnly || !parsed.state}
          required={required && !readOnly}
          onChange={e => handleChange('township', e.target.value)}
        >
          <option value="">မြို့နယ်ကုဒ်</option>
          {townships.map(t => (
            <option key={t.code} value={t.code}>
              {t.code} — {t.name}
            </option>
          ))}
        </select>

        {/* ── Citizen type ── */}
        <select
          className="form-select-custom"
          style={{ width: 90, flexShrink: 0, ...inputStyle }}
          value={parsed.type}
          disabled={readOnly}
          required={required && !readOnly}
          onChange={e => handleChange('type', e.target.value)}
        >
          <option value="">အမျိုး</option>
          {NRC_CITIZEN_TYPES.map(ct => (
            <option key={ct.value} value={ct.value}>{ct.value}</option>
          ))}
        </select>

        {/* ── Serial digits ── */}
        <input
          className="form-control-custom"
          style={{ width: 110, flexShrink: 0, ...inputStyle }}
          placeholder="၁၂၃၄၅၆"
          maxLength={6}
          value={parsed.digits}
          readOnly={readOnly}
          required={required && !readOnly}
          onChange={e => handleChange('digits', e.target.value.replace(/[^0-9၀-၉]/g, ''))}
        />
      </div>

      {/* ── Live preview ── */}
      {(parsed.state || resolvedCode || parsed.type || parsed.digits) && (
        <div style={{ marginTop: 4, fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          NRC:{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            {formatNrc({ ...parsed, township: resolvedCode }) || '—'}
          </strong>
          {resolvedCode && parsed.state && (() => {
            const t = getTownships(parsed.state).find(x => x.code === resolvedCode)
            return t ? (
              <span style={{ marginLeft: 8, fontFamily: 'inherit' }}>({t.name}မြို့နယ်)</span>
            ) : null
          })()}
        </div>
      )}

      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
        ဥပမာ — ၁၀/ခဆန(နိုင်)၁၂၃၄၅၆ &nbsp;→&nbsp; ချောင်းဆုံမြို့နယ်
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

/**
 * Parse an NRC string into its four parts.
 * Handles both new code format and legacy full-name format.
 *
 * Accepted patterns:
 *   "10/ခဆန(နိုင်)123456"   ← full
 *   "10/ခဆန(နိုင်)"         ← no digits
 *   "10/ခဆန"                ← no type/digits
 *   "10/"                   ← state only
 */
function parseNrc(str) {
  if (!str) return { state: '', township: '', type: '', digits: '' }

  // Full: digits captured after closing paren
  const full = str.match(/^(\d+)\/([^(]*)\(([^)]+)\)(.*)$/)
  if (full) return { state: full[1], township: full[2], type: full[3], digits: full[4] }

  // State + township, no type
  const partial2 = str.match(/^(\d+)\/([^(]+)$/)
  if (partial2) return { state: partial2[1], township: partial2[2], type: '', digits: '' }

  // State only
  const partial1 = str.match(/^(\d+)\/$/)
  if (partial1) return { state: partial1[1], township: '', type: '', digits: '' }

  return { state: '', township: '', type: '', digits: '' }
}

/**
 * Serialise the four parts back into a canonical NRC string.
 * Returns '' when all parts are empty.
 */
export function formatNrc({ state, township, type, digits }) {
  if (!state && !township && !type && !digits) return ''
  let s = ''
  if (state)    s += state + '/'
  if (township) s += township
  if (type)     s += `(${type})`
  if (digits)   s += digits
  return s
}
