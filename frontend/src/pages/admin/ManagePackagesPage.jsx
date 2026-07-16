import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import { toast } from 'react-toastify'

const INSURANCE_TYPES = ['LIFE', 'HEALTH', 'VEHICLE', 'PROPERTY']
const EMPTY = { name: '', type: 'LIFE', description: '', coverageMin: '', coverageMax: '', premiumRate: '', durations: '1,2,3,5', benefits: '', eligibility: '', exclusions: '', policyTerm: '', active: true }

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
  const [pkgForms, setPkgForms] = useState({})  // packageId -> { APPLICATION, CLAIM }

  const fetchPackages = () => {
    api.get('/admin/packages')
      .then(res => {
        const pkgs = Array.isArray(res.data) ? res.data : []
        setPackages(pkgs)
        // Load form status for all packages
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
  useEffect(() => { fetchPackages() }, [])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        coverageMin: Number(form.coverageMin),
        coverageMax: Number(form.coverageMax),
        premiumRate: Number(form.premiumRate),
        policyTerm: form.policyTerm ? Number(form.policyTerm) : null,
        durations: form.durations.split(',').map(d => Number(d.trim())).filter(Boolean),
        benefits: form.benefits.split('\n').map(b => b.trim()).filter(Boolean),
        eligibility: form.eligibility || null,
        exclusions: form.exclusions || null,
      }
      if (editing) {
        await api.put(`/admin/packages/${editing}`, payload)
        toast.success('Package updated')
      } else {
        await api.post('/admin/packages', payload)
        toast.success('Package created')
      }
      setShowForm(false); setEditing(null); setForm(EMPTY); fetchPackages()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSaving(false) }
  }

  const handleEdit = (pkg) => {
    setEditing(pkg.id)
    setForm({ ...pkg, durations: (pkg.durations || []).join(', '), benefits: (pkg.benefits || []).join('\n'), eligibility: pkg.eligibility || '', exclusions: pkg.exclusions || '', policyTerm: pkg.policyTerm || '' })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggle = async (id, active) => {
    try {
      await api.put(`/admin/packages/${id}/toggle`, { active: !active })
      toast.success(active ? 'Package deactivated' : 'Package activated')
      fetchPackages()
    } catch { toast.error('Failed to toggle') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this package? This cannot be undone.')) return
    try { await api.delete(`/admin/packages/${id}`); toast.success('Deleted'); fetchPackages() } catch { toast.error('Failed to delete') }
  }

  const handleManageForm = (pkg) => {
    navigate('/admin/forms', { state: { packageId: pkg.id } })
  }

  const typeColors = { LIFE: '#dc2626', HEALTH: '#16a34a', VEHICLE: '#1d4ed8', PROPERTY: '#ca8a04' }

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Insurance Packages</h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Create and manage insurance plans and their forms</p>
        </div>
        <button className="btn-primary-custom" style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }} onClick={() => {
          if (showForm && fromDashboard) { navigate('/admin/dashboard'); return }
          setShowForm(!showForm); setEditing(null); setForm(EMPTY)
        }}>
          <i className={`bi bi-${showForm ? (fromDashboard ? 'arrow-left' : 'x-lg') : 'plus-circle'} me-1`}></i>
          {showForm ? (fromDashboard ? 'Back' : 'Cancel') : 'New Package'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card-custom mb-4 fade-in">
          <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>{editing ? 'Edit Package' : 'Create New Package'}</h6>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Package Name *</label>
                <input name="name" required className="form-control-custom w-100" value={form.name} onChange={handleChange} />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label-custom">Type *</label>
                <select name="type" required className="form-select-custom w-100" value={form.type} onChange={handleChange}>
                  {INSURANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label-custom">Premium Rate (%) *</label>
                <input name="premiumRate" type="number" required step="0.001" min="0" max="1" className="form-control-custom w-100"
                  placeholder="0.02 = 2%" value={form.premiumRate} onChange={handleChange} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Min Coverage (MMK) *</label>
                <input name="coverageMin" type="number" required className="form-control-custom w-100" value={form.coverageMin} onChange={handleChange} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Max Coverage (MMK) *</label>
                <input name="coverageMax" type="number" required className="form-control-custom w-100" value={form.coverageMax} onChange={handleChange} />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label-custom">Duration Options (comma-separated years)</label>
                <input name="durations" className="form-control-custom w-100" placeholder="1, 2, 3, 5" value={form.durations} onChange={handleChange} />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label-custom">Max Policy Term (years)</label>
                <input name="policyTerm" type="number" className="form-control-custom w-100" placeholder="e.g. 30" value={form.policyTerm} onChange={handleChange} min={1} />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label-custom">Active</label>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <input type="checkbox" name="active" checked={form.active} onChange={handleChange} id="pkgActive" />
                  <label htmlFor="pkgActive" style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>Visible to customers</label>
                </div>
              </div>
              <div className="col-12">
                <label className="form-label-custom">Description</label>
                <textarea name="description" rows={2} className="form-control-custom w-100" style={{ resize: 'vertical' }} value={form.description} onChange={handleChange} />
              </div>
              <div className="col-12">
                <label className="form-label-custom">Benefits (one per line)</label>
                <textarea name="benefits" rows={3} className="form-control-custom w-100" style={{ resize: 'vertical' }}
                  placeholder="Death benefit payout&#10;Accidental coverage&#10;24/7 support" value={form.benefits} onChange={handleChange} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Eligibility Requirements</label>
                <textarea name="eligibility" rows={3} className="form-control-custom w-100" style={{ resize: 'vertical' }}
                  placeholder="e.g. Age 18–65, Myanmar citizen" value={form.eligibility} onChange={handleChange} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Exclusions</label>
                <textarea name="exclusions" rows={3} className="form-control-custom w-100" style={{ resize: 'vertical' }}
                  placeholder="e.g. Pre-existing conditions" value={form.exclusions} onChange={handleChange} />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button type="submit" disabled={saving} className="btn-primary-custom" style={{ justifyContent: 'center' }}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : (editing ? 'Update Package' : 'Create Package')}
              </button>
              <button type="button" className="btn-outline-custom" onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY) }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : packages.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-box-seam" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No packages yet</h5>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {packages.map(pkg => {
            const pForms = pkgForms[pkg.id] || {}
            const hasAppForm = !!pForms.APPLICATION
            const hasClaimForm = !!pForms.CLAIM
            return (
              <div key={pkg.id} className="card-custom">
                <div className="row align-items-center g-2">
                  <div className="col-12 col-md-5">
                    <div className="d-flex align-items-center gap-3">
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{pkg.name}</div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: typeColors[pkg.type] || '#6b7280' }}>{pkg.type}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>·</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600 }}>{(pkg.premiumRate * 100).toFixed(1)}%</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>·</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{(pkg.durations || []).join(', ')} yr</span>
                        </div>
                      </div>
                      <span className={`badge-status ${pkg.active ? 'badge-active' : 'badge-cancelled'}`}>{pkg.active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>FORMS:</span>
                      <FormBadge label="Application" exists={hasAppForm} onClick={() => handleManageForm(pkg)} />
                      <FormBadge label="Claim" exists={hasClaimForm} onClick={() => handleManageForm(pkg)} />
                    </div>
                  </div>
                  <div className="col-12 col-md-3">
                    <div className="d-flex gap-1 flex-wrap justify-content-md-end">
                      <button className="btn-outline-custom" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
                        onClick={() => handleManageForm(pkg)} title="Manage forms">
                        <i className="bi bi-ui-checks me-1"></i>Forms
                      </button>
                      <button className="btn-primary-sm" onClick={() => handleEdit(pkg)} style={{ padding: '0.3rem 0.6rem' }}><i className="bi bi-pencil"></i></button>
                      <button className="btn-outline-custom" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }} onClick={() => handleToggle(pkg.id, pkg.active)}>
                        {pkg.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn-danger-sm" onClick={() => handleDelete(pkg.id)} style={{ padding: '0.3rem 0.6rem' }}><i className="bi bi-trash"></i></button>
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

function FormBadge({ label, exists, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '0.2rem 0.6rem', borderRadius: 99, border: 'none', cursor: 'pointer',
      fontSize: '0.72rem', fontWeight: 700,
      background: exists ? '#dcfce7' : '#fee2e2',
      color: exists ? '#16a34a' : '#dc2626',
    }} title={exists ? `${label} form exists` : `No ${label} form — click to build`}>
      {exists ? '✓' : '✗'} {label}
    </button>
  )
}
