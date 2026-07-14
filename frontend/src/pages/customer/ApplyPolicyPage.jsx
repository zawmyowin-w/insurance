import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { toast } from 'react-toastify'

const ALL_TYPES = ['LIFE', 'HEALTH', 'TRAVEL', 'MOTOR', 'EDUCATION', 'VEHICLE', 'PROPERTY']
const TYPE_META = {
  LIFE:      { color: '#dc2626', bg: '#fef2f2',  icon: 'bi-heart-pulse',  label: 'Life Insurance' },
  HEALTH:    { color: '#16a34a', bg: '#f0fdf4',  icon: 'bi-hospital',     label: 'Health Insurance' },
  TRAVEL:    { color: '#0891b2', bg: '#ecfeff',  icon: 'bi-airplane',     label: 'Travel Insurance' },
  MOTOR:     { color: '#d97706', bg: '#fffbeb',  icon: 'bi-car-front',    label: 'Motor Insurance' },
  EDUCATION: { color: '#7c3aed', bg: '#f5f3ff',  icon: 'bi-mortarboard',  label: 'Education Insurance' },
  VEHICLE:   { color: '#2563eb', bg: '#eff6ff',  icon: 'bi-truck',        label: 'Vehicle Insurance' },
  PROPERTY:  { color: '#ca8a04', bg: '#fefce8',  icon: 'bi-house-check',  label: 'Property Insurance' },
}

const STEPS = [
  { id: 1, title: 'Select Plan',    icon: 'bi-grid-3x3-gap' },
  { id: 2, title: 'Personal Info',  icon: 'bi-person-vcard' },
  { id: 3, title: 'Plan Details',   icon: 'bi-clipboard-data' },
  { id: 4, title: 'Risk & Premium', icon: 'bi-calculator' },
  { id: 5, title: 'Review',         icon: 'bi-check2-circle' },
]

const calcRisk = (type, com, ext) => {
  let s = 0
  if (com.dob) { const age = new Date().getFullYear() - new Date(com.dob).getFullYear(); if (age > 55) s += 3; else if (age > 40) s += 1 }
  if (type === 'LIFE') { if (ext.smoking) s += 2; if (ext.hasDisease) s += 2 }
  if (type === 'HEALTH' && ext.existingDiseases?.trim()) s += 2
  if ((type === 'MOTOR' || type === 'VEHICLE') && ext.vehicleYear) {
    const va = new Date().getFullYear() - parseInt(ext.vehicleYear)
    if (va > 10) s += 3; else if (va > 5) s += 1
  }
  return s <= 1 ? 'LOW' : s <= 3 ? 'MEDIUM' : 'HIGH'
}
const calcPremium = (cov, rate, dur, risk) => Math.round(cov * rate * dur * (risk === 'HIGH' ? 1.5 : risk === 'MEDIUM' ? 1.2 : 1.0))

const initCommon = { fullName: '', fatherName: '', nrc: '', dob: '', phone: '', email: '', address: '', occupation: '', maritalStatus: 'Single', monthlyIncome: '' }
const initExtra = { beneficiaryName: '', beneficiaryRelation: '', smoking: false, hasDisease: false, diseaseDetails: '', bloodType: '', existingDiseases: '', allergies: '', preferredHospital: '', passportNumber: '', destination: '', travelDate: '', returnDate: '', vehicleReg: '', engineNumber: '', chassisNumber: '', vehicleValue: '', drivingLicense: '', vehicleYear: '', studentName: '', studentDob: '', parentName: '', schoolName: '', educationGoal: '' }

export default function ApplyPolicyPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const preselectedId = location.state?.planId

  const [step, setStep] = useState(1)
  const [plans, setPlans] = useState([])
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [common, setCommon] = useState({ ...initCommon, fullName: user?.name || '', email: user?.email || '' })
  const [extra, setExtra] = useState(initExtra)
  const [coverage, setCoverage] = useState('')
  const [duration, setDuration] = useState(1)
  const [docs, setDocs] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get('/packages/public').then(res => {
      const pkgs = Array.isArray(res.data) ? res.data : []
      setPlans(pkgs)
      if (preselectedId) {
        const p = pkgs.find(x => x.id === Number(preselectedId))
        if (p) { setSelectedPlan(p); setCoverage(String(p.coverageMin || '')); setStep(2) }
      }
    }).catch(() => {})
  }, [])

  const risk    = selectedPlan ? calcRisk(selectedPlan.type, common, extra) : 'LOW'
  const premium = selectedPlan && coverage ? calcPremium(Number(coverage), selectedPlan.premiumRate, duration, risk) : null

  const setC = (k, v) => setCommon(c => ({ ...c, [k]: v }))
  const setE = (k, v) => setExtra(x => ({ ...x, [k]: v }))

  const selectPlan = (plan) => {
    setSelectedPlan(plan); setCoverage(String(plan.coverageMin || '')); setStep(2)
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('packageId', selectedPlan.id)
      fd.append('coverageAmount', Number(coverage))
      fd.append('duration', duration)
      fd.append('commonInfo', JSON.stringify(common))
      fd.append('extraInfo', JSON.stringify(extra))
      fd.append('notes', `Risk: ${risk} | Est. Premium: ${premium?.toLocaleString()} MMK`)
      docs.forEach(d => fd.append('documents', d))
      await api.post('/customer/applications', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Application submitted successfully!')
      navigate('/customer/applications')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally { setSubmitting(false) }
  }

  // ── UI helpers ──────────────────────────────────────────────────────
  const meta = selectedPlan ? (TYPE_META[selectedPlan.type] || { color: '#6b7280', bg: '#f3f4f6', icon: 'bi-shield', label: selectedPlan.type }) : null

  const StepProgress = () => (
    <div className="d-flex align-items-center justify-content-center mb-4 gap-0 flex-wrap">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.id}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: step > s.id ? 'pointer' : 'default' }}
               onClick={() => step > s.id && setStep(s.id)}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.2s', background: step === s.id ? 'var(--primary)' : step > s.id ? '#16a34a' : 'var(--bg-secondary)', color: step >= s.id ? '#fff' : 'var(--text-muted)' }}>
              {step > s.id ? <i className="bi bi-check2" style={{ fontSize: '1rem' }}></i> : s.id}
            </div>
            <span style={{ fontSize: '0.66rem', color: step === s.id ? 'var(--primary)' : 'var(--text-muted)', fontWeight: step === s.id ? 700 : 400, whiteSpace: 'nowrap' }}>{s.title}</span>
          </div>
          {i < STEPS.length - 1 && <div style={{ height: 2, flex: 1, minWidth: 20, maxWidth: 50, background: step > s.id + 1 ? '#16a34a' : step > s.id ? 'var(--primary)' : 'var(--border)', margin: '0 4px', marginBottom: 22, transition: 'background 0.2s' }}></div>}
        </React.Fragment>
      ))}
    </div>
  )

  const NavBtn = ({ back, next, nextLabel = 'Continue', disabled }) => (
    <div className="d-flex gap-2 mt-4">
      {back && <button type="button" onClick={back} className="btn-outline-custom"><i className="bi bi-arrow-left me-1"></i>Back</button>}
      <button type="button" onClick={next} disabled={disabled || submitting} className="btn-primary-custom flex-grow-1" style={{ justifyContent: 'center' }}>
        {submitting && <span className="spinner-border spinner-border-sm me-2"></span>}
        {nextLabel}<i className="bi bi-arrow-right ms-2"></i>
      </button>
    </div>
  )

  const Field = ({ label, value }) => (
    <div className="d-flex gap-2 mb-2" style={{ fontSize: '0.88rem' }}>
      <span style={{ color: 'var(--text-muted)', minWidth: 150, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  )

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Apply for Insurance</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Complete all steps to submit your application</p>
      </div>
      <StepProgress />

      {/* ── STEP 1: Select Plan ── */}
      {step === 1 && (
        <div className="fade-in">
          <div className="d-flex gap-2 mb-3 flex-wrap">
            {['ALL', ...ALL_TYPES].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '0.3rem 0.85rem', borderRadius: 99, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', background: typeFilter === t ? 'var(--primary)' : 'var(--bg-secondary)', color: typeFilter === t ? '#fff' : 'var(--text-secondary)' }}>
                {TYPE_META[t] && <i className={`bi ${TYPE_META[t].icon} me-1`}></i>}{t}
              </button>
            ))}
          </div>
          <div className="row g-3">
            {plans.filter(p => typeFilter === 'ALL' || p.type === typeFilter).map(plan => {
              const m = TYPE_META[plan.type] || { color: '#6b7280', bg: '#f3f4f6', icon: 'bi-shield', label: plan.type }
              return (
                <div key={plan.id} className="col-12 col-md-6 col-lg-4">
                  <div className="card-custom h-100" style={{ border: '2px solid var(--border)', cursor: 'pointer' }}
                       onMouseEnter={e => e.currentTarget.style.borderColor = m.color}
                       onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className={`bi ${m.icon}`} style={{ color: m.color, fontSize: '1.3rem' }}></i>
                      </div>
                      <div><div style={{ fontSize: '0.7rem', color: m.color, fontWeight: 700 }}>{m.label}</div><div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{plan.name}</div></div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{plan.description}</p>
                    <div className="row g-2 mb-3">
                      <div className="col-6"><div style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: '0.35rem 0.55rem' }}><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Premium Rate</div><div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.88rem' }}>{(plan.premiumRate * 100).toFixed(1)}%/yr</div></div></div>
                      <div className="col-6"><div style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: '0.35rem 0.55rem' }}><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Policy Term</div><div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{plan.policyTerm ? `≤${plan.policyTerm}yr` : 'Flexible'}</div></div></div>
                      <div className="col-12"><div style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: '0.35rem 0.55rem' }}><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Coverage (MMK)</div><div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{Number(plan.coverageMin).toLocaleString()} – {Number(plan.coverageMax).toLocaleString()}</div></div></div>
                    </div>
                    {(plan.benefits || []).slice(0, 3).map((b, i) => <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 3 }}><i className="bi bi-check-circle-fill me-1" style={{ color: '#16a34a' }}></i>{b}</div>)}
                    <button onClick={() => selectPlan(plan)} className="btn-primary-custom w-100 mt-3" style={{ justifyContent: 'center', background: m.color, borderColor: m.color, fontSize: '0.88rem' }}>
                      <i className="bi bi-check-circle me-2"></i>Select This Plan
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STEP 2: Personal Info ── */}
      {step === 2 && (
        <div className="fade-in">
          <div className="card-custom">
            {meta && (
              <div className="d-flex align-items-center gap-3 mb-4 p-3" style={{ background: meta.bg, borderRadius: 10 }}>
                <i className={`bi ${meta.icon}`} style={{ color: meta.color, fontSize: '1.3rem' }}></i>
                <div style={{ fontWeight: 700, color: meta.color }}>{selectedPlan.name}</div>
                <button onClick={() => setStep(1)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}><i className="bi bi-arrow-left me-1"></i>Change</button>
              </div>
            )}
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Personal Information (Required for all plans)</h6>
            <div className="row g-3">
              <div className="col-12 col-md-6"><label className="form-label-custom">Full Name *</label><input required className="form-control-custom w-100" placeholder="As per NRC card" value={common.fullName} onChange={e => setC('fullName', e.target.value)} /></div>
              <div className="col-12 col-md-6"><label className="form-label-custom">Father's Name *</label><input required className="form-control-custom w-100" value={common.fatherName} onChange={e => setC('fatherName', e.target.value)} /></div>
              <div className="col-12 col-md-6"><label className="form-label-custom">NRC Number *</label><input required className="form-control-custom w-100" placeholder="12/KAKANA(N)123456" value={common.nrc} onChange={e => setC('nrc', e.target.value)} /></div>
              <div className="col-12 col-md-6"><label className="form-label-custom">Date of Birth *</label><input required type="date" className="form-control-custom w-100" value={common.dob} onChange={e => setC('dob', e.target.value)} max={new Date().toISOString().split('T')[0]} /></div>
              <div className="col-12 col-md-6"><label className="form-label-custom">Phone Number *</label><input required className="form-control-custom w-100" placeholder="09xxxxxxxxx" value={common.phone} onChange={e => setC('phone', e.target.value)} /></div>
              <div className="col-12 col-md-6"><label className="form-label-custom">Email Address</label><input type="email" className="form-control-custom w-100" value={common.email} onChange={e => setC('email', e.target.value)} /></div>
              <div className="col-12"><label className="form-label-custom">Home Address *</label><textarea rows={2} className="form-control-custom w-100" style={{ resize: 'vertical' }} placeholder="Township, City, State/Division" value={common.address} onChange={e => setC('address', e.target.value)} /></div>
              <div className="col-12 col-md-4"><label className="form-label-custom">Occupation *</label><input required className="form-control-custom w-100" placeholder="e.g. Engineer, Teacher, Driver" value={common.occupation} onChange={e => setC('occupation', e.target.value)} /></div>
              <div className="col-12 col-md-4"><label className="form-label-custom">Marital Status</label><select className="form-select-custom w-100" value={common.maritalStatus} onChange={e => setC('maritalStatus', e.target.value)}>{['Single', 'Married', 'Divorced', 'Widowed'].map(m => <option key={m}>{m}</option>)}</select></div>
              <div className="col-12 col-md-4"><label className="form-label-custom">Monthly Income (MMK) *</label><input required type="number" className="form-control-custom w-100" placeholder="300000" value={common.monthlyIncome} onChange={e => setC('monthlyIncome', e.target.value)} /></div>
            </div>
            <NavBtn back={() => setStep(1)} next={() => {
              if (!common.fullName || !common.nrc || !common.dob || !common.phone || !common.address || !common.occupation || !common.monthlyIncome) { toast.error('Please fill all required fields'); return }
              setStep(3)
            }} />
          </div>
        </div>
      )}

      {/* ── STEP 3: Plan-Specific Info + Coverage ── */}
      {step === 3 && selectedPlan && (
        <div className="fade-in">
          <div className="card-custom">
            <h6 style={{ fontWeight: 700, color: meta?.color || 'var(--text-primary)', marginBottom: '1rem' }}>
              <i className={`bi ${meta?.icon} me-2`}></i>{selectedPlan.type} — Additional Details
            </h6>
            <div className="row g-3">
              {/* LIFE */}
              {selectedPlan.type === 'LIFE' && <>
                <div className="col-12 col-md-6"><label className="form-label-custom">Beneficiary Name *</label><input required className="form-control-custom w-100" value={extra.beneficiaryName} onChange={e => setE('beneficiaryName', e.target.value)} /></div>
                <div className="col-12 col-md-6"><label className="form-label-custom">Relationship *</label><select required className="form-select-custom w-100" value={extra.beneficiaryRelation} onChange={e => setE('beneficiaryRelation', e.target.value)}><option value="">Select...</option>{['Spouse','Child','Parent','Sibling','Other'].map(r=><option key={r}>{r}</option>)}</select></div>
                <div className="col-12 col-md-6"><label className="form-label-custom">Do you smoke?</label><select className="form-select-custom w-100" value={extra.smoking?'yes':'no'} onChange={e => setE('smoking', e.target.value==='yes')}><option value="no">No</option><option value="yes">Yes</option></select></div>
                <div className="col-12 col-md-6"><label className="form-label-custom">Existing diseases?</label><select className="form-select-custom w-100" value={extra.hasDisease?'yes':'no'} onChange={e => setE('hasDisease', e.target.value==='yes')}><option value="no">No</option><option value="yes">Yes</option></select></div>
                {extra.hasDisease && <div className="col-12"><label className="form-label-custom">Disease Details</label><textarea rows={2} className="form-control-custom w-100" style={{resize:'vertical'}} value={extra.diseaseDetails} onChange={e => setE('diseaseDetails', e.target.value)} placeholder="Describe existing conditions..." /></div>}
              </>}
              {/* HEALTH */}
              {selectedPlan.type === 'HEALTH' && <>
                <div className="col-12 col-md-4"><label className="form-label-custom">Blood Type</label><select className="form-select-custom w-100" value={extra.bloodType} onChange={e => setE('bloodType', e.target.value)}><option value="">Unknown</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t=><option key={t}>{t}</option>)}</select></div>
                <div className="col-12 col-md-8"><label className="form-label-custom">Existing Diseases / Medical Conditions</label><input className="form-control-custom w-100" placeholder="e.g. Diabetes, Hypertension (or none)" value={extra.existingDiseases} onChange={e => setE('existingDiseases', e.target.value)} /></div>
                <div className="col-12 col-md-6"><label className="form-label-custom">Allergies</label><input className="form-control-custom w-100" placeholder="e.g. Penicillin (or none)" value={extra.allergies} onChange={e => setE('allergies', e.target.value)} /></div>
                <div className="col-12 col-md-6"><label className="form-label-custom">Preferred Hospital</label><input className="form-control-custom w-100" placeholder="e.g. Yangon General Hospital" value={extra.preferredHospital} onChange={e => setE('preferredHospital', e.target.value)} /></div>
              </>}
              {/* TRAVEL */}
              {selectedPlan.type === 'TRAVEL' && <>
                <div className="col-12 col-md-6"><label className="form-label-custom">Passport Number *</label><input required className="form-control-custom w-100" placeholder="e.g. AB1234567" value={extra.passportNumber} onChange={e => setE('passportNumber', e.target.value)} /></div>
                <div className="col-12 col-md-6"><label className="form-label-custom">Destination Country *</label><input required className="form-control-custom w-100" placeholder="e.g. Thailand, Japan, USA" value={extra.destination} onChange={e => setE('destination', e.target.value)} /></div>
                <div className="col-12 col-md-6"><label className="form-label-custom">Travel Start Date *</label><input required type="date" className="form-control-custom w-100" value={extra.travelDate} onChange={e => setE('travelDate', e.target.value)} /></div>
                <div className="col-12 col-md-6"><label className="form-label-custom">Return Date *</label><input required type="date" className="form-control-custom w-100" value={extra.returnDate} onChange={e => setE('returnDate', e.target.value)} /></div>
              </>}
              {/* MOTOR / VEHICLE */}
              {(selectedPlan.type === 'MOTOR' || selectedPlan.type === 'VEHICLE') && <>
                <div className="col-12 col-md-6"><label className="form-label-custom">Vehicle Registration No. *</label><input required className="form-control-custom w-100" value={extra.vehicleReg} onChange={e => setE('vehicleReg', e.target.value)} /></div>
                <div className="col-12 col-md-6"><label className="form-label-custom">Vehicle Year *</label><input required type="number" className="form-control-custom w-100" placeholder="e.g. 2018" min="1990" max={new Date().getFullYear()} value={extra.vehicleYear} onChange={e => setE('vehicleYear', e.target.value)} /></div>
                <div className="col-12 col-md-6"><label className="form-label-custom">Engine Number *</label><input required className="form-control-custom w-100" value={extra.engineNumber} onChange={e => setE('engineNumber', e.target.value)} /></div>
                <div className="col-12 col-md-6"><label className="form-label-custom">Chassis Number *</label><input required className="form-control-custom w-100" value={extra.chassisNumber} onChange={e => setE('chassisNumber', e.target.value)} /></div>
                <div className="col-12 col-md-6"><label className="form-label-custom">Vehicle Value (MMK) *</label><input required type="number" className="form-control-custom w-100" value={extra.vehicleValue} onChange={e => setE('vehicleValue', e.target.value)} /></div>
                <div className="col-12 col-md-6"><label className="form-label-custom">Driving License No. *</label><input required className="form-control-custom w-100" value={extra.drivingLicense} onChange={e => setE('drivingLicense', e.target.value)} /></div>
              </>}
              {/* EDUCATION */}
              {selectedPlan.type === 'EDUCATION' && <>
                <div className="col-12 col-md-6"><label className="form-label-custom">Student Full Name *</label><input required className="form-control-custom w-100" value={extra.studentName} onChange={e => setE('studentName', e.target.value)} /></div>
                <div className="col-12 col-md-6"><label className="form-label-custom">Student Date of Birth *</label><input required type="date" className="form-control-custom w-100" value={extra.studentDob} onChange={e => setE('studentDob', e.target.value)} /></div>
                <div className="col-12 col-md-6"><label className="form-label-custom">Parent / Guardian Name *</label><input required className="form-control-custom w-100" value={extra.parentName} onChange={e => setE('parentName', e.target.value)} /></div>
                <div className="col-12 col-md-6"><label className="form-label-custom">School / University *</label><input required className="form-control-custom w-100" value={extra.schoolName} onChange={e => setE('schoolName', e.target.value)} /></div>
                <div className="col-12"><label className="form-label-custom">Education Goal</label><input className="form-control-custom w-100" placeholder="e.g. Complete Bachelor's by 2028" value={extra.educationGoal} onChange={e => setE('educationGoal', e.target.value)} /></div>
              </>}
              {selectedPlan.type === 'PROPERTY' && (
                <div className="col-12"><div className="p-3" style={{ background: 'var(--bg-secondary)', borderRadius: 8, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Property details will be collected by your assigned agent during verification. Please proceed to the next step.</div></div>
              )}
            </div>

            {/* Coverage & Duration */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1.25rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Coverage & Duration</div>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Coverage Amount (MMK) *</label>
                  <input required type="number" className="form-control-custom w-100" value={coverage} min={selectedPlan.coverageMin} max={selectedPlan.coverageMax} step={500000} onChange={e => setCoverage(e.target.value)} />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Range: {Number(selectedPlan.coverageMin).toLocaleString()} – {Number(selectedPlan.coverageMax).toLocaleString()} MMK</small>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Policy Duration (Years) *</label>
                  <select className="form-select-custom w-100" value={duration} onChange={e => setDuration(Number(e.target.value))}>
                    {(selectedPlan.durations || [1, 2, 3, 5]).map(d => <option key={d} value={d}>{d} Year{d > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <NavBtn back={() => setStep(2)} next={() => { if (!coverage) { toast.error('Enter coverage amount'); return } setStep(4) }} />
          </div>
        </div>
      )}

      {/* ── STEP 4: Risk & Premium ── */}
      {step === 4 && selectedPlan && (
        <div className="fade-in">
          <div className="card-custom">
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Risk Assessment & Premium Calculation</h6>
            <div className="row g-3 mb-4">
              {['LOW', 'MEDIUM', 'HIGH'].map(r => {
                const rc = r === 'LOW' ? '#16a34a' : r === 'MEDIUM' ? '#d97706' : '#dc2626'
                const rb = r === 'LOW' ? '#f0fdf4' : r === 'MEDIUM' ? '#fffbeb' : '#fef2f2'
                const ri = r === 'LOW' ? 'bi-shield-check' : r === 'MEDIUM' ? 'bi-shield-exclamation' : 'bi-shield-x'
                return (
                  <div key={r} className="col-4">
                    <div style={{ padding: '1rem', borderRadius: 12, textAlign: 'center', border: `2.5px solid ${risk === r ? rc : 'var(--border)'}`, background: risk === r ? rb : 'var(--bg-secondary)', opacity: risk === r ? 1 : 0.45, transition: 'all 0.2s' }}>
                      <i className={`bi ${ri}`} style={{ fontSize: '1.5rem', color: rc }}></i>
                      <div style={{ fontWeight: 800, color: rc, marginTop: 4, fontSize: '0.88rem' }}>{r}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{r === 'LOW' ? '1.0×' : r === 'MEDIUM' ? '1.2×' : '1.5×'} rate</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mb-4 p-3" style={{ background: 'var(--bg-secondary)', borderRadius: 8, fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
              <strong>Risk factors:</strong> Age, {selectedPlan.type === 'LIFE' ? 'smoking status, existing diseases' : selectedPlan.type === 'HEALTH' ? 'medical history' : selectedPlan.type === 'MOTOR' || selectedPlan.type === 'VEHICLE' ? 'vehicle age & value' : selectedPlan.type === 'TRAVEL' ? 'travel destination' : 'general profile'}
            </div>
            <div className="premium-result mb-4">
              <div className="premium-result-label">Estimated Total Premium</div>
              <div className="premium-result-amount">{premium ? premium.toLocaleString() : '—'} <span style={{ fontSize: '1rem' }}>MMK</span></div>
              <div style={{ fontSize: '0.82rem', opacity: 0.8, marginTop: 4 }}>
                Coverage: {Number(coverage).toLocaleString()} MMK · {duration} yr{duration > 1 ? 's' : ''} · {(selectedPlan.premiumRate * 100).toFixed(1)}% × {risk === 'HIGH' ? '1.5×' : risk === 'MEDIUM' ? '1.2×' : '1.0×'}
              </div>
            </div>
            <NavBtn back={() => setStep(3)} next={() => setStep(5)} nextLabel="Proceed to Review" />
          </div>
        </div>
      )}

      {/* ── STEP 5: Review & Submit ── */}
      {step === 5 && selectedPlan && (
        <div className="fade-in">
          <div className="card-custom">
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Review Your Application</h6>
            <div className="mb-4">
              <div style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Plan Details</div>
              <Field label="Plan" value={selectedPlan.name} />
              <Field label="Type" value={selectedPlan.type} />
              <Field label="Coverage Amount" value={`${Number(coverage).toLocaleString()} MMK`} />
              <Field label="Duration" value={`${duration} year${duration > 1 ? 's' : ''}`} />
              <Field label="Risk Level" value={risk} />
              <Field label="Estimated Premium" value={premium ? `${premium.toLocaleString()} MMK` : '—'} />
            </div>
            <div className="mb-4" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Personal Info</div>
              <Field label="Full Name" value={common.fullName} />
              <Field label="NRC" value={common.nrc} />
              <Field label="Date of Birth" value={common.dob} />
              <Field label="Phone" value={common.phone} />
              <Field label="Occupation" value={common.occupation} />
              <Field label="Monthly Income" value={common.monthlyIncome ? `${Number(common.monthlyIncome).toLocaleString()} MMK` : ''} />
            </div>
            <div className="mb-4" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Supporting Documents</div>
              <label className="form-label-custom">Upload ID Card Photo / Proof Documents</label>
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="form-control-custom w-100"
                onChange={e => setDocs(Array.from(e.target.files))} />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                Your assigned agent will review these documents. (PDF, JPG, PNG, WEBP){docs.length > 0 ? ` — ${docs.length} file(s) selected` : ''}
              </small>
            </div>
            <div className="p-3 mb-4" style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 10, fontSize: '0.85rem', color: '#92400e' }}>
              <i className="bi bi-info-circle me-2"></i>
              After submission, an agent will review your application and forward to admin for approval. Final premium may be adjusted after document verification.
            </div>
            <div className="d-flex gap-2">
              <button type="button" onClick={() => setStep(4)} className="btn-outline-custom"><i className="bi bi-arrow-left me-2"></i>Back</button>
              <button type="button" onClick={submit} disabled={submitting} className="btn-primary-custom flex-grow-1" style={{ justifyContent: 'center', background: '#16a34a', borderColor: '#16a34a' }}>
                {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-send me-2"></i>}
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
