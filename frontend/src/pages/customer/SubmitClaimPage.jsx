import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { toast } from 'react-toastify'

const CLAIM_TYPES = ['Accident', 'Hospitalization', 'Death Benefit', 'Property Damage', 'Vehicle Damage', 'Critical Illness', 'Other']

export default function SubmitClaimPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activePolicies, setActivePolicies] = useState([])
  const [claimedIds, setClaimedIds] = useState(new Set())
  const [form, setForm] = useState({ applicationId: '', claimType: '', amount: '', description: '', incidentDate: '' })
  const [docs, setDocs] = useState([])
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

  // A policy may only have one claim submitted against it, ever (regardless of that claim's status)
  const availablePolicies = activePolicies.filter(p => !claimedIds.has(p.id))

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.applicationId) { toast.error('Please select a policy'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      docs.forEach(d => fd.append('documents', d))
      await api.post('/customer/claims', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Claim submitted successfully!')
      navigate('/customer/claims')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit claim')
    } finally {
      setLoading(false)
    }
  }

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
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label-custom">Select Policy *</label>
                  <select name="applicationId" required className="form-select-custom w-100" value={form.applicationId} onChange={handleChange}>
                    <option value="">Choose an active policy...</option>
                    {availablePolicies.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.packageName || p.package?.name} — {Number(p.coverageAmount).toLocaleString()} MMK
                      </option>
                    ))}
                  </select>
                  {activePolicies.length === 0 && (
                    <small style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
                      No approved policies found. Apply for a policy first.
                    </small>
                  )}
                  {activePolicies.length > 0 && availablePolicies.length === 0 && (
                    <small style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
                      All of your approved policies already have a claim submitted. Only one claim is allowed per policy.
                    </small>
                  )}
                  {activePolicies.length > availablePolicies.length && availablePolicies.length > 0 && (
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      Note: policies that already have a claim are hidden — only one claim is allowed per policy.
                    </small>
                  )}
                </div>
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
                    placeholder="Describe the incident in detail..."
                    value={form.description} onChange={handleChange} style={{ resize: 'vertical' }} />
                </div>
                <div className="col-12">
                  <label className="form-label-custom">Supporting Documents</label>
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
                    className="form-control-custom w-100"
                    onChange={e => setDocs(Array.from(e.target.files))} />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    Upload photos, medical reports, police reports, etc. (PDF, JPG, PNG)
                  </small>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary-custom mt-4 w-100" style={{ justifyContent: 'center' }}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</> : 'Submit Claim'}
              </button>
            </form>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="card-custom">
            <h6 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>📋 Claim Process</h6>
            {[
              'Submit your claim with required documents',
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
