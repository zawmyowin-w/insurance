import { useTranslation } from 'react-i18next'
import { NRC_DATA, NRC_CITIZEN_TYPES, getTownships, resolveToCode, findTownship } from '../data/nrcData'

/**
 * Myanmar NRC input component — bilingual, language-aware.
 *
 * Responds to the app's EN ↔ မြန်မာ toggle:
 *   EN  mode → English labels & codes first, Myanmar in parentheses
 *   မြန်မာ mode → Myanmar labels & codes first, English in parentheses
 *
 * Stored format (language-independent): "10/မဒန(နိုင်)241890"
 *
 * Preview:
 *   မြန်မာ  ၁၀/မဒန(နိုင်)၂၄၁၈၉၀
 *   English  10/MADANA(N)241890
 *
 * Props
 *   value    : NRC string (controlled)
 *   onChange : (nrcString) => void
 *   required : bool
 *   readOnly : bool
 */
export default function NrcInput({ value, onChange, required, readOnly }) {
  const { t, i18n } = useTranslation()
  const isEn = i18n.language === 'en'

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

  // Convert Arabic digits → Myanmar digits
  const toMM = str => (str || '').replace(/[0-9]/g, d => '၀၁၂၃၄၅၆၇၈၉'[d])
  // Convert Myanmar digits → Arabic digits
  const toAR = str => (str || '').replace(/[၀-၉]/g, d => '၀၁၂၃၄၅၆၇၈၉'.indexOf(d))

  // ── State dropdown option label ───────────────────────────────────
  const stateLabel = (key, stateData) =>
    isEn
      ? `${key}/ — ${stateData.engState}`
      : `${key}/ — ${stateData.stateName}`

  // ── Township dropdown option label ────────────────────────────────
  const townshipLabel = t =>
    isEn
      ? `${t.engCode} — ${t.engName} (${t.code} — ${t.name})`
      : `${t.code} — ${t.name} (${t.engCode} — ${t.engName})`

  // ── Citizen type option label ─────────────────────────────────────
  const citizenLabel = ct =>
    isEn
      ? `${ct.engValue} — ${ct.label.split(' — ')[1]?.split(' (')[0] ?? ct.engValue} (${ct.value})`
      : `${ct.value} (${ct.engValue})`

  // ── Myanmar preview ───────────────────────────────────────────────
  const mmPreview = (() => {
    if (!parsed.state && !resolvedCode && !parsed.type && !parsed.digits) return ''
    let s = ''
    if (parsed.state)  s += toMM(parsed.state) + '/'
    if (resolvedCode)  s += resolvedCode
    if (parsed.type)   s += `(${parsed.type})`
    if (parsed.digits) s += toMM(parsed.digits)
    return s
  })()

  // ── English preview ───────────────────────────────────────────────
  const enPreview = (() => {
    if (!parsed.state && !resolvedCode && !parsed.type && !parsed.digits) return ''
    let s = ''
    if (parsed.state)         s += parsed.state + '/'
    if (townshipObj?.engCode) s += townshipObj.engCode
    else if (resolvedCode)    s += resolvedCode
    if (citizenObj?.engValue) s += `(${citizenObj.engValue})`
    else if (parsed.type)     s += `(${parsed.type})`
    if (parsed.digits)        s += toAR(parsed.digits)
    return s
  })()

  const hasPreview = mmPreview || enPreview

  // ── Which preview row goes first based on language ────────────────
  const previewRows = isEn
    ? [
        { label: t('nrc.enLabel'), text: enPreview },
        { label: t('nrc.mmLabel'), text: mmPreview },
      ]
    : [
        { label: t('nrc.mmLabel'), text: mmPreview },
        { label: t('nrc.enLabel'), text: enPreview },
      ]

  return (
    <div>
      <div className="d-flex gap-1 align-items-center flex-wrap">

        {/* ── State number ── */}
        <select
          className="form-select-custom"
          style={{ width: 160, flexShrink: 0, ...inputStyle }}
          value={parsed.state}
          disabled={readOnly}
          required={required && !readOnly}
          onChange={e => handleChange('state', e.target.value)}
        >
          <option value="">{t('nrc.statePlaceholder')}</option>
          {Object.entries(NRC_DATA).map(([k, v]) => (
            <option key={k} value={k}>{stateLabel(k, v)}</option>
          ))}
        </select>

        {/* ── Township ── */}
        <select
          className="form-select-custom"
          style={{ flex: '1 1 240px', minWidth: 200, ...inputStyle }}
          value={resolvedCode}
          disabled={readOnly || !parsed.state}
          required={required && !readOnly}
          onChange={e => handleChange('township', e.target.value)}
        >
          <option value="">{t('nrc.townshipPlaceholder')}</option>
          {townships.map(tp => (
            <option key={tp.code} value={tp.code}>
              {townshipLabel(tp)}
            </option>
          ))}
        </select>

        {/* ── Citizen type ── */}
        <select
          className="form-select-custom"
          style={{ width: 120, flexShrink: 0, ...inputStyle }}
          value={parsed.type}
          disabled={readOnly}
          required={required && !readOnly}
          onChange={e => handleChange('type', e.target.value)}
        >
          <option value="">{t('nrc.typePlaceholder')}</option>
          {NRC_CITIZEN_TYPES.map(ct => (
            <option key={ct.value} value={ct.value}>
              {citizenLabel(ct)}
            </option>
          ))}
        </select>

        {/* ── Serial digits ── */}
        <input
          className="form-control-custom"
          style={{ width: 110, flexShrink: 0, ...inputStyle }}
          placeholder={t('nrc.digitsPlaceholder')}
          maxLength={6}
          value={parsed.digits}
          readOnly={readOnly}
          required={required && !readOnly}
          onChange={e => handleChange('digits', e.target.value.replace(/[^0-9၀-၉]/g, ''))}
        />
      </div>

      {/* ── Live dual preview ── */}
      {hasPreview && (
        <div style={{ marginTop: 6, fontSize: '0.78rem', fontFamily: 'monospace' }}>
          {previewRows.map(row => (
            <div key={row.label} style={{ color: 'var(--text-muted)', marginTop: 1 }}>
              <span style={{ marginRight: 4 }}>{row.label}:</span>
              <strong style={{ color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                {row.text || '—'}
              </strong>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
        {t('nrc.example')}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function parseNrc(str) {
  if (!str) return { state: '', township: '', type: '', digits: '' }
  const full = str.match(/^(\d+)\/([^(]*)\(([^)]+)\)(.*)$/)
  if (full) return { state: full[1], township: full[2], type: full[3], digits: full[4] }
  const partial2 = str.match(/^(\d+)\/([^(]+)$/)
  if (partial2) return { state: partial2[1], township: partial2[2], type: '', digits: '' }
  const partial1 = str.match(/^(\d+)\/$/)
  if (partial1) return { state: partial1[1], township: '', type: '', digits: '' }
  return { state: '', township: '', type: '', digits: '' }
}

function formatNrc({ state, township, type, digits }) {
  if (!state && !township && !type && !digits) return ''
  let s = ''
  if (state)    s += state + '/'
  if (township) s += township
  if (type)     s += `(${type})`
  if (digits)   s += digits
  return s
}
