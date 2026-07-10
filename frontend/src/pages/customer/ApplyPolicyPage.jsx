import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { toast } from 'react-toastify'

const FALLBACK_PLANS = [
  { id: 1, name: 'Basic Life Protection', type: 'LIFE', coverageMin: 5000000, coverageMax: 50000000, premiumRate: 0.02, durations: [1, 2, 3, 5] },
  { id: 2, name: 'Comprehensive Health Plan', type: 'HEALTH', coverageMin: 2000000, coverageMax: 30000000, premiumRate: 0.025, durations: [1, 2, 3] },
  { id: 3, name: 'Vehicle Protect Plus', type: 'VEHICLE', coverageMin: 3000000, coverageMax: 80000000, premiumRate: 0.03, durations: [1, 2, 3] },
  { id: 4, name: 'Home & Property Shield', type: 'PROPERTY', coverageMin: 10000000, coverageMax: 500000000, premiumRate: 0.015, durations: [1, 2, 3, 5] },
]

export default function ApplyPolicyPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [plans, setPlans] = useState(FALLBACK_PLANS)
  const [form, setForm] = useState({ packageId: '', coverageAmount: '', duration: '1', notes: '' })
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [premium, setPremium] = useState(null)

  useEffect(() => {
    api.get('/packages/public').then(res => { if (res.data?.length) setPlans(res.data) }).catch(() => {})
  }, [])

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (name === 'packageId') {
      const p = plans.find(pl => pl.id === Number(value))
      setSelectedPlan(p || null)
      if (p) setForm(f => ({ ...f, packageId: value, coverageAmount: String(p.coverageMin) }))
      setPremium(null)
    }
    if ((name === 'coverageAmount' || name === 'duration') && selectedPlan) {
      const cov = name === 'coverageAmount' ? Number(value) : Number(form.coverageAmount)
      const dur = name === 'duration' ? Number(value) : Number(form.duration)
      if (cov && dur) setPremium(cov * selectedPlan.premiumRate * dur)
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.packageId) { toast.error('Please select an insurance plan'); return }
    setLoading(true)
    try {
      await api.post('/customer/applications', {
        packageId: Number(form.packageId),
        coverageAmount: Number(form.coverageAmount),
        duration: Number(form.duration),
        notes: form.notes,
      })
      toast.success(t('apply.success'))
      navigate('/customer/applications')
    } catch (err) {
      toast.error(err.response?.data?.message || t('apply.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('apply.title')}</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{t('apply.subtitle')}</p>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <div className="card-custom">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label-custom">{t('apply.selectPlan')} *</label>
                <select name="packageId" required className="form-select-custom w-100" value={form.packageId} onChange={handleChange}>
                  <option value="">{t('plans.choosePlan')}</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label-custom">{t('plans.coverageLabel')} (MMK) *</label>
                <input name="coverageAmount" type="number" required className="form-control-custom w-100"
                  value={form.coverageAmount}
                  min={selectedPlan?.coverageMin || 1000000}
                  max={selectedPlan?.coverageMax || 999999999}
                  step={500000}
                  onChange={handleChange} />
                {selectedPlan && (
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    Range: {selectedPlan.coverageMin.toLocaleString()} – {selectedPlan.coverageMax.toLocaleString()} MMK
                  </small>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label-custom">{t('plans.durationLabel')} *</label>
                <select name="duration" required className="form-select-custom w-100" value={form.duration} onChange={handleChange}>
                  {(selectedPlan?.durations || [1, 2, 3, 5]).map(d => (
                    <option key={d} value={d}>{d} {d === 1 ? 'Year' : 'Years'}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="form-label-custom">Additional Notes</label>
                <textarea name="notes" rows={3} className="form-control-custom w-100"
                  placeholder="Any special requirements or information..."
                  value={form.notes} onChange={handleChange} style={{ resize: 'vertical' }} />
              </div>

              {premium !== null && (
                <div className="premium-result mb-4">
                  <div className="premium-result-label">Estimated Total Premium</div>
                  <div className="premium-result-amount">{Math.round(premium).toLocaleString()} <span style={{ fontSize: '1rem' }}>MMK</span></div>
                  <div style={{ fontSize: '0.82rem', opacity: 0.8, marginTop: '0.25rem' }}>
                    for {form.duration} year{form.duration > 1 ? 's' : ''}
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary-custom w-100" style={{ justifyContent: 'center' }}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</> : t('apply.submit')}
              </button>
            </form>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          {selectedPlan ? (
            <div className="card-custom">
              <h6 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>{selectedPlan.name}</h6>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{selectedPlan.description}</div>
              <div className="mb-2">
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Type</span>
                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{selectedPlan.type}</div>
              </div>
              <div className="mb-2">
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Premium Rate</span>
                <div style={{ fontWeight: 600, color: 'var(--accent)' }}>{(selectedPlan.premiumRate * 100).toFixed(1)}% per year</div>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Coverage Range</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedPlan.coverageMin.toLocaleString()} – {selectedPlan.coverageMax.toLocaleString()} MMK
                </div>
              </div>
            </div>
          ) : (
            <div className="card-custom text-center py-4">
              <i className="bi bi-info-circle" style={{ fontSize: '2.5rem', color: 'var(--border)', marginBottom: '0.75rem' }}></i>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Select a plan to see its details</p>
            </div>
          )}
          <div className="card-custom mt-3">
            <h6 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>📋 What happens next?</h6>
            {['Your application is sent to your assigned agent', 'Agent reviews and forwards to admin', 'Admin approves or requests changes', 'You\'ll be notified and can make payment'].map((step, i) => (
              <div key={i} className="d-flex align-items-start gap-2 mb-2">
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
