import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { toast } from 'react-toastify'
import NrcInput from '../../components/NrcInput'
import { getTypeMeta } from '../../utils/typeMeta'
import AgentProfileCard from '../../components/AgentProfileCard'
import DigitalSignatureCanvas from '../../components/DigitalSignatureCanvas'

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

  const signatureRef = useRef()
  const [signatureData, setSignatureData] = useState(null)

  const [step, setStep] = useState(1)
  const [plans, setPlans] = useState([])
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [coverage, setCoverage] = useState('')
  const [duration, setDuration] = useState(1)
  const [notes, setNotes] = useState('')

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
      .then(res => {
        const tmpl = res.data
        setTemplate(tmpl)
        // Auto-fill NAME / EMAIL / PHONE fields from user profile
        if (tmpl?.fields && user) {
          const prefill = {}
          tmpl.fields.forEach(f => {
            if (f.fieldType === 'NAME')  prefill[String(f.id)] = user.name  || ''
            if (f.fieldType === 'EMAIL') prefill[String(f.id)] = user.email || ''
          })
          if (Object.keys(prefill).length > 0) setFieldValues(prefill)
        }
      })
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

      if (!signatureData) {
        toast.error('လက်မှတ်ရေးထိုးပါ — Digital Signature လိုအပ်သည်')
        setSubmitting(false)
        return
      }

      const mergedFormData = {
        __name: user?.name || '',
        __email: user?.email || '',
        __signature: signatureData,
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
  const meta2 = selectedPlan ? getTypeMeta(selectedPlan.type) : {}

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
            {['ALL', ...[...new Set(plans.map(p => p.type))]].map(t => {
              const meta = t === 'ALL' ? null : getTypeMeta(t)
              return (
                <button key={t} onClick={() => setTypeFilter(t)} style={{
                  padding: '0.4rem 1rem', borderRadius: 20, border: `2px solid ${typeFilter === t ? (meta?.color || 'var(--primary)') : 'transparent'}`,
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                  background: typeFilter === t ? (meta?.bg || 'var(--bg-secondary)') : 'var(--bg-secondary)',
                  color: typeFilter === t ? (meta?.color || 'var(--primary)') : 'var(--text-secondary)',
                }}>
                  {meta && <i className={`bi ${meta.icon} me-1`}></i>}{t === 'ALL' ? 'All' : meta?.label || t}
                </button>
              )
            })}
          </div>
          {filteredPlans.length === 0 ? (
            <div className="card-custom text-center py-5">
              <i className="bi bi-box-seam" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
              <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No plans available</h5>
            </div>
          ) : (
            <div className="row g-3">
              {filteredPlans.map(plan => {
                const meta = getTypeMeta(plan.type)
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
                        <span style={{ fontWeight: 700, color: meta.color }}>{(plan.premiumRate * 100).toFixed(1)}%/year</span>
                      </div>
                      {(plan.minPolicyTerm || plan.policyTerm) && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                          <i className="bi bi-clock me-1"></i>
                          Policy Term: {plan.minPolicyTerm && plan.policyTerm ? `${plan.minPolicyTerm} – ${plan.policyTerm} yrs` : plan.policyTerm ? `Up to ${plan.policyTerm} yrs` : `From ${plan.minPolicyTerm} yrs`}
                        </div>
                      )}
                      {plan.eligibility && (
                        <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.65rem', borderRadius: 8, background: 'rgba(255,255,255,0.6)', border: `1px solid ${meta.color}22` }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
                            <i className="bi bi-person-check me-1"></i>Eligibility
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{plan.eligibility}</div>
                        </div>
                      )}
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
            {/* Hero banner */}
            <div style={{
              borderRadius: '16px 16px 0 0',
              background: 'linear-gradient(135deg, ' + meta2.color + ' 0%, ' + meta2.color + 'bb 100%)',
              padding: '1.75rem 1.75rem 2.5rem',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* decorative circles */}
              <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ position: 'absolute', bottom: -20, right: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
                <div style={{ width: 54, height: 54, borderRadius: 14, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`bi ${meta2.icon}`} style={{ fontSize: '1.6rem', color: '#fff' }}></i>
                </div>
                <div className="flex-grow-1">
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{selectedPlan.type}</div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2 }}>{selectedPlan.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', marginTop: 3 }}>
                    {(selectedPlan.premiumRate * 100).toFixed(1)}% premium rate &nbsp;·&nbsp; {Number(selectedPlan.coverageMin).toLocaleString()} – {Number(selectedPlan.coverageMax).toLocaleString()} MMK
                  </div>
                </div>
                <button onClick={() => { setStep(1); setSelectedPlan(null) }} style={{
                  background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff', borderRadius: 8, padding: '0.35rem 0.75rem',
                  cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, backdropFilter: 'blur(4px)',
                  flexShrink: 0,
                }}>
                  <i className="bi bi-arrow-left me-1"></i>Change
                </button>
              </div>
            </div>

            {/* Form card — attached below hero */}
            <div className="card-custom" style={{ borderRadius: '0 0 16px 16px', marginTop: 0, borderTop: 'none', paddingTop: '1.5rem' }}>

              {/* Coverage & duration */}
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: meta2.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  <i className="bi bi-sliders me-1"></i>Coverage Details
                </div>
                <div className="row g-3">
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
              </div>

              {/* Dynamic form fields */}
              {templateLoading && (
                <div className="text-center py-3">
                  <span className="spinner-border spinner-border-sm me-2" style={{ color: meta2.color }}></span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading form fields...</span>
                </div>
              )}

              {!templateLoading && template && template.fields?.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.25rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: meta2.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                    <i className="bi bi-ui-checks me-1"></i>{template.name}
                  </div>
                  <DynamicFormFields
                    fields={template.fields.filter(f => !(f.fieldType === 'LABEL' && f.fieldLabel?.toLowerCase().includes('personal information')))}
                    fieldValues={fieldValues}
                    fieldFiles={fieldFiles}
                    onValue={handleFieldValue}
                    onFile={handleFieldFile}
                    onCheckboxOption={handleCheckboxOption}
                    user={user}
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

              {/* Digital Signature */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.75rem' }}>
                <div style={{ padding: '0.6rem 0.9rem', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: '0.75rem', fontSize: '0.82rem', color: '#1e40af' }}>
                  <i className="bi bi-pen me-2"></i>
                  <strong>Digital Signature</strong> — Insurance Application ကို တရားဝင်ဖြစ်စေသောအတွက် လက်မှတ်ရေးထိုးပါ
                </div>
                <DigitalSignatureCanvas
                  ref={signatureRef}
                  label="Applicant လက်မှတ်"
                  required
                  onChange={data => setSignatureData(data)}
                  height={160}
                />
              </div>

              <div className="d-flex gap-2 mt-4">
                <button
                  onClick={() => {
                    if (!signatureData) {
                      toast.error('လက်မှတ်ရေးထိုးပါ — Digital Signature လိုအပ်သည်')
                      return
                    }
                    setStep(3)
                  }}
                  className="btn-primary-custom flex-grow-1"
                  style={{ justifyContent: 'center', background: meta2.color, borderColor: meta2.color }}
                  disabled={templateLoading}
                >
                  Review Application →
                </button>
                <button onClick={() => { setStep(1); setSelectedPlan(null) }} className="btn-outline-custom">
                  Back
                </button>
              </div>
            </div>
          </div>

          {/* Side panel: agent card + premium estimate */}
          <div className="col-12 col-lg-4">
            <AgentProfileCard packageType={selectedPlan?.type} style={{ marginBottom: '1rem' }} />
            <div className="card-custom">
              <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Premium Estimate</h6>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
                {[
                  ['Plan', selectedPlan.name],
                  ['Type', selectedPlan.type],
                  ['Coverage', coverage ? Number(coverage).toLocaleString() + ' MMK' : '—'],
                  ['Duration', duration + ' year(s)'],
                  ['Rate', (selectedPlan.premiumRate * 100).toFixed(1) + '%/year'],
                  ...(selectedPlan.minPolicyTerm || selectedPlan.policyTerm ? [['Policy Term', selectedPlan.minPolicyTerm && selectedPlan.policyTerm ? `${selectedPlan.minPolicyTerm} – ${selectedPlan.policyTerm} yrs` : selectedPlan.policyTerm ? `Up to ${selectedPlan.policyTerm} yrs` : `From ${selectedPlan.minPolicyTerm} yrs`]] : []),
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
              {signatureData && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    <i className="bi bi-pen me-1"></i>Digital Signature
                  </div>
                  <img src={signatureData} alt="Signature" style={{ maxHeight: 80, border: '1px solid var(--border)', borderRadius: 8, background: '#fff', padding: 4 }} />
                  <div style={{ fontSize: '0.7rem', color: '#16a34a', marginTop: 4 }}>
                    <i className="bi bi-check-circle me-1"></i>လက်မှတ်ရေးထိုးပြီးပါပြီ
                  </div>
                </div>
              )}

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

function DynamicFormFields({ fields, fieldValues, fieldFiles, onValue, onFile, onCheckboxOption, user }) {
  if (!fields || fields.length === 0) return null
  return (
    <div className="d-flex flex-column gap-3">
      {fields.map(field => (
        <DynamicField key={field.id} field={field}
          value={fieldValues[String(field.id)]}
          file={fieldFiles[String(field.id)]}
          onValue={v => onValue(field.id, v)}
          onFile={f => onFile(field.id, f)}
          onCheckboxOption={(opt, checked) => onCheckboxOption(field.id, opt, checked)}
          user={user} />
      ))}
    </div>
  )
}

function DynamicField({ field, value, file, onValue, onFile, onCheckboxOption, user }) {
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

  const isAutoFilled = field.fieldType === 'NAME' || field.fieldType === 'EMAIL'

  let options = []
  if (field.fieldType === 'CHECKBOX' && field.fieldOptions) {
    try { options = JSON.parse(field.fieldOptions) } catch { options = ['Yes', 'No'] }
  }
  const selectedOptions = Array.isArray(value) ? value : []

  return (
    <div>
      <label className="form-label-custom">
        {field.fieldLabel}
        {isAutoFilled && (
          <span style={{ fontSize: '0.7rem', color: '#16a34a', marginLeft: 6, fontWeight: 400 }}>
            <i className="bi bi-lock-fill me-1"></i>ပရိုဖိုင်မှ အလိုလျှောက်ထည့်သည်
          </span>
        )}
      </label>
      {isAutoFilled && (
        <input className="form-control-custom w-100" value={value || ''}
          readOnly
          style={{ background: '#f0fdf4', borderColor: '#86efac', color: 'var(--text-primary)', cursor: 'not-allowed' }} />
      )}
      {field.fieldType === 'TEXT' && (
        <input className="form-control-custom w-100" value={value || ''}
          onChange={e => onValue(e.target.value)} />
      )}
      {field.fieldType === 'PHONE' && (
        <input type="tel" className="form-control-custom w-100" value={value || ''}
          placeholder="+95 9xxxxxxxx"
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
