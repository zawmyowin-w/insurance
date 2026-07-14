import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import FormDetailModal from '../../components/FormDetailModal'

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('VERIFIED')
  const [selected, setSelected] = useState(null)
  const [actionNote, setActionNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [viewItem, setViewItem] = useState(null)

  const fetchClaims = () => {
    api.get(`/admin/claims${filter !== 'ALL' ? `?status=${filter}` : ''}`)
      .then(res => setClaims(Array.isArray(res.data) ? res.data : []))
      .catch(() => setClaims([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { setLoading(true); fetchClaims() }, [filter])

  const handleAction = async (id, action) => {
    if ((action === 'reject' || action === 'revise') && !actionNote.trim()) { toast.error('Provide a note'); return }
    setSubmitting(true)
    try {
      await api.put(`/admin/claims/${id}/${action}`, { note: actionNote })
      toast.success(`Claim ${action}d`)
      setSelected(null); setActionNote(''); fetchClaims()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Claims Management</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Review and process insurance claims</p>
      </div>
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {['ALL', 'PENDING', 'VERIFIED', 'APPROVED', 'REJECTED'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '0.4rem 1rem', borderRadius: 20, border: '1px solid',
            borderColor: filter === f ? 'var(--primary)' : 'var(--border)',
            background: filter === f ? 'var(--primary)' : 'var(--bg-card)',
            color: filter === f ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.85rem', cursor: 'pointer'
          }}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : claims.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-file-earmark-medical" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No claims found for "{filter}"</h5>
        </div>
      ) : (
        <div className="row g-4">
          {claims.map(claim => (
            <div key={claim.id} className="col-12">
              <div className="card-custom">
                <div className="row align-items-start">
                  <div className="col-12 col-md-8">
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <div>
                        <h6 style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          #{claim.id} — {claim.customerName || claim.customer?.name}
                        </h6>
                        <small style={{ color: 'var(--text-muted)' }}>{claim.claimType}</small>
                      </div>
                      <span className={`badge-status badge-${claim.status?.toLowerCase()}`}>{claim.status}</span>
                    </div>
                    <div className="d-flex gap-3 flex-wrap mb-2">
                      {[
                        { label: 'Policy', value: claim.policyName || claim.policy?.packageName },
                        { label: 'Amount', value: `${Number(claim.amount).toLocaleString()} MMK` },
                        { label: 'Incident Date', value: claim.incidentDate ? new Date(claim.incidentDate).toLocaleDateString() : '—' },
                        { label: 'Submitted', value: claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : '—' },
                        { label: 'Agent', value: claim.agentName || claim.agent?.name || 'N/A' },
                      ].map(item => (
                        <div key={item.label} style={{ minWidth: 100 }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.label}</div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setViewItem(claim)} style={{
                      padding: '0.3rem 0.8rem', borderRadius: 7, border: '1.5px solid var(--border)',
                      background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
                      fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4
                    }}>
                      <i className="bi bi-eye"></i> View Details
                    </button>
                    {claim.agentNote && <p style={{ color: '#1d4ed8', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>Agent: {claim.agentNote}</p>}
                  </div>
                  {claim.status === 'VERIFIED' && (
                    <div className="col-12 col-md-4 mt-3 mt-md-0">
                      {selected === claim.id ? (
                        <div>
                          <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical' }}
                            placeholder="Decision note..." value={actionNote} onChange={e => setActionNote(e.target.value)} />
                          <div className="d-flex gap-1 flex-wrap">
                            <button className="btn-success-sm" onClick={() => handleAction(claim.id, 'approve')} disabled={submitting}>
                              {submitting ? <span className="spinner-border spinner-border-sm"></span> : '✓ Approve'}
                            </button>
                            <button className="btn-danger-sm" onClick={() => handleAction(claim.id, 'reject')} disabled={submitting}>✗ Reject</button>
                            <button style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 0.7rem', fontSize: '0.82rem', cursor: 'pointer' }}
                              onClick={() => handleAction(claim.id, 'revise')} disabled={submitting}>↩ Revise</button>
                            <button className="btn-outline-custom" style={{ padding: '0.3rem 0.6rem', fontSize: '0.82rem' }} onClick={() => setSelected(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn-primary-custom" style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                          onClick={() => { setSelected(claim.id); setActionNote('') }}>
                          Review Claim
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormDetailModal
        show={!!viewItem} onClose={() => setViewItem(null)}
        type="claim" item={viewItem} role="admin" />
    </div>
  )
}
