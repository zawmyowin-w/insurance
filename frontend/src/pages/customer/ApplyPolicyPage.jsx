import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { toast } from 'react-toastify'
import SystemFormFields from '../../components/SystemFormFields'
import NrcInput from '../../components/NrcInput'

const ALL_TYPES = ['LIFE', 'HEALTH', 'VEHICLE', 'PROPERTY']
const TYPE_META = {
  LIFE:     { color: '#dc2626', bg: '#fef2f2', icon: 'bi-heart-pulse',  label: 'Life Insurance' },
  HEALTH:   { color: '#16a34a', bg: '#f0fdf4', icon: 'bi-hospital',     label: 'Health Insurance' },
  VEHICLE:  { color: '#2563eb', bg: '#eff6ff', icon: 'bi-truck',        label: 'Vehicle Insurance' },
  PROPERTY: { color: '#ca8a04', bg: '#fefce8', icon: 'bi-house-check',  label: 'Property Insurance' },
}

const STEPS = [
  { id: 1, title: 'Select Plan',   icon: 'bi-grid-3x3-gap' },
  { id: 2, title: 'Fill Form',     icon: 'bi-ui-checks' },
  { id: 3, title: 'Review',        icon: 'bi-check2-circle' },
]

export default function ApplyPolicyPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const preselectedId = location.state?.planId

  const [step, setStep] = useState(1)
  const [plans, setPlans] = useState([])
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [coverage, setCoverage] = useState('')
  const [duration, setDuration] = useState(1)
  const [notes, setNotes] = useState('')

  // System mandatory fields (always present regardless of template)
  const [systemValues, setSystemValues] = useState({ __dob: '', __nrc: '' })
  const handleSystemChange = (key, val) => setSystemValues(v => ({ ...v, [key]: val }))

  // Dynamic form state
  const [template, setTemplate] = useState(null)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [fieldValues, setFieldValues] = useState({})   // fieldId -> value (text/checkbox)
  const [fieldFiles, setFieldFiles]   = useState({})   // fieldId -> File

  const [submitting, setSubmitting] = useState(false)

  // Load plans
  useEffect(() => {
    api.get('/packages/public').then(res => {
      const pkgs = Array.isArray(res.data) ? res.data : []
      setPlans(pkgs)
      if (preselectedId) {
        const p = pkgs.find(x => x.id === Number(preselectedId))
        if (p) { selectPlan(p); }
      }
    }).catch(() => {})
  }, [])

  // Load form template when plan is selected
  useEffect(() => {
    if (!selectedPlan) { setTemplate(null); return }
    setTemplateLoading(true)
    setFieldValues({})
    setFieldFiles({})
    api.get(`/forms/public?packageId=${selectedPlan.id}&formType=APPLICATION`)
      .then(res => setTemplate(res.data))
      .catch(() => setTemplate(null))
      .finally(() => setTemplateLoading(false))
  }, [selectedPlan?.id])

  const selectPlan = (plan) => {
    setSelectedPlan(plan)
    setCoverage(String(plan.coverageMin || ''))
    setDuration((plan.durations?.[0]) || 1)
    setStep(2)
  }

  const handleFieldValue = (fieldId, value) => setFieldValues(v => ({ ...v, [String(fieldId)]: value }))
  const handleFieldFile  = (fieldId, file)  => setFieldFiles(v => ({ ...v, [String(fieldId)]: file }))
  const handleCheckboxOption = (fieldId, option, checked) => {
    setFieldValues(prev => {
      const current = Array.isArray(prev[String(fieldId)]) ? prev[String(fieldId)] : []
      const next = checked ? [...current, option] : current.filter(o => o !== option)
      return { ...prev, [String(fieldId)]: next }
    })
  }

  const validateForm = () => {
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    try {
      // Build formData JSON (non-file values)
      const formDataObj = {}
      Object.entries(fieldValues).forEach(([k, v]) => {
        formDataObj[k] = Array.isArray(v) ? JSON.stringify(v) : v
      })

      // Merge system fields into formData
      const mergedFormData = {
        __name: user?.name || '',
        __email: user?.email || '',
        __dob: systemValues.__dob,
        __nrc: systemValues.__nrc,
        ...formDataObj,
      }

      const fd = new FormData()
      fd.append('packageId', selectedPlan.id)
      fd.append('coverageAmount', coverage)
      fd.append('duration', duration)
      fd.append('notes', notes)
      fd.append('formData', JSON.stringify(mergedFormData))

      // Append file fields
      Object.entries(fieldFiles).forEach(([fieldId, file]) => {
        if (file) fd.append(`file_${fieldId}`, file)
      })

      await api.post('/customer/applications', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Application submitted successfully!')
      navigate('/customer/applications')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredPlans = typeFilter === 'ALL' ? plans : plans.filter(p => p.type === typeFilter)
  const durations = selectedPlan?.durations || [1, 2, 3, 5]
  const premium = selectedPlan && coverage
    ? Math.round(Number(coverage) * selectedPlan.premiumRate * duration)
    : null

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Apply for Insurance</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Select a plan and fill in the required details</p>
      </div>

      {/* Step indicator */}
      <div className="d-flex align-items-center gap-0 mb-5" style={{ maxWidth: 500 }}>
        {STEPS.map((s, idx) => (
          <React.Fragment key={s.id}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: idx < STEPS.length - 1 ? 'none' : 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step >= s.id ? 'var(--primary)' : 'var(--bg-secondary)',
                color: step >= s.id ? '#fff' : 'var(--text-muted)',
                fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s',
                border: `2px solid ${step >= s.id ? 'var(--primary)' : 'var(--border)'}`
              }}>
                {step > s.id ? <i className="bi bi-check2"></i> : s.id}
              </div>
              <span style={{ fontSize: '0.72rem', color: step >= s.id ? 'var(--primary)' : 'var(--text-muted)', marginTop: 4, fontWeight: 600, whiteSpace: 'nowrap' }}>{s.title}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: step > s.id ? 'var(--primary)' : 'var(--border)', margin: '0 8px', marginBottom: 20, transition: 'all 0.2s' }}></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 1: Plan selection ── */}
      {step === 1 && (
        <>
          <div className="d-flex gap-2 mb-4 flex-wrap">
            {['ALL', ...ALL_TYPES].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{
                padding: '0.4rem 1rem', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.82rem',
                background: typeFilter === t ? 'var(--primary)' : 'var(--bg-secondary)',
                color: typeFilter === t ? '#fff' : 'var(--text-secondary)',
              }}>{t}</button>
            ))}
          </div>
          {filteredPlans.length === 0 ? (
            <div className="card-custom text-center py-5">
              <i className="bi bi-box-seam" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
              <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No plans available</h5>
            </div>
          ) : (
            <div className="row g-3">
              {filteredPlans.map(plan => {
                const meta = TYPE_META[plan.type] || {}
                return (
                  <div key={plan.id} className="col-12 col-md-6">
                    <div onClick={() => selectPlan(plan)} style={{
                      padding: '1.25rem', borderRadius: 14, cursor: 'pointer',
                      border: `2px solid ${meta.color || 'var(--border)'}22`,
                      background: meta.bg || 'var(--bg-secondary)',
                      transition: 'all 0.15s',
                    }} className="h-100">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
                        <i className={`bi ${meta.icon || 'bi-shield'}`} style={{ fontSize: '1.5rem', color: meta.color }}></i>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{plan.name}</div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: meta.color }}>{plan.type}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem' }}>{plan.description}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{Number(plan.coverageMin).toLocaleString()} – {Number(plan.coverageMax).toLocaleString()} MMK</span>
                        <span style={{ fontWeight: 700, color: meta.color }}>{(plan.premiumRate * 100).toFixed(1)}%/yr</span>
                      </div>
                      <button style={{
                        marginTop: '0.75rem', width: '100%', padding: '0.5rem', borderRadius: 8,
                        border: 'none', background: meta.color, color: '#fff',
                        fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                      }}>Select This Plan →</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Step 2: Fill Form ── */}
      {step === 2 && selectedPlan && (
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <div className="card-custom">
              {/* Plan summary */}
              <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'var(--bg-secondary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                <i className={`bi ${TYPE_META[selectedPlan.type]?.icon || 'bi-shield'}`} style={{ fontSize: '1.4rem', color: TYPE_META[selectedPlan.type]?.color, flexShrink: 0 }}></i>
                <div className="flex-grow-1">
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedPlan.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedPlan.type} • {(selectedPlan.premiumRate * 100).toFixed(1)}% premium rate</div>
                </div>
                <button onClick={() => { setStep(1); setSelectedPlan(null) }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}>
                  Change Plan
                </button>
              </div>

              {/* Coverage & duration */}
              <div className="row g-3 mb-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label-custom">Coverage Amount (MMK)</label>
                  <input type="number" className="form-control-custom w-100"
                    value={coverage}
                    min={selectedPlan.coverageMin} max={selectedPlan.coverageMax}
                    onChange={e => setCoverage(e.target.value)} />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    Range: {Number(selectedPlan.coverageMin).toLocaleString()} – {Number(selectedPlan.coverageMax).toLocaleString()} MMK
                  </small>
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label-custom">Duration (years)</label>
                  <select className="form-select-custom w-100" value={duration} onChange={e => setDuration(Number(e.target.value))}>
                    {(Array.isArray(durations) ? durations : String(durations).split(',').map(Number)).map(d => (
                      <option key={d} value={d}>{d} year{d > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* System fields */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <SystemFormFields
                  user={user}
                  values={systemValues}
                  onChange={handleSystemChange}
                />
              </div>

              {/* Dynamic form fields */}
              {templateLoading && (
                <div className="text-center py-3">
                  <span className="spinner-border spinner-border-sm me-2" style={{ color: 'var(--primary)' }}></span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading form fields...</span>
                </div>
              )}

              {!templateLoading && template && template.fields?.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                    {template.name}
                  </div>
                  <DynamicFormFields
                    fields={template.fields}
                    fieldValues={fieldValues}
                    fieldFiles={fieldFiles}
                    onValue={handleFieldValue}
                    onFile={handleFieldFile}
                    onCheckboxOption={handleCheckboxOption}
                  />
                </div>
              )}

              {!templateLoading && !template && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: '#fef3c7', border: '1px solid #fcd34d', marginBottom: '1rem', fontSize: '0.85rem', color: '#92400e' }}>
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  No application form has been configured for this plan yet. Contact the administrator.
                </div>
              )}

              {/* Additional notes */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.75rem' }}>
                <label className="form-label-custom">Additional Notes (optional)</label>
                <textarea rows={2} className="form-control-custom w-100" style={{ resize: 'vertical' }}
                  placeholder="Any additional information..."
                  value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              <div className="d-flex gap-2 mt-4">
                <button onClick={() => setStep(3)} className="btn-primary-custom flex-grow-1" style={{ justifyContent: 'center' }}
                  disabled={templateLoading}>
                  Review Application →
                </button>
                <button onClick={() => { setStep(1); setSelectedPlan(null) }} className="btn-outline-custom">
                  Back
                </button>
              </div>
            </div>
          </div>

          {/* Premium estimate */}
          <div className="col-12 col-lg-4">
            <div className="card-custom">
              <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Premium Estimate</h6>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
                {[
                  ['Plan', selectedPlan.name],
                  ['Type', selectedPlan.type],
                  ['Coverage', coverage ? Number(coverage).toLocaleString() + ' MMK' : '—'],
                  ['Duration', duration + ' year(s)'],
                  ['Rate', (selectedPlan.premiumRate * 100).toFixed(1) + '%/year'],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.6rem', marginTop: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem' }}>
                    <span>Est. Premium</span>
                    <span style={{ color: 'var(--primary)' }}>
                      {premium ? Number(premium).toLocaleString() + ' MMK' : '—'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Final amount determined at approval
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Review & Submit ── */}
      {step === 3 && selectedPlan && (
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <div className="card-custom">
              <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Review Your Application</h6>

              {/* Plan info */}
              <ReviewRow label="Plan" value={selectedPlan.name} />
              <ReviewRow label="Type" value={selectedPlan.type} />
              <ReviewRow label="Coverage" value={Number(coverage).toLocaleString() + ' MMK'} />
              <ReviewRow label="Duration" value={duration + ' year(s)'} />
              <ReviewRow label="Est. Premium" value={premium ? Number(premium).toLocaleString() + ' MMK' : '—'} />
              {notes && <ReviewRow label="Notes" value={notes} />}

              {/* System fields summary */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Personal Information</div>
                <ReviewRow label="အမည်" value={user?.name} />
                <ReviewRow label="အီးမေးလ်" value={user?.email} />
                <ReviewRow label="မွေးသက္ကရာဇ်" value={systemValues.__dob} />
                <ReviewRow label="မှတ်ပုံတင်" value={systemValues.__nrc} />
              </div>

              {/* Dynamic form summary */}
              {template?.fields && template.fields.filter(f => f.fieldType !== 'LABEL').length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    Form Details
                  </div>
                  {template.fields.filter(f => f.fieldType !== 'LABEL').map(field => {
                    const val = fieldValues[String(field.id)]
                    const file = fieldFiles[String(field.id)]
                    let display = '—'
                    if ((field.fieldType === 'IMAGE_UPLOAD' || field.fieldType === 'PDF_UPLOAD') && file) {
                      display = file.name
                    } else if (Array.isArray(val)) {
                      display = val.join(', ') || '—'
                    } else if (val) {
                      display = val
                    }
                    return <ReviewRow key={field.id} label={field.fieldLabel} value={display} />
                  })}
                </div>
              )}

              <div className="d-flex gap-2 mt-4">
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary-custom flex-grow-1" style={{ justifyContent: 'center' }}>
                  {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</> : <><i className="bi bi-send me-2"></i>Submit Application</>}
                </button>
                <button onClick={() => setStep(2)} className="btn-outline-custom" disabled={submitting}>Back</button>
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="card-custom">
              <h6 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>📋 What Happens Next</h6>
              {[
                'Application submitted and assigned to an agent',
                'Agent verifies your information',
                'Admin makes final approval decision',
                'You receive a notification with the outcome',
                'Approved: make your premium payment',
              ].map((s, i) => (
                <div key={i} className="d-flex align-items-start gap-2 mb-2">
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewRow({ label, value }) {
  return (
    <div className="d-flex gap-2 mb-2" style={{ fontSize: '0.88rem' }}>
      <span style={{ color: 'var(--text-muted)', minWidth: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{value || '—'}</span>
    </div>
  )
}

function DynamicFormFields({ fields, fieldValues, fieldFiles, onValue, onFile, onCheckboxOption }) {
  if (!fields || fields.length === 0) return null
  return (
    <div className="d-flex flex-column gap-3">
      {fields.map(field => (
        <DynamicField key={field.id} field={field}
          value={fieldValues[String(field.id)]}
          file={fieldFiles[String(field.id)]}
          onValue={v => onValue(field.id, v)}
          onFile={f => onFile(field.id, f)}
          onCheckboxOption={(opt, checked) => onCheckboxOption(field.id, opt, checked)} />
      ))}
    </div>
  )
}

function DynamicField({ field, value, file, onValue, onFile, onCheckboxOption }) {
  if (field.fieldType === 'LABEL') {
    return (
      <div style={{
        padding: '0.6rem 0.9rem', borderRadius: 8,
        background: 'var(--bg-secondary)', borderLeft: '3px solid var(--primary)',
        fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem'
      }}>
        {field.fieldLabel}
      </div>
    )
  }

  let options = []
  if (field.fieldType === 'CHECKBOX' && field.fieldOptions) {
    try { options = JSON.parse(field.fieldOptions) } catch { options = ['Yes', 'No'] }
  }
  const selectedOptions = Array.isArray(value) ? value : []

  return (
    <div>
      <label className="form-label-custom">
        {field.fieldLabel}
      </label>
      {field.fieldType === 'TEXT' && (
        <input className="form-control-custom w-100" value={value || ''}
          onChange={e => onValue(e.target.value)} />
      )}
      {field.fieldType === 'TEXTAREA' && (
        <textarea rows={3} className="form-control-custom w-100" style={{ resize: 'vertical' }}
          value={value || ''} onChange={e => onValue(e.target.value)} />
      )}
      {field.fieldType === 'CHECKBOX' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 4 }}>
          {options.map(opt => (
            <label key={opt} style={{
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              padding: '0.35rem 0.75rem', borderRadius: 8, fontSize: '0.88rem', color: 'var(--text-primary)',
              border: selectedOptions.includes(opt) ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
              background: selectedOptions.includes(opt) ? 'var(--bg-secondary)' : 'transparent',
            }}>
              <input type="checkbox"
                checked={selectedOptions.includes(opt)}
                onChange={e => onCheckboxOption(opt, e.target.checked)} />
              {opt}
            </label>
          ))}
        </div>
      )}
      {field.fieldType === 'DATE' && (
        <input type="date" className="form-control-custom w-100"
          value={value || ''}
          max={new Date().toISOString().split('T')[0]}
          onChange={e => onValue(e.target.value)} />
      )}
      {field.fieldType === 'NRC' && (
        <NrcInput value={value || ''} onChange={onValue} />
      )}
      {field.fieldType === 'IMAGE_UPLOAD' && (
        <input type="file" accept=".jpg,.jpeg,.png,.webp" className="form-control-custom w-100"
          onChange={e => onFile(e.target.files[0] || null)} />
      )}
      {field.fieldType === 'PDF_UPLOAD' && (
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="form-control-custom w-100"
          onChange={e => onFile(e.target.files[0] || null)} />
      )}
      {file && (
        <small style={{ color: '#16a34a', fontSize: '0.78rem', marginTop: 2, display: 'block' }}>✓ {file.name}</small>
      )}
    </div>
  )
}
