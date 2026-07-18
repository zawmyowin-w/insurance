import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import { toast } from 'react-toastify'

const PAYMENT_FREQ_OPTIONS = [
  { value: 'MONTHLY',     label: 'တစ်လတစ်ကြိမ် (Monthly)',       months: 1  },
  { value: 'QUARTERLY',   label: 'သုံးလတစ်ကြိမ် (Quarterly)',     months: 3  },
  { value: 'HALF_YEARLY', label: 'ခြောက်လတစ်ကြိမ် (Half-Yearly)', months: 6  },
  { value: 'YEARLY',      label: 'တစ်နှစ်တစ်ကြိမ် (Yearly)',      months: 12 },
]

const EMPTY = {
  name: '',
  type: '',
  description: '',
  coverageMin: '',
  coverageMax: '',
  maxClaimAmount: '',
  durationTiers: [{ years: 1, premiumRate: '' }],
  paymentFrequency: 'MONTHLY',
  paymentIntervalMonths: 1,
  benefitsList: [''],
  requiredDocuments: [''],
  eligibility: '',
  exclusions: '',
  termsAndConditions: '',
  beneficiaryInfo: '',
  active: true,
}

function fmt(n) {
  const num = parseFloat(n)
  if (!num || isNaN(num)) return '—'
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function calcPremium(coverage, rate, paymentIntervalMonths) {
  if (!coverage || !rate) return null
  const annual = parseFloat(coverage) * parseFloat(rate)
  const perPayment = annual / (12 / paymentIntervalMonths)
  return { annual, perPayment }
}

export default function ManagePackagesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromDashboard = searchParams.get('action') === 'new'
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(fromDashboard)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [pkgForms, setPkgForms] = useState({})
  const [insuranceTypes, setInsuranceTypes] = useState([])
  const [openSection, setOpenSection] = useState('basic')
  const [detailPkg, setDetailPkg] = useState(null)
  const [termsModal, setTermsModal] = useState(null)

  const fetchInsuranceTypes = () => {
    api.get('/admin/insurance-types')
      .then(res => {
        const names = Array.isArray(res.data) ? res.data.map(t => t.name) : []
        setInsuranceTypes(names.length > 0 ? names : ['LIFE', 'HEALTH', 'VEHICLE', 'PROPERTY'])
      })
      .catch(() => setInsuranceTypes(['LIFE', 'HEALTH', 'VEHICLE', 'PROPERTY']))
  }

  const fetchPackages = () => {
    api.get('/admin/packages')
      .then(res => {
        const pkgs = Array.isArray(res.data) ? res.data : []
        setPackages(pkgs)
        pkgs.forEach(pkg => {
          api.get(`/admin/packages/${pkg.id}/forms`)
            .then(r => {
              const forms = Array.isArray(r.data) ? r.data : []
              setPkgForms(prev => ({
                ...prev,
                [pkg.id]: {
                  APPLICATION: forms.find(f => f.formType === 'APPLICATION') || null,
                  CLAIM: forms.find(f => f.formType === 'CLAIM') || null,
                }
              }))
            }).catch(() => {})
        })
      }).catch(() => setPackages([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchInsuranceTypes(); fetchPackages() }, [])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  // Benefits
  const handleBenefitChange = (i, v) => setForm(f => { const l = [...f.benefitsList]; l[i] = v; return { ...f, benefitsList: l } })
  const addBenefit = () => setForm(f => ({ ...f, benefitsList: [...f.benefitsList, ''] }))
  const removeBenefit = i => setForm(f => ({ ...f, benefitsList: f.benefitsList.length > 1 ? f.benefitsList.filter((_, idx) => idx !== i) : [''] }))

  // Required Documents
  const handleDocChange = (i, v) => setForm(f => { const l = [...f.requiredDocuments]; l[i] = v; return { ...f, requiredDocuments: l } })
  const addDoc = () => setForm(f => ({ ...f, requiredDocuments: [...f.requiredDocuments, ''] }))
  const removeDoc = i => setForm(f => ({ ...f, requiredDocuments: f.requiredDocuments.length > 1 ? f.requiredDocuments.filter((_, idx) => idx !== i) : [''] }))

  // Duration Tiers
  const handleTierChange = (i, field, v) => setForm(f => { const t = [...f.durationTiers]; t[i] = { ...t[i], [field]: v }; return { ...f, durationTiers: t } })
  const addTier = () => setForm(f => ({ ...f, durationTiers: [...f.durationTiers, { years: '', premiumRate: '' }] }))
  const removeTier = i => setForm(f => ({ ...f, durationTiers: f.durationTiers.length > 1 ? f.durationTiers.filter((_, idx) => idx !== i) : f.durationTiers }))

  const handlePaymentFreq = e => {
    const freq = e.target.value
    const opt = PAYMENT_FREQ_OPTIONS.find(o => o.value === freq)
    setForm(f => ({ ...f, paymentFrequency: freq, paymentIntervalMonths: opt ? opt.months : 1 }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const validTiers = form.durationTiers
        .filter(t => t.years && t.premiumRate)
        .map(t => ({ years: Number(t.years), premiumRate: Number(t.premiumRate) }))

      if (validTiers.length === 0) {
        toast.error('အနည်းဆုံး Duration Tier တစ်ခုထည့်ပါ')
        setSaving(false)
        return
      }

      const payload = {
        name: form.name,
        type: form.type,
        description: form.description,
        coverageMin: Number(form.coverageMin),
        coverageMax: Number(form.coverageMax),
        maxClaimAmount: form.maxClaimAmount ? Number(form.maxClaimAmount) : null,
        durationTiers: validTiers,
        paymentFrequency: form.paymentFrequency,
        paymentIntervalMonths: Number(form.paymentIntervalMonths),
        benefits: form.benefitsList.map(b => b.trim()).filter(Boolean),
        requiredDocuments: form.requiredDocuments.map(d => d.trim()).filter(Boolean),
        eligibility: form.eligibility || null,
        exclusions: form.exclusions || null,
        termsAndConditions: form.termsAndConditions || null,
        beneficiaryInfo: form.beneficiaryInfo || null,
        active: form.active,
      }

      if (editing) {
        await api.put(`/admin/packages/${editing}`, payload)
        toast.success('Package updated')
      } else {
        await api.post('/admin/packages', payload)
        toast.success('Package created')
      }
      setShowForm(false); setEditing(null); setForm(EMPTY); fetchPackages()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleEdit = pkg => {
    setEditing(pkg.id)
    const tiers = Array.isArray(pkg.durationTiers) && pkg.durationTiers.length > 0
      ? pkg.durationTiers.map(t => ({ years: t.years, premiumRate: t.premiumRate }))
      : (pkg.durations || [1]).map(y => ({ years: y, premiumRate: pkg.premiumRate || '' }))
    const freqOpt = PAYMENT_FREQ_OPTIONS.find(o => o.value === pkg.paymentFrequency)
    setForm({
      name: pkg.name || '',
      type: pkg.type || '',
      description: pkg.description || '',
      coverageMin: pkg.coverageMin || '',
      coverageMax: pkg.coverageMax || '',
      maxClaimAmount: pkg.maxClaimAmount || '',
      durationTiers: tiers,
      paymentFrequency: pkg.paymentFrequency || 'MONTHLY',
      paymentIntervalMonths: pkg.paymentIntervalMonths || (freqOpt?.months ?? 1),
      benefitsList: (pkg.benefits || []).length ? pkg.benefits : [''],
      requiredDocuments: (pkg.requiredDocuments || []).length ? pkg.requiredDocuments : [''],
      eligibility: pkg.eligibility || '',
      exclusions: pkg.exclusions || '',
      termsAndConditions: pkg.termsAndConditions || '',
      beneficiaryInfo: pkg.beneficiaryInfo || '',
      active: pkg.active !== false,
    })
    setShowForm(true)
    setOpenSection('basic')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggle = async (id, active) => {
    try {
      await api.put(`/admin/packages/${id}/toggle`, { active: !active })
      toast.success(active ? 'Deactivated' : 'Activated')
      fetchPackages()
    } catch { toast.error('Failed') }
  }

  const handleDelete = async id => {
    if (!window.confirm('ဤ Package ကို ဖျက်မည်လား? ဒီလုပ်ဆောင်ချက်ကို ပြန်မလုပ်နိုင်ပါ။')) return
    try { await api.delete(`/admin/packages/${id}`); toast.success('Deleted'); fetchPackages() } catch { toast.error('Failed') }
  }

  const midCoverage = form.coverageMin && form.coverageMax
    ? (Number(form.coverageMin) + Number(form.coverageMax)) / 2 : null

  const SectionHeader = ({ id, icon, label, badge }) => (
    <button type="button" onClick={() => setOpenSection(openSection === id ? null : id)}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.85rem 1rem', background: openSection === id ? 'var(--bg-secondary)' : 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', borderRadius: openSection === id ? '10px 10px 0 0' : 8, textAlign: 'left' }}>
      <i className={`bi ${icon}`} style={{ color: 'var(--primary)', fontSize: '1rem' }}></i>
      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem', flex: 1 }}>{label}</span>
      {badge && <span style={{ fontSize: '0.72rem', background: 'var(--primary)', color: '#fff', borderRadius: 99, padding: '0.1rem 0.5rem', fontWeight: 700 }}>{badge}</span>}
      <i className={`bi bi-chevron-${openSection === id ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}></i>
    </button>
  )

  const freqLabel = PAYMENT_FREQ_OPTIONS.find(o => o.value === form.paymentFrequency)?.label || ''

  return (
    <div className="fade-in">
      {/* Terms Modal */}
      {termsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setTermsModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-primary)', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className="bi bi-file-earmark-text" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Terms & Conditions</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{termsModal.name}</div>
              </div>
              <button onClick={() => setTermsModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}><i className="bi bi-x-lg"></i></button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', whiteSpace: 'pre-wrap', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              {termsModal.termsAndConditions || 'Terms and Conditions မထည့်ထားသေးပါ။'}
            </div>
          </div>
        </div>
      )}

      {/* Package Detail Modal */}
      {detailPkg && (
        <PackageDetailModal pkg={detailPkg} onClose={() => setDetailPkg(null)} onEdit={() => { handleEdit(detailPkg); setDetailPkg(null) }} />
      )}

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Insurance Packages</h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Insurance Plan များ ဖန်တီးစီမံပါ</p>
        </div>
        <button className="btn-primary-custom" style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }} onClick={() => {
          if (showForm) { setShowForm(false); setEditing(null); setForm({ ...EMPTY }); return }
          setEditing(null); setForm({ ...EMPTY }); setShowForm(true); setOpenSection('basic')
        }}>
          <i className={`bi bi-${showForm ? 'arrow-left' : 'plus-circle'} me-1`}></i>
          {showForm ? 'Back' : 'New Package'}
        </button>
      </div>

      {/* ── FORM ── */}
      {showForm && (
        <div className="card-custom mb-4 fade-in" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '2px solid var(--primary)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className={`bi bi-${editing ? 'pencil-square' : 'plus-circle-fill'}`} style={{ color: 'var(--primary)', fontSize: '1.1rem' }}></i>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{editing ? 'Package Edit လုပ်ရန်' : 'Package အသစ်ဖန်တီးရန်'}</span>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
            <div className="d-flex flex-column gap-2">

              {/* ①  Basic Info */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <SectionHeader id="basic" icon="bi-info-circle" label="① Basic Information" />
                {openSection === 'basic' && (
                  <div className="row g-3" style={{ padding: '1rem' }}>
                    <div className="col-12 col-md-6">
                      <label className="form-label-custom">Package Name *</label>
                      <input name="name" required className="form-control-custom w-100" placeholder="e.g. Premium Life Cover" value={form.name} onChange={handleChange} />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label-custom">Insurance Type *</label>
                      <select name="type" required className="form-select-custom w-100" value={form.type} onChange={handleChange}>
                        <option value="">— ရွေးချယ်ပါ —</option>
                        {insuranceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                        <a href="/admin/insurance-types" style={{ color: 'var(--primary)' }}>Insurance Types</a> တွင် type အသစ်ထည့်နိုင်သည်
                      </p>
                    </div>
                    <div className="col-12 col-md-2">
                      <label className="form-label-custom">Status</label>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <input type="checkbox" name="active" checked={form.active} onChange={handleChange} id="pkgActive" />
                        <label htmlFor="pkgActive" style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>Active</label>
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label-custom">Description</label>
                      <textarea name="description" rows={2} className="form-control-custom w-100" style={{ resize: 'vertical' }} placeholder="Plan အကြောင်း အနှစ်ချုပ်ဖော်ပြပါ" value={form.description} onChange={handleChange} />
                    </div>
                  </div>
                )}
              </div>

              {/* ② Coverage & Claim */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <SectionHeader id="coverage" icon="bi-shield-check" label="② Coverage & Claim Limit" />
                {openSection === 'coverage' && (
                  <div className="row g-3" style={{ padding: '1rem' }}>
                    <div className="col-12 col-md-4">
                      <label className="form-label-custom">Coverage Min (MMK) *</label>
                      <input name="coverageMin" type="number" required min="0" className="form-control-custom w-100" placeholder="e.g. 1000000" value={form.coverageMin} onChange={handleChange} />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label-custom">Coverage Max (MMK) *</label>
                      <input name="coverageMax" type="number" required min="0" className="form-control-custom w-100" placeholder="e.g. 100000000" value={form.coverageMax} onChange={handleChange} />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label-custom">Max Claimable Amount (MMK)</label>
                      <input name="maxClaimAmount" type="number" min="0" className="form-control-custom w-100" placeholder="အများဆုံး တောင်းဆိုနိုင်သောပမာဏ" value={form.maxClaimAmount} onChange={handleChange} />
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>ဤပမာဏထက်ပို၍ claim တောင်းဆိုခွင့်မရှိ</p>
                    </div>
                    {form.coverageMin && form.coverageMax && (
                      <div className="col-12">
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <i className="bi bi-calculator me-1" style={{ color: 'var(--primary)' }}></i>
                          Coverage Range: <strong style={{ color: 'var(--text-primary)' }}>MMK {fmt(form.coverageMin)} – {fmt(form.coverageMax)}</strong>
                          &nbsp;&nbsp;|&nbsp;&nbsp;Midpoint: <strong style={{ color: 'var(--primary)' }}>MMK {fmt(midCoverage)}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ③ Duration Tiers */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <SectionHeader id="tiers" icon="bi-calendar3" label="③ Duration & Premium Tiers" badge={`${form.durationTiers.filter(t => t.years && t.premiumRate).length} tier`} />
                {openSection === 'tiers' && (
                  <div style={{ padding: '1rem' }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      <i className="bi bi-info-circle me-1"></i>
                      နှစ်အမျိုးမျိုးအတွက် premium rate သတ်မှတ်ပါ။ နှစ်ရှည် plan များကို ငွေကြေး ပိုသက်သာသည့် rate ပေးနိုင်သည်။
                    </p>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-secondary)' }}>
                            <th style={thStyle}>Duration (နှစ်)</th>
                            <th style={thStyle}>Premium Rate (%) / year</th>
                            {midCoverage && <th style={thStyle}>Annual Premium* (MMK)</th>}
                            {midCoverage && <th style={thStyle}>{freqLabel} Premium* (MMK)</th>}
                            <th style={{ ...thStyle, width: 40 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.durationTiers.map((tier, i) => {
                            const calc = midCoverage && tier.premiumRate ? calcPremium(midCoverage, tier.premiumRate, form.paymentIntervalMonths) : null
                            return (
                              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={tdStyle}>
                                  <div className="d-flex align-items-center gap-2">
                                    <input type="number" min="1" max="40" className="form-control-custom"
                                      style={{ width: 80 }} placeholder="e.g. 1" value={tier.years}
                                      onChange={e => handleTierChange(i, 'years', e.target.value)} />
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>နှစ်</span>
                                  </div>
                                </td>
                                <td style={tdStyle}>
                                  <div className="d-flex align-items-center gap-2">
                                    <input type="number" min="0" max="100" step="0.001" className="form-control-custom"
                                      style={{ width: 100 }} placeholder="e.g. 2.5" value={tier.premiumRate}
                                      onChange={e => handleTierChange(i, 'premiumRate', e.target.value)} />
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>%</span>
                                  </div>
                                </td>
                                {midCoverage && (
                                  <td style={tdStyle}>
                                    <span style={{ color: calc ? 'var(--primary)' : 'var(--text-muted)', fontWeight: calc ? 700 : 400 }}>
                                      {calc ? fmt(calc.annual) : '—'}
                                    </span>
                                  </td>
                                )}
                                {midCoverage && (
                                  <td style={tdStyle}>
                                    <span style={{ color: calc ? '#16a34a' : 'var(--text-muted)', fontWeight: calc ? 700 : 400 }}>
                                      {calc ? fmt(calc.perPayment) : '—'}
                                    </span>
                                  </td>
                                )}
                                <td style={tdStyle}>
                                  <button type="button" onClick={() => removeTier(i)} disabled={form.durationTiers.length <= 1}
                                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: form.durationTiers.length <= 1 ? 'not-allowed' : 'pointer', opacity: form.durationTiers.length <= 1 ? 0.3 : 1 }}>
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <button type="button" onClick={addTier} style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--primary)', background: 'none', border: '1.5px dashed var(--primary)', borderRadius: 8, padding: '0.35rem 0.9rem', cursor: 'pointer', fontWeight: 600 }}>
                      <i className="bi bi-plus me-1"></i>Duration Tier ထပ်ထည့်မည်
                    </button>
                    {midCoverage && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>* Coverage midpoint (MMK {fmt(midCoverage)}) အသုံးပြု၍ တွက်ချက်ထားသော ဥပမာ</p>}
                  </div>
                )}
              </div>

              {/* ④ Payment Schedule */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <SectionHeader id="payment" icon="bi-credit-card" label="④ Payment Schedule" badge={freqLabel.split('(')[0].trim()} />
                {openSection === 'payment' && (
                  <div className="row g-3" style={{ padding: '1rem' }}>
                    <div className="col-12 col-md-6">
                      <label className="form-label-custom">Payment Frequency *</label>
                      <select className="form-select-custom w-100" value={form.paymentFrequency} onChange={handlePaymentFreq}>
                        {PAYMENT_FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                        Customer များ premium ပေးသွင်းရမည့် အကြိမ်နှုန်း
                      </p>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label-custom">Payment Info</label>
                      <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <i className="bi bi-calendar-check me-2" style={{ color: 'var(--primary)' }}></i>
                        <strong style={{ color: 'var(--text-primary)' }}>လ {form.paymentIntervalMonths} လတစ်ကြိမ်</strong> premium ပေးသွင်းရမည်
                        {midCoverage && form.durationTiers[0]?.premiumRate && (() => {
                          const c = calcPremium(midCoverage, form.durationTiers[0].premiumRate, form.paymentIntervalMonths)
                          return c ? <span> — Tier 1 ပမာဏ: <strong style={{ color: 'var(--primary)' }}>MMK {fmt(c.perPayment)}</strong></span> : null
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ⑤ Benefits */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <SectionHeader id="benefits" icon="bi-check-circle" label="⑤ Benefits (အကျိုးခံစားခွင့်များ)" badge={`${form.benefitsList.filter(Boolean).length}`} />
                {openSection === 'benefits' && (
                  <div style={{ padding: '1rem' }}>
                    {form.benefitsList.map((b, i) => (
                      <div key={i} className="d-flex align-items-center gap-2 mb-2">
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', minWidth: 28, fontWeight: 700 }}>{i + 1}.</span>
                        <input className="form-control-custom flex-grow-1" placeholder={`Benefit ${i + 1}`} value={b} onChange={e => handleBenefitChange(i, e.target.value)} />
                        <button type="button" onClick={() => removeBenefit(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', flexShrink: 0 }}><i className="bi bi-x-lg"></i></button>
                      </div>
                    ))}
                    <button type="button" onClick={addBenefit} style={{ fontSize: '0.82rem', color: 'var(--primary)', background: 'none', border: '1.5px dashed var(--primary)', borderRadius: 8, padding: '0.35rem 0.9rem', cursor: 'pointer', fontWeight: 600 }}>
                      <i className="bi bi-plus me-1"></i>Benefit ထပ်ထည့်မည်
                    </button>
                  </div>
                )}
              </div>

              {/* ⑥ Required Documents */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <SectionHeader id="docs" icon="bi-file-earmark-check" label="⑥ Required Documents (လျှောက်ရမည့်စာရွက်များ)" badge={`${form.requiredDocuments.filter(Boolean).length}`} />
                {openSection === 'docs' && (
                  <div style={{ padding: '1rem' }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      <i className="bi bi-info-circle me-1"></i>
                      Insurance plan လျှောက်ထားရာတွင် တင်ပြရမည့် စာရွက်စာတမ်းများ
                    </p>
                    {form.requiredDocuments.map((d, i) => (
                      <div key={i} className="d-flex align-items-center gap-2 mb-2">
                        <i className="bi bi-file-text" style={{ color: 'var(--text-muted)', flexShrink: 0 }}></i>
                        <input className="form-control-custom flex-grow-1" placeholder={`e.g. National ID Card, Passport`} value={d} onChange={e => handleDocChange(i, e.target.value)} />
                        <button type="button" onClick={() => removeDoc(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', flexShrink: 0 }}><i className="bi bi-x-lg"></i></button>
                      </div>
                    ))}
                    <button type="button" onClick={addDoc} style={{ fontSize: '0.82rem', color: 'var(--primary)', background: 'none', border: '1.5px dashed var(--primary)', borderRadius: 8, padding: '0.35rem 0.9rem', cursor: 'pointer', fontWeight: 600 }}>
                      <i className="bi bi-plus me-1"></i>Document ထပ်ထည့်မည်
                    </button>
                  </div>
                )}
              </div>

              {/* ⑦ Eligibility */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <SectionHeader id="eligibility" icon="bi-person-check" label="⑦ Eligibility Requirements (အဆင်သင့်ဖြစ်ရမည့်သတ်မှတ်ချက်)" />
                {openSection === 'eligibility' && (
                  <div style={{ padding: '1rem' }}>
                    <textarea name="eligibility" rows={4} className="form-control-custom w-100" style={{ resize: 'vertical' }}
                      placeholder="e.g.&#10;- အသက် ၁၈ မှ ၆၅ နှစ်အတွင်း&#10;- မြန်မာနိုင်ငံသား&#10;- ကျန်းမာရေးစစ်ဆေးမှု ဖြတ်သန်းပြီးသူ" value={form.eligibility} onChange={handleChange} />
                  </div>
                )}
              </div>

              {/* ⑧ Exclusions */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <SectionHeader id="exclusions" icon="bi-x-circle" label="⑧ Exclusions (အကျုံးမဝင်သောအရာများ)" />
                {openSection === 'exclusions' && (
                  <div style={{ padding: '1rem' }}>
                    <textarea name="exclusions" rows={4} className="form-control-custom w-100" style={{ resize: 'vertical' }}
                      placeholder="e.g.&#10;- ကိုယ်ကိုကိုယ် အနာတရဖြစ်ခြင်း&#10;- မူးစရာ/မူးယစ်ဆေးနှင့်ဆက်သွယ်သောထိခိုက်ဒဏ်ရာ&#10;- နိုင်ငံရေးဆင်ခြင်မှုနှင့်ဆက်စပ်သောဆုံးရှုံးမှုများ" value={form.exclusions} onChange={handleChange} />
                  </div>
                )}
              </div>

              {/* ⑨ Beneficiary */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <SectionHeader id="beneficiary" icon="bi-people" label="⑨ Beneficiary Information (အကျိုးခံစားခွင့်ဆက်ခံသူ)" />
                {openSection === 'beneficiary' && (
                  <div style={{ padding: '1rem' }}>
                    <textarea name="beneficiaryInfo" rows={4} className="form-control-custom w-100" style={{ resize: 'vertical' }}
                      placeholder="e.g.&#10;- မိသားစုဝင်များ (မိဘ၊ ဇနီး/ခင်ပွန်း၊ သားသမီး)&#10;- တရားဝင်ခန့်အပ်ထားသောနောက်ဆက်တွဲသူ&#10;- Policy holder ကိုယ်တိုင် (ကိုယ်ခန္ဓာဆိုင်ရာ အာမခံများတွင်)" value={form.beneficiaryInfo} onChange={handleChange} />
                  </div>
                )}
              </div>

              {/* ⑩ Terms & Conditions */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <SectionHeader id="terms" icon="bi-file-earmark-text" label="⑩ Terms, Rules & Policy Conditions" />
                {openSection === 'terms' && (
                  <div style={{ padding: '1rem' }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      <i className="bi bi-info-circle me-1"></i>
                      Plan နှင့်ပတ်သက်သော Rule များ၊ Terms and Conditions အပြည့်အစုံ ထည့်သွင်းပါ။ Customer များ "View Terms" button ဖြင့်ဖတ်နိုင်မည်။
                    </p>
                    <textarea name="termsAndConditions" rows={10} className="form-control-custom w-100" style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.8 }}
                      placeholder="e.g.&#10;1. Premium Payment&#10;Premium ကို သတ်မှတ်ထားသောနေ့ ၃၀ ကျော်၍ မပေးသွင်းပါက Policy ကုန်ဆုံးမည်...&#10;&#10;2. Claim Process&#10;ဆုံးရှုံးမှုဖြစ်သည့်နေ့မှ ရက် ၃၀ အတွင်း claim တင်ပြရမည်..." value={form.termsAndConditions} onChange={handleChange} />
                  </div>
                )}
              </div>

            </div>{/* end sections */}

            <div className="d-flex gap-2 mt-4">
              <button type="submit" disabled={saving} className="btn-primary-custom" style={{ justifyContent: 'center', minWidth: 160 }}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : (editing ? <><i className="bi bi-check-lg me-1"></i>Update Package</> : <><i className="bi bi-plus-circle me-1"></i>Create Package</>)}
              </button>
              <button type="button" className="btn-outline-custom" onClick={() => { setShowForm(false); setEditing(null); setForm({ ...EMPTY }) }}>
                <i className="bi bi-x-lg me-1"></i>Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── LIST ── */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : packages.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-box-seam" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Package မရှိသေးပါ</h5>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>New Package button ဖြင့် ဖန်တီးပါ</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {packages.map(pkg => {
            const pForms = pkgForms[pkg.id] || {}
            const tiers = Array.isArray(pkg.durationTiers) && pkg.durationTiers.length > 0 ? pkg.durationTiers : []
            return (
              <div key={pkg.id} className="card-custom">
                <div className="row align-items-center g-2">
                  <div className="col-12 col-md-5">
                    <div className="d-flex align-items-start gap-3">
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{pkg.name}</span>
                          <span className={`badge-status ${pkg.active ? 'badge-active' : 'badge-cancelled'}`}>{pkg.active ? 'Active' : 'Inactive'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>{pkg.type}</span>
                          {tiers.length > 0 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              · {tiers.map(t => `${t.years}yr@${(t.premiumRate * 100).toFixed(1)}%`).join(', ')}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          MMK {fmt(pkg.coverageMin)} – {fmt(pkg.coverageMax)}
                          {pkg.paymentFrequency && <span style={{ color: 'var(--text-muted)' }}> · {PAYMENT_FREQ_OPTIONS.find(o => o.value === pkg.paymentFrequency)?.label?.split('(')[0].trim() || pkg.paymentFrequency}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>FORMS:</span>
                      <FormBadge label="Application" exists={!!pForms.APPLICATION} onClick={() => navigate('/admin/forms', { state: { packageId: pkg.id } })} />
                      <FormBadge label="Claim" exists={!!pForms.CLAIM} onClick={() => navigate('/admin/forms', { state: { packageId: pkg.id } })} />
                    </div>
                  </div>
                  <div className="col-12 col-md-3">
                    <div className="d-flex gap-1 flex-wrap justify-content-md-end">
                      <button className="btn-outline-custom" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }} onClick={() => setDetailPkg(pkg)} title="View full details">
                        <i className="bi bi-eye me-1"></i>Details
                      </button>
                      {pkg.termsAndConditions && (
                        <button className="btn-outline-custom" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }} onClick={() => setTermsModal(pkg)} title="View Terms">
                          <i className="bi bi-file-text me-1"></i>Terms
                        </button>
                      )}
                      <button className="btn-primary-sm" onClick={() => handleEdit(pkg)} style={{ padding: '0.3rem 0.6rem' }} title="Edit"><i className="bi bi-pencil"></i></button>
                      <button className="btn-outline-custom" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }} onClick={() => handleToggle(pkg.id, pkg.active)}>
                        {pkg.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn-danger-sm" onClick={() => handleDelete(pkg.id)} style={{ padding: '0.3rem 0.6rem' }} title="Delete"><i className="bi bi-trash"></i></button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const thStyle = { padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }
const tdStyle = { padding: '0.6rem 0.75rem', verticalAlign: 'middle' }

function FormBadge({ label, exists, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: '0.2rem 0.6rem', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, background: exists ? '#dcfce7' : '#fee2e2', color: exists ? '#16a34a' : '#dc2626' }}>
      {exists ? '✓' : '✗'} {label}
    </button>
  )
}

function PackageDetailModal({ pkg, onClose, onEdit }) {
  const freqLabel = PAYMENT_FREQ_OPTIONS.find(o => o.value === pkg.paymentFrequency)?.label || pkg.paymentFrequency || '—'
  const tiers = Array.isArray(pkg.durationTiers) && pkg.durationTiers.length > 0 ? pkg.durationTiers : []
  const [calcCoverage, setCalcCoverage] = useState('')
  const [calcDuration, setCalcDuration] = useState(tiers[0]?.years || '')
  const [showTerms, setShowTerms] = useState(false)

  const selectedTier = tiers.find(t => String(t.years) === String(calcDuration)) || tiers[0]
  const calcResult = calcCoverage && selectedTier?.premiumRate
    ? calcPremium(calcCoverage, selectedTier.premiumRate, pkg.paymentIntervalMonths || 1) : null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-primary)', borderRadius: 16, width: '100%', maxWidth: 780, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.05rem' }}>{pkg.name}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>{pkg.type}</span>
              <span className={`badge-status ${pkg.active ? 'badge-active' : 'badge-cancelled'}`}>{pkg.active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button onClick={onEdit} className="btn-primary-sm" style={{ fontSize: '0.8rem' }}><i className="bi bi-pencil me-1"></i>Edit</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}><i className="bi bi-x-lg"></i></button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Description */}
          {pkg.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>{pkg.description}</p>}

          {/* Coverage & Claim */}
          <div className="row g-2">
            <div className="col-6 col-md-3">
              <DetailCard label="Min Coverage" value={`MMK ${fmt(pkg.coverageMin)}`} icon="bi-shield" color="#1d4ed8" />
            </div>
            <div className="col-6 col-md-3">
              <DetailCard label="Max Coverage" value={`MMK ${fmt(pkg.coverageMax)}`} icon="bi-shield-fill-check" color="#16a34a" />
            </div>
            <div className="col-6 col-md-3">
              <DetailCard label="Max Claim" value={pkg.maxClaimAmount ? `MMK ${fmt(pkg.maxClaimAmount)}` : '—'} icon="bi-cash-stack" color="#d97706" />
            </div>
            <div className="col-6 col-md-3">
              <DetailCard label="Payment" value={freqLabel.split('(')[0].trim()} icon="bi-credit-card" color="#7c3aed" />
            </div>
          </div>

          {/* Duration Tiers */}
          {tiers.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
                <i className="bi bi-calendar3 me-1" style={{ color: 'var(--primary)' }}></i>Duration & Premium Tiers
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      <th style={thStyle}>Duration</th>
                      <th style={thStyle}>Rate / yr</th>
                      <th style={thStyle}>Annual Premium (midpoint)</th>
                      <th style={thStyle}>{freqLabel.split('(')[0].trim()} Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers.map((t, i) => {
                      const mid = pkg.coverageMin && pkg.coverageMax ? (Number(pkg.coverageMin) + Number(pkg.coverageMax)) / 2 : null
                      const c = mid ? calcPremium(mid, t.premiumRate, pkg.paymentIntervalMonths || 1) : null
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={tdStyle}><strong>{t.years} နှစ်</strong></td>
                          <td style={tdStyle}><span style={{ color: 'var(--primary)', fontWeight: 700 }}>{(t.premiumRate * 100).toFixed(2)}%</span></td>
                          <td style={tdStyle}>{c ? `MMK ${fmt(c.annual)}` : '—'}</td>
                          <td style={tdStyle}><strong style={{ color: '#16a34a' }}>{c ? `MMK ${fmt(c.perPayment)}` : '—'}</strong></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Premium Calculator */}
          {tiers.length > 0 && (
            <div style={{ background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)', borderRadius: 12, padding: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                <i className="bi bi-calculator me-1" style={{ color: 'var(--primary)' }}></i>Premium Calculator (တိကျသောပမာဏ)
              </div>
              <div className="row g-2 mb-3">
                <div className="col-12 col-md-6">
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>Coverage Amount (MMK)</label>
                  <input type="number" className="form-control-custom w-100" placeholder="Coverage ပမာဏထည့်ပါ" min={pkg.coverageMin} max={pkg.coverageMax} value={calcCoverage} onChange={e => setCalcCoverage(e.target.value)} />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Range: MMK {fmt(pkg.coverageMin)} – {fmt(pkg.coverageMax)}</p>
                </div>
                <div className="col-12 col-md-6">
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>Duration & Premium Tier</label>
                  <select className="form-select-custom w-100" value={calcDuration} onChange={e => setCalcDuration(e.target.value)}>
                    {tiers.map(t => <option key={t.years} value={t.years}>{t.years} နှစ် — {(t.premiumRate * 100).toFixed(2)}%/yr</option>)}
                  </select>
                </div>
              </div>

              {calcResult ? (() => {
                const intervalMonths = pkg.paymentIntervalMonths || 1
                const years = Number(calcDuration) || 1
                const totalPremium = calcResult.annual * years
                const numPayments = Math.round((years * 12) / intervalMonths)
                const freqName = PAYMENT_FREQ_OPTIONS.find(o => o.months === intervalMonths)?.label?.split('(')[0].trim() || `${intervalMonths} လတစ်ကြိမ်`
                return (
                  <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    {/* Header */}
                    <div style={{ background: 'var(--primary)', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                        <i className="bi bi-receipt me-2"></i>Premium ပမာဏ အသေးစိတ်
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>
                        Coverage: MMK {fmt(calcCoverage)} · {years} နှစ်
                      </span>
                    </div>
                    {/* Breakdown rows */}
                    <div style={{ padding: '0.75rem 1rem' }}>
                      {[
                        { icon: 'bi-calculator', label: 'Coverage Amount', value: `MMK ${fmt(calcCoverage)}`, color: '#1d4ed8' },
                        { icon: 'bi-percent', label: `Premium Rate (${years} နှစ် tier)`, value: `${(selectedTier?.premiumRate * 100).toFixed(3)}% / year`, color: '#7c3aed' },
                        { icon: 'bi-calendar-year', label: 'Annual Premium', value: `MMK ${fmt(calcResult.annual)}`, color: '#d97706', formula: `(${fmt(calcCoverage)} × ${(selectedTier?.premiumRate * 100).toFixed(3)}%)` },
                        { icon: 'bi-calendar-range', label: `${years} နှစ် စုစုပေါင်း Premium`, value: `MMK ${fmt(totalPremium)}`, color: '#dc2626', formula: `(${fmt(calcResult.annual)} × ${years} နှစ်)`, highlight: true },
                      ].map((row, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.45rem 0.6rem', borderRadius: 8, marginBottom: 4,
                          background: row.highlight ? '#fef2f2' : 'var(--bg-secondary)',
                          border: row.highlight ? '1px solid #fecaca' : '1px solid transparent',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <i className={`bi ${row.icon}`} style={{ color: row.color, fontSize: '0.85rem', width: 16 }}></i>
                            <div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: row.highlight ? 700 : 500 }}>{row.label}</div>
                              {row.formula && <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>{row.formula}</div>}
                            </div>
                          </div>
                          <span style={{ fontWeight: row.highlight ? 800 : 700, color: row.color, fontSize: row.highlight ? '0.95rem' : '0.85rem' }}>{row.value}</span>
                        </div>
                      ))}

                      {/* Divider */}
                      <div style={{ borderTop: '2px dashed #e2e8f0', margin: '0.6rem 0' }}></div>

                      {/* Payment schedule box */}
                      <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '0.65rem 0.75rem', border: '1px solid #86efac' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#16a34a', marginBottom: '0.5rem' }}>
                          <i className="bi bi-calendar-check me-1"></i>ပေးချေမှုဇယား ({freqName})
                        </div>
                        <div className="row g-2">
                          <div className="col-6">
                            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>တစ်ကြိမ်ပေးချေရမည့်ပမာဏ</div>
                            <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '1.15rem' }}>MMK {fmt(calcResult.perPayment)}</div>
                          </div>
                          <div className="col-6">
                            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>စုစုပေါင်း ပေးချေကြိမ်</div>
                            <div style={{ fontWeight: 800, color: '#1d4ed8', fontSize: '1.15rem' }}>{numPayments} ကြိမ်</div>
                            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>(လ {intervalMonths} တစ်ကြိမ် × {years} နှစ်)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })() : (
                <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '1.25rem', border: '1px dashed var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <i className="bi bi-calculator" style={{ fontSize: '1.5rem', opacity: 0.4, display: 'block', marginBottom: 4 }}></i>
                  Coverage Amount ထည့်၍ တွက်ချက်မည်
                </div>
              )}
            </div>
          )}

          {/* Benefits */}
          {(pkg.benefits || []).length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
                <i className="bi bi-check-circle me-1" style={{ color: '#16a34a' }}></i>Benefits
              </div>
              <div className="row g-1">
                {(pkg.benefits || []).map((b, i) => (
                  <div key={i} className="col-12 col-md-6">
                    <div style={{ display: 'flex', gap: 8, fontSize: '0.83rem', color: 'var(--text-secondary)', alignItems: 'flex-start' }}>
                      <i className="bi bi-check2" style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }}></i>{b}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required Documents */}
          {(pkg.requiredDocuments || []).length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
                <i className="bi bi-file-earmark-check me-1" style={{ color: '#d97706' }}></i>Required Documents
              </div>
              <div className="d-flex flex-column gap-1">
                {(pkg.requiredDocuments || []).map((d, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.83rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                    <i className="bi bi-file-text" style={{ color: '#d97706', flexShrink: 0 }}></i>{d}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="row g-3">
            {pkg.eligibility && (
              <div className="col-12 col-md-6">
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  <i className="bi bi-person-check me-1" style={{ color: '#1d4ed8' }}></i>Eligibility
                </div>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line', margin: 0 }}>{pkg.eligibility}</p>
              </div>
            )}
            {pkg.exclusions && (
              <div className="col-12 col-md-6">
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  <i className="bi bi-x-circle me-1" style={{ color: '#dc2626' }}></i>Exclusions
                </div>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line', margin: 0 }}>{pkg.exclusions}</p>
              </div>
            )}
            {pkg.beneficiaryInfo && (
              <div className="col-12">
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  <i className="bi bi-people me-1" style={{ color: '#7c3aed' }}></i>Beneficiary
                </div>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line', margin: 0 }}>{pkg.beneficiaryInfo}</p>
              </div>
            )}
          </div>

          {/* Terms */}
          {pkg.termsAndConditions && (
            <div>
              <button onClick={() => setShowTerms(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: showTerms ? 'var(--bg-secondary)' : 'transparent', border: '1.5px solid var(--border)', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem', width: '100%' }}>
                <i className="bi bi-file-earmark-text" style={{ color: 'var(--primary)' }}></i>
                Terms & Conditions ကြည့်ရန်
                <i className={`bi bi-chevron-${showTerms ? 'up' : 'down'} ms-auto`} style={{ color: 'var(--text-muted)' }}></i>
              </button>
              {showTerms && (
                <div style={{ marginTop: 8, background: 'var(--bg-secondary)', borderRadius: 8, padding: '1rem', fontSize: '0.83rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.8, maxHeight: 300, overflowY: 'auto' }}>
                  {pkg.termsAndConditions}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailCard({ label, value, icon, color }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '0.65rem 0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <i className={`bi ${icon}`} style={{ color, fontSize: '0.85rem' }}></i>
        <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{value}</div>
    </div>
  )
}
