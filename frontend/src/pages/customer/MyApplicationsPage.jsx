import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { toast } from 'react-toastify'
import FormDetailModal from '../../components/FormDetailModal'

export default function MyApplicationsPage() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewItem, setViewItem] = useState(null)

  const fetchApps = () => {
    api.get('/customer/applications')
      .then(res => setApps(Array.isArray(res.data) ? res.data : []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetchApps() }, [])

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this application?')) return
    try {
      await api.delete(`/customer/applications/${id}`)
      toast.success('Application cancelled')
      fetchApps()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel')
    }
  }

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>My Applications</h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Track your insurance applications</p>
        </div>
        <Link to="/customer/apply" className="btn-primary-custom" style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}>
          <i className="bi bi-plus-circle me-1"></i>New Application
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : apps.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-file-earmark-text" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No applications yet</h5>
          <Link to="/customer/apply" className="btn-primary-custom mt-3" style={{ display: 'inline-flex' }}>Apply Now</Link>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {apps.map(app => (
            <div key={app.id} className="card-custom">
              <div className="row align-items-center g-2">
                <div className="col-12 col-md-7">
                  <div className="d-flex align-items-center gap-3 mb-1">
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {app.packageName || app.package?.name}
                      </div>
                      <small style={{ color: 'var(--text-muted)' }}>
                        #{app.id} · {app.packageType} · Applied {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}
                      </small>
                    </div>
                    <span className={`badge-status badge-${app.status?.toLowerCase()}`}>{app.status}</span>
                  </div>
                  <div className="d-flex gap-3 flex-wrap" style={{ fontSize: '0.83rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Coverage: <strong style={{ color: 'var(--text-primary)' }}>{Number(app.coverageAmount).toLocaleString()} MMK</strong></span>
                    <span style={{ color: 'var(--text-muted)' }}>Duration: <strong style={{ color: 'var(--text-primary)' }}>{app.duration} yr</strong></span>
                    {app.premiumAmount && <span style={{ color: 'var(--text-muted)' }}>Premium: <strong style={{ color: 'var(--primary)' }}>{Number(app.premiumAmount).toLocaleString()} MMK</strong></span>}
                    {app.riskLevel && <span style={{ color: 'var(--text-muted)' }}>Risk: <strong style={{ color: app.riskLevel === 'HIGH' ? '#dc2626' : app.riskLevel === 'MEDIUM' ? '#d97706' : '#16a34a' }}>{app.riskLevel}</strong></span>}
                  </div>
                  {app.adminNote && <p style={{ color: '#16a34a', fontSize: '0.82rem', margin: '0.4rem 0 0' }}><i className="bi bi-check-circle me-1"></i>{app.adminNote}</p>}
                  {app.agentNote && <p style={{ color: '#1d4ed8', fontSize: '0.82rem', margin: '0.25rem 0 0' }}><i className="bi bi-person me-1"></i>Agent: {app.agentNote}</p>}
                </div>
                <div className="col-12 col-md-5">
                  <div className="d-flex gap-2 justify-content-md-end flex-wrap">
                    <button onClick={() => setViewItem(app)} style={{
                      padding: '0.4rem 0.9rem', borderRadius: 8, border: '1.5px solid var(--primary)',
                      background: 'transparent', color: 'var(--primary)', cursor: 'pointer',
                      fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      <i className="bi bi-eye"></i> View Form
                    </button>
                    {app.status === 'PENDING' && (
                      <button onClick={() => handleCancel(app.id)} style={{
                        padding: '0.4rem 0.9rem', borderRadius: 8, border: '1.5px solid #dc2626',
                        background: 'transparent', color: '#dc2626', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.82rem'
                      }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormDetailModal
        show={!!viewItem} onClose={() => setViewItem(null)}
        type="application" item={viewItem} role="customer" />
    </div>
  )
}
