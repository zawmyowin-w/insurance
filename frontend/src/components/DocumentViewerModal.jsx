import React, { useEffect, useState } from 'react'
import api from '../services/api'

/**
 * Fetches a list of protected document URLs (via axios, so the JWT Authorization
 * header is attached) and renders them as image previews or PDF links.
 * urls: string[] — relative API paths, e.g. `/agent/applications/5/documents/0`
 */
export default function DocumentViewerModal({ title, urls, onClose }) {
  const [blobs, setBlobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const created = []
    Promise.all((urls || []).map(u =>
      api.get(u, { responseType: 'blob' })
        .then(res => {
          const objUrl = URL.createObjectURL(res.data)
          created.push(objUrl)
          return { url: objUrl, type: res.data.type }
        })
        .catch(() => null)
    )).then(results => {
      if (active) setBlobs(results.filter(Boolean))
      setLoading(false)
    })
    return () => { active = false; created.forEach(u => URL.revokeObjectURL(u)) }
  }, [urls])

  return (
    <div className="modal show d-block modal-custom" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h5>
            <button className="icon-btn" onClick={onClose}><i className="bi bi-x-lg"></i></button>
          </div>
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center py-4"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
            ) : blobs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No documents uploaded.</p>
            ) : (
              <div className="row g-3">
                {blobs.map((b, i) => (
                  <div key={i} className="col-12 col-md-6">
                    {b.type === 'application/pdf' ? (
                      <a href={b.url} target="_blank" rel="noreferrer" className="btn-outline-custom w-100" style={{ justifyContent: 'center' }}>
                        <i className="bi bi-file-earmark-pdf me-2"></i>View PDF Document {i + 1}
                      </a>
                    ) : (
                      <a href={b.url} target="_blank" rel="noreferrer">
                        <img src={b.url} alt={`document-${i}`} style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
