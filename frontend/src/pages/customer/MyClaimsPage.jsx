import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'

export default function MyClaimsPage() {
  const { t } = useTranslation()
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/customer/claims')
      .then(res => setClaims(Array.isArray(res.data) ? res.data : []))
      .catch(() => setClaims([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>My Claims</h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Track your insurance claims</p>
        </div>
        <Link to="/customer/submit-claim" className="btn-primary-custom" style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}>
          <i className="bi bi-plus-circle me-1"></i>New Claim
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : claims.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-file-earmark-medical" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No claims submitted yet</h5>
          <Link to="/customer/submit-claim" className="btn-primary-custom mt-3" style={{ display: 'inline-flex' }}>
            Submit a Claim
          </Link>
        </div>
      ) : (
        <div className="card-custom p-0">
          <div className="table-custom">
            <table className="w-100">
              <thead>
                <tr>
                  {['#', 'Policy', 'Claim Type', 'Amount (MMK)', 'Status', 'Submitted', 'Notes'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {claims.map(claim => (
                  <tr key={claim.id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>#{claim.id}</td>
                    <td style={{ fontWeight: 500 }}>{claim.policyName || claim.policy?.packageName}</td>
                    <td>{claim.claimType}</td>
                    <td>{Number(claim.amount).toLocaleString()}</td>
                    <td><span className={`badge-status badge-${claim.status?.toLowerCase()}`}>{claim.status}</span></td>
                    <td>{claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : '—'}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {claim.adminNote || claim.agentNote || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
