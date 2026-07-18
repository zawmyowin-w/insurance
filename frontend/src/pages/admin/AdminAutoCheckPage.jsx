import React, { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'

const STATUS_STYLE = {
  SUCCESS: { bg: '#dcfce7', color: '#16a34a', icon: 'bi-check-circle-fill' },
  PARTIAL:  { bg: '#fef9c3', color: '#ca8a04', icon: 'bi-exclamation-triangle-fill' },
  SKIPPED:  { bg: '#f1f5f9', color: '#64748b', icon: 'bi-skip-forward-circle' },
  ERROR:    { bg: '#fee2e2', color: '#dc2626', icon: 'bi-x-circle-fill' },
}
const TYPE_LABEL = {
  AUTO_VERIFY: { label: 'ငွေပေးချေ အလိုအလျောက် စစ်ဆေး', icon: 'bi-shield-check', color: '#1d4ed8' },
  REMINDER:    { label: 'Premium Due သတိပေး',               icon: 'bi-bell-fill',    color: '#d97706' },
}

function Badge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.SKIPPED
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: '0.15rem 0.55rem',
      fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <i className={`bi ${s.icon}`} style={{ fontSize: '0.7rem' }}></i>{status}
    </span>
  )
}

function StatCard({ icon, label, value, color, bg, sub }) {
  return (
    <div className="card-custom" style={{ padding: '1rem' }}>
      <div className="d-flex align-items-center gap-3">
        <div style={{ width: 44, height: 44, borderRadius: 12, background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`bi ${icon}`} style={{ color, fontSize: '1.2rem' }}></i>
        </div>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value ?? '—'}</div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 2 }}>{label}</div>
          {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
    </div>
  )
}

export default function AdminAutoCheckPage() {
  const [status,   setStatus]   = useState(null)
  const [logs,     setLogs]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [running,  setRunning]  = useState(null)   // 'verify' | 'reminder' | null
  const [logType,  setLogType]  = useState('ALL')
  const [expandLog, setExpandLog] = useState(null)
  const [toast,    setToast]    = useState(null)

  const load = useCallback(() => {
    return Promise.all([
      api.get('/admin/autocheck/status'),
      api.get(`/admin/autocheck/logs?type=${logType}`),
    ]).then(([s, l]) => {
      setStatus(s.data)
      setLogs(l.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [logType])

  useEffect(() => { load() }, [load])

  // auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [load])

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const trigger = async (type) => {
    setRunning(type)
    try {
      const url = type === 'verify' ? '/admin/autocheck/run/verify' : '/admin/autocheck/run/reminders'
      const res = await api.post(url)
      const d = res.data
      if (type === 'verify') {
        showToast(`✅ စစ်ဆေးပြီး — Verified: ${d.verified ?? 0} | Skipped: ${d.skipped ?? 0} | Errors: ${d.errors ?? 0}`)
      } else {
        showToast(`✅ သတိပေးချက်များ ပေးပို့ပြီး`)
      }
      await load()
    } catch (e) {
      showToast('❌ ' + (e?.response?.data?.message || 'Error occurred'), false)
    } finally {
      setRunning(null)
    }
  }

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border" style={{ color: 'var(--primary)' }}></div>
    </div>
  )

  const lastVerify   = status?.lastRuns?.AUTO_VERIFY
  const lastReminder = status?.lastRuns?.REMINDER

  return (
    <div className="fade-in">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.ok ? '#dcfce7' : '#fee2e2',
          color: toast.ok ? '#16a34a' : '#dc2626',
          border: `1px solid ${toast.ok ? '#86efac' : '#fca5a5'}`,
          borderRadius: 10, padding: '0.75rem 1.25rem',
          fontWeight: 600, fontSize: '0.85rem', boxShadow: '0 4px 20px rgba(0,0,0,.12)',
          maxWidth: 440,
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            <i className="bi bi-robot me-2" style={{ color: 'var(--primary)' }}></i>
            Auto-Check System
          </h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.88rem' }}>
            Spring AI ဖြင့် လုပ်ဆောင်သည့် အလိုအလျောက် စစ်ဆေး / သတိပေးစနစ်
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: status?.enabled ? '#dcfce7' : '#fee2e2',
            color: status?.enabled ? '#16a34a' : '#dc2626',
            border: `1px solid ${status?.enabled ? '#86efac' : '#fca5a5'}`,
            borderRadius: 8, padding: '0.35rem 0.85rem', fontWeight: 700, fontSize: '0.82rem',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%',
              background: status?.enabled ? '#16a34a' : '#dc2626',
              display: 'inline-block', animation: status?.enabled ? 'pulse 2s infinite' : 'none' }}></span>
            {status?.enabled ? 'Active' : 'Disabled'}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: status?.aiEnabled ? '#eff6ff' : '#f8fafc',
            color: status?.aiEnabled ? '#1d4ed8' : '#94a3b8',
            border: `1px solid ${status?.aiEnabled ? '#bfdbfe' : '#e2e8f0'}`,
            borderRadius: 8, padding: '0.35rem 0.85rem', fontWeight: 600, fontSize: '0.8rem',
          }}>
            <i className="bi bi-stars"></i>
            {status?.aiEnabled ? 'Spring AI ✓' : 'Spring AI (key မပါ)'}
          </span>
        </div>
      </div>

      {/* AI key missing notice */}
      {!status?.aiEnabled && (
        <div className="mb-4" style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '0.85rem 1.1rem', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <i className="bi bi-info-circle-fill" style={{ color: '#d97706', fontSize: '1.1rem', marginTop: 1, flexShrink: 0 }}></i>
          <div>
            <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.85rem' }}>OpenAI API Key မပါသေးပါ</div>
            <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: 2 }}>
              Auto-check system သည် ဆက်လက်လုပ်ဆောင်နိုင်သော်လည်း AI-generated notifications
              မရနိုင်သေးပါ — template messages ကိုသုံးမည်။
              <code style={{ background: '#fef3c7', padding: '0.1rem 0.4rem', borderRadius: 4, marginLeft: 6 }}>OPENAI_API_KEY</code>
              &nbsp;ကို Secrets တွင် ထည့်သွင်းပါ။
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <StatCard icon="bi-shield-check" label="ယနေ့ Auto-Verified" value={status?.todayVerified ?? 0}
            color="#1d4ed8" bg="#eff6ff" sub="ငွေပေးချေမှု အတည်ပြုပြီး" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-bell-fill" label="ယနေ့ Reminders" value={status?.todayReminders ?? 0}
            color="#d97706" bg="#fffbeb" sub="သတိပေးချက် ပေးပို့ပြီး" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-clock" label="Verify အချိန်" value="9:00 AM"
            color="#7c3aed" bg="#f5f3ff" sub="Myanmar Time နေ့စဥ်" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-alarm" label="Reminder အချိန်" value="8:00 AM"
            color="#0891b2" bg="#ecfeff" sub="Myanmar Time နေ့စဥ်" />
        </div>
      </div>

      {/* Configuration + Last runs */}
      <div className="row g-4 mb-4">
        {/* Scheduler config */}
        <div className="col-12 col-lg-5">
          <div className="card-custom h-100">
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              <i className="bi bi-gear me-2" style={{ color: 'var(--primary)' }}></i>
              Scheduler ဆက်တင်များ
            </h6>
            <div className="d-flex flex-column gap-3">
              {[
                { label: 'ငွေပေးချေ စစ်ဆေး Cron',   value: status?.verifyCron,     icon: 'bi-shield-check', color: '#1d4ed8' },
                { label: 'Reminder Cron',              value: status?.reminderCron,   icon: 'bi-bell',         color: '#d97706' },
                { label: 'Pending အနည်းဆုံးစောင့်ချိန်', value: `${status?.minPendingHours} နာရီ`, icon: 'bi-hourglass', color: '#7c3aed' },
                { label: 'Myanmar ယခုအချိန်',         value: status?.currentTimeMM,  icon: 'bi-clock',        color: '#0891b2' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`bi ${row.icon}`} style={{ color: row.color, fontSize: '0.9rem' }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{row.label}</div>
                    <code style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {row.value ?? '—'}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Last runs */}
        <div className="col-12 col-lg-7">
          <div className="card-custom h-100">
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              <i className="bi bi-clock-history me-2" style={{ color: 'var(--primary)' }}></i>
              နောက်ဆုံး Run မှတ်တမ်း
            </h6>
            <div className="d-flex flex-column gap-3">
              {[
                { key: 'AUTO_VERIFY', data: lastVerify   },
                { key: 'REMINDER',    data: lastReminder },
              ].map(({ key, data }) => {
                const t = TYPE_LABEL[key]
                return (
                  <div key={key} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '0.85rem 1rem' }}>
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <i className={`bi ${t.icon}`} style={{ color: t.color, fontSize: '1rem' }}></i>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{t.label}</span>
                      </div>
                      {data ? <Badge status={data.status} /> : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>မရှိသေး</span>}
                    </div>
                    {data && (
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{data.summary}</div>
                        <div className="d-flex gap-3 flex-wrap">
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            စစ်ဆေး: <b style={{ color: 'var(--text-primary)' }}>{data.totalChecked}</b>
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            ရလဒ်: <b style={{ color: '#16a34a' }}>{data.affectedCount}</b>
                          </span>
                          {data.aiAssisted && (
                            <span style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 600 }}>
                              <i className="bi bi-stars me-1"></i>AI-assisted
                            </span>
                          )}
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {data.createdAt ? new Date(data.createdAt).toLocaleString() : '—'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Manual trigger buttons */}
      <div className="card-custom mb-4">
        <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          <i className="bi bi-play-circle me-2" style={{ color: 'var(--primary)' }}></i>
          ကိုယ်တိုင် Run ပြုလုပ်ခြင်း
        </h6>
        <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Scheduler မစောင့်ဘဲ ချက်ချင်း run ချင်ပါက အောက်ပါ ခလုတ်များကို နှိပ်ပါ
        </p>
        <div className="d-flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => trigger('verify')}
            disabled={running !== null}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '0.55rem 1.25rem', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: running === 'verify' ? '#e2e8f0' : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
              color: running === 'verify' ? '#64748b' : '#fff',
              fontWeight: 700, fontSize: '0.85rem', transition: 'all .15s',
            }}>
            {running === 'verify'
              ? <><span className="spinner-border spinner-border-sm"></span> စစ်ဆေးနေသည်...</>
              : <><i className="bi bi-shield-check"></i> ငွေပေးချေ စစ်ဆေး (Run Now)</>}
          </button>
          <button
            type="button"
            onClick={() => trigger('reminder')}
            disabled={running !== null}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '0.55rem 1.25rem', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: running === 'reminder' ? '#e2e8f0' : 'linear-gradient(135deg, #d97706, #f59e0b)',
              color: running === 'reminder' ? '#64748b' : '#fff',
              fontWeight: 700, fontSize: '0.85rem', transition: 'all .15s',
            }}>
            {running === 'reminder'
              ? <><span className="spinner-border spinner-border-sm"></span> ပေးပို့နေသည်...</>
              : <><i className="bi bi-bell"></i> Premium Reminder ပေးပို့ (Run Now)</>}
          </button>
        </div>
      </div>

      {/* Log table */}
      <div className="card-custom p-0">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            <i className="bi bi-list-ul me-2" style={{ color: 'var(--primary)' }}></i>
            Run မှတ်တမ်း Log (နောက်ဆုံး 50)
          </div>
          <div className="d-flex gap-1" style={{ background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 8 }}>
            {['ALL', 'AUTO_VERIFY', 'REMINDER'].map(t => (
              <button key={t} type="button" onClick={() => setLogType(t)}
                style={{
                  padding: '0.3rem 0.75rem', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.75rem',
                  background: logType === t ? 'var(--bg-primary)' : 'transparent',
                  color: logType === t ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: logType === t ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                }}>
                {t === 'ALL' ? 'အားလုံး' : t === 'AUTO_VERIFY' ? 'Verify' : 'Reminder'}
              </button>
            ))}
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-5" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <i className="bi bi-inbox" style={{ fontSize: '2rem', opacity: 0.3, display: 'block', marginBottom: 8 }}></i>
            Log မှတ်တမ်းမရှိသေးပါ
          </div>
        ) : (
          <div>
            {logs.map((log, idx) => {
              const t = TYPE_LABEL[log.checkType] || { label: log.checkType, icon: 'bi-circle', color: '#64748b' }
              const isOpen = expandLog === idx
              return (
                <div key={log.id} style={{ borderBottom: idx < logs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div
                    onClick={() => setExpandLog(isOpen ? null : idx)}
                    style={{ padding: '0.75rem 1.25rem', cursor: 'pointer',
                      background: isOpen ? 'var(--bg-secondary)' : 'transparent',
                      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem 1rem' }}>
                    <div className="d-flex align-items-center gap-2" style={{ minWidth: 180 }}>
                      <i className={`bi ${t.icon}`} style={{ color: t.color, fontSize: '0.9rem' }}></i>
                      <span style={{ fontWeight: 600, fontSize: '0.83rem', color: 'var(--text-primary)' }}>{t.label}</span>
                    </div>
                    <Badge status={log.status} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flex: 1 }}>{log.summary}</span>
                    <div className="d-flex align-items-center gap-3">
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        စစ်ဆေး: <b>{log.totalChecked}</b> · ရလဒ်: <b style={{ color: '#16a34a' }}>{log.affectedCount}</b>
                      </span>
                      {log.aiAssisted && <i className="bi bi-stars" style={{ color: '#1d4ed8', fontSize: '0.85rem' }} title="AI-assisted"></i>}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                      </span>
                      <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}></i>
                    </div>
                  </div>

                  {isOpen && log.details?.length > 0 && (
                    <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1.25rem 0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                        အသေးစိတ် ({log.details.length} ခု)
                      </div>
                      <div className="d-flex flex-column gap-1" style={{ maxHeight: 280, overflowY: 'auto' }}>
                        {log.details.map((d, i) => {
                          const outcome = d.outcome || d.status || 'UNKNOWN'
                          const s = STATUS_STYLE[outcome] || STATUS_STYLE.SKIPPED
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem 0.75rem',
                              background: 'var(--bg-primary)', borderRadius: 7, padding: '0.4rem 0.75rem',
                              border: '1px solid var(--border)', fontSize: '0.78rem' }}>
                              <span style={{ background: s.bg, color: s.color, borderRadius: 4,
                                padding: '0.1rem 0.4rem', fontWeight: 700, fontSize: '0.7rem' }}>{outcome}</span>
                              {d.paymentId && <span style={{ color: 'var(--text-muted)' }}>Payment #{d.paymentId}</span>}
                              {d.customer && <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.customer}</span>}
                              {d.customerName && <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.customerName}</span>}
                              {d.policy && <span style={{ color: 'var(--text-secondary)' }}>{d.policy}</span>}
                              {d.amount && <span style={{ color: '#16a34a', fontWeight: 700 }}>{Number(d.amount).toLocaleString()} MMK</span>}
                              {d.period && <span style={{ color: '#7c3aed' }}>{d.period}</span>}
                              {d.urgency && <span style={{ color: d.urgency === 'OVERDUE' ? '#dc2626' : '#d97706', fontWeight: 600 }}>{d.urgency}</span>}
                              {d.reason && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>({d.reason})</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
