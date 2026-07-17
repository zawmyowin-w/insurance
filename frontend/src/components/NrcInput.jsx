import React from 'react'

// Myanmar NRC data: State No → { name, townships[] }
export const NRC_STATES = {
  '1':  { name: '၁ ကချင်ပြည်နယ်',     townships: ['ဘားမိုး','မိုးညှင်း','မြစ်ကြီးနား','မိုးကောင်း','ဆွမ်ပြားဘွမ်','ဝိုင်းမော်','ပူတာအို','ချီဖွေ','ကောလင်'] },
  '2':  { name: '၂ ကယားပြည်နယ်',     townships: ['ဘောလခဲ','ဒေမောဆို','ဖရူဆို','လွိုင်ကော်','မဲဆဲ','ရှားတော'] },
  '3':  { name: '၃ ကရင်ပြည်နယ်',     townships: ['ကော့ကရိတ်','မြဝတီ','ဖာပွန်','ဘားအံ','လှိုင်းဘွဲ'] },
  '4':  { name: '၄ ချင်းပြည်နယ်',     townships: ['ဖလမ်း','ဟားခါး','ကန်ပက်လက်','မတူပီ','မင်းတပ်','ပလက်ဝ','တီးတိန်','သန်တလန်','တောင်ဇာ'] },
  '5':  { name: '၅ မွန်ပြည်နယ်',     townships: ['ဘီးလင်း','ကျောက်တံခါး','ကျောက်မြောက်','ကျောင်းကုန်း','မော်လမြိုင်','မုဒုံ','ပေါင်','သထုံ','ရေး'] },
  '6':  { name: '၆ ရခိုင်ပြည်နယ်',   townships: ['အမ်း','ကျောက်ဖြူ','ကျောက်တော်','မောင်တော','မြင်ဘူး','မြေပုံ','စစ်တွေ','တောင်ကုတ်','သံတွဲ','တောင်ပြူ'] },
  '7':  { name: '၇ ရှမ်းပြည်နယ်',    townships: ['ဟိုပုံး','နမ်ဆန်','လဲချား','ကျိုင်းတုံ','လားရှိုး','မိုင်းဆတ်','ငါတပ်','ညောင်ရွှေ','တောင်ကြီး','တာချီလိတ်','မူဆယ်','ကောလင်'] },
  '8':  { name: '၈ စစ်ကိုင်းတိုင်း', townships: ['ကနီ','ကသာ','ကာလေး','ကလေး','ရေဦး','ဆားလင်းကြီး','စစ်ကိုင်း','ရွှေဘို','တမူး','ဝက်လက်','ရမည်းသင်း','ရွာငံ','မော်လိုက်','မင်းကင်း','ခင်ဦး','ပင်လည်ဘူး'] },
  '9':  { name: '၉ တနင်္သာရီတိုင်း', townships: ['ဘုတ်ပြင်း','ထားဝယ်','ကျွန်းစု','လောင်းလုံ','မြိတ်','ပုလော','သရက်ချောင်း','ရေဖြူ'] },
  '10': { name: '၁၀ ပဲခူးတိုင်း',    townships: ['ပဲခူး','တောင်ငူ','ညောင်လေးပင်','ရေတာရှည်','ဝေါ','ဒိုက်ဦး','ကြို့ပင်ကောက်','ကဝ','ပုသိမ်ကြီး','ဖြူး','ပြည်','သဲကုန်း','ရွှေကျင်','မင်းလှ'] },
  '11': { name: '၁၁ မကွေးတိုင်း',    townships: ['ငပုတော','ချောက်','ဂန့်ဂေါ','မကွေး','မင်းဘူး','မြောင်း','နတ်မောက်','ပခုက္ကူ','ပေါက်','ဆော','ရေနံချောင်း','တောင်တွင်းကြီး','သရက်','ဆိပ်ဖြူ','တိပ်'] },
  '12': { name: '၁၂ မန္တလေးတိုင်း',  townships: ['အမရပူရ','ချမ်းအေးသာစည်','ချမ်းမြသာစည်','ကျောက်ဆည်','ကျောက်ပန်းတောင်း','မင်းကွန်း','မိတ္ထီလာ','မော်လိုက်','မကွေး','မှော်ဘီ','မြင်းမူ','မောင်း','မန္တလေး','မတ္တရာ',' နွားထိုး','ညောင်ဦး','ပြင်ဦးလွင်','ဆင်ဖြူကျွန်း','တောင်သာ','ရမည်းသင်း'] },
  '13': { name: '၁၃ ရန်ကုန်တိုင်း',  townships: ['ဗဟန်း','ဗိုလ်တထောင်','ဒဂုံ','ဒလ','ဒေါပုံ','ဟင်္သာတ','ဟလောင်','အင်းစိန်','ကမာရွတ်','ကြည့်မြင်တိုင်','လသာ','လမှိုင်','မင်္ဂလာတောင်ညွန့်','မင်္ဂလာဒုံ','မရမ်းကုန်း','မလ္လရ','မောကွန်း','မြောက်ဒဂုံ','မြောက်အောင်မြေ','ဉာဏ်မြောက်','ပုဇွန်တောင်','သင်္ဃန်းကျွန်း','စမ်းချောင်း','ရွှေပြည်သာ','တောင်ဒဂုံ','တောင်အောင်မြေ','သာကေတ','သင်္ဃန်းကျွန်း','သာမြေ',' သဃ္ဃန်းကျွန်း','တာမွေ','ဆိပ်ကမ်း','သုံးခွ','တွံတေး','လှည်းကူး','ရွာသစ်ကြီး','ရေတာရှည်','ညောင်တုန်း'] },
  '14': { name: '၁၄ ဧရာဝတီတိုင်း',   townships: ['ဘိုကလေး','ဒနူဘြူး','ဒေးဒရဲ','အိမ်မဲ','ဟင်္သာတ','ဩကလပ်','ကော့မှုး','ကျောင်းကုန်း','ကျောက်ကြိုး','လပွတ္တာ','မအူပင်','မြောင်း','ပုသိမ်','ပြည်ကြီးတောင်','ဆိပ်ဖြူ','သာပေါင်း','ရေနံချောင်','ဝါကမာ','ဇလွန်'] },
}

export const NRC_CITIZEN_TYPES = [
  { value: 'N', label: 'N (နိုင်) - နိုင်ငံသား' },
  { value: 'E', label: 'E (ဧည့်) - ဧည့်နိုင်ငံသား' },
  { value: 'P', label: 'P (ပြု) - ပြုစုနိုင်ငံသား' },
  { value: 'T', label: 'T (သ) - သွားလာခွင့်ပြုသူ' },
]

/**
 * Myanmar NRC input component.
 * value: string in format "StateNo/Township(Type)Digits" e.g. "12/မန္တလေး(N)123456"
 * onChange: (nrcString) => void
 */
export default function NrcInput({ value, onChange, required, readOnly }) {
  // Parse current value
  const parsed = parseNrc(value || '')

  const handleChange = (part, val) => {
    const next = { ...parsed, [part]: val }
    // reset township when state changes
    if (part === 'state') next.township = ''
    onChange(formatNrc(next))
  }

  const stateObj = NRC_STATES[parsed.state] || null
  const townships = stateObj ? stateObj.townships : []

  const inputStyle = {
    background: readOnly ? 'var(--bg-secondary)' : undefined,
    cursor: readOnly ? 'not-allowed' : undefined,
    color: readOnly ? 'var(--text-muted)' : undefined,
  }

  return (
    <div>
      <div className="d-flex gap-1 align-items-center flex-wrap">
        {/* State number */}
        <select
          className="form-select-custom"
          style={{ width: 70, flexShrink: 0, ...inputStyle }}
          value={parsed.state}
          disabled={readOnly}
          required={required && !readOnly}
          onChange={e => handleChange('state', e.target.value)}
        >
          <option value="">နံပါတ်</option>
          {Object.keys(NRC_STATES).map(k => (
            <option key={k} value={k}>{k}/</option>
          ))}
        </select>

        {/* Township */}
        <select
          className="form-select-custom"
          style={{ flex: '1 1 160px', minWidth: 140, ...inputStyle }}
          value={parsed.township}
          disabled={readOnly || !parsed.state}
          required={required && !readOnly}
          onChange={e => handleChange('township', e.target.value)}
        >
          <option value="">မြို့နယ်ကုဒ်</option>
          {townships.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Citizen type */}
        <select
          className="form-select-custom"
          style={{ width: 80, flexShrink: 0, ...inputStyle }}
          value={parsed.type}
          disabled={readOnly}
          required={required && !readOnly}
          onChange={e => handleChange('type', e.target.value)}
        >
          <option value="">အမျိုး</option>
          {NRC_CITIZEN_TYPES.map(ct => (
            <option key={ct.value} value={ct.value}>{ct.value}</option>
          ))}
        </select>

        {/* Number */}
        <input
          className="form-control-custom"
          style={{ width: 110, flexShrink: 0, ...inputStyle }}
          placeholder="၁၂၃၄၅၆"
          maxLength={6}
          value={parsed.digits}
          readOnly={readOnly}
          required={required && !readOnly}
          onChange={e => handleChange('digits', e.target.value.replace(/[^0-9၀-၉]/g, ''))}
        />
      </div>

      {/* Preview */}
      {(parsed.state || parsed.township || parsed.type || parsed.digits) && (
        <div style={{ marginTop: 4, fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          NRC: <strong style={{ color: 'var(--text-primary)' }}>{formatNrc(parsed) || '—'}</strong>
        </div>
      )}

      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
        ဥပမာ: ၁၂/မန္တလေး(N)၁၂၃၄၅၆
      </div>
    </div>
  )
}

function parseNrc(str) {
  if (!str) return { state: '', township: '', type: '', digits: '' }
  // Try to parse "StateNo/Township(Type)Digits"
  const m = str.match(/^(\d+)\/(.+)\(([NEPT])\)(.*)$/)
  if (m) return { state: m[1], township: m[2], type: m[3], digits: m[4] }
  return { state: '', township: '', type: '', digits: '' }
}

export function formatNrc({ state, township, type, digits }) {
  if (!state && !township && !type && !digits) return ''
  let parts = ''
  if (state) parts += state + '/'
  if (township) parts += township
  if (type) parts += `(${type})`
  if (digits) parts += digits
  return parts
}
