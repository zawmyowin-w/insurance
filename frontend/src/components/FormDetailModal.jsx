import React, { useState, useEffect } from 'react'
import api from '../services/api'

/**
 * Reusable modal for viewing submitted application or claim form data.
 * Shows the form template fields alongside the submitted values.
 * Provides a "Download PDF" button.
 *
 * Props:
 *   show        {boolean}  - whether to show modal
 *   onClose     {function} - close callback
 *   type        {string}   - 'application' | 'claim'
 *   item        {object}   - the application or claim object (must have id, packageId, formData)
 *   role        {string}   - 'admin' | 'agent' | 'customer'
 */
export default function FormDetailModal({ show, onClose, type, item, role }) {
  const [template, setTemplate] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    if (!show || !item) return
    const pkgId = item.packageId
    if (!pkgId) { setTemplate(null); return }
    const formType = type === 'application' ? 'APPLICATION' : 'CLAIM'
    setLoading(true)
    api.get(`/forms/public?packageId=${pkgId}&formType=${formType}`)
      .then(res => setTemplate(res.data))
      .catch(() => setTemplate(null))
      .finally(() => setLoading(false))
  }, [show, item, type])

  if (!show || !item) return null

  // Parse submitted form data
  let formData = {}
  try { if (item.formData) formData = JSON.parse(item.formData) } catch {}

  const handleDownloadPdf = async () => {
    const path = type === 'application'
      ? `/${role}/applications/${item.id}/pdf`
      : `/${role}/claims/${item.id}/pdf`
    setPdfLoading(true)
    try {
      const res = await api.get(path, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}_${item.id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch { alert('Failed to download PDF') }
    finally { setPdfLoading(false) }
  }

  const isApp = type === 'application'
  const typeColor   = isApp ? '#1d4ed8' : '#d97706'
  const typeColor2  = isApp ? '#3b82f6' : '#f59e0b'
  const typeLabel   = isApp ? 'Application Form' : 'Claim Form'
  const typeIcon    = isApp ? 'bi-file-earmark-text' : 'bi-shield-exclamation'
  const statusValue = item.status

  const statusBadgeStyle = {
    display: 'inline-block',
    padding: '0.2rem 0.7rem',
    borderRadius: 99,
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    background: statusValue === 'APPROVED' ? '#dcfce7'
      : statusValue === 'REJECTED' ? '#fee2e2'
      : statusValue === 'PENDING'  ? '#fef9c3'
      : '#e0e7ff',
    color: statusValue === 'APPROVED' ? '#15803d'
      : statusValue === 'REJECTED' ? '#b91c1c'
      : statusValue === 'PENDING'  ? '#854d0e'
      : '#3730a3',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1060,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      backdropFilter: 'blur(3px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: 20,
        width: '100%', maxWidth: 700, maxHeight: '92vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
      }}>

        {/* ── Gradient Hero Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, ' + typeColor + ' 0%, ' + typeColor2 + ' 100%)',
          padding: '1.5rem 1.75rem 2.25rem',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 160, height: 160, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }} />
          <div style={{
            position: 'absolute', bottom: -30, right: 80,
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }} />

          {/* Top row: icon+title | close button */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.25rem', color: '#fff',
              }}>
                <i className={'bi ' + typeIcon}></i>
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {typeLabel}
                </div>
                <div style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.2 }}>
                  {item.packageName || item.policyName || '—'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={handleDownloadPdf} disabled={pdfLoading} style={{
                padding: '0.4rem 0.85rem', borderRadius: 9,
                border: '1.5px solid rgba(255,255,255,0.55)',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(4px)',
                color: '#fff', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.8rem',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {pdfLoading
                  ? <><span className="spinner-border spinner-border-sm"></span> Generating...</>
                  : <><i className="bi bi-file-earmark-pdf"></i> PDF</>}
              </button>
              <button onClick={onClose} style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(4px)',
                border: '1.5px solid rgba(255,255,255,0.4)',
                borderRadius: 8,
                color: '#fff', cursor: 'pointer',
                fontSize: '1.1rem', lineHeight: 1,
                padding: '0.35rem 0.6rem',
              }}>×</button>
            </div>
          </div>

          {/* Status pill row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: '1rem', position: 'relative', zIndex: 1 }}>
            <span style={statusBadgeStyle}>{statusValue}</span>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem' }}>
              #{item.id}
              {item.policyNumber ? ' · ' + item.policyNumber : ''}
              {item.createdAt ? ' · ' + new Date(item.createdAt).toLocaleDateString() : ''}
            </span>
          </div>

          {/* Stats strip */}
          <div style={{
            display: 'flex', gap: '0.75rem', marginTop: '1.1rem',
            position: 'relative', zIndex: 1, flexWrap: 'wrap',
          }}>
            {isApp ? <>
              {item.coverageAmount && <StatPill icon="bi-shield-check" label="Coverage" value={Number(item.coverageAmount).toLocaleString() + ' MMK'} />}
              {item.premiumAmount  && <StatPill icon="bi-cash-coin"    label="Premium"  value={Number(item.premiumAmount).toLocaleString() + ' MMK'} />}
              {item.duration       && <StatPill icon="bi-calendar3"    label="Duration" value={item.duration + ' year'} />}
              {item.riskLevel      && <StatPill icon="bi-activity"     label="Risk"     value={item.riskLevel} />}
            </> : <>
              {item.amount       && <StatPill icon="bi-cash-coin"          label="Claim Amount"  value={Number(item.amount).toLocaleString() + ' MMK'} />}
              {item.incidentDate && <StatPill icon="bi-calendar-event"     label="Incident Date" value={item.incidentDate} />}
              {item.claimType    && <StatPill icon="bi-tag"                label="Claim Type"    value={item.claimType} />}
              {item.customerName && <StatPill icon="bi-person"             label="Customer"      value={item.customerName} />}
            </>}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem' }}>

          {/* Dynamic form fields */}
          {loading ? (
            <div className="text-center py-4">
              <span className="spinner-border" style={{ color: typeColor }}></span>
            </div>
          ) : !template ? (
            <div style={{
              padding: '1.25rem', borderRadius: 12,
              background: 'var(--bg-secondary)', border: '1px dashed var(--border)',
              textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem',
            }}>
              <i className="bi bi-info-circle me-2"></i>
              No form template found for this plan.
            </div>
          ) : (
            <div>
              <SectionHeading icon="bi-ui-checks-grid" label={template.name} color={typeColor} />
              <FormFieldsView fields={template.fields} formData={formData} role={role} type={type} itemId={item.id} />
            </div>
          )}

          {/* ── Notes section (always shown) ── */}
          <NotesSection item={item} type={type} typeColor={typeColor} />
        </div>
      </div>
    </div>
  )
}

/* ── Small stat pill inside the hero ── */
function StatPill({ icon, label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(255,255,255,0.15)',
      backdropFilter: 'blur(4px)',
      border: '1px solid rgba(255,255,255,0.25)',
      borderRadius: 9, padding: '0.3rem 0.7rem',
    }}>
      <i className={'bi ' + icon} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}></i>
      <div>
        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.65)', fontWeight: 600, lineHeight: 1, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 700, lineHeight: 1.3 }}>{value}</div>
      </div>
    </div>
  )
}

/* ── Section heading ── */
function SectionHeading({ icon, label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.85rem', color: color,
      }}>
        <i className={'bi ' + icon}></i>
      </div>
      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{label}</span>
    </div>
  )
}

function FormFieldsView({ fields, formData, role, type, itemId }) {
  if (!fields || fields.length === 0) return (
    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No fields in this template.</div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
      {fields.map(field => (
        <FieldRow key={field.id} field={field} value={formData[String(field.id)]} role={role} type={type} itemId={itemId} />
      ))}
    </div>
  )
}

function FieldRow({ field, value, role, type, itemId }) {
  if (field.fieldType === 'LABEL') {
    return (
      <div style={{
        padding: '0.5rem 0.85rem', borderRadius: 9,
        background: 'var(--bg-secondary)', borderLeft: '3px solid var(--primary)',
        fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem',
        marginTop: '0.25rem',
      }}>
        {field.fieldLabel}
      </div>
    )
  }

  let displayValue = null

  if (field.fieldType === 'CHECKBOX') {
    if (value === undefined || value === null || value === '') {
      displayValue = <span style={{ color: 'var(--text-muted)' }}>—</span>
    } else if (Array.isArray(value)) {
      displayValue = value.length > 0
        ? <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {value.map(v => (
              <span key={v} style={{ padding: '0.15rem 0.55rem', borderRadius: 99, background: '#dcfce7', color: '#16a34a', fontSize: '0.8rem', fontWeight: 600 }}>
                ✓ {v}
              </span>
            ))}
          </div>
        : <span style={{ color: 'var(--text-muted)' }}>None selected</span>
    } else {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          displayValue = parsed.length > 0
            ? <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {parsed.map(v => (
                  <span key={v} style={{ padding: '0.15rem 0.55rem', borderRadius: 99, background: '#dcfce7', color: '#16a34a', fontSize: '0.8rem', fontWeight: 600 }}>
                    ✓ {v}
                  </span>
                ))}
              </div>
            : <span style={{ color: 'var(--text-muted)' }}>None selected</span>
        } else {
          displayValue = value === 'true'
            ? <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Yes</span>
            : <span style={{ color: '#dc2626' }}>✗ No</span>
        }
      } catch {
        displayValue = value === 'true'
          ? <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Yes</span>
          : value === 'false'
            ? <span style={{ color: '#dc2626' }}>✗ No</span>
            : <span>{value}</span>
      }
    }
  } else if (field.fieldType === 'IMAGE_UPLOAD') {
    displayValue = !value
      ? <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No image uploaded</span>
      : <FileLink path={value} label="View Image" isImage={true} role={role} type={type} itemId={itemId} fieldId={field.id} />
  } else if (field.fieldType === 'PDF_UPLOAD') {
    displayValue = !value
      ? <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No file uploaded</span>
      : <FileLink path={value} label="View File" isImage={false} role={role} type={type} itemId={itemId} fieldId={field.id} />
  } else {
    displayValue = value
      ? <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{value}</span>
      : <span style={{ color: 'var(--text-muted)' }}>—</span>
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '170px 1fr', gap: '0.5rem',
      padding: '0.6rem 0.85rem', borderRadius: 9,
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      alignItems: 'start',
    }}>
      <div style={{ fontSize: '0.79rem', color: 'var(--text-secondary)', fontWeight: 600, paddingTop: 2 }}>
        {field.fieldLabel}
        {field.required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </div>
      <div style={{ fontSize: '0.87rem', color: 'var(--text-primary)' }}>{displayValue}</div>
    </div>
  )
}

function FileLink({ path, label, isImage, role, type, itemId, fieldId }) {
  const [url, setUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    if (url) { window.open(url, '_blank'); return }
    setLoading(true)
    try {
      const endpoint = `/${role}/${type === 'application' ? 'applications' : 'claims'}/${itemId}/form-file/${fieldId}`
      const res = await api.get(endpoint, { responseType: 'blob' })
      const objUrl = window.URL.createObjectURL(res.data)
      setUrl(objUrl)
      window.open(objUrl, '_blank')
    } catch { alert('Could not load file') }
    finally { setLoading(false) }
  }

  return (
    <button onClick={load} disabled={loading} style={{
      padding: '0.3rem 0.75rem', borderRadius: 6,
      border: '1.5px solid var(--primary)', background: 'transparent',
      color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {loading
        ? <><span className="spinner-border spinner-border-sm"></span> Loading...</>
        : <><i className={`bi ${isImage ? 'bi-image' : 'bi-file-earmark-pdf'}`}></i> {label}</>}
    </button>
  )
}

function NotesSection({ item, type, typeColor }) {
  const customerNote = type === 'application' ? item.notes : item.description
  const agentNote    = item.agentNote
  const adminNote    = item.adminNote
  const hasAny       = customerNote || agentNote || adminNote

  const noteEntries = [
    { key: 'customer', icon: 'bi-person-circle',   label: 'Customer', color: '#0369a1', bg: '#e0f2fe', value: customerNote },
    { key: 'agent',    icon: 'bi-headset',          label: 'Agent',    color: '#7c3aed', bg: '#ede9fe', value: agentNote },
    { key: 'admin',    icon: 'bi-shield-lock-fill', label: 'Admin',    color: '#b45309', bg: '#fef3c7', value: adminNote },
  ].filter(e => e.value)

  return (
    <div style={{
      marginTop: '1.5rem',
      borderRadius: 14,
      border: '1.5px solid var(--border)',
      overflow: 'hidden',
    }}>
      {/* Note header */}
      <div style={{
        padding: '0.65rem 1rem',
        background: 'linear-gradient(90deg, ' + typeColor + '12 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: typeColor + '20',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.82rem', color: typeColor,
        }}>
          <i className="bi bi-sticky-fill"></i>
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Notes
        </span>
      </div>

      {/* Note body */}
      <div style={{ padding: '0.9rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {!hasAny ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            color: 'var(--text-muted)', fontSize: '0.83rem',
            padding: '0.4rem 0',
          }}>
            <i className="bi bi-chat-dots" style={{ fontSize: '1rem', opacity: 0.45 }}></i>
            <span>No notes have been added yet.</span>
          </div>
        ) : noteEntries.map(({ key, icon, label, color, bg, value }) => (
          <div key={key} style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            padding: '0.6rem 0.75rem', borderRadius: 10,
            background: bg, border: '1px solid ' + color + '33',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: color + '20',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.82rem', color: color, flexShrink: 0, marginTop: 1,
            }}>
              <i className={'bi ' + icon}></i>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                {label}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
