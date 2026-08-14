import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'

const STATUS_STYLE = {
  SUCCESS: { bg: '#dcfce7', color: '#16a34a', icon: 'bi-check-circle-fill' },
  PARTIAL:  { bg: '#fef9c3', color: '#ca8a04', icon: 'bi-exclamation-triangle-fill' },
  SKIPPED:  { bg: '#f1f5f9', color: '#64748b', icon: 'bi-skip-forward-circle' },
  ERROR:    { bg: '#fee2e2', color: '#dc2626', icon: 'bi-x-circle-fill' },
}
const TYPE_META = {
  REMINDER:         { icon: 'bi-bell-fill',    color: '#d97706', labelKey: 'typeReminder' },
  REVISION_CLEANUP: { icon: 'bi-trash3-fill',  color: '#dc2626', labelKey: 'typeCleanup'  },
}

function Badge({ status, t }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.SKIPPED
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: '0.15rem 0.55rem',
      fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <i className={`bi ${s.icon}`} style={{ fontSize: '0.7rem' }}></i>{t(`admin.autoCheck.status${status}`, status)}
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

// ─── Advertise Section (packages only) ──────────────────────────────────────
function AdvertiseSection({ showToast }) {
  const { t } = useTranslation()
  const [packages,      setPackages]      = useState([])
  const [selectedPkg,   setSelectedPkg]   = useState(null)
  const [customMsg,     setCustomMsg]     = useState('')
  const [sending,       setSending]       = useState(false)
  const [history,       setHistory]       = useState([])
  const [loadingItems,  setLoadingItems]  = useState(true)
  const [refreshing,    setRefreshing]    = useState(false)

  const loadItems = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoadingItems(true)
    return Promise.all([
      api.get('/admin/packages').catch(() => ({ data: [] })),
      api.get('/admin/advertise/history').catch(() => ({ data: [] })),
    ]).then(([p, h]) => {
      setPackages(Array.isArray(p.data) ? p.data : [])
      setHistory(Array.isArray(h.data) ? h.data : [])
    }).finally(() => { setLoadingItems(false); setRefreshing(false) })
  }

  useEffect(() => { loadItems() }, [])

  const handleBroadcast = async () => {
    if (!selectedPkg) { showToast('❌ Please select a package to advertise.', false); return }
    setSending(true)
    try {
      const pkgName = selectedPkg.packageName || selectedPkg.name
      const title   = `🎉 New Insurance Package: ${pkgName}`
      const message = customMsg.trim() || `Discover our "${pkgName}" insurance package — great coverage options are available for you! Tap to learn more.`

      await api.post('/admin/advertise/broadcast', {
        title,
        message,
        packageId: selectedPkg.id,
      })

      showToast('✅ Advertisement sent to all customers!')
      setSelectedPkg(null); setCustomMsg('')

      const h = await api.get('/admin/advertise/history').catch(() => ({ data: [] }))
      setHistory(Array.isArray(h.data) ? h.data : [])
    } catch (e) {
      showToast('❌ ' + (e?.response?.data?.message || t('admin.autoCheck.errorOccurred')), false)
    } finally { setSending(false) }
  }

  return (
    <div className="card-custom mb-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          <i className="bi bi-megaphone-fill me-2" style={{ color: '#16a34a' }}></i>
          {t('admin.autoCheck.advertiseTitle')}
        </h6>
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {t('admin.autoCheck.advertiseSubtitle')}
          </span>
          <button type="button" onClick={() => loadItems(true)} disabled={refreshing}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '0.28rem 0.65rem', borderRadius: 7, border: '1.5px solid var(--border)',
              background: 'var(--bg-primary)', color: 'var(--text-secondary)',
              fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
            }}>
            <i className={`bi bi-arrow-clockwise${refreshing ? ' spin-icon' : ''}`}
              style={{ fontSize: '0.8rem', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}></i>
            {refreshing ? t('admin.common.loading', 'Loading…') : t('admin.autoCheck.refreshList', 'Refresh')}
          </button>
        </div>
      </div>

      <div className="row g-3">
        {/* Left: package picker */}
        <div className="col-12 col-lg-5">
          <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Select Insurance Package
          </div>
          {loadingItems ? (
            <div className="text-center py-3"><span className="spinner-border spinner-border-sm" style={{ color: 'var(--primary)' }}></span></div>
          ) : packages.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No packages found. Create a package first.</div>
          ) : (
            <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {packages.map(pkg => {
                const isSelected = selectedPkg?.id === pkg.id
                const pkgName = pkg.packageName || pkg.name
                return (
                  <button key={pkg.id} type="button"
                    onClick={() => setSelectedPkg(isSelected ? null : pkg)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '0.6rem 0.85rem', borderRadius: 10,
                      border: `1.5px solid ${isSelected ? '#0891b2' : 'var(--border)'}`,
                      background: isSelected ? '#e0f2fe' : 'var(--bg-primary)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                    }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: isSelected ? '#bae6fd' : 'var(--bg-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="bi bi-box-seam" style={{ color: isSelected ? '#0891b2' : 'var(--text-muted)', fontSize: '0.85rem' }}></i>
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#0c4a6e' : 'var(--text-primary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pkgName}</div>
                      <div style={{ fontSize: '0.7rem', color: isSelected ? '#0369a1' : 'var(--text-muted)' }}>
                        {pkg.type || pkg.packageType || 'Insurance Package'}
                      </div>
                    </div>
                    <i className={`bi ${isSelected ? 'bi-check-circle-fill' : 'bi-circle'}`}
                      style={{ color: isSelected ? '#0891b2' : 'var(--border)', fontSize: '1rem', flexShrink: 0 }}></i>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: compose + send */}
        <div className="col-12 col-lg-7">
          <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            {t('admin.autoCheck.adComposeMsg')}
          </div>

          {/* Selected package chip */}
          {selectedPkg && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#e0f2fe', borderRadius: 20, padding: '0.25rem 0.65rem 0.25rem 0.45rem',
              border: '1.5px solid #7dd3fc', fontSize: '0.8rem', marginBottom: 8 }}>
              <i className="bi bi-box-seam" style={{ color: '#0891b2', fontSize: '0.75rem' }}></i>
              <span style={{ color: '#0c4a6e', fontWeight: 700 }}>{selectedPkg.packageName || selectedPkg.name}</span>
              <button type="button" onClick={() => setSelectedPkg(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0 1px', lineHeight: 1 }}>
                <i className="bi bi-x"></i>
              </button>
            </div>
          )}

          <textarea
            rows={4}
            placeholder={selectedPkg
              ? `Discover our "${selectedPkg.packageName || selectedPkg.name}" insurance package — great coverage options are available for you!`
              : 'Select a package above, then write a custom message (or leave blank for default)'}
            value={customMsg}
            onChange={e => setCustomMsg(e.target.value)}
            style={{
              width: '100%', padding: '0.6rem 0.85rem', borderRadius: 9,
              border: '1.5px solid var(--border)', background: 'var(--bg-primary)',
              color: 'var(--text-primary)', fontSize: '0.83rem', resize: 'vertical',
              outline: 'none', marginBottom: 10,
            }}
          />
          <button type="button" onClick={handleBroadcast} disabled={sending || !selectedPkg}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '0.55rem 1.4rem', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: (!selectedPkg || sending) ? '#e2e8f0' : 'linear-gradient(135deg, #16a34a, #15803d)',
              color: (!selectedPkg || sending) ? '#94a3b8' : '#fff',
              fontWeight: 700, fontSize: '0.85rem',
              boxShadow: (!selectedPkg || sending) ? 'none' : '0 4px 12px rgba(22,163,74,0.35)',
            }}>
            {sending
              ? <><span className="spinner-border spinner-border-sm"></span> {t('admin.autoCheck.sendingLabel')}</>
              : <><i className="bi bi-megaphone"></i> {t('admin.autoCheck.adBroadcastBtn')}</>}
          </button>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
            <i className="bi bi-info-circle me-1"></i>
            Customers will see a popup with package details and an "Apply Now" button.
          </div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            {t('admin.autoCheck.adHistoryTitle')}
          </div>
          <div className="d-flex flex-column gap-2">
            {history.slice(0, 5).map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.6rem 0.85rem' }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: '#dcfce7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="bi bi-megaphone-fill" style={{ color: '#16a34a', fontSize: '0.8rem' }}></i>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.message}</div>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {h.sentAt ? new Date(h.sentAt).toLocaleDateString() : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function AdminAutoCheckPage() {
  const { t } = useTranslation()
  const [status,    setStatus]    = useState(null)
  const [logs,      setLogs]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [running,   setRunning]   = useState(null)   // 'reminder' | 'cleanup' | null
  const [logType,   setLogType]   = useState('ALL')
  const [expandLog, setExpandLog] = useState(null)
  const [toast,     setToast]     = useState(null)

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

  useEffect(() => {
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [load])

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4500)
  }

  const trigger = async (type) => {
    setRunning(type)
    try {
      const endpoint = type === 'cleanup'
        ? '/admin/autocheck/run/cleanup'
        : '/admin/autocheck/run/reminders'
      await api.post(endpoint)
      showToast(`✅ ${t('admin.autoCheck.runComplete')}`)
      await load()
    } catch (e) {
      showToast('❌ ' + (e?.response?.data?.message || t('admin.autoCheck.errorOccurred')), false)
    } finally {
      setRunning(null)
    }
  }

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border" style={{ color: 'var(--primary)' }}></div>
    </div>
  )

  const lastReminder = status?.lastRuns?.REMINDER
  const lastCleanup  = status?.lastRuns?.REVISION_CLEANUP

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
          maxWidth: 460,
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            <i className="bi bi-bell-fill me-2" style={{ color: '#d97706' }}></i>
            {t('admin.autoCheck.title')}
          </h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.88rem' }}>
            {t('admin.autoCheck.subtitle')}
          </p>
        </div>
      </div>

      {/* Stats row — only today's reminder count + current Myanmar time */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-6">
          <StatCard icon="bi-bell-fill" label={t('admin.autoCheck.todayReminders')} value={status?.todayReminders ?? 0}
             color="#d97706" bg="#fffbeb" sub={t('admin.autoCheck.remindersSentSub')} />
        </div>
        <div className="col-6 col-md-6">
          <StatCard icon="bi-clock"
             label={t('admin.autoCheck.currentMyanmarTime')}
            value={status?.currentTimeMM?.slice(11, 16) ?? '—'}
            color="#7c3aed" bg="#f5f3ff"
             sub={status?.currentTimeMM ?? ''} />
        </div>
      </div>

      {/* Advertise Section */}
      <AdvertiseSection showToast={showToast} />

      {/* Last Runs */}
      <div className="card-custom mb-4">
        <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
          <i className="bi bi-clock-history me-2" style={{ color: 'var(--primary)' }}></i>
           {t('admin.autoCheck.lastRunsTitle')}
        </h6>
        <div className="d-flex flex-column gap-3">
          {[
            { key: 'REMINDER',         data: lastReminder },
            { key: 'REVISION_CLEANUP', data: lastCleanup  },
          ].map(({ key, data }) => {
             const type = TYPE_META[key]
            return (
              <div key={key} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '0.85rem 1rem' }}>
                <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <div className="d-flex align-items-center gap-2">
                     <i className={`bi ${type.icon}`} style={{ color: type.color, fontSize: '1rem' }}></i>
                     <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{t(`admin.autoCheck.${type.labelKey}`)}</span>
                  </div>
                   {data ? <Badge status={data.status} t={t} /> : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('admin.autoCheck.noRecord')}</span>}
                </div>
                {data && (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{data.summary}</div>
                    <div className="d-flex gap-3 flex-wrap">
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                         {t('admin.autoCheck.checkedLabel')}: <b style={{ color: 'var(--text-primary)' }}>{data.totalChecked}</b>
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                         {t('admin.autoCheck.resultLabel')}: <b style={{ color: '#16a34a' }}>{data.affectedCount}</b>
                      </span>
                      {data.aiAssisted && (
                        <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600 }}>
                           <i className="bi bi-stars me-1"></i>{t('admin.autoCheck.aiAssisted')}
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

      {/* Manual trigger buttons */}
      <div className="card-custom mb-4">
        <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          <i className="bi bi-play-circle me-2" style={{ color: 'var(--primary)' }}></i>
           {t('admin.autoCheck.manualRunTitle')}
        </h6>
        <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
           Run jobs manually. Results appear in the log table below.
        </p>
        <div className="d-flex gap-3 flex-wrap">
          {/* Send Reminders */}
          <button type="button" onClick={() => trigger('reminder')} disabled={running !== null}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '0.55rem 1.25rem', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: running === 'reminder' ? '#e2e8f0' : 'linear-gradient(135deg, #d97706, #f59e0b)',
              color: running === 'reminder' ? '#64748b' : '#fff',
              fontWeight: 700, fontSize: '0.85rem', transition: 'all .15s',
            }}>
            {running === 'reminder'
               ? <><span className="spinner-border spinner-border-sm"></span> {t('admin.autoCheck.sendingLabel')}</>
              : <><i className="bi bi-bell"></i> {t('admin.autoCheck.typeReminder')}</>}
          </button>

          {/* Empty Record / Revision Cleanup */}
          <button type="button" onClick={() => trigger('cleanup')} disabled={running !== null}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '0.55rem 1.25rem', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: running === 'cleanup' ? '#e2e8f0' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: running === 'cleanup' ? '#64748b' : '#fff',
              fontWeight: 700, fontSize: '0.85rem', transition: 'all .15s',
            }}>
            {running === 'cleanup'
              ? <><span className="spinner-border spinner-border-sm"></span> Running…</>
              : <><i className="bi bi-trash3"></i> Empty Record</>}
          </button>
        </div>
        <div style={{ marginTop: '0.6rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <i className="bi bi-info-circle me-1"></i>
          <b>Empty Record</b> clears expired revision-requested applications and claims that have passed their 7-day deadline.
        </div>
      </div>

      {/* Log table */}
      <div className="card-custom p-0">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            <i className="bi bi-list-ul me-2" style={{ color: 'var(--primary)' }}></i>
             {t('admin.autoCheck.logTableTitle')}
          </div>
          <div className="d-flex gap-1" style={{ background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 8 }}>
            {['ALL', 'REMINDER', 'REVISION_CLEANUP'].map(filterType => (
              <button key={filterType} type="button" onClick={() => setLogType(filterType)}
                style={{
                  padding: '0.3rem 0.75rem', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.75rem',
                   background: logType === filterType ? 'var(--bg-primary)' : 'transparent',
                   color: logType === filterType ? 'var(--text-primary)' : 'var(--text-muted)',
                   boxShadow: logType === filterType ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                }}>
                 {filterType === 'ALL' ? t('admin.autoCheck.logAll') : filterType === 'REMINDER' ? t('admin.autoCheck.filterReminder') : t('admin.autoCheck.filterCleanup')}
              </button>
            ))}
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-5" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <i className="bi bi-inbox" style={{ fontSize: '2rem', opacity: 0.3, display: 'block', marginBottom: 8 }}></i>
             {t('admin.autoCheck.noLogsMsg')}
          </div>
        ) : (
          <div>
            {logs.map((log, idx) => {
               const type = TYPE_META[log.checkType] || { labelKey: null, icon: 'bi-circle', color: '#64748b' }
              const isOpen = expandLog === idx
              return (
                <div key={log.id} style={{ borderBottom: idx < logs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div
                    onClick={() => setExpandLog(isOpen ? null : idx)}
                    style={{ padding: '0.75rem 1.25rem', cursor: 'pointer',
                      background: isOpen ? 'var(--bg-secondary)' : 'transparent',
                      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem 1rem' }}>
                    <div className="d-flex align-items-center gap-2" style={{ minWidth: 180 }}>
                       <i className={`bi ${type.icon}`} style={{ color: type.color, fontSize: '0.9rem' }}></i>
                       <span style={{ fontWeight: 600, fontSize: '0.83rem', color: 'var(--text-primary)' }}>{type.labelKey ? t(`admin.autoCheck.${type.labelKey}`) : log.checkType}</span>
                    </div>
                     <Badge status={log.status} t={t} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flex: 1 }}>{log.summary}</span>
                    <div className="d-flex align-items-center gap-3">
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                         {t('admin.autoCheck.checkedLabel')}: <b>{log.totalChecked}</b> · {t('admin.autoCheck.resultLabel')}: <b style={{ color: '#16a34a' }}>{log.affectedCount}</b>
                      </span>
                       {log.aiAssisted && <i className="bi bi-stars" style={{ color: '#d97706', fontSize: '0.85rem' }} title={t('admin.autoCheck.aiAssisted')}></i>}
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
                         {t('admin.autoCheck.detailsLabel')} ({log.details.length} {t('admin.autoCheck.items')})
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
                               {d.paymentId   && <span style={{ color: 'var(--text-muted)' }}>{t('admin.autoCheck.payment')} #{d.paymentId}</span>}
                              {d.customer    && <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.customer}</span>}
                              {d.customerName && <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.customerName}</span>}
                              {d.policy      && <span style={{ color: 'var(--text-secondary)' }}>{d.policy}</span>}
                              {d.amount      && <span style={{ color: '#16a34a', fontWeight: 700 }}>{Number(d.amount).toLocaleString()} MMK</span>}
                              {d.period      && <span style={{ color: '#7c3aed' }}>{d.period}</span>}
                              {d.urgency     && <span style={{ color: d.urgency === 'OVERDUE' ? '#dc2626' : '#d97706', fontWeight: 600 }}>{d.urgency}</span>}
                              {d.reason      && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>({d.reason})</span>}
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
