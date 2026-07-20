import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'

// ── Colour palette by insurance type ────────────────────────────────────────
const TYPE_COLORS = {
  LIFE:      '#1d4ed8', HEALTH:   '#16a34a', TRAVEL:    '#0891b2',
  MOTOR:     '#d97706', VEHICLE:  '#7c3aed', EDUCATION: '#db2777',
  PROPERTY:  '#ca8a04', OTHER:    '#64748b',
}
const typeColor = t => TYPE_COLORS[t] || TYPE_COLORS.OTHER
const MMK = n => (n == null ? '—' : Number(n).toLocaleString() + ' MMK')
const Pct = n => (n == null ? '—' : Number(n).toFixed(1) + '%')
const shortMonth = key => key?.split(' ')[0] || key

// ── SVG Chart Primitives ──────────────────────────────────────────────────────
function BarChart({ data, color = 'var(--primary)', height = 180 }) {
  const entries = Object.entries(data || {})
  if (!entries.length) return <Empty />
  const vals = entries.map(([, v]) => Number(v))
  if (vals.every(v => v === 0)) return <Empty />
  const maxV = Math.max(...vals, 1)
  const W = 600, H = height, PAD_L = 60, PAD_B = 28, PAD_T = 16, PAD_R = 8
  const bw = Math.floor((W - PAD_L - PAD_R) / entries.length)
  const barW = Math.max(bw - 6, 4)
  const barX = i => PAD_L + i * bw + (bw - barW) / 2
  const barH = v => Math.max(((v / maxV) * (H - PAD_T - PAD_B)), 2)
  const barY = v => H - PAD_B - barH(v)
  const yTicks = 4
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
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
      {entries.map(([k, v], i) => (
        <g key={k}>
          <rect x={barX(i)} y={barY(Number(v))} width={barW} height={barH(Number(v))}
            fill={Array.isArray(color) ? color[i % color.length] : color} rx={3} opacity={0.9} />
          <text x={barX(i) + barW / 2} y={barY(Number(v)) - 3} textAnchor="middle" fontSize={8.5} fill="var(--text-muted)" fontWeight={600}>
            {Number(v) >= 1000000 ? (Number(v)/1000000).toFixed(1)+'M' : Number(v) >= 1000 ? (Number(v)/1000).toFixed(0)+'K' : Math.round(Number(v))}
          </text>
          <text x={barX(i) + barW / 2} y={H - PAD_B + 12} textAnchor="middle" fontSize={8} fill="var(--text-muted)">
            {shortMonth(k)}
          </text>
        </g>
      ))}
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
    const x1s = cx + r * Math.cos(start), y1s = cy + r * Math.sin(start)
    const x1e = cx + r * Math.cos(end),   y1e = cy + r * Math.sin(end)
    const x2s = cx + ri * Math.cos(end),  y2s = cy + ri * Math.sin(end)
    const x2e = cx + ri * Math.cos(start),y2e = cy + ri * Math.sin(start)
    const large = pct > 0.5 ? 1 : 0
    const d = `M${x1s},${y1s} A${r},${r} 0 ${large} 1 ${x1e},${y1e} L${x2s},${y2s} A${ri},${ri} 0 ${large} 0 ${x2e},${y2e} Z`
    const clr = colors ? (colors[k] || '#64748b') : `hsl(${(i * 47) % 360}, 65%, 52%)`
    return { k, v, pct, d, clr }
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
  { key: 'wallet',    label: 'Premium Wallet',          icon: 'bi-wallet2'        },
  { key: 'claims',    label: 'Claim ထုတ်ပေးမှု',        icon: 'bi-cash-stack'     },
  { key: 'agents',    label: 'Agent Performance',       icon: 'bi-person-badge'   },
  { key: 'packages',  label: 'Plan Popularity',         icon: 'bi-star'           },
  { key: 'analytics', label: 'Application Analytics',  icon: 'bi-bar-chart-line' },
]

export default function AdminReportsPage() {
  const { t } = useTranslation()
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
  const lossRatio       = Number(reports.lossRatioPct    || 0)
  const profitMargin    = Number(reports.profitMarginPct || 0)
  const profitByType      = reports.profitByType      || {}
  const claimsTotalByType = reports.claimsTotalByType || {}

  const thisMonthKey = Object.keys(monRev).at(-1)
  const thisMonthRev = Number(monRev[thisMonthKey] || 0)
  const prevMonthRev = Number(Object.values(monRev).at(-2) || 0)
  const revGrowth = prevMonthRev > 0 ? ((thisMonthRev - prevMonthRev) / prevMonthRev * 100).toFixed(1) : null

  const agentPerformance       = reports.agentPerformance       || []
  const packagePopularity      = reports.packagePopularity      || []
  const claimsPayoutByCustomer = reports.claimsPayoutByCustomer || []
  const claimsByType           = reports.claimsByType           || {}

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('admin.reports.title')}</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>မြန်မာအာမခံလုပ်ငန်း ဘဏ္ဍာရေးခွဲခြမ်းစိတ်ဖြာမှု</p>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-1 mb-4 flex-wrap" style={{ background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 12, width: 'fit-content', maxWidth: '100%' }}>
        {TABS.map(t => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            style={{
              padding: '0.45rem 0.9rem', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.78rem', transition: 'all .15s',
              display: 'flex', alignItems: 'center', gap: 5,
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
          {/* Income vs Expenses — two clearly separate hero cards */}
          <div className="row g-3">
            {/* Income card */}
            <div className="col-12 col-md-6">
              <div className="card-custom" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)', border: 'none', padding: '1.5rem', height: '100%' }}>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-arrow-down-circle-fill" style={{ color: '#6ee7b7', fontSize: '1.1rem' }}></i>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ဝင်ငွေ စုစုပေါင်း</div>
                    <div style={{ color: '#6ee7b7', fontSize: '0.78rem', fontWeight: 700 }}>Customer Premium ကြေးများသာ</div>
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{totalRevenue.toLocaleString()}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', marginTop: 4 }}>MMK · Verified Payments</div>
                {revGrowth != null && (
                  <div style={{ marginTop: 10, fontSize: '0.78rem', color: Number(revGrowth) >= 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                    <i className={`bi bi-arrow-${Number(revGrowth) >= 0 ? 'up' : 'down'} me-1`}></i>
                    {Math.abs(revGrowth)}% ယခင်လနှင့် နှိုင်းယှဉ်
                  </div>
                )}
                <div style={{ marginTop: 12, padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)' }}>
                  <i className="bi bi-info-circle me-1"></i>ဤပမာဏသည် Customer မှ ပေးသော Premium ကြေးများသာဖြစ်ပြီး Claim ငွေမပါဝင်ပါ
                </div>
              </div>
            </div>
            {/* Expenses card */}
            <div className="col-12 col-md-6">
              <div className="card-custom" style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 60%, #b91c1c 100%)', border: 'none', padding: '1.5rem', height: '100%' }}>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-arrow-up-circle-fill" style={{ color: '#fca5a5', fontSize: '1.1rem' }}></i>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ထွက်ငွေ စုစုပေါင်း</div>
                    <div style={{ color: '#fca5a5', fontSize: '0.78rem', fontWeight: 700 }}>Admin မှ Customer ဆီ Claim လျှော်ကြေးသာ</div>
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{totalClaimsPaid.toLocaleString()}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', marginTop: 4 }}>MMK · Approved Claim Payouts</div>
                <div style={{ marginTop: 10, fontSize: '0.78rem', color: totalClaimsPaid > 0 ? '#f87171' : '#86efac', fontWeight: 600 }}>
                  {totalClaimsPaid > 0
                    ? <><i className="bi bi-dash-circle me-1"></i>Approved Claims {reports.approvedClaims} ခု ထုတ်ပေးပြီး</>
                    : <><i className="bi bi-check-circle me-1"></i>Claim ထုတ်ပေးမှု မရှိသေးပါ</>}
                </div>
                <div style={{ marginTop: 12, padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)' }}>
                  <i className="bi bi-info-circle me-1"></i>ဤပမာဏသည် Admin မှ Customer ဆီ ပေးသော Claim လျှော်ကြေးသာဖြစ်ပြီး Premium ငွေမပါဝင်ပါ
                </div>
              </div>
            </div>
          </div>

          {/* Net result card */}
          <div className="card-custom" style={{ background: netProfit >= 0 ? 'linear-gradient(135deg, #0f172a, #1e3a8a)' : 'linear-gradient(135deg, #1c1917, #44403c)', border: 'none', padding: '1.25rem' }}>
            <div className="row align-items-center g-3">
              <div className="col-12 col-md-5">
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>အသားတင် အမြတ် (ဝင်ငွေ − ထွက်ငွေ)</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: netProfit >= 0 ? '#86efac' : '#fca5a5', lineHeight: 1 }}>
                  {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', marginTop: 4 }}>MMK</div>
              </div>
              <div className="col-12 col-md-7">
                <div className="row g-2">
                  {[
                    { label: 'ဤလ Premium ဝင်ငွေ', value: thisMonthRev.toLocaleString() + ' MMK', color: '#93c5fd' },
                    { label: 'Profit Margin', value: Pct(profitMargin), color: profitMargin >= 20 ? '#86efac' : profitMargin >= 0 ? '#fde68a' : '#fca5a5' },
                  ].map(c => (
                    <div key={c.label} className="col-6">
                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.65rem 0.75rem' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{c.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card-custom">
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              <i className="bi bi-speedometer2 me-2" style={{ color: 'var(--primary)' }}></i>
              မြန်မာအာမခံ စံနှုန်း KPI များ
            </h6>
            <div className="row g-3 align-items-center">
              {[
                { label: 'Loss Ratio', desc: 'Claim ထုတ် / Premium ဝင်', value: lossRatio, max: 100, color: lossRatio < 60 ? '#16a34a' : lossRatio < 80 ? '#d97706' : '#dc2626', note: lossRatio < 60 ? '✅ ကောင်းမွန်' : lossRatio < 80 ? '⚠️ သတိပြု' : '🔴 အန္တရာယ်' },
                { label: 'Profit Margin', desc: 'အမြတ် / Premium ဝင်', value: Math.max(0, Math.min(profitMargin, 100)), max: 100, color: profitMargin >= 20 ? '#16a34a' : profitMargin >= 0 ? '#d97706' : '#dc2626', note: profitMargin >= 20 ? '✅ ကောင်းသည်' : profitMargin >= 0 ? '⚠️ နည်းသည်' : '🔴 အရှုံး' },
              ].map(g => (
                <div key={g.label} className="col-6 text-center">
                  <DonutGauge value={g.value} max={g.max} color={g.color} size={130} label={g.label} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>{g.desc}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, marginTop: 3, color: g.color }}>{g.note}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="row g-3">
            {[
              { label: 'Customer Premium ဝင်ငွေ (စုစုပေါင်း)', value: MMK(totalRevenue),    icon: 'bi-arrow-down-circle-fill', color: '#16a34a', bg: '#dcfce7' },
              { label: 'Claim လျှော်ကြေး ထုတ်ပေး (စုစုပေါင်း)', value: MMK(totalClaimsPaid), icon: 'bi-arrow-up-circle-fill',   color: '#dc2626', bg: '#fee2e2' },
              { label: 'အသားတင် အမြတ် (Premium − Claim)',        value: MMK(netProfit),       icon: 'bi-graph-up',               color: netProfit >= 0 ? '#16a34a' : '#dc2626', bg: netProfit >= 0 ? '#dcfce7' : '#fee2e2' },
            ].map(c => (
              <div key={c.label} className="col-12 col-md-4">
                <StatCard {...c} />
              </div>
            ))}
          </div>

          <div className="card-custom">
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              <i className="bi bi-bar-chart me-2" style={{ color: 'var(--primary)' }}></i>
              လစဥ် Premium ဝင်ငွေ vs Claim ထုတ်ပေး (MMK)
            </h6>
            <GroupedBarChart data1={monRev} data2={monClaims} label1="Premium ဝင်ငွေ" label2="Claim ထုတ်ပေး" height={200} />
          </div>

          {/* Insurance Type financial summary */}
          {Object.keys(profitByType).length > 0 && (
            <div className="card-custom p-0">
              <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  <i className="bi bi-table me-2" style={{ color: 'var(--primary)' }}></i>
                  ဘဏ္ဍာရေးအနှစ်ချုပ် — Insurance Type အလိုက်
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  ဝင်ငွေ = Customer Premium ကြေးများ &nbsp;|&nbsp; ထွက်ငွေ = Admin မှ Claim လျှော်ကြေးပေးသော ပမာဏ
                </div>
              </div>
              <div className="table-custom">
                <table className="w-100">
                  <thead>
                    <tr>
                      {['Insurance Type', 'ဝင်ငွေ (Customer Premium)', 'ထွက်ငွေ (Claim လျှော်ကြေး)', 'အမြတ် / အရှုံး', 'Loss Ratio'].map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(profitByType).sort((a, b) => Number(b[1].income) - Number(a[1].income)).map(([type, d]) => {
                      const income  = Number(d.income  || 0)
                      const outflow = Number(d.outflow || 0)
                      const profit  = Number(d.profit  || 0)
                      const lr      = income > 0 ? (outflow / income * 100).toFixed(1) : '—'
                      return (
                        <tr key={type}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div style={{ width: 10, height: 10, borderRadius: 2, background: typeColor(type), flexShrink: 0 }}></div>
                              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{type}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 700, color: '#16a34a' }}>{income.toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MMK</span></td>
                          <td style={{ fontWeight: 700, color: outflow > 0 ? '#dc2626' : 'var(--text-muted)' }}>{outflow > 0 ? outflow.toLocaleString() + ' MMK' : '—'}</td>
                          <td>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: profit >= 0 ? '#16a34a' : '#dc2626' }}>
                              {profit >= 0 ? '+' : ''}{profit.toLocaleString()} MMK
                            </span>
                            <div style={{ fontSize: '0.68rem', color: profit >= 0 ? '#16a34a' : '#dc2626', marginTop: 1 }}>
                              {profit >= 0 ? '✅ အမြတ်ရ' : '🔴 အရှုံး'}
                            </div>
                          </td>
                          <td>
                            {lr === '—' ? <span style={{ color: 'var(--text-muted)' }}>—</span> : (
                              <div className="d-flex align-items-center gap-2">
                                <div style={{ flex: 1, height: 7, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden', minWidth: 60 }}>
                                  <div style={{ height: '100%', width: `${Math.min(Number(lr), 100)}%`, background: Number(lr) < 60 ? '#16a34a' : Number(lr) < 90 ? '#d97706' : '#dc2626', borderRadius: 99 }}></div>
                                </div>
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: Number(lr) < 60 ? '#16a34a' : Number(lr) < 90 ? '#d97706' : '#dc2626', minWidth: 40 }}>{lr}%</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {/* Totals row */}
                    <tr style={{ background: 'var(--bg-secondary)', fontWeight: 800 }}>
                      <td style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        <i className="bi bi-calculator me-1" style={{ color: 'var(--primary)' }}></i>စုစုပေါင်း
                      </td>
                      <td style={{ fontWeight: 800, color: '#16a34a' }}>{totalRevenue.toLocaleString()} MMK</td>
                      <td style={{ fontWeight: 800, color: totalClaimsPaid > 0 ? '#dc2626' : 'var(--text-muted)' }}>{totalClaimsPaid > 0 ? totalClaimsPaid.toLocaleString() + ' MMK' : '—'}</td>
                      <td>
                        <span style={{ fontWeight: 900, fontSize: '0.95rem', color: netProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                          {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()} MMK
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: lossRatio < 60 ? '#16a34a' : lossRatio < 90 ? '#d97706' : '#dc2626' }}>{Pct(lossRatio)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: By Type ── */}
      {tab === 'bytype' && (
        <div className="fade-in d-flex flex-column gap-4">
          <div className="row g-4">
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
            <div className="col-12 col-lg-7">
              <div className="card-custom h-100">
                <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  <i className="bi bi-bar-chart me-2" style={{ color: 'var(--primary)' }}></i>
                  Insurance Type အလိုက် ဝင်ငွေ (MMK)
                </h6>
                <BarChart data={revByType} color={Object.keys(revByType).map(typeColor)} height={200} />
              </div>
            </div>
          </div>

          {/* Profit/Loss by type */}
          <div className="card-custom">
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              <i className="bi bi-bar-chart-steps me-2" style={{ color: 'var(--primary)' }}></i>
              Insurance Type အလိုက် Claim ထုတ်ပေးမှု (ပြီးခဲ့သော ၁၂ လ)
            </h6>
            {Object.keys(claimsByType).length === 0 ? <Empty /> : (
              <div className="d-flex flex-column gap-3">
                {Object.entries(claimsByType).map(([type, monthData]) => {
                  const typeTotal = Object.values(monthData).reduce((s, v) => s + Number(v), 0)
                  return (
                    <div key={type}>
                      <div className="d-flex justify-content-between mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: typeColor(type) }}></div>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{type}</span>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#dc2626' }}>{typeTotal.toLocaleString()} MMK</span>
                      </div>
                      <BarChart data={monthData} color={typeColor(type)} height={100} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card-custom p-0">
            <div style={{ padding: '1rem 1.25rem 0.75rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
              <i className="bi bi-table me-2" style={{ color: 'var(--primary)' }}></i>
              Insurance Type အလိုက် အသေးစိတ်
            </div>
            <div className="table-custom">
              <table className="w-100">
                <thead>
                  <tr>
                    {['Insurance Type', 'Active Policies', 'ဝင်ငွေ Premium (MMK)', 'Claim ထုတ် (MMK)', 'Profit/Loss (MMK)', 'ဝင်ငွေ အချိုး'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(byType).sort((a, b) => Number(revByType[b[0]] || 0) - Number(revByType[a[0]] || 0)).map(([type, count]) => {
                    const rev = Number(revByType[type] || 0)
                    const claimsPaid = Number(claimsTotalByType[type] || 0)
                    const profit = rev - claimsPaid
                    const totalRev = Object.values(revByType).reduce((s, v) => s + Number(v), 0)
                    const pct = totalRev > 0 ? (rev / totalRev * 100).toFixed(1) : 0
                    return (
                      <tr key={type}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: typeColor(type) }}></div>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{type}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{count}</td>
                        <td style={{ fontWeight: 700, color: '#16a34a' }}>{rev.toLocaleString()}</td>
                        <td style={{ fontWeight: 700, color: '#dc2626' }}>{claimsPaid.toLocaleString()}</td>
                        <td style={{ fontWeight: 800, color: profit >= 0 ? '#16a34a' : '#dc2626' }}>
                          {profit >= 0 ? '+' : ''}{profit.toLocaleString()}
                        </td>
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
      {tab === 'wallet' && <WalletTab wallet={wallet} walletLoaded={walletLoaded} />}

      {/* ── TAB: Claims Payout ── */}
      {tab === 'claims' && (
        <ClaimsPayoutTab
          claimsPayoutByCustomer={claimsPayoutByCustomer}
          totalClaimsPaid={totalClaimsPaid}
          monthlyClaims={monClaims}
          claimsByType={claimsByType}
          reports={reports}
        />
      )}

      {/* ── TAB: Agent Performance ── */}
      {tab === 'agents' && <AgentPerformanceTab agents={agentPerformance} />}

      {/* ── TAB: Package Popularity ── */}
      {tab === 'packages' && <PackagePopularityTab packages={packagePopularity} />}

      {/* ── TAB: Application Analytics ── */}
      {tab === 'analytics' && (
        <div className="fade-in d-flex flex-column gap-4">
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
          <div className="card-custom">
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              <i className="bi bi-bar-chart me-2" style={{ color: 'var(--primary)' }}></i>
              လစဥ် Application တင်သွင်းမှု (ပြီးခဲ့သော ၁၂ လ)
            </h6>
            <BarChart data={monApps} height={190} />
          </div>
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

// ── Claims Payout Tab ────────────────────────────────────────────────────────
function ClaimsPayoutTab({ claimsPayoutByCustomer, totalClaimsPaid, monthlyClaims, claimsByType, reports }) {
  const [expand, setExpand] = useState(null)

  const totalClaims = reports?.totalClaims || 0
  const approvedClaims = reports?.approvedClaims || 0

  return (
    <div className="fade-in d-flex flex-column gap-4">
      {/* Hero */}
      <div className="card-custom" style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b, #b91c1c)', border: 'none', padding: '1.5rem' }}>
        <div className="row align-items-center g-3">
          <div className="col-12 col-md-5">
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              စုစုပေါင်း Claim ထုတ်ပေးပမာဏ (Approved Claims)
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
              {Number(totalClaimsPaid).toLocaleString()}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: 4 }}>MMK</div>
          </div>
          <div className="col-12 col-md-7">
            <div className="row g-2">
              {[
                { l: 'Claim ပေးရမည့် Customer', v: claimsPayoutByCustomer.length + ' ဦး', c: '#fca5a5' },
                { l: 'Approved Claims', v: approvedClaims + ' ခု', c: '#fde68a' },
                { l: 'Average per Customer', v: claimsPayoutByCustomer.length > 0 ? Math.round(Number(totalClaimsPaid) / claimsPayoutByCustomer.length).toLocaleString() + ' MMK' : '—', c: '#6ee7b7' },
                { l: 'Total Claims', v: totalClaims + ' ခု', c: '#c4b5fd' },
              ].map(x => (
                <div key={x.l} className="col-6">
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.65rem 0.75rem' }}>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{x.l}</div>
                    <div style={{ fontWeight: 800, color: x.c, fontSize: '0.95rem' }}>{x.v}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly claims chart */}
      <div className="card-custom">
        <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          <i className="bi bi-bar-chart me-2" style={{ color: '#dc2626' }}></i>
          လစဥ် Claim ထုတ်ပေးမှု (MMK) — ပြီးခဲ့သော ၁၂ လ
        </h6>
        <BarChart data={monthlyClaims} color="#dc2626" height={180} />
      </div>

      {/* Claims by type pie */}
      {Object.keys(claimsByType).length > 0 && (
        <div className="card-custom">
          <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            <i className="bi bi-pie-chart me-2" style={{ color: 'var(--primary)' }}></i>
            Insurance Type အလိုက် Claim ထုတ်ပေးမှု
          </h6>
          <div className="d-flex align-items-center justify-content-center gap-4 flex-wrap">
            <PieChart
              data={Object.fromEntries(Object.entries(claimsByType).map(([t, d]) => [t, Object.values(d).reduce((s, v) => s + Number(v), 0)]))}
              colors={TYPE_COLORS} size={200}
            />
            <div className="d-flex flex-column gap-2">
              {Object.entries(claimsByType).map(([type, monthData]) => {
                const total = Object.values(monthData).reduce((s, v) => s + Number(v), 0)
                return (
                  <div key={type} className="d-flex align-items-center gap-2">
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: typeColor(type), flexShrink: 0 }}></div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{type}</span>
                    <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 700 }}>{total.toLocaleString()} MMK</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Per-customer claim payout list */}
      <div className="card-custom p-0">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            <i className="bi bi-people me-2" style={{ color: '#dc2626' }}></i>
            Customer အလိုက် Claim ထုတ်ပေးမှု
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {claimsPayoutByCustomer.length} ဦးကို Claim ပေးထားပြီး
          </div>
        </div>
        {claimsPayoutByCustomer.length === 0 ? (
          <div className="text-center py-5" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <i className="bi bi-cash-stack" style={{ fontSize: '2rem', opacity: 0.3, display: 'block', marginBottom: 6 }}></i>
            Claim ထုတ်ပေးမှု မှတ်တမ်း မရှိသေးပါ
          </div>
        ) : (
          <div>
            {claimsPayoutByCustomer.map((c, idx) => {
              const isOpen = expand === idx
              return (
                <div key={c.customerId} style={{ borderBottom: idx < claimsPayoutByCustomer.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div
                    className="d-flex align-items-center justify-content-between flex-wrap gap-2"
                    style={{ padding: '0.85rem 1.25rem', cursor: 'pointer', background: isOpen ? 'var(--bg-secondary)' : 'transparent', transition: 'background .12s' }}
                    onClick={() => setExpand(isOpen ? null : idx)}>
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #b91c1c, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                        {c.customerName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{c.customerName}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{c.customerEmail}</div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#dc2626' }}>{Number(c.totalPayout).toLocaleString()} <span style={{ fontSize: '0.72rem' }}>MMK</span></div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.claimCount} claim</div>
                      </div>
                      <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}></i>
                    </div>
                  </div>
                  {isOpen && c.claims?.length > 0 && (
                    <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1.25rem 0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Claim မှတ်တမ်း</div>
                      <div className="d-flex flex-column gap-2">
                        {c.claims.map(claim => (
                          <div key={claim.claimId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, background: 'var(--bg-primary)', borderRadius: 8, padding: '0.55rem 0.85rem', border: '1px solid var(--border)' }}>
                            <div className="d-flex align-items-center gap-2">
                              <i className="bi bi-shield-check" style={{ color: '#16a34a', fontSize: '0.9rem' }}></i>
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  #{claim.claimId} — {claim.claimType || '—'}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {claim.insuranceType && <span className="type-badge-pill" style={{ padding: '0.05rem 0.35rem', borderRadius: 3, marginRight: 4 }}>{claim.insuranceType}</span>}
                                  {claim.approvedAt ? new Date(claim.approvedAt).toLocaleDateString() : '—'}
                                </div>
                              </div>
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#dc2626' }}>{Number(claim.amount).toLocaleString()} MMK</span>
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

// ── Agent Performance Tab ────────────────────────────────────────────────────
function AgentPerformanceTab({ agents }) {
  const maxApps = Math.max(...agents.map(a => a.applicationsHandled || 0), 1)

  return (
    <div className="fade-in d-flex flex-column gap-4">
      {/* Summary stats */}
      <div className="row g-3">
        {[
          { label: 'Agent စုစုပေါင်း',      value: agents.length,                                                            icon: 'bi-person-badge',  color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Application စုစုပေါင်း',  value: agents.reduce((s, a) => s + (a.applicationsHandled || 0), 0),           icon: 'bi-file-earmark',  color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Approved Applications',   value: agents.reduce((s, a) => s + (a.applicationsApproved || 0), 0),           icon: 'bi-shield-check',  color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Claims Handled',          value: agents.reduce((s, a) => s + (a.claimsHandled || 0), 0),                  icon: 'bi-clipboard2',    color: '#d97706', bg: '#fffbeb' },
        ].map(c => (
          <div key={c.label} className="col-6 col-md-3">
            <StatCard {...c} />
          </div>
        ))}
      </div>

      {/* Bar chart of applications per agent */}
      {agents.length > 0 && (
        <div className="card-custom">
          <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            <i className="bi bi-bar-chart me-2" style={{ color: 'var(--primary)' }}></i>
            Agent တစ်ဦးချင်း Application စီမံမှု
          </h6>
          <BarChart
            data={Object.fromEntries(agents.map(a => [a.agentName?.split(' ')[0] || 'Agent', a.applicationsHandled || 0]))}
            color="#1d4ed8"
            height={180}
          />
        </div>
      )}

      {/* Agent performance table */}
      {agents.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-person-badge" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Agent မရှိသေးပါ</h5>
        </div>
      ) : (
        <div className="card-custom p-0">
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            <i className="bi bi-table me-2" style={{ color: 'var(--primary)' }}></i>
            Agent အလိုက် Performance အသေးစိတ်
          </div>
          <div className="table-custom">
            <table className="w-100">
              <thead>
                <tr>
                  {['Agent', 'Insurance Type', 'Applications', 'Approved', 'Claims', 'Approval Rate', 'Performance'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {agents.map((agent, i) => {
                  const rate = agent.approvalRate || 0
                  const rateColor = rate >= 70 ? '#16a34a' : rate >= 40 ? '#d97706' : '#dc2626'
                  const barW = maxApps > 0 ? ((agent.applicationsHandled || 0) / maxApps * 100) : 0
                  return (
                    <tr key={agent.agentId}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `hsl(${(i * 67) % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                            {agent.agentName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{agent.agentName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{agent.agentEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {agent.insuranceType ? (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: typeColor(agent.insuranceType), background: typeColor(agent.insuranceType) + '20', padding: '0.15rem 0.5rem', borderRadius: 99 }}>
                            {agent.insuranceType}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>ALL</span>}
                      </td>
                      <td><span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{agent.applicationsHandled || 0}</span></td>
                      <td><span style={{ fontWeight: 700, color: '#16a34a' }}>{agent.applicationsApproved || 0}</span></td>
                      <td><span style={{ fontWeight: 600, color: '#d97706' }}>{agent.claimsHandled || 0}</span></td>
                      <td>
                        <span style={{ fontWeight: 800, color: rateColor, fontSize: '0.88rem' }}>{rate.toFixed(1)}%</span>
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${barW}%`, background: 'var(--primary)', borderRadius: 99 }}></div>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {agent.applicationsHandled || 0} / {maxApps} cases
                        </div>
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

// ── Package Popularity Tab ───────────────────────────────────────────────────
function PackagePopularityTab({ packages }) {
  const maxApps = Math.max(...packages.map(p => p.applicationCount || 0), 1)

  return (
    <div className="fade-in d-flex flex-column gap-4">
      <div className="row g-3">
        {[
          { label: 'Insurance Plan အားလုံး', value: packages.length,                                                icon: 'bi-box-seam',       color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Active Plans',            value: packages.filter(p => p.active).length,                         icon: 'bi-check-circle',   color: '#16a34a', bg: '#f0fdf4' },
          { label: 'လျှောက်မှု စုစုပေါင်း',    value: packages.reduce((s, p) => s + (p.applicationCount || 0), 0), icon: 'bi-file-earmark',   color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Plan ဝင်ငွေ စုစုပေါင်း',   value: packages.reduce((s, p) => s + Number(p.revenue || 0), 0).toLocaleString() + ' MMK', icon: 'bi-cash-stack', color: '#d97706', bg: '#fffbeb' },
        ].map(c => (
          <div key={c.label} className="col-6 col-md-3">
            <StatCard {...c} />
          </div>
        ))}
      </div>

      {/* Popularity bar chart */}
      {packages.length > 0 && (
        <div className="card-custom">
          <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            <i className="bi bi-bar-chart me-2" style={{ color: 'var(--primary)' }}></i>
            Plan တစ်ခုချင်း လျှောက်ထားမှု
          </h6>
          <BarChart
            data={Object.fromEntries(packages.slice(0, 15).map(p => [p.packageName?.substring(0, 10) || 'Plan', p.applicationCount || 0]))}
            color={packages.map(p => typeColor(p.packageType))}
            height={180}
          />
        </div>
      )}

      {/* Package table */}
      {packages.length === 0 ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-box-seam" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Package မရှိသေးပါ</h5>
        </div>
      ) : (
        <div className="card-custom p-0">
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            <i className="bi bi-table me-2" style={{ color: 'var(--primary)' }}></i>
            Insurance Plan အသေးစိတ် (လူကြိုက်အများဆုံးမှ)
          </div>
          <div className="table-custom">
            <table className="w-100">
              <thead>
                <tr>
                  {['Plan', 'Type', 'Status', 'Applications', 'Approved', 'Approval %', 'ဝင်ငွေ (MMK)', 'Popularity'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {packages.map(pkg => {
                  const approvalPct = pkg.applicationCount > 0 ? Math.round(pkg.approvedCount / pkg.applicationCount * 100) : 0
                  const barW = maxApps > 0 ? (pkg.applicationCount / maxApps * 100) : 0
                  return (
                    <tr key={pkg.packageId}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{pkg.packageName}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: typeColor(pkg.packageType), background: typeColor(pkg.packageType) + '20', padding: '0.15rem 0.5rem', borderRadius: 99 }}>
                          {pkg.packageType}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-status ${pkg.active ? 'badge-active' : 'badge-cancelled'}`}>
                          {pkg.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td><span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{pkg.applicationCount || 0}</span></td>
                      <td><span style={{ fontWeight: 700, color: '#16a34a' }}>{pkg.approvedCount || 0}</span></td>
                      <td>
                        <span style={{ fontWeight: 700, color: approvalPct >= 60 ? '#16a34a' : approvalPct >= 30 ? '#d97706' : '#dc2626' }}>
                          {approvalPct}%
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{Number(pkg.revenue || 0).toLocaleString()}</td>
                      <td style={{ minWidth: 120 }}>
                        <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${barW}%`, background: typeColor(pkg.packageType), borderRadius: 99 }}></div>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {pkg.applicationCount || 0} applications
                        </div>
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

// ── Wallet Tab ────────────────────────────────────────────────────────────────
function WalletTab({ wallet, walletLoaded }) {
  const [expand, setExpand] = useState(null)

  if (!walletLoaded) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: 'var(--primary)' }}></div>
        <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Wallet ဒေတာ ဆွဲယူနေသည်...</p>
      </div>
    )
  }
  if (!wallet) {
    return (
      <div className="card-custom text-center py-5">
        <i className="bi bi-exclamation-triangle" style={{ fontSize: '2rem', color: '#d97706', display: 'block', marginBottom: 8 }}></i>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>Wallet ဒေတာ ဆွဲယူ၍ မရပါ။ နောက်မှ ထပ်ကြည့်ပါ။</p>
      </div>
    )
  }

  const balance   = Number(wallet.walletBalance   || 0)
  const inflow    = Number(wallet.totalInflow     || 0)
  const claims    = Number(wallet.totalClaimsPaid || 0)
  const customers = wallet.customers || []
  const monIn     = wallet.monthlyInflow  || {}
  const monOut    = wallet.monthlyOutflow || {}

  return (
    <div className="fade-in d-flex flex-column gap-4">
      <div className="card-custom" style={{ background: balance >= 0 ? 'linear-gradient(135deg, #064e3b, #065f46, #047857)' : 'linear-gradient(135deg, #7f1d1d, #991b1b)', border: 'none', padding: '1.5rem' }}>
        <div className="row align-items-center g-3">
          <div className="col-12 col-md-5">
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Premium Wallet လက်ကျန်ငွေ</div>
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
                { l: 'Customer Premium ဝင်ငွေ', v: inflow,  icon: 'bi-arrow-down-circle', c: '#6ee7b7' },
                { l: 'Claim လျှော်ကြေး ထုတ်ပေး', v: claims,  icon: 'bi-arrow-up-circle',   c: '#fca5a5' },
                { l: 'လက်ကျန် (ဝင် − ထွက်)',     v: balance, icon: 'bi-wallet2',            c: balance >= 0 ? '#86efac' : '#fca5a5' },
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

      <div className="card-custom">
        <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          <i className="bi bi-bar-chart me-2" style={{ color: 'var(--primary)' }}></i>
          လစဥ် Premium ဝင်ငွေ vs Claim ထုတ်ပေး (MMK)
        </h6>
        <GroupedBarChart data1={monIn} data2={monOut} label1="Premium ဝင်ငွေ" label2="Claim ထုတ်" height={200} />
      </div>

      <div className="card-custom p-0">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <i className="bi bi-list-check me-2" style={{ color: 'var(--primary)' }}></i>
              Customer Premium ပေးချေမှု
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{customers.length} ဦးမှ ပေးချေပြီး</div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.3rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, color: '#16a34a' }}>
            <i className="bi bi-wallet2 me-1"></i>Total: {inflow.toLocaleString()} MMK
          </div>
        </div>
        {customers.length === 0 ? (
          <div className="text-center py-5" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Premium ပေးချေမှု မှတ်တမ်းမရှိသေးပါ</div>
        ) : (
          <div>
            {customers.map((c, idx) => {
              const isOpen = expand === idx
              return (
                <div key={c.customerId} style={{ borderBottom: idx < customers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div
                    className="d-flex align-items-center justify-content-between flex-wrap gap-2"
                    style={{ padding: '0.85rem 1.25rem', cursor: 'pointer', background: isOpen ? 'var(--bg-secondary)' : 'transparent', transition: 'background .12s' }}
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
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '—'}</div>
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
