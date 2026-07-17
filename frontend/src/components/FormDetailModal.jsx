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

  const typeColor = type === 'application' ? '#1d4ed8' : '#d97706'
  const typeLabel = type === 'application' ? 'Application Form' : 'Claim Form'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1060,
      background: 'rgba(0,0,0,0.55)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: 'var(--bg-primary)', borderRadius: 16,
        width: '100%', maxWidth: 680, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: typeColor, display: 'inline-block' }}></span>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{typeLabel}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>#{item.id}</span>
            </div>
            {item.packageName && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {item.policyName || item.packageName}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleDownloadPdf} disabled={pdfLoading} style={{
              padding: '0.45rem 0.9rem', borderRadius: 8, border: `1.5px solid ${typeColor}`,
              background: 'transparent', color: typeColor, cursor: 'pointer',
              fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6
            }}>
              {pdfLoading
                ? <><span className="spinner-border spinner-border-sm"></span> Generating...</>
                : <><i className="bi bi-file-earmark-pdf"></i> PDF</>}
            </button>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: '0.25rem'
            }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
          {/* Meta info */}
          <MetaSection type={type} item={item} />

          {/* System fields (always shown if present in formData) */}
          {(formData.__name || formData.__email || formData.__dob || formData.__nrc) && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                <i className="bi bi-person-fill me-1"></i>Personal Information
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {formData.__name  && <SystemFieldRow label="အမည် (Full Name)"              value={formData.__name} />}
                {formData.__email && <SystemFieldRow label="အီးမေးလ် (Email)"              value={formData.__email} />}
                {formData.__dob   && <SystemFieldRow label="မွေးသက္ကရာဇ် (Date of Birth)"  value={formData.__dob} />}
                {formData.__nrc   && <SystemFieldRow label="မှတ်ပုံတင် (NRC No.)"          value={formData.__nrc} />}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.75rem' }}></div>
            </div>
          )}

          {/* Dynamic form fields */}
          {loading ? (
            <div className="text-center py-4">
              <span className="spinner-border" style={{ color: typeColor }}></span>
            </div>
          ) : !template ? (
            <div style={{
              padding: '1rem', borderRadius: 10,
              background: 'var(--bg-secondary)', border: '1px dashed var(--border)',
              textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem'
            }}>
              <i className="bi bi-info-circle me-2"></i>
              No form template found for this plan.
              {item.formData && <div style={{ marginTop: 4 }}>Raw data stored.</div>}
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.75rem', marginTop: '1rem' }}>
                {template.name}
              </div>
              <FormFieldsView fields={template.fields} formData={formData} role={role} type={type} itemId={item.id} />
            </div>
          )}

          {/* Notes */}
          <NotesSection item={item} type={type} />
        </div>
      </div>
    </div>
  )
}

function SystemFieldRow({ label, value }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '180px 1fr', gap: '0.5rem',
      padding: '0.45rem 0.75rem', borderRadius: 8,
      background: '#f0fdf4', border: '1px solid #86efac', alignItems: 'start'
    }}>
      <div style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '0.87rem', color: 'var(--text-primary)' }}>{value || '—'}</div>
    </div>
  )
}

function MetaSection({ type, item }) {
  const rows = type === 'application' ? [
    ['Policy Number', item.policyNumber],
    ['Customer', item.customerName],
    ['Coverage Amount', item.coverageAmount ? Number(item.coverageAmount).toLocaleString() + ' MMK' : '—'],
    ['Duration', item.duration ? item.duration + ' year(s)' : '—'],
    ['Premium', item.premiumAmount ? Number(item.premiumAmount).toLocaleString() + ' MMK' : '—'],
    ['Risk Level', item.riskLevel],
    ['Status', item.status],
    ['Submitted', item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'],
  ] : [
    ['Claim Type', item.claimType],
    ['Customer', item.customerName],
    ['Claim Amount', item.amount ? Number(item.amount).toLocaleString() + ' MMK' : '—'],
    ['Incident Date', item.incidentDate || '—'],
    ['Status', item.status],
    ['Submitted', item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'],
  ]
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Summary</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 1rem' }}>
        {rows.filter(([, v]) => v).map(([label, value]) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: label === 'Status' ? 700 : 400 }}>
              {label === 'Status'
                ? <span className={`badge-status badge-${value?.toLowerCase()}`}>{value}</span>
                : value}
            </span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--border)', marginTop: '1rem' }}></div>
    </div>
  )
}

function FormFieldsView({ fields, formData, role, type, itemId }) {
  if (!fields || fields.length === 0) return (
    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No fields in this template.</div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {fields.map(field => (
        <FieldRow key={field.id} field={field} value={formData[String(field.id)]} role={role} type={type} itemId={itemId} />
      ))}
    </div>
  )
}

function FieldRow({ field, value, role, type, itemId }) {
  const [imgSrc, setImgSrc] = useState(null)
  const isUpload = field.fieldType === 'IMAGE_UPLOAD' || field.fieldType === 'PDF_UPLOAD'

  useEffect(() => {
    if (field.fieldType === 'IMAGE_UPLOAD' && value && !imgSrc) {
      // derive doc index from formData key mapping — fetch via blob
      // We use a simpler approach: display as link
    }
  }, [value])

  if (field.fieldType === 'LABEL') {
    return (
      <div style={{
        padding: '0.5rem 0.75rem', borderRadius: 8,
        background: 'var(--bg-secondary)', borderLeft: '3px solid var(--primary)',
        fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem'
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
      // Try to parse JSON array
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
    if (!value) {
      displayValue = <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No image uploaded</span>
    } else {
      const endpoint = `/${role}/${type === 'application' ? 'applications' : 'claims'}/${itemId}/form-file`
      displayValue = (
        <FileLink path={value} label="View Image" isImage={true} role={role} type={type} itemId={itemId} fieldId={field.id} />
      )
    }
  } else if (field.fieldType === 'PDF_UPLOAD') {
    if (!value) {
      displayValue = <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No file uploaded</span>
    } else {
      displayValue = (
        <FileLink path={value} label="View File" isImage={false} role={role} type={type} itemId={itemId} fieldId={field.id} />
      )
    }
  } else {
    displayValue = value
      ? <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{value}</span>
      : <span style={{ color: 'var(--text-muted)' }}>—</span>
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '180px 1fr', gap: '0.5rem',
      padding: '0.6rem 0.75rem', borderRadius: 8,
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      alignItems: 'start'
    }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, paddingTop: 1 }}>
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
      display: 'inline-flex', alignItems: 'center', gap: 4
    }}>
      {loading
        ? <><span className="spinner-border spinner-border-sm"></span> Loading...</>
        : <><i className={`bi ${isImage ? 'bi-image' : 'bi-file-earmark-pdf'}`}></i> {label}</>}
    </button>
  )
}

function NotesSection({ item, type }) {
  const notes = type === 'application' ? item.notes : item.description
  const agentNote = item.agentNote
  const adminNote = item.adminNote
  if (!notes && !agentNote && !adminNote) return null
  return (
    <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Notes</div>
      {notes && (
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Customer: </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{notes}</span>
        </div>
      )}
      {agentNote && (
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Agent: </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{agentNote}</span>
        </div>
      )}
      {adminNote && (
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Admin: </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{adminNote}</span>
        </div>
      )}
    </div>
  )
}
