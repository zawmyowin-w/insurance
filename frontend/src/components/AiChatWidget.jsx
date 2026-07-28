import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

// ── Helpers ─────────────────────────────────────────────────────────────────

const fmtMMK = n => n ? Number(n).toLocaleString('en-US') + ' MMK' : ''

const TYPE_LABEL_EN = { LIFE: 'Life', HEALTH: 'Health', AUTO: 'Auto', PROPERTY: 'Property' }
const TYPE_LABEL_MY = { LIFE: 'အသက်', HEALTH: 'ကျန်းမာရေး', AUTO: 'ယာဉ်', PROPERTY: 'ပစ္စည်း' }

// ── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, onApply, lang }) {
  const typeLabel = lang === 'my'
    ? (TYPE_LABEL_MY[plan.type] || plan.type)
    : (TYPE_LABEL_EN[plan.type] || plan.type)

  return (
    <div style={{
      background: 'var(--bg-primary, #fff)', border: '1.5px solid var(--border)',
      borderRadius: 12, padding: '0.75rem 0.85rem', marginTop: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.84rem' }}>{plan.name}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>{typeLabel}</div>
        </div>
        {plan.premiumRate && (
          <span style={{
            fontSize: '0.68rem', background: 'var(--primary)', color: '#fff',
            borderRadius: 20, padding: '0.12rem 0.5rem', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {plan.premiumRate}% rate
          </span>
        )}
      </div>
      {(plan.coverageMin || plan.coverageMax) && (
        <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)', marginTop: 5 }}>
          📊 {fmtMMK(plan.coverageMin)} – {fmtMMK(plan.coverageMax)}
        </div>
      )}
      {plan.description && (
        <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.4 }}>
          {plan.description.length > 80 ? plan.description.slice(0, 80) + '…' : plan.description}
        </div>
      )}
      <button
        onClick={() => onApply(plan)}
        style={{
          marginTop: 8, width: '100%', padding: '0.38rem 0.5rem',
          background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
          color: '#fff', border: 'none', borderRadius: 8,
          fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
        }}
      >
        {lang === 'my' ? '✓ လျှောက်ထားမည်' : '✓ Apply Now'}
      </button>
    </div>
  )
}

// ── Chip Buttons ─────────────────────────────────────────────────────────────

function Chips({ chips, onSelect, disabled }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
      {chips.map((c, i) => (
        <button key={i} onClick={() => !disabled && onSelect(c)} disabled={disabled}
          style={{
            padding: '0.28rem 0.65rem', borderRadius: 20,
            border: '1.5px solid var(--primary)', background: 'transparent',
            color: 'var(--primary)', fontSize: '0.74rem', cursor: disabled ? 'default' : 'pointer',
            fontWeight: 600, opacity: disabled ? 0.5 : 1, transition: 'all .15s',
          }}
          onMouseOver={e => { if (!disabled) e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff' }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--primary)' }}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}

// ── Message Renderer ──────────────────────────────────────────────────────────

function Message({ msg, onApply, onChip, loading, lang }) {
  const isUser = msg.from === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem', marginRight: 6, flexShrink: 0, marginTop: 2,
        }}>🤖</div>
      )}
      <div style={{ maxWidth: '82%' }}>
        <div style={{
          padding: '0.52rem 0.8rem',
          borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background: isUser ? 'var(--primary)' : 'var(--bg-secondary)',
          color: isUser ? '#fff' : 'var(--text-primary)',
          fontSize: '0.83rem', lineHeight: 1.58, whiteSpace: 'pre-wrap',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        }}>
          {msg.text}
        </div>
        {/* Plan cards */}
        {msg.plans && msg.plans.length > 0 && msg.plans.map(p => (
          <PlanCard key={p.id} plan={p} onApply={onApply} lang={lang} />
        ))}
        {/* Chip choices */}
        {msg.chips && (
          <Chips chips={msg.chips} onSelect={onChip} disabled={!!msg.chipsUsed || loading} />
        )}
      </div>
    </div>
  )
}

// ── Main Widget ───────────────────────────────────────────────────────────────

export default function AiChatWidget({ user }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language || 'en'
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState([])
  const [types, setTypes] = useState([])
  const [plansLoaded, setPlansLoaded] = useState(false)

  // Recommender state: null | 'type' | 'coverage' | 'done'
  const [rec, setRec] = useState(null)
  const [recData, setRecData] = useState({})

  const greet = lang === 'my'
    ? 'မင်္ဂလာပါ! ကျွန်ုပ်သည် DICP Insurance Assistant ဖြစ်ပါသည်။ အာမခံအမျိုးအစားများ၊ Plan များ၊ Benefits နှင့်ပတ်သက်၍ မေးမြန်းနိုင်ပါသည်။'
    : 'Hello! I\'m the DICP Insurance Assistant. Ask me about plans, benefits, pricing, or let me recommend the right plan for you!'

  const initChips = lang === 'my'
    ? [
        { label: '📋 Plan များကြည့်မည်', action: 'view_plans' },
        { label: '🎯 Plan ညှိနှိုင်းမည်', action: 'recommend' },
        { label: '📝 လျှောက်ထားနည်း', action: 'how_to_apply' },
      ]
    : [
        { label: '📋 View Plans', action: 'view_plans' },
        { label: '🎯 Recommend a Plan', action: 'recommend' },
        { label: '📝 How to Apply', action: 'how_to_apply' },
      ]

  const [messages, setMessages] = useState([
    { from: 'ai', text: greet, chips: initChips },
  ])

  const bottomRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    if (open && bottomRef.current)
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  // Load plans when first opened
  useEffect(() => {
    if (open && !plansLoaded) {
      Promise.all([
        api.get('/packages/public').catch(() => ({ data: [] })),
        api.get('/insurance-types/public').catch(() => ({ data: [] })),
      ]).then(([pkgRes, typeRes]) => {
        setPlans(Array.isArray(pkgRes.data) ? pkgRes.data : [])
        setTypes(Array.isArray(typeRes.data) ? typeRes.data : [])
        setPlansLoaded(true)
      })
    }
  }, [open, plansLoaded])

  // Reset greeting when language changes
  useEffect(() => {
    setMessages([{ from: 'ai', text: greet, chips: initChips }])
    setRec(null)
    setRecData({})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language])

  const addMsg = msg => setMessages(prev => [...prev, msg])

  const markLastChipsUsed = () =>
    setMessages(prev => prev.map((m, i) =>
      i === prev.length - 1 && m.chips ? { ...m, chipsUsed: true } : m
    ))

  const handleApply = plan => {
    setOpen(false)
    navigate('/customer/apply', { state: { planId: plan.id } })
  }

  // ── Chip actions ────────────────────────────────────────────────────────────

  const handleChip = chip => {
    markLastChipsUsed()

    if (chip.action === 'view_plans') {
      addMsg({ from: 'user', text: chip.label })
      showAllPlans()
      return
    }

    if (chip.action === 'recommend') {
      addMsg({ from: 'user', text: chip.label })
      startRecommender()
      return
    }

    if (chip.action === 'how_to_apply') {
      addMsg({ from: 'user', text: chip.label })
      const reply = lang === 'my'
        ? 'Policy လျှောက်ထားရန် အဆင့်များ:\n1. အကောင့် Register လုပ်ပါ\n2. Plans page မှ Plan တစ်ခု ရွေးချယ်ပါ\n3. Application ဖြည့်ပြီး Submit လုပ်ပါ\n4. Agent မှ စစ်ဆေးပြီး အတည်ပြုမည်\n5. Premium ငွေပေးချေပြီး Policy ရမည်'
        : 'How to apply for a policy:\n1. Register a free account\n2. Browse Plans and pick one\n3. Fill the application and submit\n4. An agent reviews and approves it\n5. Pay your premium — you\'re covered!'
      addMsg({ from: 'ai', text: reply })
      return
    }

    if (chip.action === 'rec_type') {
      addMsg({ from: 'user', text: chip.label })
      setRecData(d => ({ ...d, type: chip.value }))
      setRec('coverage')
      const q = lang === 'my'
        ? 'Coverage ပမာဏ ဘယ်လောက် လိုချင်ပါသလဲ?'
        : 'What coverage range are you looking for?'
      addMsg({
        from: 'ai', text: q,
        chips: lang === 'my'
          ? [
              { label: '💰 သေးသော (< 1M MMK)', action: 'rec_coverage', value: 'low' },
              { label: '💰 အလတ်စား (1M–5M MMK)', action: 'rec_coverage', value: 'mid' },
              { label: '💰 ကြီးမားသော (> 5M MMK)', action: 'rec_coverage', value: 'high' },
            ]
          : [
              { label: '💰 Low (< 1M MMK)', action: 'rec_coverage', value: 'low' },
              { label: '💰 Medium (1M–5M MMK)', action: 'rec_coverage', value: 'mid' },
              { label: '💰 High (> 5M MMK)', action: 'rec_coverage', value: 'high' },
            ],
      })
      return
    }

    if (chip.action === 'rec_coverage') {
      addMsg({ from: 'user', text: chip.label })
      const fullData = { ...recData, coverage: chip.value }
      setRecData(fullData)
      setRec('done')
      showRecommendation(fullData)
      return
    }
  }

  // ── Show all plans ──────────────────────────────────────────────────────────

  const showAllPlans = () => {
    if (plans.length === 0) {
      const loading = lang === 'my' ? 'Plans တင်နေသည်…' : 'Loading plans…'
      addMsg({ from: 'ai', text: loading })
      // Fetch if not yet loaded
      api.get('/packages/public').then(r => {
        const pkgs = Array.isArray(r.data) ? r.data : []
        setPlans(pkgs)
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = buildPlanListMsg(pkgs, lang)
          return copy
        })
      }).catch(() => {})
      return
    }
    addMsg(buildPlanListMsg(plans, lang))
  }

  const buildPlanListMsg = (pkgs, lang) => {
    if (pkgs.length === 0) {
      return { from: 'ai', text: lang === 'my' ? 'Plan များ မတွေ့ပါ။' : 'No plans available.' }
    }
    const intro = lang === 'my'
      ? `${pkgs.length} ခုသော Plan ရှိပါသည်။ Apply လုပ်ရန် Plan ကို ရွေးချယ်ပါ:`
      : `We have ${pkgs.length} insurance plan(s). Choose one to apply:`
    return { from: 'ai', text: intro, plans: pkgs }
  }

  // ── Plan recommender ────────────────────────────────────────────────────────

  const startRecommender = () => {
    setRec('type')
    setRecData({})
    const q = lang === 'my'
      ? 'မည်သည့် အာမခံအမျိုးအစား လိုချင်ပါသလဲ?'
      : 'What type of insurance are you interested in?'
    const typeChips = types.length > 0
      ? types.map(tp => ({
          label: `${TYPE_LABEL_EN[tp.name] ? '' : ''}${lang === 'my' ? (TYPE_LABEL_MY[tp.name] || tp.name) : tp.name}`,
          action: 'rec_type',
          value: tp.name,
        }))
      : [
          { label: lang === 'my' ? '❤️ အသက်' : '❤️ Life', action: 'rec_type', value: 'LIFE' },
          { label: lang === 'my' ? '🏥 ကျန်းမာရေး' : '🏥 Health', action: 'rec_type', value: 'HEALTH' },
          { label: lang === 'my' ? '🚗 ယာဉ်' : '🚗 Auto', action: 'rec_type', value: 'AUTO' },
          { label: lang === 'my' ? '🏠 ပစ္စည်း' : '🏠 Property', action: 'rec_type', value: 'PROPERTY' },
        ]
    addMsg({ from: 'ai', text: q, chips: typeChips })
  }

  const showRecommendation = ({ type, coverage }) => {
    const coverageRanges = { low: [0, 1_000_000], mid: [500_000, 5_000_000], high: [3_000_000, Infinity] }
    const [minC, maxC] = coverageRanges[coverage] || [0, Infinity]

    const matched = plans.filter(p => {
      const typeMatch = !type || p.type === type || p.type?.toUpperCase() === type?.toUpperCase()
        || p.name?.toUpperCase().includes(type?.toUpperCase())
      const covMin = Number(p.coverageMin) || 0
      const covMax = Number(p.coverageMax) || Infinity
      const covMatch = covMin <= maxC && covMax >= minC
      return typeMatch && covMatch
    })

    if (matched.length === 0) {
      // Widen search to just type
      const byType = plans.filter(p =>
        !type || p.type === type || p.type?.toUpperCase() === type?.toUpperCase()
      )
      const fallback = byType.length > 0 ? byType : plans.slice(0, 3)
      const msg = lang === 'my'
        ? `သင်၏ ရွေးချယ်မှုနှင့် တိကျ မကိုက်ညီသော Plan မရှိပါ၊ ဆင်တူသော Plan ${fallback.length} ခု:`
        : `No exact match found. Here are ${fallback.length} similar plan(s) you may like:`
      addMsg({ from: 'ai', text: msg, plans: fallback })
      setRec(null)
      return
    }

    const msg = lang === 'my'
      ? `သင့်အတွက် Plan ${matched.length} ခု ညှိနှိုင်းထားပါသည်:`
      : `Great! Here ${matched.length === 1 ? 'is' : 'are'} ${matched.length} recommended plan(s) for you:`
    addMsg({ from: 'ai', text: msg, plans: matched })
    setRec(null)
  }

  // ── AI chat send ────────────────────────────────────────────────────────────

  const send = async () => {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    setRec(null)
    addMsg({ from: 'user', text: msg })
    setLoading(true)

    // Client-side shortcut: plan listing request
    const lower = msg.toLowerCase()
    const isPlanReq = lower.includes('plan') || lower.includes('package') || lower.includes('အာမခံ plan') || lower.includes('ပြပါ') || lower.includes('show plan')
    const isRecReq = lower.includes('recommend') || lower.includes('suggest') || lower.includes('ညှိ') || lower.includes('ဘယ်plan')

    if (isRecReq) {
      setLoading(false)
      startRecommender()
      return
    }

    if (isPlanReq && plans.length > 0) {
      setLoading(false)
      showAllPlans()
      return
    }

    try {
      const res = await api.post('/ai/chat', { message: msg, lang: i18n.language })
      const reply = res.data.reply || ''
      // Check if reply references specific plans by name
      const matchedPlans = plans.filter(p => reply.includes(p.name))
      addMsg({ from: 'ai', text: reply, plans: matchedPlans.length > 0 ? matchedPlans : undefined })
    } catch {
      const err = lang === 'my'
        ? 'တစ်ခုခု မှားယွင်းနေသည်။ နောက်မှ ထပ်ကြိုးစားပါ။'
        : 'Sorry, something went wrong. Please try again.'
      addMsg({ from: 'ai', text: err })
    } finally {
      setLoading(false)
    }
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const placeholder = lang === 'my' ? 'မေးလိုသည့် မေးခွန်းကို ရိုက်ပါ…' : 'Ask about plans, benefits…'
  const headerSub  = lang === 'my' ? 'Plan များ၊ Benefits နှင့်ပတ်သက်၍ မေးနိုင်သည်' : 'Ask about plans, benefits & more'

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 1200,
          width: 350, maxWidth: 'calc(100vw - 48px)',
          background: 'var(--bg)', border: '1.5px solid var(--border)',
          borderRadius: 18, boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'aiChatFadeUp .25s ease',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
            padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', gap: 10,
            flexShrink: 0,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
              🤖
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Insurance AI Assistant</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.71rem' }}>{headerSub}</div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.8, padding: '0.2rem' }}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '0.85rem 0.9rem',
            display: 'flex', flexDirection: 'column', gap: 8,
            minHeight: 260, maxHeight: 380,
          }}>
            {messages.map((m, i) => (
              <Message key={i} msg={m} onApply={handleApply} onChip={handleChip} loading={loading} lang={lang} />
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>🤖</div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '14px 14px 14px 4px', padding: '0.52rem 0.9rem', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'inline-flex', gap: 3 }}>
                    <span style={{ animation: 'aiDot 1.2s infinite 0s', display: 'inline-block' }}>●</span>
                    <span style={{ animation: 'aiDot 1.2s infinite .2s', display: 'inline-block' }}>●</span>
                    <span style={{ animation: 'aiDot 1.2s infinite .4s', display: 'inline-block' }}>●</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '0.6rem 0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={placeholder}
              style={{
                flex: 1, resize: 'none', border: '1.5px solid var(--border)', borderRadius: 10,
                padding: '0.48rem 0.7rem', fontSize: '0.83rem', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit',
                transition: 'border-color .15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button onClick={send} disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: input.trim() && !loading ? 'var(--primary)' : 'var(--border)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.95rem', flexShrink: 0, transition: 'background .15s', alignSelf: 'flex-end',
              }}>
              <i className="bi bi-send-fill" style={{ fontSize: '0.8rem' }}></i>
            </button>
          </div>
        </div>
      )}

      {/* Bubble Toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1200,
          width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
          boxShadow: '0 6px 24px rgba(99,102,241,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', transition: 'transform .2s, box-shadow .2s',
        }}
        title="Insurance AI Assistant"
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open ? '✕' : '🤖'}
      </button>

      <style>{`
        @keyframes aiDot {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
        @keyframes aiChatFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
