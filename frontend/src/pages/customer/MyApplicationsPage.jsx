import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { toast } from 'react-toastify'

export default function MyApplicationsPage() {
  const { t } = useTranslation()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelId, setCancelId] = useState(null)

  const fetchApps = () => {
    api.get('/customer/applications')
      .then(res => setApps(Array.isArray(res.data) ? res.data : []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchApps() }, [])

  const handleCancel = async (id) => {
    if (!window.confirm(t('apps.cancelConfirm'))) return
    try {
      await api.delete(`/customer/applications/${id}`)
      toast.success(t('apps.cancelSuccess'))
      fetchApps()
    } catch (err) {
      toast.error(err.response?.data?.message || t('apps.cancelError'))
    }
  }

  const statusOrder = { PENDING: 0, VERIFIED: 1, APPROVED: 2, REJECTED: 3, CANCELLED: 4 }

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('apps.title')}</h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{t('apps.subtitle')}</p>
        </div>
        <Link to="/customer/apply" className="btn-primary-custom" style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}>
          <i className="bi bi-plus-circle me-1"></i>{t('apps.applyNew')}
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : apps.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-file-earmark-text" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{t('apps.empty')}</h5>
          <Link to="/customer/apply" className="btn-primary-custom mt-3" style={{ display: 'inline-flex' }}>
            {t('apps.applyNow')}
          </Link>
        </div>
      ) : (
        <div className="card-custom p-0">
          <div className="table-custom">
            <table className="w-100">
              <thead>
                <tr>
                  {['#', 'Plan', 'Type', 'Coverage (MMK)', 'Duration', 'Status', 'Applied On', 'Actions'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps.map((app, idx) => (
                  <tr key={app.id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>#{app.id}</td>
                    <td style={{ fontWeight: 500 }}>{app.packageName || app.package?.name}</td>
                    <td><span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)' }}>{app.packageType || app.package?.type}</span></td>
                    <td>{Number(app.coverageAmount).toLocaleString()}</td>
                    <td>{app.duration} yr{app.duration > 1 ? 's' : ''}</td>
                    <td><span className={`badge-status badge-${app.status?.toLowerCase()}`}>{app.status}</span></td>
                    <td>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}</td>
                    <td>
                      {app.status === 'PENDING' && (
                        <button className="btn-danger-sm" onClick={() => handleCancel(app.id)}>
                          <i className="bi bi-x-circle me-1"></i>Cancel
                        </button>
                      )}
                      {app.status === 'APPROVED' && (
                        <Link to="/customer/payments" className="btn-success-sm" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <i className="bi bi-credit-card"></i> Pay
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status legend */}
      <div className="card-custom mt-4">
        <h6 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Status Guide</h6>
        <div className="d-flex gap-3 flex-wrap">
          {[
            { s: 'PENDING', label: 'Submitted, awaiting agent review' },
            { s: 'VERIFIED', label: 'Verified by agent, pending admin' },
            { s: 'APPROVED', label: 'Approved — pay to activate' },
            { s: 'REJECTED', label: 'Rejected by admin' },
            { s: 'CANCELLED', label: 'Cancelled by you' },
          ].map(item => (
            <div key={item.s} className="d-flex align-items-center gap-2">
              <span className={`badge-status badge-${item.s.toLowerCase()}`}>{item.s}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
