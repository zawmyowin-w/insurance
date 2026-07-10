import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

export default function AgentClaimsPage() {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [rejectId, setRejectId] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchClaims = () => {
    api.get('/agent/claims').then(res => setClaims(Array.isArray(res.data) ? res.data : [])).catch(() => setClaims([])).finally(() => setLoading(false))
  }
  useEffect(() => { fetchClaims() }, [])

  const handleVerify = async (id) => {
    setSubmitting(true)
    try {
      await api.put(`/agent/claims/${id}/verify`, { note })
      toast.success('Claim verified and sent to admin')
      setSelected(null); setNote(''); fetchClaims()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  const handleReject = async (id) => {
    if (!rejectNote.trim()) { toast.error('Provide rejection reason'); return }
    setSubmitting(true)
    try {
      await api.put(`/agent/claims/${id}/reject`, { note: rejectNote })
      toast.success('Claim rejected')
      setRejectId(null); setRejectNote(''); fetchClaims()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Review Claims</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Verify customer claims before forwarding to admin</p>
      </div>
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : claims.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-check-circle" style={{ fontSize: '3rem', color: 'var(--secondary)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No pending claims</h5>
        </div>
      ) : (
        <div className="row g-4">
          {claims.map(claim => (
            <div key={claim.id} className="col-12 col-lg-6">
              <div className="card-custom h-100">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{claim.customerName || claim.customer?.name}</h6>
                    <small style={{ color: 'var(--text-muted)' }}>{claim.claimType}</small>
                  </div>
                  <span className={`badge-status badge-${claim.status?.toLowerCase()}`}>{claim.status}</span>
                </div>
                <div className="row g-2 mb-3">
                  {[
                    { label: 'Policy', value: claim.policyName || claim.policy?.packageName },
                    { label: 'Amount', value: `${Number(claim.amount).toLocaleString()} MMK` },
                    { label: 'Incident Date', value: claim.incidentDate ? new Date(claim.incidentDate).toLocaleDateString() : '—' },
                    { label: 'Submitted', value: claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : '—' },
                  ].map(item => (
                    <div key={item.label} className="col-6">
                      <div style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: '0.5rem 0.75rem' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.label}</div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {claim.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>{claim.description}</p>}
                {claim.status === 'PENDING' && (
                  selected === claim.id ? (
                    <div>
                      <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical' }} placeholder="Verification notes..." value={note} onChange={e => setNote(e.target.value)} />
                      <div className="d-flex gap-2">
                        <button className="btn-success-sm flex-grow-1" onClick={() => handleVerify(claim.id)} disabled={submitting}>
                          {submitting ? <span className="spinner-border spinner-border-sm"></span> : 'Mark as Verified'}
                        </button>
                        <button className="btn-outline-custom" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={() => setSelected(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : rejectId === claim.id ? (
                    <div>
                      <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical' }} placeholder="Reason *" value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
                      <div className="d-flex gap-2">
                        <button className="btn-danger-sm flex-grow-1" onClick={() => handleReject(claim.id)} disabled={submitting}>Reject</button>
                        <button className="btn-outline-custom" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={() => setRejectId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex gap-2">
                      <button className="btn-success-sm flex-grow-1" onClick={() => setSelected(claim.id)}><i className="bi bi-check-circle me-1"></i>Verify</button>
                      <button className="btn-danger-sm" onClick={() => setRejectId(claim.id)}><i className="bi bi-x-circle me-1"></i>Reject</button>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
