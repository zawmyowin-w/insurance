import React, { useEffect, useState } from 'react'
import api from '../../services/api'

const FREQ_LABEL = {
  MONTHLY: 'လစဥ်', QUARTERLY: 'သုံးလတစ်ကြိမ်',
  HALF_YEARLY: 'ခြောက်လတစ်ကြိမ်', YEARLY: 'နှစ်စဥ်',
}

const STATUS_META = {
  OVERDUE:              { label: 'သတ်မှတ်ရက်ကျော်',   color: '#dc2626', bg: '#fee2e2', icon: 'bi-exclamation-triangle-fill' },
  DUE:                  { label: 'ဤလပေးရမည်',         color: '#d97706', bg: '#fef3c7', icon: 'bi-clock-fill' },
  PENDING_VERIFICATION: { label: 'စစ်ဆေးဆဲ',           color: '#7c3aed', bg: '#ede9fe', icon: 'bi-hourglass-split' },
  UPCOMING:             { label: 'လာမည်',              color: '#64748b', bg: '#f1f5f9', icon: 'bi-calendar-event' },
  PAID:                 { label: 'ပေးပြီး',            color: '#16a34a', bg: '#dcfce7', icon: 'bi-check-circle-fill' },
}

const TABS = [
  { key: 'ALL',    label: 'အားလုံး',              icon: 'bi-list-ul'         },
  { key: 'OVERDUE',label: 'သတ်မှတ်ရက်ကျော်',     icon: 'bi-exclamation-triangle' },
  { key: 'DUE',    label: 'ဤလပေးရမည်',            icon: 'bi-clock'           },
  { key: 'PENDING_VERIFICATION', label: 'စစ်ဆေးဆဲ', icon: 'bi-hourglass-split' },
  { key: 'PAID',   label: 'ပေးပြီး',              icon: 'bi-check-circle'    },
]

export default function AdminPremiumSchedulePage() {
  const [entries, setEntries]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('ALL')
  const [search, setSearch]     = useState('')

  const fetchData = () => {
    setLoading(true)
    api.get('/admin/premium-schedule')
      .then(res => setEntries(Array.isArray(res.data) ? res.data : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetchData() }, [])

  const filtered = entries.filter(e => {
    const matchTab = activeTab === 'ALL' || e.scheduleStatus === activeTab
    const q = search.toLowerCase()
    const matchSearch = !q || [e.customerName, e.customerEmail, e.policyNumber, e.packageName]
      .some(f => f?.toLowerCase().includes(q))
    return matchTab && matchSearch
  })

  // Count per status for badges
  const counts = entries.reduce((acc, e) => {
    acc[e.scheduleStatus] = (acc[e.scheduleStatus] || 0) + 1
    return acc
  }, {})

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Premium Payment Schedule</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
          Customer များ၏ လစဥ်/နှစ်စဥ် Premium ပေးသွင်းမှု အခြေအနေ
        </p>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="row g-3 mb-4">
          {[
            { key: 'OVERDUE', label: 'သတ်မှတ်ရက်ကျော်', icon: 'bi-exclamation-triangle-fill', color: '#dc2626', bg: '#fee2e2' },
            { key: 'DUE',     label: 'ဤလပေးရမည်',       icon: 'bi-clock-fill',               color: '#d97706', bg: '#fef3c7' },
            { key: 'PENDING_VERIFICATION', label: 'စစ်ဆေးဆဲ', icon: 'bi-hourglass-split',    color: '#7c3aed', bg: '#ede9fe' },
            { key: 'PAID',    label: 'ပေးပြီး',          icon: 'bi-check-circle-fill',        color: '#16a34a', bg: '#dcfce7' },
          ].map(c => (
            <div key={c.key} className="col-6 col-md-3">
              <div className="card-custom" style={{ padding: '1rem', cursor: 'pointer', border: activeTab === c.key ? `2px solid ${c.color}` : '1px solid var(--border)' }}
                onClick={() => setActiveTab(c.key === activeTab ? 'ALL' : c.key)}>
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`bi ${c.icon}`} style={{ color: c.color, fontSize: '1.1rem' }}></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: c.color, lineHeight: 1 }}>{counts[c.key] || 0}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{c.label}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs + Search */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
        <div className="d-flex gap-1" style={{ background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 12 }}>
          {TABS.map(tab => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.4rem 0.9rem', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.8rem', transition: 'all .15s',
                display: 'flex', alignItems: 'center', gap: 5,
                background: activeTab === tab.key ? 'var(--bg-primary)' : 'transparent',
                color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              }}>
              <i className={`bi ${tab.icon}`}></i>
              <span className="d-none d-sm-inline">{tab.label}</span>
              {tab.key !== 'ALL' && counts[tab.key] > 0 && (
                <span style={{
                  background: STATUS_META[tab.key]?.bg, color: STATUS_META[tab.key]?.color,
                  borderRadius: 99, fontSize: '0.65rem', fontWeight: 800, padding: '0.05rem 0.4rem',
                }}>{counts[tab.key]}</span>
              )}
            </button>
          ))}
        </div>

        <input
          type="text" placeholder="Customer/Policy ရှာဖွေရန်..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="form-control-custom"
          style={{ maxWidth: 260, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : filtered.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-calendar-x" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>မှတ်တမ်းမရှိပါ</h5>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Recurring payment frequency သတ်မှတ်ထားသော Approved Policy မရှိသေးပါ
          </p>
        </div>
      ) : (
        <div className="card-custom p-0">
          <div className="table-custom">
            <table className="w-100">
              <thead>
                <tr>
                  {['Customer', 'Policy', 'ငွေပေးချေပုံစံ', 'ကာလ', 'ပေးသွင်းရမည်', 'ရက်', 'ပေးပြီး/စုစုပေါင်း', 'အခြေအနေ'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => {
                  const meta = STATUS_META[e.scheduleStatus] || STATUS_META.UPCOMING
                  return (
                    <tr key={`${e.applicationId}-${i}`}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{e.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.customerEmail}</div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 500 }}>{e.packageName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{e.policyNumber}</div>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {FREQ_LABEL[e.paymentFrequency] || e.paymentFrequency || '—'}
                      </td>
                      <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                        {e.periodLabel || `Period ${e.currentPeriodNumber}`}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          {e.installmentAmount != null ? Number(e.installmentAmount).toLocaleString() : '—'} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>MMK</span>
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {e.dueDate ? new Date(e.dueDate + 'T00:00:00').toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontWeight: 700, color: e.paidInstallments === e.totalInstallments ? '#16a34a' : 'var(--text-primary)' }}>
                            {e.paidInstallments}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>/ {e.totalInstallments}</span>
                        </div>
                        <div style={{ marginTop: 3, height: 4, borderRadius: 99, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 99, background: '#16a34a', width: `${(e.paidInstallments / e.totalInstallments) * 100}%` }}></div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.6rem',
                          borderRadius: 99, background: meta.bg, color: meta.color,
                        }}>
                          <i className={`bi ${meta.icon}`}></i>{meta.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
