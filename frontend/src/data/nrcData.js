/**
 * Myanmar National Registration Card (NRC) data.
 * Format: StateNo/TownshipCode(CitizenType)Digits
 * Example: 10/ခဆန(နိုင်)123456  →  ချောင်းဆုံမြို့နယ်၊ မွန်ပြည်နယ်
 *
 * code  : 3-char Myanmar abbreviation printed on the NRC card
 * name  : full township name (display only)
 */

export const NRC_DATA = {
  '1': {
    stateName: 'ကချင်ပြည်နယ်',
    townships: [
      { code: 'ဗကထ', name: 'ဗန်းမောက်' },
      { code: 'မဝဘ', name: 'မိုးကောင်း' },
      { code: 'မညတ', name: 'မိုးညှင်း' },
      { code: 'မကန', name: 'မြစ်ကြီးနား' },
      { code: 'ပတသ', name: 'ပူတာအို' },
      { code: 'ဆဘတ', name: 'ဆွမ်ပြားဘွမ်' },
      { code: 'ဝမဝ', name: 'ဝိုင်းမော်' },
      { code: 'ချဖဖ', name: 'ချီဖွေ' },
      { code: 'ကဒတ', name: 'ကောလင်' },
      { code: 'ခကတ', name: 'ခမ်ပတ်' },
    ],
  },

  '2': {
    stateName: 'ကယားပြည်နယ်',
    townships: [
      { code: 'ဘတလ', name: 'ဘောလခဲ' },
      { code: 'ဒမဝ', name: 'ဒီမောဆို' },
      { code: 'ဖကန', name: 'ဖရူဆို' },
      { code: 'ကလသ', name: 'ကလဲ့' },
      { code: 'လဂတ', name: 'လွိုင်ကော်' },
      { code: 'မကလ', name: 'မဲ့' },
      { code: 'ရတမ', name: 'ရပ်ဆောင်း' },
      { code: 'ရမန', name: 'ရှားတော' },
    ],
  },

  '3': {
    stateName: 'ကရင်ပြည်နယ်',
    townships: [
      { code: 'ဘကလ', name: 'ဘားအံ' },
      { code: 'ကကဆ', name: 'ကြာအင်းဆိပ်ကြီး' },
      { code: 'မဝတ', name: 'မြဝတီ' },
      { code: 'ဖကန', name: 'ဖာပွန်' },
      { code: 'သတပ', name: 'သံတောင်ကြီး' },
      { code: 'လကသ', name: 'လူကေ' },
      { code: 'ကပတ', name: 'ကော့ကရိတ်' },
      { code: 'ကထမ', name: 'ကျောက်ကြီး' },
    ],
  },

  '4': {
    stateName: 'ချင်းပြည်နယ်',
    townships: [
      { code: 'ဖကလ', name: 'ဖလမ်း' },
      { code: 'ဟဃတ', name: 'ဟားခါး' },
      { code: 'ကဃတ', name: 'ကန်ပက်လက်' },
      { code: 'လဃတ', name: 'လိုင်ဇော်' },
      { code: 'မဃတ', name: 'မင်းတပ်' },
      { code: 'မဒတ', name: 'မတူပီ' },
      { code: 'ပဃလ', name: 'ပလက်ဝ' },
      { code: 'တဒတ', name: 'တွန်းဇံ' },
      { code: 'တတန', name: 'တီးတိန်' },
      { code: 'သတလ', name: 'သန်တလန်' },
    ],
  },

  '5': {
    stateName: 'စစ်ကိုင်းတိုင်းဒေသကြီး',
    townships: [
      { code: 'ကနတ', name: 'ကနီ' },
      { code: 'ကမတ', name: 'ကသာ' },
      { code: 'ကလတ', name: 'ကလေး' },
      { code: 'ကထတ', name: 'ကလေးဝ' },
      { code: 'ကဘတ', name: 'ကန့်ဘလူ' },
      { code: 'ရကတ', name: 'ရေဦး' },
      { code: 'ဆကတ', name: 'ဆားလင်းကြီး' },
      { code: 'စစတ', name: 'စစ်ကိုင်း' },
      { code: 'ရဘတ', name: 'ရွှေဘို' },
      { code: 'တတပ', name: 'တမူး' },
      { code: 'ဝကတ', name: 'ဝက်လက်' },
      { code: 'ရမတ', name: 'ရမည်းသင်း' },
      { code: 'ရကပ', name: 'ရွာငံ' },
      { code: 'မလတ', name: 'မော်လိုက်' },
      { code: 'မကတ', name: 'မင်းကင်း' },
      { code: 'ခကတ', name: 'ခင်ဦး' },
      { code: 'ပကတ', name: 'ပင်လည်ဘူး' },
      { code: 'ဟကတ', name: 'ဟုမ္မလင်း' },
      { code: 'ယကတ', name: 'ယင်းမာပင်' },
      { code: 'ငနတ', name: 'ငါနှောင်း' },
      { code: 'မတပ', name: 'မုံရွာ' },
      { code: 'ဖကတ', name: 'ဖောင်းပြင်' },
      { code: 'ဒကတ', name: 'ဒိပဲရင်း' },
      { code: 'ဝသတ', name: 'ဝန်းသို' },
    ],
  },

  '6': {
    stateName: 'တနင်္သာရီတိုင်းဒေသကြီး',
    townships: [
      { code: 'ဘကလ', name: 'ဘုတ်ပြင်း' },
      { code: 'ထကတ', name: 'ထားဝယ်' },
      { code: 'မကတ', name: 'မြိတ်' },
      { code: 'ကသတ', name: 'ကော့သောင်း' },
      { code: 'ပကတ', name: 'ပုလော' },
      { code: 'သကတ', name: 'သရက်ချောင်း' },
      { code: 'ရကတ', name: 'ရေဖြူ' },
      { code: 'ကဟတ', name: 'ကလိမ်' },
      { code: 'မကသ', name: 'မိုးနဲ' },
      { code: 'လကတ', name: 'လောင်းလုံ' },
      { code: 'ဒဝတ', name: 'ဒေါက်ဦး' },
    ],
  },

  '7': {
    stateName: 'ပဲခူးတိုင်းဒေသကြီး',
    townships: [
      { code: 'ပကတ', name: 'ပဲခူး' },
      { code: 'တကတ', name: 'တောင်ငူ' },
      { code: 'ပသတ', name: 'ပြည်' },
      { code: 'ဝတပ', name: 'ဝေါ' },
      { code: 'ဒကန', name: 'ဒိုက်ဦး' },
      { code: 'ကသပ', name: 'ကျောက်တံခါး' },
      { code: 'ကကပ', name: 'ကြို့ပင်ကောက်' },
      { code: 'ကမတ', name: 'ကဝ' },
      { code: 'ဖကတ', name: 'ဖြူး' },
      { code: 'ရကတ', name: 'ရေတာရှည်' },
      { code: 'မကန', name: 'မင်းလှ' },
      { code: 'ညကတ', name: 'ညောင်လေးပင်' },
      { code: 'ဘကန', name: 'ဘုရားသုံးဆူ' },
      { code: 'ဆတပ', name: 'ဆည်ကြောင်းကြီး' },
      { code: 'ရကပ', name: 'ရွာငံ' },
      { code: 'သကပ', name: 'သာယာဝတီ' },
    ],
  },

  '8': {
    stateName: 'မကွေးတိုင်းဒေသကြီး',
    townships: [
      { code: 'မကတ', name: 'မကွေး' },
      { code: 'ပမတ', name: 'ပခုက္ကူ' },
      { code: 'ဆဝတ', name: 'ဆော' },
      { code: 'ငပတ', name: 'ငပုတော' },
      { code: 'ချကတ', name: 'ချောက်' },
      { code: 'မဘတ', name: 'မင်းဘူး' },
      { code: 'မမတ', name: 'မြောင်း' },
      { code: 'နတပ', name: 'နတ်မောက်' },
      { code: 'ဂကတ', name: 'ဂန့်ဂေါ်' },
      { code: 'ရနတ', name: 'ရေနံချောင်း' },
      { code: 'ပကတ', name: 'ပေါက်' },
      { code: 'သကတ', name: 'သရက်' },
      { code: 'တကတ', name: 'တောင်တွင်းကြီး' },
      { code: 'ဆသတ', name: 'ဆိပ်ဖြူ' },
      { code: 'ကမတ', name: 'ကျောက်ပတ်' },
    ],
  },

  '9': {
    stateName: 'မန္တလေးတိုင်းဒေသကြီး',
    townships: [
      { code: 'မကတ', name: 'မန္တလေး (မြောက်)' },
      { code: 'မဒတ', name: 'မန္တလေး (တောင်)' },
      { code: 'ကသတ', name: 'ကျောက်ဆည်' },
      { code: 'ကပတ', name: 'ကျောက်ပန်းတောင်း' },
      { code: 'မသတ', name: 'မိတ္ထီလာ' },
      { code: 'ပကတ', name: 'ပြင်ဦးလွင်' },
      { code: 'မဝတ', name: 'မှော်ဘီ' },
      { code: 'မမတ', name: 'မြင်းမူ' },
      { code: 'တပတ', name: 'တပ်ကုန်း' },
      { code: 'ညကတ', name: 'ညောင်ဦး' },
      { code: 'တကတ', name: 'တောင်သာ' },
      { code: 'ရမတ', name: 'ရမည်းသင်း' },
      { code: 'မကပ', name: 'မင်းကွန်း' },
      { code: 'အမတ', name: 'အမရပူရ' },
      { code: 'ချအတ', name: 'ချမ်းအေးသာစည်' },
      { code: 'ချမတ', name: 'ချမ်းမြသာစည်' },
      { code: 'မဂတ', name: 'မောင်း' },
      { code: 'မတတ', name: 'မတ္တရာ' },
      { code: 'ဆကတ', name: 'ဆင်ဖြူကျွန်း' },
    ],
  },

  '10': {
    stateName: 'မွန်ပြည်နယ်',
    townships: [
      { code: 'မမတ', name: 'မော်လမြိုင်' },
      { code: 'ကမန', name: 'ကျိုက်မရော' },
      { code: 'ကထမ', name: 'ကျိုက်ထို' },
      { code: 'ခဆန', name: 'ချောင်းဆုံ' },
      { code: 'မဒန', name: 'မုဒုံ' },
      { code: 'သနပ', name: 'သံပုဇြဲ' },
      { code: 'ဘလတ', name: 'ဘီးလင်း' },
      { code: 'ပကန', name: 'ပေါင်' },
      { code: 'ရကသ', name: 'ရေး' },
    ],
  },

  '11': {
    stateName: 'ရခိုင်ပြည်နယ်',
    townships: [
      { code: 'စစတ', name: 'စစ်တွေ' },
      { code: 'ကကတ', name: 'ကျောက်ဖြူ' },
      { code: 'မကတ', name: 'မောင်တော' },
      { code: 'ကထတ', name: 'ကျောက်တော်' },
      { code: 'မဘတ', name: 'မင်းဘျူး' },
      { code: 'မပတ', name: 'မြေပုံ' },
      { code: 'ရကတ', name: 'ရမ်းဗြဲ' },
      { code: 'သကတ', name: 'သံတွဲ' },
      { code: 'တကတ', name: 'တောင်ကုတ်' },
      { code: 'ဂကတ', name: 'ဂွ' },
      { code: 'ပကတ', name: 'ပုဏ္ဏားကျွန်း' },
      { code: 'ဆကတ', name: 'ဆတော' },
      { code: 'အကတ', name: 'အမ်း' },
      { code: 'မမတ', name: 'မြောင်' },
      { code: 'ဘကတ', name: 'ဘူသီးတောင်' },
      { code: 'တပတ', name: 'တောင်ပြူ' },
      { code: 'ဒတ', name: 'ဒေးနဲ' },
    ],
  },

  '12': {
    stateName: 'ရန်ကုန်တိုင်းဒေသကြီး',
    townships: [
      { code: 'ဗဟန', name: 'ဗဟန်း' },
      { code: 'ဗတတ', name: 'ဗိုလ်တထောင်' },
      { code: 'ကမတ', name: 'ကမာရွတ်' },
      { code: 'ကကတ', name: 'ကြည့်မြင်တိုင်' },
      { code: 'ဒဂတ', name: 'ဒဂုံ' },
      { code: 'ဒကတ', name: 'ဒလ' },
      { code: 'ဒပတ', name: 'ဒေါပုံ' },
      { code: 'ဟကတ', name: 'ဟင်္သာတ' },
      { code: 'ဟလတ', name: 'ဟလောင်' },
      { code: 'မတညတ', name: 'မင်္ဂလာတောင်ညွန့်' },
      { code: 'မကန', name: 'မင်္ဂလာဒုံ' },
      { code: 'မရကတ', name: 'မရမ်းကုန်း' },
      { code: 'မဒတ', name: 'မြောက်ဒဂုံ' },
      { code: 'မအတ', name: 'မြောက်အောင်မြေ' },
      { code: 'ပကန', name: 'ပုဇွန်တောင်' },
      { code: 'သကတ', name: 'သင်္ဃန်းကျွန်း' },
      { code: 'စကတ', name: 'စမ်းချောင်း' },
      { code: 'ရကန', name: 'ရွှေပြည်သာ' },
      { code: 'တဒကတ', name: 'တောင်ဒဂုံ' },
      { code: 'တအတ', name: 'တောင်အောင်မြေ' },
      { code: 'သဗပ', name: 'သာကေတ' },
      { code: 'တမတ', name: 'တာမွေ' },
      { code: 'ဆကန', name: 'ဆိပ်ကမ်း' },
      { code: 'သသတ', name: 'သုံးခွ' },
      { code: 'တတတ', name: 'တွံတေး' },
      { code: 'လသတ', name: 'လသာ' },
      { code: 'လမတ', name: 'လမှိုင်' },
      { code: 'မလတ', name: 'မလ္လရ' },
      { code: 'အကတ', name: 'အင်းစိန်' },
      { code: 'ရကတ', name: 'ရေတာရှည်' },
      { code: 'ညတကတ', name: 'ညောင်တုန်း' },
      { code: 'လကတ', name: 'လှည်းကူး' },
      { code: 'ရသကတ', name: 'ရွာသစ်ကြီး' },
      { code: 'မဟတ', name: 'လှိုင်သာယာ' },
      { code: 'မကတ', name: 'မဟာအောင်မြေ' },
      { code: 'ကကပ', name: 'ကိုကိုးကျွန်း' },
      { code: 'ဆဖတ', name: 'ဆင်ဖြူကျွန်း' },
    ],
  },

  '13': {
    stateName: 'ရှမ်းပြည်နယ်',
    townships: [
      { code: 'မဆန', name: 'မိုင်းဆတ်' },
      { code: 'မကတ', name: 'မူဆယ်' },
      { code: 'ကမတ', name: 'ကျောက်မဲ' },
      { code: 'လကတ', name: 'လားရှိုး' },
      { code: 'ဆကတ', name: 'ဆီဆိုင်' },
      { code: 'ကကတ', name: 'ကောင်းတုံ' },
      { code: 'ကဆတ', name: 'ကျောက်ဆည် (ရှမ်း)' },
      { code: 'မပတ', name: 'မိုင်းပျဉ်း' },
      { code: 'နနတ', name: 'နမ့်ဆန်' },
      { code: 'တတပ', name: 'တာချီလိတ်' },
      { code: 'ဟဒတ', name: 'ဟိုပုံ' },
      { code: 'မဟတ', name: 'မိုင်းဟောင်' },
      { code: 'ကဘတ', name: 'ကျောင်းတောင်' },
      { code: 'နနပ', name: 'နမ့်ဆာမ်' },
      { code: 'မဒတ', name: 'မိုင်းဒိုင်' },
      { code: 'မမပ', name: 'မောင်းမောင်း' },
      { code: 'မကပ', name: 'မန်တုန်' },
      { code: 'ပကတ', name: 'ပင်လောင်း (ရှမ်း)' },
      { code: 'တကပ', name: 'တောင်ကြီး' },
      { code: 'ရမတ', name: 'ရပ်မည်းနောင်' },
      { code: 'ဟပတ', name: 'ဟိုပုံ (ရှမ်းတောင်)' },
      { code: 'ကကပ', name: 'ကော်လိမ်' },
      { code: 'မမဒ', name: 'မိုးနဲ (ရှမ်း)' },
    ],
  },

  '14': {
    stateName: 'အိုင်ရာဝတီတိုင်းဒေသကြီး',
    townships: [
      { code: 'ဗကတ', name: 'ဗောဂါလေ' },
      { code: 'ကမတ', name: 'ကောဘ' },
      { code: 'ဒကတ', name: 'ဒေးဒရဲ' },
      { code: 'ကထပ', name: 'ကျောင်းကုန်း' },
      { code: 'မတပ', name: 'မြောင်ကြီး' },
      { code: 'ပကပ', name: 'ပုသိမ်' },
      { code: 'ပသပ', name: 'ပင်မဲ' },
      { code: 'ဆမပ', name: 'ဆားတောင်း' },
      { code: 'မမပ', name: 'မောင်မောင်း' },
      { code: 'နနပ', name: 'နေပြည်တော် (ဝ)' },
      { code: 'ဟကပ', name: 'ဟသာပါ' },
      { code: 'ဝမပ', name: 'ဝိုင်းကန်' },
      { code: 'မကပ', name: 'မအူပင်' },
      { code: 'ကတပ', name: 'ကြောင်ပုတ်' },
      { code: 'မသပ', name: 'မြောင်သစ်' },
      { code: 'ပကတ', name: 'ပြောင်ကောင်' },
      { code: 'မဒပ', name: 'မတ္တရာ (အိုင်ရာဝတီ)' },
      { code: 'သကပ', name: 'သင်တိုင်ကျွန်း' },
      { code: 'ဒမပ', name: 'ဒေးဒရဲ-မြောင်' },
      { code: 'ဂကတ', name: 'ဂဒေါင်' },
      { code: 'ကကပ', name: 'ကနောင်' },
      { code: 'ဇလကတ', name: 'ဇလွန်' },
    ],
  },
}

/** Citizen type codes printed on NRC */
export const NRC_CITIZEN_TYPES = [
  { value: 'နိုင်', label: 'နိုင် — နိုင်ငံသား' },
  { value: 'ဧည့်', label: 'ဧည့် — ဧည့်နိုင်ငံသား' },
  { value: 'ပြု', label: 'ပြု — ပြုစုနိုင်ငံသား' },
  { value: 'သ', label: 'သ — သွားလာခွင့်ပြုသူ' },
]

/**
 * Given a state key, return its townships array (or []).
 */
export function getTownships(stateKey) {
  return NRC_DATA[stateKey]?.townships ?? []
}

/**
 * Look up a township object by code within a state.
 * Returns { code, name } or undefined.
 */
export function findTownship(stateKey, code) {
  return getTownships(stateKey).find(t => t.code === code)
}

/**
 * Try to resolve a legacy full-name value to a code.
 * Used for backward-compat when old records stored the name instead of the code.
 */
export function resolveToCode(stateKey, nameOrCode) {
  const townships = getTownships(stateKey)
  // Exact code match
  if (townships.some(t => t.code === nameOrCode)) return nameOrCode
  // Name match → return code
  const byName = townships.find(t => t.name === nameOrCode)
  return byName ? byName.code : nameOrCode
}
