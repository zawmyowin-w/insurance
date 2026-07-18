import React, { useEffect, useState } from 'react'
import api from '../../services/api'

// ── Colour palette by insurance type ────────────────────────────────────────
const TYPE_COLORS = {
  LIFE:      '#1d4ed8', HEALTH:   '#16a34a', TRAVEL:    '#0891b2',
  MOTOR:     '#d97706', VEHICLE:  '#7c3aed', EDUCATION: '#db2777',
  PROPERTY:  '#ca8a04', OTHER:    '#64748b',
}
const typeColor = t => TYPE_COLORS[t] || TYPE_COLORS.OTHER

// ── Myanmar month labels ─────────────────────────────────────────────────────
const MMK = n => (n == null ? '—' : Number(n).toLocaleString() + ' MMK')
const Pct = n => (n == null ? '—' : Number(n).toFixed(1) + '%')
const shortMonth = key => key?.split(' ')[0] || key

// ── SVG helpers ──────────────────────────────────────────────────────────────
function BarChart({ data, color = 'var(--primary)', height = 180, label = '' }) {
  const entries = Object.entries(data || {})
  if (!entries.length) return <Empty />
  const vals = entries.map(([, v]) => Number(v))
  const maxV  = Math.max(...vals, 1)
  const W = 600, H = height, PAD_L = 60, PAD_B = 28, PAD_T = 16, PAD_R = 8
  const bw = Math.floor((W - PAD_L - PAD_R) / entries.length)
  const barW = Math.max(bw - 6, 4)
  const barX = i => PAD_L + i * bw + (bw - barW) / 2
  const barH = v => Math.max(((v / maxV) * (H - PAD_T - PAD_B)), 2)
  const barY = v => H - PAD_B - barH(v)
  const yTicks = 4
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      {/* Y grid */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const yv = (maxV * i) / yTicks
        const y  = H - PAD_B - (i / yTicks) * (H - PAD_T - PAD_B)
        return (
          <g key={i}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="var(--border)" strokeWidth={0.8} />
            <text x={PAD_L - 4} y={y + 4} textAnchor="end" fontSize={9} fill="var(--text-muted)">
              {yv >= 1000000 ? (yv/1000000).toFixed(1)+'M' : yv >= 1000 ? (yv/1000).toFixed(0)+'K' : Math.round(yv)}
            </text>
          </g>
        )
      })}
      {/* Bars */}
      {entries.map(([k, v], i) => (
        <g key={k}>
          <rect x={barX(i)} y={barY(Number(v))} width={barW} height={barH(Number(v))}
            fill={Array.isArray(color) ? color[i % color.length] : color}
            rx={3} opacity={0.9} />
          <text x={barX(i) + barW / 2} y={barY(Number(v)) - 3} textAnchor="middle" fontSize={8.5} fill="var(--text-muted)" fontWeight={600}>
            {Number(v) >= 1000000 ? (Number(v)/1000000).toFixed(1)+'M' : Number(v) >= 1000 ? (Number(v)/1000).toFixed(0)+'K' : Math.round(Number(v))}
          </text>
          <text x={barX(i) + barW / 2} y={H - PAD_B + 12} textAnchor="middle" fontSize={8} fill="var(--text-muted)">
            {shortMonth(k)}
          </text>
        </g>
      ))}
      {/* Axis */}
      <line x1={PAD_L} x2={PAD_L} y1={PAD_T} y2={H - PAD_B} stroke="var(--border)" strokeWidth={1} />
      <line x1={PAD_L} x2={W - PAD_R} y1={H - PAD_B} y2={H - PAD_B} stroke="var(--border)" strokeWidth={1} />
    </svg>
  )
}

function GroupedBarChart({ data1, data2, label1 = 'ဝင်ငွေ', label2 = 'ထွက်ငွေ', height = 200 }) {
  const keys = Object.keys(data1 || {})
  if (!keys.length) return <Empty />
  const allVals = [...Object.values(data1 || {}).map(Number), ...Object.values(data2 || {}).map(Number)]
  const maxV = Math.max(...allVals, 1)
  const W = 620, H = height, PAD_L = 64, PAD_B = 30, PAD_T = 16, PAD_R = 8
  const gw = Math.floor((W - PAD_L - PAD_R) / keys.length)
  const bw = Math.max(Math.floor(gw / 2) - 3, 3)
  const barH = v => Math.max(((Number(v) / maxV) * (H - PAD_T - PAD_B)), 2)
  const barY = v => H - PAD_B - barH(v)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      {Array.from({ length: 5 }, (_, i) => {
        const yv = (maxV * i) / 4
        const y  = H - PAD_B - (i / 4) * (H - PAD_T - PAD_B)
        return (
          <g key={i}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="var(--border)" strokeWidth={0.6} />
            <text x={PAD_L - 4} y={y + 4} textAnchor="end" fontSize={8.5} fill="var(--text-muted)">
              {yv >= 1e6 ? (yv/1e6).toFixed(1)+'M' : yv >= 1e3 ? (yv/1e3).toFixed(0)+'K' : Math.round(yv)}
            </text>
          </g>
        )
      })}
      {keys.map((k, i) => {
        const v1 = Number(data1[k] || 0), v2 = Number(data2[k] || 0)
        const x1 = PAD_L + i * gw + 2
        const x2 = x1 + bw + 2
        return (
          <g key={k}>
            <rect x={x1} y={barY(v1)} width={bw} height={barH(v1)} fill="#16a34a" rx={2} opacity={0.85} />
            <rect x={x2} y={barY(v2)} width={bw} height={barH(v2)} fill="#dc2626" rx={2} opacity={0.85} />
            <text x={x1 + gw / 2} y={H - PAD_B + 12} textAnchor="middle" fontSize={8} fill="var(--text-muted)">{shortMonth(k)}</text>
          </g>
        )
      })}
      <line x1={PAD_L} x2={PAD_L} y1={PAD_T} y2={H - PAD_B} stroke="var(--border)" strokeWidth={1} />
      <line x1={PAD_L} x2={W - PAD_R} y1={H - PAD_B} y2={H - PAD_B} stroke="var(--border)" strokeWidth={1} />
      {/* legend */}
      <rect x={PAD_L} y={4} width={10} height={10} fill="#16a34a" rx={2} />
      <text x={PAD_L + 13} y={13} fontSize={9} fill="var(--text-secondary)">{label1}</text>
      <rect x={PAD_L + 70} y={4} width={10} height={10} fill="#dc2626" rx={2} />
      <text x={PAD_L + 83} y={13} fontSize={9} fill="var(--text-secondary)">{label2}</text>
    </svg>
  )
}

function PieChart({ data, colors, size = 180 }) {
  const entries = Object.entries(data || {}).filter(([, v]) => Number(v) > 0)
  if (!entries.length) return <Empty />
  const total = entries.reduce((s, [, v]) => s + Number(v), 0)
  const cx = size / 2, cy = size / 2, r = size * 0.38, ri = r * 0.54
  let angle = -Math.PI / 2
  const slices = entries.map(([k, v], i) => {
    const pct   = Number(v) / total
    const start = angle
    const end   = angle + pct * 2 * Math.PI
    angle = end
    const lAngle = start + (end - start) / 2
    const lx = cx + (r + 12) * Math.cos(lAngle)
    const ly = cy + (r + 12) * Math.sin(lAngle)
    const x1s = cx + r * Math.cos(start), y1s = cy + r * Math.sin(start)
    const x1e = cx + r * Math.cos(end),   y1e = cy + r * Math.sin(end)
    const x2s = cx + ri * Math.cos(end),  y2s = cy + ri * Math.sin(end)
    const x2e = cx + ri * Math.cos(start),y2e = cy + ri * Math.sin(start)
    const large = pct > 0.5 ? 1 : 0
    const d = `M${x1s},${y1s} A${r},${r} 0 ${large} 1 ${x1e},${y1e} L${x2s},${y2s} A${ri},${ri} 0 ${large} 0 ${x2e},${y2e} Z`
    const clr = colors ? (colors[k] || '#64748b') : `hsl(${(i * 47) % 360}, 65%, 52%)`
    return { k, v, pct, d, clr, lx, ly, lAngle }
  })
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ overflow: 'visible' }}>
      {slices.map(s => (
        <g key={s.k}>
          <path d={s.d} fill={s.clr} stroke="var(--bg-primary)" strokeWidth={1.5} />
        </g>
      ))}
    </svg>
  )
}

function DonutGauge({ value, max = 100, color = '#16a34a', size = 120, label }) {
  const pct = Math.min(Math.max(value / max, 0), 1)
  const r = 44, cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r
  const dash  = pct * circ
  const gap   = circ - dash
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-secondary)" strokeWidth={10} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={13} fontWeight={800} fill={color}>{Math.round(value)}%</text>
      {label && <text x={cx} y={cy + 13} textAnchor="middle" fontSize={8.5} fill="var(--text-muted)">{label}</text>}
    </svg>
  )
}

function Empty() {
  return (
    <div className="text-center py-4" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      <i className="bi bi-bar-chart-line" style={{ fontSize: '2rem', opacity: 0.3, display: 'block', marginBottom: 6 }}></i>
      Data မရှိသေးပါ
    </div>
  )
}

function StatCard({ label, value, icon, color, bg, sub }) {
  return (
    <div className="card-custom" style={{ padding: '1rem' }}>
      <div className="d-flex align-items-center gap-3">
        <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`bi ${icon}`} style={{ color, fontSize: '1.2rem' }}></i>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value ?? '—'}</div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 2 }}>{label}</div>
          {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview',  label: 'ဘဏ္ဍာရေး အနှစ်ချုပ်', icon: 'bi-graph-up-arrow' },
  { key: 'bytype',    label: 'Insurance Type',         icon: 'bi-pie-chart'      },
  { key: 'wallet',    label: 'Admin Wallet',            icon: 'bi-wallet2'        },
  { key: 'analytics', label: 'Application Analytics',  icon: 'bi-bar-chart-line' },
]

export default function AdminReportsPage() {
  const [reports, setReports]   = useState(null)
  const [wallet,  setWallet]    = useState(null)
  const [loading, setLoading]   = useState(true)
  const [tab,     setTab]       = useState('overview')
  const [walletLoaded, setWalletLoaded] = useState(false)

  useEffect(() => {
    api.get('/admin/reports')
      .then(r => setReports(r.data))
      .catch(() => setReports(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'wallet' && !walletLoaded) {
      setWalletLoaded(true)
      api.get('/admin/wallet')
        .then(r => setWallet(r.data))
        .catch(() => setWallet(null))
    }
  }, [tab])

  if (loading) return <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
  if (!reports) return <div className="card-custom text-center py-5"><p style={{ color: 'var(--text-muted)' }}>Failed to load reports</p></div>

  const byType    = reports.policiesByType    || {}
  const revByType = reports.revenueByType     || {}
  const monRev    = reports.monthlyRevenue    || {}
  const monClaims = reports.monthlyClaims     || {}
  const monApps   = reports.applicationsByMonth || {}

  const totalRevenue    = Number(reports.totalRevenue    || 0)
  const totalClaimsPaid = Number(reports.totalClaimsPaid || 0)
  const netProfit       = Number(reports.netProfit       || 0)
  const opExpense       = Number(reports.operatingExpense|| 0)
  const lossRatio       = Number(reports.lossRatioPct    || 0)
  const profitMargin    = Number(reports.profitMarginPct || 0)
  const combinedRatio   = Number(reports.combinedRatioPct|| 0)

  // This month revenue
  const thisMonthKey = Object.keys(monRev).at(-1)
  const thisMonthRev = Number(monRev[thisMonthKey] || 0)
  const prevMonthRev = Number(Object.values(monRev).at(-2) || 0)
  const revGrowth = prevMonthRev > 0 ? ((thisMonthRev - prevMonthRev) / prevMonthRev * 100).toFixed(1) : null

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Reports & Analytics</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>မြန်မာအာမခံလုပ်ငန်း ဘဏ္ဍာရေးခွဲခြမ်းစိတ်ဖြာမှု</p>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-1 mb-4 flex-wrap" style={{ background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 12, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            style={{
              padding: '0.45rem 1rem', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.82rem', transition: 'all .15s',
              display: 'flex', alignItems: 'center', gap: 6,
              background: tab === t.key ? 'var(--bg-primary)' : 'transparent',
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
            }}>
            <i className={`bi ${t.icon}`}></i>
            <span className="d-none d-sm-inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: Financial Overview ── */}
      {tab === 'overview' && (
        <div className="fade-in d-flex flex-column gap-4">
          {/* Hero banner */}
          <div className="card-custom" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)', border: 'none', padding: '1.5rem' }}>
            <div className="row align-items-center g-3">
              <div className="col-12 col-md-5">
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  စုစုပေါင်း ဝင်ငွေ (Verified Payments)
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                  {totalRevenue.toLocaleString()}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: 4 }}>MMK</div>
                {revGrowth != null && (
                  <div style={{ marginTop: 8, fontSize: '0.8rem', color: Number(revGrowth) >= 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                    <i className={`bi bi-arrow-${Number(revGrowth) >= 0 ? 'up' : 'down'} me-1`}></i>
                    {Math.abs(revGrowth)}% ယခင်လနှင့် နှိုင်းယှဉ်
                  </div>
                )}
              </div>
              <div className="col-12 col-md-7">
                <div className="row g-3">
                  {[
                    { label: 'လစဥ်ဝင်ငွေ', value: thisMonthRev.toLocaleString() + ' MMK', color: '#93c5fd' },
                    { label: 'ထုတ်ပေးသည့် Claim', value: totalClaimsPaid.toLocaleString() + ' MMK', color: '#fca5a5' },
                    { label: 'အမြတ် (Net Profit)', value: netProfit.toLocaleString() + ' MMK', color: netProfit >= 0 ? '#86efac' : '#fca5a5' },
                    { label: 'Profit Margin', value: Pct(profitMargin), color: profitMargin >= 20 ? '#86efac' : profitMargin >= 0 ? '#fde68a' : '#fca5a5' },
                  ].map(c => (
                    <div key={c.label} className="col-6">
                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.75rem' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{c.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Myanmar insurance KPI gauges */}
          <div className="card-custom">
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              <i className="bi bi-speedometer2 me-2" style={{ color: 'var(--primary)' }}></i>
              မြန်မာအာမခံ စံနှုန်း KPI များ
            </h6>
            <div className="row g-3 align-items-center">
              {[
                { label: 'Loss Ratio', desc: 'Claim / Premium', value: lossRatio, max: 100, color: lossRatio < 60 ? '#16a34a' : lossRatio < 80 ? '#d97706' : '#dc2626', note: lossRatio < 60 ? '✅ ကောင်းမွန်' : lossRatio < 80 ? '⚠️ သတိပြု' : '🔴 အန္တရာယ်' },
                { label: 'Expense Ratio', desc: 'ကုန်ကျစရိတ် / Premium', value: 15, max: 100, color: '#7c3aed', note: 'မြန်မာ standard: ~15%' },
                { label: 'Combined Ratio', desc: 'Loss + Expense', value: Math.min(combinedRatio, 100), max: 100, color: combinedRatio < 90 ? '#16a34a' : combinedRatio < 100 ? '#d97706' : '#dc2626', note: combinedRatio < 100 ? '✅ အမြတ်ရ' : '🔴 အရှုံးပေါ်' },
                { label: 'Profit Margin', desc: 'Net Profit / Revenue', value: Math.max(0, Math.min(profitMargin, 100)), max: 100, color: profitMargin >= 15 ? '#16a34a' : profitMargin >= 0 ? '#d97706' : '#dc2626', note: profitMargin >= 15 ? '✅ ကောင်းသည်' : profitMargin >= 0 ? '⚠️ နည်းသည်' : '🔴 အရှုံး' },
              ].map(g => (
                <div key={g.label} className="col-6 col-md-3 text-center">
                  <DonutGauge value={g.value} max={g.max} color={g.color} size={120} label={g.label} />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{g.desc}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, marginTop: 2, color: g.color }}>{g.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Profit breakdown cards */}
          <div className="row g-3">
            {[
              { label: 'စုစုပေါင်း Premium ဝင်ငွေ', value: MMK(totalRevenue), icon: 'bi-arrow-down-circle-fill', color: '#16a34a', bg: '#dcfce7' },
              { label: 'ထုတ်ပေးသည့် Claim ပမာဏ',    value: MMK(totalClaimsPaid), icon: 'bi-arrow-up-circle-fill', color: '#dc2626', bg: '#fee2e2' },
              { label: 'ကုန်ကျစရိတ် (15%)',          value: MMK(opExpense), icon: 'bi-briefcase', color: '#7c3aed', bg: '#ede9fe' },
              { label: 'အသားတင် အမြတ်',              value: MMK(netProfit), icon: 'bi-graph-up', color: netProfit >= 0 ? '#16a34a' : '#dc2626', bg: netProfit >= 0 ? '#dcfce7' : '#fee2e2' },
            ].map(c => (
              <div key={c.label} className="col-6 col-md-3">
                <StatCard {...c} />
              </div>
            ))}
          </div>

          {/* Monthly revenue bar chart */}
          <div className="card-custom">
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              <i className="bi bi-bar-chart me-2" style={{ color: 'var(--primary)' }}></i>
              လစဥ် ဝင်ငွေနှင့် Claim ထုတ်ပေးမှု (MMK)
            </h6>
            <GroupedBarChart data1={monRev} data2={monClaims} label1="ဝင်ငွေ" label2="Claim ထုတ်" height={200} />
          </div>
        </div>
      )}

      {/* ── TAB: By Type ── */}
      {tab === 'bytype' && (
        <div className="fade-in d-flex flex-column gap-4">
          <div className="row g-4">
            {/* Pie chart */}
            <div className="col-12 col-lg-5">
              <div className="card-custom h-100">
                <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  <i className="bi bi-pie-chart me-2" style={{ color: 'var(--primary)' }}></i>
                  Policy အမျိုးအစား အချိုးအစား
                </h6>
                <div className="d-flex align-items-center justify-content-center gap-4 flex-wrap">
                  <PieChart data={byType} colors={TYPE_COLORS} size={200} />
                  <div className="d-flex flex-column gap-2">
                    {Object.entries(byType).map(([type, count]) => {
                      const total = Object.values(byType).reduce((s, v) => s + Number(v), 0)
                      const pct = total > 0 ? ((Number(count) / total) * 100).toFixed(1) : 0
                      return (
                        <div key={type} className="d-flex align-items-center gap-2">
                          <div style={{ width: 12, height: 12, borderRadius: 3, background: typeColor(type), flexShrink: 0 }}></div>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>{type}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue by type bar chart */}
            <div className="col-12 col-lg-7">
              <div className="card-custom h-100">
                <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  <i className="bi bi-bar-chart me-2" style={{ color: 'var(--primary)' }}></i>
                  Insurance Type အလိုက် ဝင်ငွေ (MMK)
                </h6>
                <BarChart
                  data={revByType}
                  color={Object.keys(revByType).map(typeColor)}
                  height={200}
                />
              </div>
            </div>
          </div>

          {/* Per-type detail table */}
          <div className="card-custom p-0">
            <div style={{ padding: '1rem 1.25rem 0.75rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
              <i className="bi bi-table me-2" style={{ color: 'var(--primary)' }}></i>
              Insurance Type အလိုက် အသေးစိတ်
            </div>
            <div className="table-custom">
              <table className="w-100">
                <thead>
                  <tr>
                    {['Insurance Type', 'Active Policies', 'ဝင်ငွေ (MMK)', 'Policy တစ်ခုမျှ ဝင်ငွေ', 'ဝင်ငွေ အချိုး'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(byType).sort((a, b) => Number(revByType[b[0]] || 0) - Number(revByType[a[0]] || 0)).map(([type, count]) => {
                    const rev = Number(revByType[type] || 0)
                    const totalRev = Object.values(revByType).reduce((s, v) => s + Number(v), 0)
                    const pct = totalRev > 0 ? (rev / totalRev * 100).toFixed(1) : 0
                    const perPolicy = Number(count) > 0 ? Math.round(rev / Number(count)) : 0
                    return (
                      <tr key={type}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: typeColor(type) }}></div>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{type}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{count}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{rev.toLocaleString()}</td>
                        <td style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{perPolicy.toLocaleString()}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div style={{ flex: 1, height: 6, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: typeColor(type), borderRadius: 99 }}></div>
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: typeColor(type), minWidth: 36 }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Wallet ── */}
      {tab === 'wallet' && (
        <WalletTab wallet={wallet} walletLoaded={walletLoaded} />
      )}

      {/* ── TAB: Application Analytics ── */}
      {tab === 'analytics' && (
        <div className="fade-in d-flex flex-column gap-4">
          {/* Stat strip */}
          <div className="row g-3">
            {[
              { label: 'Customers',         value: reports.totalCustomers,       icon: 'bi-people-fill',          color: '#1d4ed8', bg: '#eff6ff' },
              { label: 'Active Policies',   value: reports.activePolicies,       icon: 'bi-shield-check',         color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Total Applications',value: reports.totalApplications,    icon: 'bi-file-earmark-text',    color: '#7c3aed', bg: '#f5f3ff' },
              { label: 'Pending',           value: reports.pendingApplications,  icon: 'bi-hourglass-split',      color: '#d97706', bg: '#fffbeb' },
              { label: 'Rejected',          value: reports.rejectedApplications, icon: 'bi-x-circle',             color: '#dc2626', bg: '#fef2f2' },
              { label: 'Approved Claims',   value: reports.approvedClaims,       icon: 'bi-check-circle',         color: '#0891b2', bg: '#ecfeff' },
            ].map(c => (
              <div key={c.label} className="col-6 col-md-4 col-xl-2">
                <StatCard {...c} />
              </div>
            ))}
          </div>

          {/* Applications per month bar chart */}
          <div className="card-custom">
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              <i className="bi bi-bar-chart me-2" style={{ color: 'var(--primary)' }}></i>
              လစဥ် Application တင်သွင်းမှု (ပြီးခဲ့သော ၁၂ လ)
            </h6>
            <BarChart data={monApps} height={190} />
          </div>

          {/* Application status pie + claims */}
          <div className="row g-4">
            <div className="col-12 col-lg-6">
              <div className="card-custom h-100">
                <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  <i className="bi bi-pie-chart me-2" style={{ color: 'var(--primary)' }}></i>
                  Application Status ခွဲခြမ်း
                </h6>
                <PieChart
                  data={{ Approved: reports.activePolicies, Pending: reports.pendingApplications, Rejected: reports.rejectedApplications }}
                  colors={{ Approved: '#16a34a', Pending: '#d97706', Rejected: '#dc2626' }}
                  size={200}
                />
                <div className="d-flex justify-content-center gap-4 mt-3 flex-wrap">
                  {[['Approved', '#16a34a', reports.activePolicies], ['Pending', '#d97706', reports.pendingApplications], ['Rejected', '#dc2626', reports.rejectedApplications]].map(([l, c, v]) => (
                    <div key={l} className="text-center">
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: c, margin: '0 auto 4px' }}></div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: c }}>{v}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div className="card-custom h-100">
                <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  <i className="bi bi-file-earmark-medical me-2" style={{ color: 'var(--primary)' }}></i>
                  Claims အနှစ်ချုပ်
                </h6>
                <div className="d-flex flex-column gap-3">
                  {[
                    { label: 'စုစုပေါင်း Claims',     value: reports.totalClaims,   color: '#2563eb', w: 100 },
                    { label: 'အတည်ပြုပြီး (Approved)', value: reports.approvedClaims, color: '#16a34a', w: reports.totalClaims > 0 ? Math.round(reports.approvedClaims / reports.totalClaims * 100) : 0 },
                    { label: 'ဆဲဆေးစစ် (Pending)',    value: reports.pendingClaims,  color: '#d97706', w: reports.totalClaims > 0 ? Math.round(reports.pendingClaims  / reports.totalClaims * 100) : 0 },
                    { label: 'ပယ်ချသည် (Rejected)',   value: reports.rejectedClaims, color: '#dc2626', w: reports.totalClaims > 0 ? Math.round(reports.rejectedClaims / reports.totalClaims * 100) : 0 },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="d-flex justify-content-between mb-1">
                        <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
                        <span style={{ fontSize: '0.83rem', fontWeight: 700, color: item.color }}>{item.value ?? 0}</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${item.w}%`, background: item.color, borderRadius: 99 }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Wallet Tab ────────────────────────────────────────────────────────────────
function WalletTab({ wallet, walletLoaded }) {
  const [expand, setExpand] = useState(null)

  if (!walletLoaded || !wallet) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: 'var(--primary)' }}></div>
        <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Wallet ဒေတာ ဆွဲယူနေသည်...</p>
      </div>
    )
  }

  const balance    = Number(wallet.walletBalance   || 0)
  const inflow     = Number(wallet.totalInflow     || 0)
  const outflow    = Number(wallet.totalOutflow    || 0)
  const claims     = Number(wallet.totalClaimsPaid || 0)
  const opExp      = Number(wallet.operatingExpense|| 0)
  const customers  = wallet.customers || []
  const monIn      = wallet.monthlyInflow  || {}
  const monOut     = wallet.monthlyOutflow || {}

  return (
    <div className="fade-in d-flex flex-column gap-4">
      {/* Wallet balance hero */}
      <div className="card-custom" style={{ background: balance >= 0 ? 'linear-gradient(135deg, #064e3b, #065f46, #047857)' : 'linear-gradient(135deg, #7f1d1d, #991b1b)', border: 'none', padding: '1.5rem' }}>
        <div className="row align-items-center g-3">
          <div className="col-12 col-md-5">
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Admin Wallet လက်ကျန်ငွေ</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{balance.toLocaleString()}</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', marginTop: 4 }}>MMK</div>
            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '0.3rem 0.7rem' }}>
              <i className={`bi bi-${balance >= 0 ? 'check-circle-fill' : 'exclamation-triangle-fill'}`} style={{ color: balance >= 0 ? '#6ee7b7' : '#fca5a5', fontSize: '0.85rem' }}></i>
              <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>{balance >= 0 ? 'Profitable' : 'Loss Making'}</span>
            </div>
          </div>
          <div className="col-12 col-md-7">
            <div className="row g-2">
              {[
                { l: 'ဝင်ငွေ (Premium)', v: inflow,  icon: 'bi-arrow-down-circle', c: '#6ee7b7' },
                { l: 'Claim ထုတ်ပေး',   v: claims,  icon: 'bi-arrow-up-circle',   c: '#fca5a5' },
                { l: 'ကုန်ကျစရိတ်',     v: opExp,   icon: 'bi-briefcase',         c: '#fde68a' },
                { l: 'ထွက်ငွေ စုစုပေါင်', v: outflow, icon: 'bi-dash-circle',       c: '#f9a8d4' },
              ].map(x => (
                <div key={x.l} className="col-6">
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.65rem 0.75rem' }}>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>{x.l}</div>
                    <div style={{ fontWeight: 800, color: x.c, fontSize: '0.95rem' }}>{x.v.toLocaleString()} MMK</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly inflow vs outflow bar chart */}
      <div className="card-custom">
        <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          <i className="bi bi-bar-chart me-2" style={{ color: 'var(--primary)' }}></i>
          လစဥ် ငွေဝင်ငွေထွက် (MMK)
        </h6>
        <GroupedBarChart data1={monIn} data2={monOut} label1="ဝင်ငွေ" label2="Claim ထုတ်" height={200} />
      </div>

      {/* Customer transaction list */}
      <div className="card-custom p-0">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <i className="bi bi-list-check me-2" style={{ color: 'var(--primary)' }}></i>
              Customer ငွေပေးချေမှု စာရင်း
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {customers.length} ဦးမှ ငွေပေးချေပြီး
            </div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.3rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, color: '#16a34a' }}>
            <i className="bi bi-wallet2 me-1"></i>Total: {inflow.toLocaleString()} MMK
          </div>
        </div>
        {customers.length === 0 ? (
          <div className="text-center py-5" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ငွေပေးချေမှု မှတ်တမ်းမရှိသေးပါ</div>
        ) : (
          <div>
            {customers.map((c, idx) => {
              const isOpen = expand === idx
              return (
                <div key={c.customerId} style={{ borderBottom: idx < customers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div
                    className="d-flex align-items-center justify-content-between flex-wrap gap-2"
                    style={{ padding: '0.85rem 1.25rem', cursor: 'pointer', transition: 'background .12s',
                      background: isOpen ? 'var(--bg-secondary)' : 'transparent' }}
                    onClick={() => setExpand(isOpen ? null : idx)}>
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                        {c.customerName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{c.customerName}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{c.customerEmail}</div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#16a34a' }}>{Number(c.totalPaid).toLocaleString()} <span style={{ fontSize: '0.72rem' }}>MMK</span></div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.paymentCount} ကြိမ်ပေးသွင်း</div>
                      </div>
                      <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}></i>
                    </div>
                  </div>

                  {isOpen && c.transactions?.length > 0 && (
                    <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1.25rem 0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaction မှတ်တမ်း</div>
                      <div className="d-flex flex-column gap-2">
                        {c.transactions.map(tx => (
                          <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, background: 'var(--bg-primary)', borderRadius: 8, padding: '0.55rem 0.85rem', border: '1px solid var(--border)' }}>
                            <div className="d-flex align-items-center gap-2">
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: typeColor(tx.insuranceType), flexShrink: 0 }}></div>
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{tx.policyName || '—'}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {tx.insuranceType && <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.05rem 0.35rem', borderRadius: 3, marginRight: 4, fontWeight: 700 }}>{tx.insuranceType}</span>}
                                  {tx.periodLabel || ''} · {tx.method || '—'}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#16a34a' }}>{Number(tx.amount).toLocaleString()} MMK</div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '—'}
                              </div>
                            </div>
                          </div>
                        ))}
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
