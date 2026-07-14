import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { toast } from 'react-toastify'

const TYPE_META = {
  LIFE:      { color: '#dc2626', bg: '#fef2f2',  icon: 'bi-heart-pulse'  },
  HEALTH:    { color: '#16a34a', bg: '#f0fdf4',  icon: 'bi-hospital'     },
  TRAVEL:    { color: '#0891b2', bg: '#ecfeff',  icon: 'bi-airplane'     },
  MOTOR:     { color: '#d97706', bg: '#fffbeb',  icon: 'bi-car-front'    },
  EDUCATION: { color: '#7c3aed', bg: '#f5f3ff',  icon: 'bi-mortarboard'  },
  VEHICLE:   { color: '#2563eb', bg: '#eff6ff',  icon: 'bi-truck'        },
  PROPERTY:  { color: '#ca8a04', bg: '#fefce8',  icon: 'bi-house-check'  },
}

const RISK_META = {
  LOW:    { color: '#16a34a', bg: '#f0fdf4', icon: 'bi-shield-check'       },
  MEDIUM: { color: '#d97706', bg: '#fffbeb', icon: 'bi-shield-exclamation' },
  HIGH:   { color: '#dc2626', bg: '#fef2f2', icon: 'bi-shield-x'          },
}

function PolicyCertificate({ policy, onClose }) {
  return (
    <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content" style={{ borderRadius: 16 }}>
          <div className="modal-header" style={{ background: 'linear-gradient(135deg, #1d4ed8, #4338ca)', borderRadius: '16px 16px 0 0' }}>
            <div>
              <h5 className="modal-title" style={{ color: '#fff', fontWeight: 700 }}>Insurance Policy Certificate</h5>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>Print or save this document for your records</div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', color: '#fff', cursor: 'pointer' }}><i className="bi bi-x-lg"></i></button>
          </div>
          <div className="modal-body" style={{ padding: '2rem' }}>
            {/* Certificate body */}
            <div style={{ border: '2px solid #1d4ed8', borderRadius: 12, padding: '1.5rem', background: '#fafbff' }}>
              <div className="text-center mb-4">
                <i className="bi bi-shield-fill-check" style={{ fontSize: '2.5rem', color: '#1d4ed8' }}></i>
                <div style={{ fontWeight: 800, fontSize: '1.3rem', color: '#1d4ed8', marginTop: 8 }}>INSURANCE POLICY CERTIFICATE</div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>This certifies that the following insurance policy is active</div>
              </div>
              <div className="row g-3">
                {[
                  ['Policy Number', policy.policyNumber || 'Pending'],
                  ['Policy Type', policy.packageType],
                  ['Plan Name', policy.packageName],
                  ['Coverage Amount', `${Number(policy.coverageAmount).toLocaleString()} MMK`],
                  ['Policy Duration', `${policy.duration} Year${policy.duration > 1 ? 's' : ''}`],
                  ['Risk Level', policy.riskLevel || '—'],
                  ['Total Premium', policy.premiumAmount ? `${Number(policy.premiumAmount).toLocaleString()} MMK` : '—'],
                  ['Issue Date', policy.createdAt ? new Date(policy.createdAt).toLocaleDateString() : '—'],
                  ['Status', 'ACTIVE'],
                ].map(([label, value]) => (
                  <div key={label} className="col-6">
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-outline-custom" onClick={onClose}>Close</button>
            <button className="btn-primary-custom" style={{ justifyContent: 'center' }} onClick={() => window.print()}>
              <i className="bi bi-printer me-2"></i>Print / Download
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CustomerPoliciesPage() {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [certPolicy, setCertPolicy] = useState(null)
  const [renewing, setRenewing] = useState(null)

  const fetchPolicies = () => {
    api.get('/customer/policies')
      .then(res => setPolicies(Array.isArray(res.data) ? res.data : []))
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetchPolicies() }, [])

  const handleRenew = async (id) => {
    if (!window.confirm('Submit a renewal application for this policy?')) return
    setRenewing(id)
    try {
      await api.post(`/customer/applications/${id}/renew`)
      toast.success('Renewal application submitted! Check Applications for status.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Renewal failed')
    } finally { setRenewing(null) }
  }

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>My Policies</h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>View and manage your active insurance policies</p>
        </div>
        <Link to="/customer/apply" className="btn-primary-custom" style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}>
          <i className="bi bi-plus-circle me-1"></i>New Policy
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : policies.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-shield-check" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No active policies</h5>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Apply for a plan to get started. Policies activate after payment is verified.</p>
          <Link to="/customer/apply" className="btn-primary-custom mt-2" style={{ display: 'inline-flex' }}>Apply Now</Link>
        </div>
      ) : (
        <div className="row g-4">
          {policies.map(policy => {
            const typeMeta = TYPE_META[policy.packageType] || { color: '#6b7280', bg: '#f3f4f6', icon: 'bi-shield' }
            const riskMeta = RISK_META[policy.riskLevel] || RISK_META['LOW']
            return (
              <div key={policy.id} className="col-12 col-md-6">
                <div className="card-custom h-100" style={{ border: `2px solid ${typeMeta.color}30` }}>
                  {/* Header */}
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: typeMeta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className={`bi ${typeMeta.icon}`} style={{ color: typeMeta.color, fontSize: '1.4rem' }}></i>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: typeMeta.color, textTransform: 'uppercase' }}>{policy.packageType}</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{policy.packageName}</div>
                      </div>
                    </div>
                    <span style={{ padding: '0.25rem 0.65rem', borderRadius: 99, background: '#dcfce7', color: '#16a34a', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>ACTIVE</span>
                  </div>

                  {/* Policy Number */}
                  <div className="mb-3 p-2" style={{ background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Policy Number</div>
                    <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)', fontSize: '0.95rem' }}>{policy.policyNumber || 'Pending Assignment'}</div>
                  </div>

                  {/* Stats grid */}
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.45rem 0.65rem' }}>
                        <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Coverage</div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{Number(policy.coverageAmount).toLocaleString()} MMK</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.45rem 0.65rem' }}>
                        <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Total Premium</div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{policy.premiumAmount ? Number(policy.premiumAmount).toLocaleString() : '—'} MMK</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.45rem 0.65rem' }}>
                        <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Duration</div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{policy.duration} Year{policy.duration > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div style={{ background: riskMeta.bg, borderRadius: 8, padding: '0.45rem 0.65rem' }}>
                        <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Risk Level</div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: riskMeta.color }}>
                          <i className={`bi ${riskMeta.icon} me-1`}></i>{policy.riskLevel || '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {policy.agentName && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      <i className="bi bi-person-badge me-1"></i>Agent: {policy.agentName}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="d-flex gap-2 mt-auto">
                    <button onClick={() => setCertPolicy(policy)} className="btn-primary-sm flex-grow-1">
                      <i className="bi bi-file-earmark-text me-1"></i>Certificate
                    </button>
                    <Link to="/customer/submit-claim" className="btn-outline-custom" style={{ textDecoration: 'none', padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
                      <i className="bi bi-file-earmark-plus me-1"></i>Claim
                    </Link>
                    <button onClick={() => handleRenew(policy.id)} disabled={renewing === policy.id} style={{ padding: '0.4rem 0.85rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                      {renewing === policy.id ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-arrow-repeat me-1"></i>Renew</>}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {certPolicy && <PolicyCertificate policy={certPolicy} onClose={() => setCertPolicy(null)} />}
    </div>
  )
}
