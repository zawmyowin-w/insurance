import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { toast } from 'react-toastify'

const CLAIM_TYPES = ['Accident', 'Hospitalization', 'Death Benefit', 'Property Damage', 'Vehicle Damage', 'Critical Illness', 'Other']

export default function SubmitClaimPage() {
  const navigate = useNavigate()
  const [activePolicies, setActivePolicies] = useState([])
  const [claimedIds, setClaimedIds] = useState(new Set())
  const [form, setForm] = useState({ applicationId: '', claimType: '', amount: '', description: '', incidentDate: '' })
  const [claimTemplate, setClaimTemplate] = useState(null)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [fieldValues, setFieldValues] = useState({})  // fieldId -> value
  const [fieldFiles, setFieldFiles] = useState({})     // fieldId -> File
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/customer/applications?status=APPROVED').catch(() => ({ data: [] })),
      api.get('/customer/claims').catch(() => ({ data: [] })),
    ]).then(([appsRes, claimsRes]) => {
      setActivePolicies(Array.isArray(appsRes.data) ? appsRes.data : [])
      const claims = Array.isArray(claimsRes.data) ? claimsRes.data : []
      setClaimedIds(new Set(claims.map(c => c.applicationId)))
    })
  }, [])

  const availablePolicies = activePolicies.filter(p => !claimedIds.has(p.id))

  // Fetch claim form template when policy is selected
  useEffect(() => {
    if (!form.applicationId) { setClaimTemplate(null); return }
    const selectedPolicy = activePolicies.find(p => String(p.id) === String(form.applicationId))
    if (!selectedPolicy?.packageId) { setClaimTemplate(null); return }
    setTemplateLoading(true)
    setFieldValues({})
    setFieldFiles({})
    api.get(`/forms/public?packageId=${selectedPolicy.packageId}&formType=CLAIM`)
      .then(res => setClaimTemplate(res.data))
      .catch(() => setClaimTemplate(null))
      .finally(() => setTemplateLoading(false))
  }, [form.applicationId])

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleFieldValue = (fieldId, value) => setFieldValues(v => ({ ...v, [String(fieldId)]: value }))
  const handleFieldFile  = (fieldId, file)  => setFieldFiles(v => ({ ...v, [String(fieldId)]: file }))

  const handleCheckboxOption = (fieldId, option, checked) => {
    setFieldValues(prev => {
      const current = Array.isArray(prev[String(fieldId)]) ? prev[String(fieldId)] : []
      const next = checked ? [...current, option] : current.filter(o => o !== option)
      return { ...prev, [String(fieldId)]: next }
    })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.applicationId) { toast.error('Please select a policy'); return }

    // Validate required fields
    if (claimTemplate?.fields) {
      for (const field of claimTemplate.fields) {
        if (field.fieldType === 'LABEL') continue
        if (!field.required) continue
        const val = fieldValues[String(field.id)]
        const file = fieldFiles[String(field.id)]
        if ((field.fieldType === 'IMAGE_UPLOAD' || field.fieldType === 'PDF_UPLOAD') && !file) {
          toast.error(`"${field.fieldLabel}" is required`); return
        }
        if (field.fieldType !== 'IMAGE_UPLOAD' && field.fieldType !== 'PDF_UPLOAD') {
          if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
            toast.error(`"${field.fieldLabel}" is required`); return
          }
        }
      }
    }

    setLoading(true)
    try {
      // Build formData JSON (non-file values)
      const formDataObj = {}
      Object.entries(fieldValues).forEach(([k, v]) => {
        formDataObj[k] = Array.isArray(v) ? JSON.stringify(v) : v
      })

      const fd = new FormData()
      fd.append('applicationId', form.applicationId)
      fd.append('claimType', form.claimType || (claimTemplate ? 'General' : 'Other'))
      fd.append('amount', form.amount || '0')
      fd.append('description', form.description || '')
      fd.append('incidentDate', form.incidentDate || new Date().toISOString().split('T')[0])
      fd.append('formData', JSON.stringify(formDataObj))

      // Append file fields
      Object.entries(fieldFiles).forEach(([fieldId, file]) => {
        if (file) fd.append(`file_${fieldId}`, file)
      })

      await api.post('/customer/claims', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Claim submitted successfully!')
      navigate('/customer/claims')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit claim')
    } finally {
      setLoading(false)
    }
  }

  const selectedPolicy = activePolicies.find(p => String(p.id) === String(form.applicationId))

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Submit a Claim</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>File an insurance claim for an approved policy</p>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card-custom">
            <form onSubmit={handleSubmit}>
              {/* Policy selection */}
              <div className="mb-3">
                <label className="form-label-custom">Select Policy *</label>
                <select name="applicationId" required className="form-select-custom w-100" value={form.applicationId} onChange={handleChange}>
                  <option value="">Choose an approved policy...</option>
                  {availablePolicies.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.packageName || p.package?.name} — {Number(p.coverageAmount).toLocaleString()} MMK
                    </option>
                  ))}
                </select>
                {activePolicies.length === 0 && (
                  <small style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>No approved policies. Apply for a policy first.</small>
                )}
                {activePolicies.length > 0 && availablePolicies.length === 0 && (
                  <small style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>All policies already have a claim. Only one claim per policy.</small>
                )}
              </div>

              {/* Template loading */}
              {templateLoading && (
                <div className="text-center py-3">
                  <span className="spinner-border spinner-border-sm me-2" style={{ color: 'var(--primary)' }}></span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading claim form...</span>
                </div>
              )}

              {/* Dynamic claim form fields */}
              {!templateLoading && form.applicationId && claimTemplate && (
                <DynamicFormFields
                  fields={claimTemplate.fields}
                  fieldValues={fieldValues}
                  fieldFiles={fieldFiles}
                  onValue={handleFieldValue}
                  onFile={handleFieldFile}
                  onCheckboxOption={handleCheckboxOption}
                />
              )}

              {/* No template fallback */}
              {!templateLoading && form.applicationId && !claimTemplate && (
                <>
                  <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: '#fef3c7', border: '1px solid #fcd34d', marginBottom: '1rem', fontSize: '0.85rem', color: '#92400e' }}>
                    <i className="bi bi-info-circle me-2"></i>
                    No claim form configured for this plan yet. Using standard fields.
                  </div>
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label-custom">Claim Type *</label>
                      <select name="claimType" required className="form-select-custom w-100" value={form.claimType} onChange={handleChange}>
                        <option value="">Select type...</option>
                        {CLAIM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label-custom">Claim Amount (MMK) *</label>
                      <input name="amount" type="number" required min={1} className="form-control-custom w-100"
                        placeholder="Enter claim amount" value={form.amount} onChange={handleChange} />
                    </div>
                    <div className="col-12">
                      <label className="form-label-custom">Incident Date *</label>
                      <input name="incidentDate" type="date" required className="form-control-custom w-100"
                        max={new Date().toISOString().split('T')[0]} value={form.incidentDate} onChange={handleChange} />
                    </div>
                    <div className="col-12">
                      <label className="form-label-custom">Description *</label>
                      <textarea name="description" required rows={4} className="form-control-custom w-100"
                        placeholder="Describe the incident..." value={form.description} onChange={handleChange} style={{ resize: 'vertical' }} />
                    </div>
                  </div>
                </>
              )}

              {form.applicationId && (
                <button type="submit" disabled={loading || templateLoading} className="btn-primary-custom mt-4 w-100" style={{ justifyContent: 'center' }}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</> : 'Submit Claim'}
                </button>
              )}
            </form>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card-custom">
            <h6 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>📋 Claim Process</h6>
            {[
              'Submit your claim with required details',
              'Agent reviews and verifies the claim',
              'Admin makes final approval decision',
              'Receive notification of outcome',
              'Approved claims are paid out promptly',
            ].map((s, i) => (
              <div key={i} className="d-flex align-items-start gap-2 mb-2">
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DynamicFormFields({ fields, fieldValues, fieldFiles, onValue, onFile, onCheckboxOption }) {
  if (!fields || fields.length === 0) return null
  return (
    <div className="d-flex flex-column gap-3 mb-3">
      {fields.map(field => (
        <DynamicField
          key={field.id}
          field={field}
          value={fieldValues[String(field.id)]}
          file={fieldFiles[String(field.id)]}
          onValue={v => onValue(field.id, v)}
          onFile={f => onFile(field.id, f)}
          onCheckboxOption={(opt, checked) => onCheckboxOption(field.id, opt, checked)}
        />
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
        {field.fieldLabel} {field.required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      {field.fieldType === 'TEXT' && (
        <input className="form-control-custom w-100" value={value || ''} required={field.required}
          onChange={e => onValue(e.target.value)} />
      )}
      {field.fieldType === 'TEXTAREA' && (
        <textarea rows={3} className="form-control-custom w-100" style={{ resize: 'vertical' }}
          value={value || ''} required={field.required}
          onChange={e => onValue(e.target.value)} />
      )}
      {field.fieldType === 'CHECKBOX' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 4 }}>
          {options.map(opt => (
            <label key={opt} style={{
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              padding: '0.35rem 0.75rem', borderRadius: 8,
              border: selectedOptions.includes(opt) ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
              background: selectedOptions.includes(opt) ? 'var(--bg-secondary)' : 'transparent',
              fontSize: '0.88rem', color: 'var(--text-primary)',
            }}>
              <input type="checkbox"
                checked={selectedOptions.includes(opt)}
                onChange={e => onCheckboxOption(opt, e.target.checked)} />
              {opt}
            </label>
          ))}
        </div>
      )}
      {field.fieldType === 'IMAGE_UPLOAD' && (
        <input type="file" accept=".jpg,.jpeg,.png,.webp" className="form-control-custom w-100"
          required={field.required}
          onChange={e => onFile(e.target.files[0] || null)} />
      )}
      {field.fieldType === 'PDF_UPLOAD' && (
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="form-control-custom w-100"
          required={field.required}
          onChange={e => onFile(e.target.files[0] || null)} />
      )}
      {file && (
        <small style={{ color: '#16a34a', fontSize: '0.78rem', marginTop: 2, display: 'block' }}>
          ✓ {file.name}
        </small>
      )}
    </div>
  )
}
