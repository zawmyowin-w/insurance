import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import { toast } from 'react-toastify'
import FormDetailModal from '../../components/FormDetailModal'
import { apiError } from '../../utils/apiError'

const FILTER_LABELS = {
  ALL: 'အားလုံး · All',
  PENDING: 'ဆဲဆေးဆဲ · Pending',
  VERIFIED: 'အတည်ပြုပြီး · Verified',
  REVISION_REQUESTED: 'ပြင်ဆင်ရန် · Revision',
  REJECTED: 'ပယ်ချပြီး · Rejected',
}

export default function AgentApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
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

  const FILTERS = ['ALL', 'PENDING', 'VERIFIED', 'REVISION_REQUESTED', 'REJECTED']
  const filter = (() => { const f = searchParams.get('filter'); return FILTERS.includes(f) ? f : 'ALL' })()

  const fetchApps = () => {
    setLoading(true)
    const url = filter && filter !== 'ALL' ? `/agent/applications?status=${filter}` : '/agent/applications?status=ALL'
    api.get(url)
      .then(res => setApps(Array.isArray(res.data) ? res.data : []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetchApps() }, [filter])

  const clearActions = () => {
    setSelected(null); setNote('')
    setRejectId(null); setRejectNote('')
    setForwardId(null); setForwardNote('')
  }

  const handleVerify = async (id) => {
    setSubmitting(true)
    try {
      await api.put(`/agent/applications/${id}/verify`, { note })
      toast.success('လျှောက်လွှာ အတည်ပြုပြီး Admin ထံ ပေးပို့ပြီးပါပြီ · Application verified and sent to admin')
      clearActions(); fetchApps()
    } catch (err) { apiError(err) } finally { setSubmitting(false) }
  }

  const handleReject = async (id) => {
    if (!rejectNote.trim()) { toast.error('အကြောင်းပြချက် ဖြည့်ပါ · Please provide a reason'); return }
    setSubmitting(true)
    try {
      await api.put(`/agent/applications/${id}/reject`, { note: rejectNote })
      toast.success('လျှောက်လွှာ ပယ်ချပြီးပါပြီ · Application rejected')
      clearActions(); fetchApps()
    } catch (err) { apiError(err) } finally { setSubmitting(false) }
  }

  const handleForward = async (id) => {
    setSubmitting(true)
    try {
      await api.put(`/agent/applications/${id}/request-revision`, { note: forwardNote })
      toast.success('Customer ထံ ပြင်ဆင်ရန် အကြောင်းကြားပြီးပါပြီ · Customer notified to update their application')
      clearActions(); fetchApps()
    } catch (err) { apiError(err) } finally { setSubmitting(false) }
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          လျှောက်လွှာများ စစ်ဆေး
          <span style={{ fontWeight: 400, fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 8 }}>· Check Applications</span>
        </h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
          Customer လျှောက်လွှာများကို Admin ထံ မတင်မီ စစ်ဆေး အတည်ပြုရန်
          <span style={{ opacity: 0.7 }}> · Verify customer policy applications before forwarding to admin</span>
        </p>
      </div>

      {/* စစ်ထုတ်ရန် Tab / Filter tabs */}
      <div className="d-flex gap-2 flex-wrap mb-4">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setSearchParams(f === 'ALL' ? {} : { filter: f })} style={{
            padding: '0.35rem 0.85rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            border: `1.5px solid ${filter === f ? 'var(--primary)' : 'var(--border)'}`,
            background: filter === f ? 'var(--primary)' : 'var(--bg-card)',
            color: filter === f ? '#fff' : 'var(--text-secondary)'
          }}>{FILTER_LABELS[f] || f}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : apps.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-check-circle" style={{ fontSize: '3rem', color: 'var(--secondary)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
            ဆဲဆေးဆဲ လျှောက်လွှာ မရှိပါ
            <span style={{ fontWeight: 400, fontSize: '0.85rem', display: 'block', marginTop: 4 }}>No pending applications</span>
          </h5>
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

                  {/* Admin မှ ပြင်ဆင်ရန် မှတ်ချက် / Admin revision note */}
                  {isRevision && app.adminNote && (
                    <div style={{
                      padding: '0.6rem 0.875rem', borderRadius: 8, marginBottom: '0.75rem',
                      background: '#fefce8', border: '1px solid #fcd34d', fontSize: '0.82rem'
                    }}>
                      <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 2 }}>
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        Admin မှ ပြင်ဆင်ရန် တောင်းဆိုသည် · Admin requested revision:
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
                        <i className="bi bi-person me-1"></i>
                        Customer ထံ သင့်မှတ်ချက် · Your note to customer:
                      </div>
                      <div style={{ color: '#1d4ed8' }}>{app.agentNote}</div>
                    </div>
                  )}

                  <div className="row g-2 mb-3">
                    {[
                      { label: 'Plan',                              value: app.packageName || app.package?.name },
                      { label: 'အမျိုးအစား · Type',                 value: app.packageType || app.package?.type },
                      { label: 'အကာအကွယ် · Coverage',              value: `${Number(app.coverageAmount).toLocaleString()} MMK` },
                      { label: 'သက်တမ်း · Duration',                value: `${app.duration} နှစ် · year${app.duration > 1 ? 's' : ''}` },
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
                    <i className="bi bi-eye"></i>
                    ဖောင်အသေးစိတ်ကြည့် · View Full Form Details
                  </button>

                  {/* PENDING နှင့် REVISION_REQUESTED အတွက် လုပ်ဆောင်ချက်များ / Actions */}
                  {(isPending || isRevision) && (
                    <>
                      {activeAction === 'verify' && (
                        <div>
                          <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical' }}
                            placeholder="အတည်ပြုမှတ်ချက် (မဖြစ်မနေ မဟုတ်) · Verification notes (optional)…"
                            value={note} onChange={e => setNote(e.target.value)} />
                          <div className="d-flex gap-2">
                            <button className="btn-success-sm flex-grow-1" onClick={() => handleVerify(app.id)} disabled={submitting}>
                              {submitting
                                ? <span className="spinner-border spinner-border-sm"></span>
                                : <><i className="bi bi-check-lg me-1"></i>အတည်ပြု · Mark Verified</>}
                            </button>
                            <button className="btn-outline-custom" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={clearActions}>
                              မလုပ်တော့ · Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      {activeAction === 'reject' && (
                        <div>
                          <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical' }}
                            placeholder="ပယ်ချအကြောင်းပြချက် * · Reason for rejection *"
                            value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
                          <div className="d-flex gap-2">
                            <button className="btn-danger-sm flex-grow-1" onClick={() => handleReject(app.id)} disabled={submitting}>
                              {submitting
                                ? <span className="spinner-border spinner-border-sm"></span>
                                : <><i className="bi bi-x-lg me-1"></i>ပယ်ချ · Reject</>}
                            </button>
                            <button className="btn-outline-custom" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={clearActions}>
                              မလုပ်တော့ · Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      {activeAction === 'forward' && (
                        <div>
                          <textarea rows={2} className="form-control-custom w-100 mb-2" style={{ resize: 'vertical' }}
                            placeholder="Customer ထံ မှတ်ချက် — ဘာပြင်ဆင်ရမည် · Note to customer — what needs to be updated…"
                            value={forwardNote} onChange={e => setForwardNote(e.target.value)} />
                          <div className="d-flex gap-2">
                            <button style={{
                              flex: 1, padding: '0.45rem 0.75rem', borderRadius: 8, border: 'none',
                              background: '#d97706', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                            }} onClick={() => handleForward(app.id)} disabled={submitting}>
                              {submitting
                                ? <span className="spinner-border spinner-border-sm"></span>
                                : <><i className="bi bi-send me-1"></i>Customer ထံ အကြောင်းကြား · Notify Customer</>}
                            </button>
                            <button className="btn-outline-custom" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={clearActions}>
                              မလုပ်တော့ · Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      {activeAction === null && (
                        <div className="d-flex flex-column gap-2">
                          {isRevision && (
                            <button onClick={() => setForwardId(app.id)} style={{
                              width: '100%', padding: '0.5rem', borderRadius: 8, border: 'none',
                              background: '#d97706', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                            }}>
                              <i className="bi bi-send"></i>Customer ထံ ပေးပို့ · Forward to Customer
                            </button>
                          )}
                          <div className="d-flex gap-2">
                            <button onClick={() => setSelected(app.id)} style={{
                              flex: 1, padding: '0.5rem', borderRadius: 8, border: 'none',
                              background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                            }}>
                              <i className="bi bi-check-circle"></i>အတည်ပြု · Verify
                            </button>
                            <button onClick={() => setRejectId(app.id)} style={{
                              flex: 1, padding: '0.5rem', borderRadius: 8, border: 'none',
                              background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                            }}>
                              <i className="bi bi-x-circle"></i>ပယ်ချ · Reject
                            </button>
                          </div>
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
