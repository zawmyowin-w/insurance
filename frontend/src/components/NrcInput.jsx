import { NRC_DATA, NRC_CITIZEN_TYPES, getTownships, resolveToCode, findTownship } from '../data/nrcData'

/**
 * Myanmar NRC input component — bilingual (Myanmar + English).
 *
 * Stored format : "10/မဒန(နိုင်)241890"
 *                  ──  ───  ────  ──────
 *                  state code  type  digits
 *
 * Myanmar preview : ၁၀/မဒန(နိုင်)၂၄၁၈၉၀
 * English preview : 10/MADANA(N)241890
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

  const townships   = getTownships(parsed.state)
  const townshipObj = findTownship(parsed.state, resolvedCode)
  const citizenObj  = NRC_CITIZEN_TYPES.find(ct => ct.value === parsed.type)

  const inputStyle = readOnly
    ? { background: 'var(--bg-secondary)', cursor: 'not-allowed', color: 'var(--text-muted)' }
    : {}

  // Convert Arabic digits to Myanmar digits for the Myanmar preview
  const toMM = str => (str || '').replace(/[0-9]/g, d => '၀၁၂၃၄၅၆၇၈၉'[d])

  // Build both preview strings
  const mmPreview = (() => {
    if (!parsed.state && !resolvedCode && !parsed.type && !parsed.digits) return ''
    let s = ''
    if (parsed.state)   s += toMM(parsed.state) + '/'
    if (resolvedCode)   s += resolvedCode
    if (parsed.type)    s += `(${parsed.type})`
    if (parsed.digits)  s += toMM(parsed.digits)
    return s
  })()

  const enPreview = (() => {
    if (!parsed.state && !resolvedCode && !parsed.type && !parsed.digits) return ''
    let s = ''
    if (parsed.state)           s += parsed.state + '/'
    if (townshipObj?.engCode)   s += townshipObj.engCode
    else if (resolvedCode)      s += resolvedCode
    if (citizenObj?.engValue)   s += `(${citizenObj.engValue})`
    else if (parsed.type)       s += `(${parsed.type})`
    if (parsed.digits)          s += parsed.digits.replace(/[၀-၉]/g, d => String('၀၁၂၃၄၅၆၇၈၉'.indexOf(d)))
    return s
  })()

  const hasPreview = mmPreview || enPreview

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
          {Object.entries(NRC_DATA).map(([k, v]) => (
            <option key={k} value={k}>{k}/ ({v.engState})</option>
          ))}
        </select>

        {/* ── Township code ── */}
        <select
          className="form-select-custom"
          style={{ flex: '1 1 220px', minWidth: 180, ...inputStyle }}
          value={resolvedCode}
          disabled={readOnly || !parsed.state}
          required={required && !readOnly}
          onChange={e => handleChange('township', e.target.value)}
        >
          <option value="">မြို့နယ် / Township</option>
          {townships.map(t => (
            <option key={t.code} value={t.code}>
              {t.code} — {t.name} ({t.engCode} — {t.engName})
            </option>
          ))}
        </select>

        {/* ── Citizen type ── */}
        <select
          className="form-select-custom"
          style={{ width: 110, flexShrink: 0, ...inputStyle }}
          value={parsed.type}
          disabled={readOnly}
          required={required && !readOnly}
          onChange={e => handleChange('type', e.target.value)}
        >
          <option value="">အမျိုး</option>
          {NRC_CITIZEN_TYPES.map(ct => (
            <option key={ct.value} value={ct.value}>
              {ct.value} ({ct.engValue})
            </option>
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

      {/* ── Dual preview ── */}
      {hasPreview && (
        <div style={{ marginTop: 6, fontSize: '0.78rem', fontFamily: 'monospace' }}>
          {/* Myanmar format */}
          <div style={{ color: 'var(--text-muted)' }}>
            <span style={{ marginRight: 4 }}>မြန်မာ:</span>
            <strong style={{ color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
              {mmPreview || '—'}
            </strong>
          </div>
          {/* English format */}
          <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>
            <span style={{ marginRight: 4 }}>English:</span>
            <strong style={{ color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
              {enPreview || '—'}
            </strong>
          </div>
        </div>
      )}

      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
        ဥပမာ — ၁၀/မဒန(နိုင်)၁၂၃၄၅၆ &nbsp;|&nbsp; 10/MADANA(N)123456
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

/**
 * Parse an NRC string into its four parts.
 *
 * Accepted patterns:
 *   "10/မဒန(နိုင်)123456"   ← full
 *   "10/မဒန(နိုင်)"         ← no digits
 *   "10/မဒန"                ← no type/digits
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
function formatNrc({ state, township, type, digits }) {
  if (!state && !township && !type && !digits) return ''
  let s = ''
  if (state)    s += state + '/'
  if (township) s += township
  if (type)     s += `(${type})`
  if (digits)   s += digits
  return s
}
