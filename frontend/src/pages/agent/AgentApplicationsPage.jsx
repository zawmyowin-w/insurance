import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { toast } from 'react-toastify'
import DocumentViewerModal from '../../components/DocumentViewerModal'

function safeParse(json) {
  if (!json) return null
  try { return JSON.parse(json) } catch { return null }
}

export default function AgentApplicationsPage() {
  const { t } = useTranslation()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [rejectId, setRejectId] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [viewApp, setViewApp] = useState(null)
  const [showDocs, setShowDocs] = useState(false)

  const fetchApps = () => {
    api.get('/agent/applications')
      .then(res => setApps(Array.isArray(res.data) ? res.data : []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchApps() }, [])

  const handleVerify = async (id) => {
    setSubmitting(true)
    try {
      await api.put(`/agent/applications/${id}/verify`, { note })
      toast.success('Application verified and sent to admin')
      setSelected(null); setNote('')
      fetchApps()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async (id) => {
    if (!rejectNote.trim()) { toast.error('Please provide a reason for rejection'); return }
    setSubmitting(true)
    try {
      await api.put(`/agent/applications/${id}/reject`, { note: rejectNote })
      toast.success('Application rejected')
      setRejectId(null); setRejectNote('')
      fetchApps()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject')
    } finally {
      setSubmitting(false)
    }
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
          {apps.map(app => (
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
                {app.notes && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>{app.notes}</p>}
                <button className="btn-outline-custom mb-3" style={{ fontSize: '0.82rem', padding: '0.35rem 0.85rem' }} onClick={() => setViewApp(app)}>
                  <i className="bi bi-eye me-1"></i>View Full Details {app.documentCount > 0 && `(${app.documentCount} doc${app.documentCount > 1 ? 's' : ''})`}
                </button>
                {app.status === 'PENDING' && (
                  <>
                    {selected === app.id ? (
                      <div>
                        <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical' }}
                          placeholder="Verification notes (optional)..."
                          value={note} onChange={e => setNote(e.target.value)} />
                        <div className="d-flex gap-2">
                          <button className="btn-success-sm flex-grow-1" onClick={() => handleVerify(app.id)} disabled={submitting}>
                            {submitting ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-check-lg me-1"></i>Mark as Verified</>}
                          </button>
                          <button className="btn-outline-custom" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={() => setSelected(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : rejectId === app.id ? (
                      <div>
                        <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical' }}
                          placeholder="Reason for rejection *" required
                          value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
                        <div className="d-flex gap-2">
                          <button className="btn-danger-sm flex-grow-1" onClick={() => handleReject(app.id)} disabled={submitting}>
                            {submitting ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-x-lg me-1"></i>Reject</>}
                          </button>
                          <button className="btn-outline-custom" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={() => setRejectId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="d-flex gap-2">
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
          ))}
        </div>
      )}

      {viewApp && (
        <div className="modal show d-block modal-custom" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Application Details</h5>
                <button className="icon-btn" onClick={() => setViewApp(null)}><i className="bi bi-x-lg"></i></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="mb-3">
                  <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Policy Overview</div>
                  {[
                    ['Customer', viewApp.customerName], ['Email', viewApp.customerEmail],
                    ['Plan', viewApp.packageName], ['Type', viewApp.packageType],
                    ['Policy Number', viewApp.policyNumber], ['Coverage', `${Number(viewApp.coverageAmount).toLocaleString()} MMK`],
                    ['Duration', `${viewApp.duration} yr(s)`], ['Risk Level', viewApp.riskLevel],
                    ['Premium', viewApp.premiumAmount ? `${Number(viewApp.premiumAmount).toLocaleString()} MMK` : '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="d-flex gap-2 mb-1" style={{ fontSize: '0.86rem' }}>
                      <span style={{ color: 'var(--text-muted)', minWidth: 140, flexShrink: 0 }}>{label}</span>
                      <span style={{ fontWeight: 500 }}>{value || '—'}</span>
                    </div>
                  ))}
                </div>
                {safeParse(viewApp.commonInfo) && (
                  <div className="mb-3" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Personal Information</div>
                    {Object.entries(safeParse(viewApp.commonInfo)).map(([k, v]) => (
                      <div key={k} className="d-flex gap-2 mb-1" style={{ fontSize: '0.86rem' }}>
                        <span style={{ color: 'var(--text-muted)', minWidth: 140, flexShrink: 0, textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                        <span style={{ fontWeight: 500 }}>{String(v) || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
                {safeParse(viewApp.extraInfo) && (
                  <div className="mb-3" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Plan-Specific Details</div>
                    {Object.entries(safeParse(viewApp.extraInfo)).filter(([, v]) => v !== '' && v !== null).map(([k, v]) => (
                      <div key={k} className="d-flex gap-2 mb-1" style={{ fontSize: '0.86rem' }}>
                        <span style={{ color: 'var(--text-muted)', minWidth: 140, flexShrink: 0, textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                        <span style={{ fontWeight: 500 }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Uploaded Documents</div>
                  {viewApp.documentCount > 0 ? (
                    <button className="btn-outline-custom" onClick={() => setShowDocs(true)}>
                      <i className="bi bi-folder2-open me-2"></i>View {viewApp.documentCount} Document{viewApp.documentCount > 1 ? 's' : ''}
                    </button>
                  ) : <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No documents uploaded.</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDocs && viewApp && (
        <DocumentViewerModal
          title="Application Documents"
          urls={Array.from({ length: viewApp.documentCount }, (_, i) => `/agent/applications/${viewApp.id}/documents/${i}`)}
          onClose={() => setShowDocs(false)}
        />
      )}
    </div>
  )
}
