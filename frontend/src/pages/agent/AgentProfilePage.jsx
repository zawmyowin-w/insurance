import React from 'react'
import { useAuth } from '../../context/AuthContext'

const Field = ({ label, value }) => (
  <div className="col-12 col-md-6">
    <label className="form-label-custom">{label}</label>
    <input disabled className="form-control-custom w-100" value={value || '—'} style={{ opacity: 0.7, cursor: 'not-allowed' }} />
  </div>
)

export default function AgentProfilePage() {
  const { user } = useAuth()

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>My Profile</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
          Your account details as set up by the admin
        </p>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card-custom">
            <div className="d-flex align-items-start gap-2 mb-3" style={{
              background: 'var(--bg-hover, rgba(29,78,216,0.06))', border: '1px solid var(--border)',
              borderRadius: 10, padding: '0.75rem 1rem'
            }}>
              <i className="bi bi-info-circle" style={{ color: '#1d4ed8', marginTop: 2 }}></i>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Agent profiles can only be edited by an admin. Please contact your administrator to update any of these details.
              </div>
            </div>
            <div className="row g-3">
              <Field label="Full Name" value={user?.name} />
              <Field label="Email" value={user?.email} />
              <Field label="Phone" value={user?.phone} />
              <Field label="Insurance Type" value={user?.insuranceType} />
              <Field label="Address" value={user?.address} />
              <Field label="Status" value={user?.active ? 'Active' : 'Inactive'} />
              <Field label="Joined" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
