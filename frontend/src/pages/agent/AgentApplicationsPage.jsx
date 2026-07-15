import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import FormDetailModal from '../../components/FormDetailModal'

export default function AgentApplicationsPage() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [rejectId, setRejectId] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [forwardId, setForwardId] = useState(null)
  const [forwardNote, setForwardNote] = useState('')
  const [viewItem, setViewItem] = useState(null)

  const fetchApps = () => {
    api.get('/agent/applications')
      .then(res => setApps(Array.isArray(res.data) ? res.data : []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetchApps() }, [])

  const clearActions = () => {
    setSelected(null); setNote('')
    setRejectId(null); setRejectNote('')
    setForwardId(null); setForwardNote('')
  }

  const handleVerify = async (id) => {
    setSubmitting(true)
    try {
      await api.put(`/agent/applications/${id}/verify`, { note })
      toast.success('Application verified and sent to admin')
      clearActions(); fetchApps()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  const handleReject = async (id) => {
    if (!rejectNote.trim()) { toast.error('Please provide a reason'); return }
    setSubmitting(true)
    try {
      await api.put(`/agent/applications/${id}/reject`, { note: rejectNote })
      toast.success('Application rejected')
      clearActions(); fetchApps()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  const handleForward = async (id) => {
    setSubmitting(true)
    try {
      await api.put(`/agent/applications/${id}/request-revision`, { note: forwardNote })
      toast.success('Customer notified to update their application')
      clearActions(); fetchApps()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Review Applications</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Verify customer policy applications before forwarding to admin</p>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : apps.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-check-circle" style={{ fontSize: '3rem', color: 'var(--secondary)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No pending applications</h5>
        </div>
      ) : (
        <div className="row g-4">
          {apps.map(app => {
            const isRevision = app.status === 'REVISION_REQUESTED'
            const isPending = app.status === 'PENDING'
            const activeAction = selected === app.id ? 'verify'
              : rejectId === app.id ? 'reject'
              : forwardId === app.id ? 'forward'
              : null

            return (
              <div key={app.id} className="col-12 col-lg-6">
                <div className="card-custom h-100">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {app.customerName || app.customer?.name}
                      </h6>
                      <small style={{ color: 'var(--text-muted)' }}>{app.customerEmail || app.customer?.email}</small>
                    </div>
                    <span className={`badge-status badge-${app.status?.toLowerCase()}`}>{app.status}</span>
                  </div>

                  {/* Admin note shown prominently for revision items */}
                  {isRevision && app.adminNote && (
                    <div style={{
                      padding: '0.6rem 0.875rem', borderRadius: 8, marginBottom: '0.75rem',
                      background: '#fefce8', border: '1px solid #fcd34d', fontSize: '0.82rem'
                    }}>
                      <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 2 }}>
                        <i className="bi bi-exclamation-triangle me-1"></i>Admin requested revision:
                      </div>
                      <div style={{ color: '#78350f' }}>{app.adminNote}</div>
                    </div>
                  )}
                  {isRevision && app.agentNote && (
                    <div style={{
                      padding: '0.6rem 0.875rem', borderRadius: 8, marginBottom: '0.75rem',
                      background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '0.82rem'
                    }}>
                      <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 2 }}>
                        <i className="bi bi-person me-1"></i>Your note to customer:
                      </div>
                      <div style={{ color: '#1d4ed8' }}>{app.agentNote}</div>
                    </div>
                  )}

                  <div className="row g-2 mb-3">
                    {[
                      { label: 'Plan', value: app.packageName || app.package?.name },
                      { label: 'Type', value: app.packageType || app.package?.type },
                      { label: 'Coverage', value: `${Number(app.coverageAmount).toLocaleString()} MMK` },
                      { label: 'Duration', value: `${app.duration} yr${app.duration > 1 ? 's' : ''}` },
                    ].map(item => (
                      <div key={item.label} className="col-6">
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: '0.5rem 0.75rem' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.label}</div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => setViewItem(app)} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '0.4rem 0.9rem', borderRadius: 8, border: '1.5px solid var(--border)',
                    background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.75rem', width: '100%', justifyContent: 'center'
                  }}>
                    <i className="bi bi-eye"></i> View Full Form Details
                  </button>

                  {/* Actions for PENDING and REVISION_REQUESTED */}
                  {(isPending || isRevision) && (
                    <>
                      {activeAction === 'verify' && (
                        <div>
                          <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical' }}
                            placeholder="Verification notes (optional)..." value={note} onChange={e => setNote(e.target.value)} />
                          <div className="d-flex gap-2">
                            <button className="btn-success-sm flex-grow-1" onClick={() => handleVerify(app.id)} disabled={submitting}>
                              {submitting ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-check-lg me-1"></i>Mark Verified</>}
                            </button>
                            <button className="btn-outline-custom" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={clearActions}>Cancel</button>
                          </div>
                        </div>
                      )}
                      {activeAction === 'reject' && (
                        <div>
                          <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical' }}
                            placeholder="Reason for rejection *" value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
                          <div className="d-flex gap-2">
                            <button className="btn-danger-sm flex-grow-1" onClick={() => handleReject(app.id)} disabled={submitting}>
                              {submitting ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-x-lg me-1"></i>Reject</>}
                            </button>
                            <button className="btn-outline-custom" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={clearActions}>Cancel</button>
                          </div>
                        </div>
                      )}
                      {activeAction === 'forward' && (
                        <div>
                          <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical' }}
                            placeholder="Note to customer — what needs to be updated..." value={forwardNote} onChange={e => setForwardNote(e.target.value)} />
                          <div className="d-flex gap-2">
                            <button style={{
                              flex: 1, padding: '0.45rem 0.75rem', borderRadius: 8, border: 'none',
                              background: '#d97706', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                            }} onClick={() => handleForward(app.id)} disabled={submitting}>
                              {submitting ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-send me-1"></i>Notify Customer</>}
                            </button>
                            <button className="btn-outline-custom" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={clearActions}>Cancel</button>
                          </div>
                        </div>
                      )}
                      {activeAction === null && (
                        <div className="d-flex gap-2 flex-wrap">
                          {isRevision && (
                            <button style={{
                              flex: 1, minWidth: 120, padding: '0.45rem 0.75rem', borderRadius: 8, border: 'none',
                              background: '#d97706', color: '#fff', fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                            }} onClick={() => setForwardId(app.id)}>
                              <i className="bi bi-send"></i> Forward to Customer
                            </button>
                          )}
                          <button className="btn-success-sm flex-grow-1" onClick={() => setSelected(app.id)}>
                            <i className="bi bi-check-circle me-1"></i>Verify
                          </button>
                          <button className="btn-danger-sm" onClick={() => setRejectId(app.id)}>
                            <i className="bi bi-x-circle me-1"></i>Reject
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <FormDetailModal
        show={!!viewItem} onClose={() => setViewItem(null)}
        type="application" item={viewItem} role="agent" />
    </div>
  )
}
