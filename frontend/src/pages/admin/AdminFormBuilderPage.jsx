import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

const INSURANCE_TYPES = ['LIFE', 'HEALTH', 'VEHICLE', 'PROPERTY']
const FORM_TYPES = ['APPLICATION', 'CLAIM']
const FIELD_TYPES = [
  { value: 'TEXT',         label: 'Text Box',      icon: 'bi-input-cursor-text' },
  { value: 'TEXTAREA',     label: 'Text Area',     icon: 'bi-textarea-t' },
  { value: 'PDF_UPLOAD',   label: 'PDF Upload',    icon: 'bi-file-earmark-pdf' },
  { value: 'IMAGE_UPLOAD', label: 'Image Upload',  icon: 'bi-image' },
]

const typeColors   = { LIFE: '#1d4ed8', HEALTH: '#16a34a', VEHICLE: '#d97706', PROPERTY: '#7c3aed' }
const formTypeMeta = {
  APPLICATION: { bg: '#dbeafe', color: '#1d4ed8' },
  CLAIM:       { bg: '#fef3c7', color: '#d97706' },
}

const emptyField = () => ({ fieldLabel: '', fieldType: 'TEXT', required: false })
const emptyForm  = () => ({
  name: '', insuranceType: 'LIFE', formType: 'APPLICATION',
  description: '', active: true, fields: [emptyField()],
})

export default function AdminFormBuilderPage() {
  const [templates, setTemplates] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState('ALL')   // insurance type tab
  const [selected,  setSelected]  = useState(null)    // template id or 'new'
  const [form,      setForm]      = useState(emptyForm())
  const [saving,    setSaving]    = useState(false)

  useEffect(() => { fetchTemplates() }, [])

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/admin/forms')
      setTemplates(Array.isArray(res.data) ? res.data : [])
    } catch { toast.error('Failed to load form templates') }
    finally   { setLoading(false) }
  }

  const openNew = () => { setSelected('new'); setForm(emptyForm()) }
  const openEdit = t => { setSelected(t.id); setForm({ ...t, fields: (t.fields || []).map(f => ({ ...f })) }) }
  const closePanel = () => setSelected(null)

  const addField    = () => setForm(f => ({ ...f, fields: [...f.fields, emptyField()] }))
  const removeField = i  => setForm(f => ({ ...f, fields: f.fields.filter((_, idx) => idx !== i) }))
  const updateField = (i, key, val) => setForm(f => {
    const fields = [...f.fields]; fields[i] = { ...fields[i], [key]: val }; return { ...f, fields }
  })
  const moveField = (i, dir) => setForm(f => {
    const fields = [...f.fields], j = i + dir
    if (j < 0 || j >= fields.length) return f
    ;[fields[i], fields[j]] = [fields[j], fields[i]]
    return { ...f, fields }
  })

  const handleSave = async e => {
    e.preventDefault()
    if (!form.name.trim())                          { toast.error('Template name is required'); return }
    if (form.fields.some(f => !f.fieldLabel.trim())) { toast.error('Every field must have a label'); return }
    setSaving(true)
    const payload = { ...form, fields: form.fields.map((f, i) => ({ ...f, sortOrder: i })) }
    try {
      if (selected === 'new') {
        await api.post('/admin/forms', payload)
        toast.success('Form template created!')
      } else {
        await api.put(`/admin/forms/${selected}`, payload)
        toast.success('Form template updated!')
      }
      await fetchTemplates()
      setSelected(null)
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this template? This cannot be undone.')) return
    try {
      await api.delete(`/admin/forms/${selected}`)
      toast.success('Template deleted')
      setTemplates(ts => ts.filter(t => t.id !== selected))
      setSelected(null)
    } catch { toast.error('Delete failed') }
  }

  const filtered = filter === 'ALL' ? templates : templates.filter(t => t.insuranceType === filter)

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Form Templates</h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Design custom application &amp; claim forms per insurance type
          </p>
        </div>
        <button className="btn-primary-custom" onClick={openNew}>
          <i className="bi bi-plus-circle me-2"></i>New Template
        </button>
      </div>

      {/* Insurance type filter tabs */}
      <div className="d-flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
        {['ALL', ...INSURANCE_TYPES].map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding: '0.35rem 1rem', borderRadius: 99, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.15s',
            background: filter === t ? 'var(--primary)' : 'var(--bg-secondary)',
            color:      filter === t ? '#fff'          : 'var(--text-secondary)',
          }}>{t}</button>
        ))}
      </div>

      <div className="row g-4">
        {/* ── Template list ── */}
        <div className={selected ? 'col-12 col-lg-5' : 'col-12'}>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: 'var(--primary)' }}></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card-custom text-center py-5">
              <i className="bi bi-file-earmark-plus" style={{ fontSize: '2.5rem', color: 'var(--text-muted)' }}></i>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
                No form templates yet.<br />Click <strong>New Template</strong> to get started.
              </p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {filtered.map(t => (
                <div key={t.id} onClick={() => openEdit(t)} style={{
                  padding: '1.1rem 1.25rem', background: 'var(--bg-primary)',
                  border: `2px solid ${selected === t.id ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 12, cursor: 'pointer', transition: 'border-color 0.15s',
                }}>
                  <div className="d-flex align-items-start justify-content-between gap-2">
                    <div className="flex-grow-1 min-w-0">
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{t.name}</div>
                      <div className="d-flex gap-2 flex-wrap mb-1">
                        <span style={{ padding: '0.18rem 0.55rem', borderRadius: 99, fontSize: '0.73rem', fontWeight: 700, background: (typeColors[t.insuranceType] || '#6b7280') + '22', color: typeColors[t.insuranceType] || '#6b7280' }}>
                          {t.insuranceType}
                        </span>
                        <span style={{ padding: '0.18rem 0.55rem', borderRadius: 99, fontSize: '0.73rem', fontWeight: 700, background: formTypeMeta[t.formType]?.bg || '#f3f4f6', color: formTypeMeta[t.formType]?.color || '#6b7280' }}>
                          {t.formType}
                        </span>
                        <span style={{ padding: '0.18rem 0.55rem', borderRadius: 99, fontSize: '0.73rem', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                          {t.fields?.length || 0} field{t.fields?.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {t.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</p>}
                    </div>
                    <span style={{ padding: '0.18rem 0.55rem', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                      background: t.active ? '#dcfce7' : '#fee2e2', color: t.active ? '#16a34a' : '#dc2626' }}>
                      {t.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Editor panel ── */}
        {selected && (
          <div className="col-12 col-lg-7">
            <div className="card-custom">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {selected === 'new' ? '✦ New Form Template' : 'Edit Template'}
                </h6>
                <button onClick={closePanel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <form onSubmit={handleSave}>
                {/* Template metadata */}
                <div className="row g-3 mb-2">
                  <div className="col-12">
                    <label className="form-label-custom">Template Name *</label>
                    <input required className="form-control-custom w-100"
                      placeholder="e.g. Life Insurance Application Form"
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="col-6">
                    <label className="form-label-custom">Insurance Type *</label>
                    <select className="form-select-custom w-100" value={form.insuranceType}
                      onChange={e => setForm(f => ({ ...f, insuranceType: e.target.value }))}>
                      {INSURANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label-custom">Form Type *</label>
                    <select className="form-select-custom w-100" value={form.formType}
                      onChange={e => setForm(f => ({ ...f, formType: e.target.value }))}>
                      {FORM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label-custom">Description</label>
                    <textarea rows={2} className="form-control-custom w-100" style={{ resize: 'vertical' }}
                      placeholder="Optional: describe what this form is for..."
                      value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                      Active (visible to agents &amp; customers when applying / claiming)
                    </label>
                  </div>
                </div>

                {/* Fields section */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '0.75rem' }}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      Form Fields <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem' }}>({form.fields.length})</span>
                    </span>
                    <button type="button" onClick={addField} style={{
                      padding: '0.3rem 0.9rem', borderRadius: 8,
                      border: '1.5px dashed var(--primary)', background: 'transparent',
                      color: 'var(--primary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                    }}>
                      <i className="bi bi-plus me-1"></i>Add Field
                    </button>
                  </div>

                  {form.fields.length === 0 ? (
                    <div style={{ padding: '1.5rem', border: '1.5px dashed var(--border)', borderRadius: 10, textAlign: 'center' }}>
                      <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>No fields — click Add Field to start building</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {form.fields.map((field, i) => (
                        <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '0.75rem 0.9rem', border: '1px solid var(--border)' }}>
                          {/* Top row: reorder + index + label + type */}
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                              <button type="button" disabled={i === 0} onClick={() => moveField(i, -1)} style={{ background: 'none', border: 'none', padding: '0 3px', cursor: i === 0 ? 'default' : 'pointer', color: i === 0 ? 'var(--text-muted)' : 'var(--text-secondary)', fontSize: '0.62rem', lineHeight: 1 }}>▲</button>
                              <button type="button" disabled={i === form.fields.length - 1} onClick={() => moveField(i, 1)} style={{ background: 'none', border: 'none', padding: '0 3px', cursor: i === form.fields.length - 1 ? 'default' : 'pointer', color: i === form.fields.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)', fontSize: '0.62rem', lineHeight: 1 }}>▼</button>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                            <input required className="form-control-custom flex-grow-1"
                              style={{ fontSize: '0.85rem', padding: '0.38rem 0.6rem' }}
                              placeholder="Field label (e.g. National ID, Proof of Income)"
                              value={field.fieldLabel}
                              onChange={e => updateField(i, 'fieldLabel', e.target.value)} />
                            <select className="form-select-custom"
                              style={{ fontSize: '0.82rem', padding: '0.38rem 0.5rem', width: 'auto', flexShrink: 0 }}
                              value={field.fieldType}
                              onChange={e => updateField(i, 'fieldType', e.target.value)}>
                              {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </div>

                          {/* Bottom row: required + type icon + delete */}
                          <div className="d-flex align-items-center justify-content-between" style={{ paddingLeft: 42 }}>
                            <label style={{ fontSize: '0.79rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                              <input type="checkbox" checked={field.required}
                                onChange={e => updateField(i, 'required', e.target.checked)} />
                              Required
                            </label>
                            <div className="d-flex align-items-center gap-3">
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <i className={`bi ${FIELD_TYPES.find(t => t.value === field.fieldType)?.icon} me-1`}></i>
                                {FIELD_TYPES.find(t => t.value === field.fieldType)?.label}
                              </span>
                              <button type="button" onClick={() => removeField(i)} title="Remove field" style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.1rem 0.25rem', fontSize: '0.85rem', lineHeight: 1 }}>
                                <i className="bi bi-trash3"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="d-flex gap-2 mt-4">
                  <button type="submit" disabled={saving} className="btn-primary-custom flex-grow-1" style={{ justifyContent: 'center' }}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                      : <><i className="bi bi-floppy me-2"></i>Save Template</>}
                  </button>
                  {selected !== 'new' && (
                    <button type="button" onClick={handleDelete} title="Delete template" style={{
                      padding: '0.65rem 1rem', borderRadius: 10,
                      border: '1.5px solid #dc2626', background: 'transparent',
                      color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
                    }}>
                      <i className="bi bi-trash3"></i>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
