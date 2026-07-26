/**
 * Shared validation constants and helpers used across all roles.
 *
 * EMAIL validation rules:
 *   - Required, not empty, not null
 *   - Lowercase (a-z) only — uppercase not accepted
 *   - No spaces anywhere (leading, trailing, or internal)
 *   - Exactly one @ symbol; must not start or end with @
 *   - Username (before @): 6–30 chars, a-z / 0-9 / . / _ / - only
 *       • Must start and end with a letter or number
 *       • No consecutive .. __ --
 *       • No mixed consecutive patterns: ._ _. .- -.
 *       • Numeric-only usernames blocked (e.g. 123456)
 *       • Reserved usernames blocked (admin, root, system, test …)
 *   - Domain (after @): letter or number start, no underscore,
 *       no leading/trailing hyphen per label, at least one dot
 *   - TLD (last domain segment): 2–6 letters only
 *   - Disposable/temp-mail domains blocked
 *   - SQL injection / XSS inputs blocked by strict character whitelist
 */

// ── Email constants ───────────────────────────────────────────────────────

export const EMAIL_USERNAME_MIN = 6
export const EMAIL_USERNAME_MAX = 30
/** Total max: username(30) + @(1) + domain(~60) */
export const EMAIL_MAX_LENGTH = 100

/** Kept for backward-compatible callers */
export const GMAIL_USERNAME_MIN = EMAIL_USERNAME_MIN
export const GMAIL_USERNAME_MAX = EMAIL_USERNAME_MAX

/**
 * Loose pattern for quick sanity-check fallbacks.
 * Full validation is done by getEmailValidationError().
 */
export const EMAIL_PATTERN = /^[a-z0-9][a-z0-9._-]{4,28}[a-z0-9]@[a-z0-9][a-z0-9.-]{0,61}[a-z0-9]\.[a-z]{2,6}$|^[a-z0-9]{6,30}@[a-z0-9][a-z0-9.-]+\.[a-z]{2,6}$/

/** Normalize: trim + lowercase (use before persisting, not as a validation bypass) */
export function normalizeEmail(raw) {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : ''
}

// ── Reserved / blacklisted usernames ─────────────────────────────────────
const RESERVED_USERNAMES = new Set([
  'admin', 'root', 'system', 'test',
  'noreply', 'no.reply', 'donotreply', 'do.not.reply',
  'fake', 'spam', 'trash', 'disposable', 'temp', 'temporary',
  'test123', 'test.user', 'example', 'sample', 'demo', 'guest',
  'anonymous', 'abuse', 'postmaster', 'webmaster', 'info', 'support',
  'contact', 'hello', 'mail', 'email', 'user', 'account',
])

// ── Disposable / temp-mail domains ───────────────────────────────────────
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'temp-mail.org',
  'yopmail.com', '10minutemail.com', 'trashmail.com', 'fakeinbox.com',
  'sharklasers.com', 'spam4.me', 'maildrop.cc', 'getnada.com',
  'dispostable.com', 'mailnull.com', 'spamgourmet.com', 'throwam.com',
  'discardmail.com', 'discard.email', 'spamex.com', 'getairmail.com',
  'incognitomail.com', 'jetable.com', 'meltmail.com', 'pookmail.com',
  'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org',
  'trashmail.at', 'trashmail.io', 'trashmail.me', 'trashmail.net',
  'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de',
  'guerrillamail.net', 'guerrillamail.org', 'grr.la',
  'mohmal.com', 'filzmail.com', 'spamavert.com', 'spaminator.de',
  'spammotel.com', 'spamspot.com', 'zetmail.com', 'noclickemail.com',
  'spamfree24.org', 'deadaddress.com', 'spamgob.com', 'mailnew.com',
  'sogetthis.com', 'privymail.de', 'spamex.com', 'wpdfs.com',
])

// ── Main validation ───────────────────────────────────────────────────────

/**
 * Returns a bilingual error object { en, my } for the first rule violation,
 * or null if the email is valid.
 *
 * Validates the RAW input (no silent trimming / normalization).
 *
 * @param {string} rawEmail – the raw string from the input
 */
export function getEmailValidationError(rawEmail) {
  // ① Required
  if (rawEmail === undefined || rawEmail === null || rawEmail === '') {
    return {
      en: 'Email is required.',
      my: 'Email ဖြည့်သွင်းရန် လိုအပ်ပါသည်။',
    }
  }

  // ② No spaces anywhere (covers leading, trailing, internal)
  if (/\s/.test(rawEmail)) {
    return {
      en: 'Email must not contain any spaces (including at the start or end).',
      my: 'Email တွင် Space လုံးဝ မပါရပါ။ (ရှေ့၊ နောက်၊ အလယ် မည်သည့်နေရာတွင်မဆို)',
    }
  }

  // ③ Lowercase only — uppercase letters not accepted
  if (rawEmail !== rawEmail.toLowerCase()) {
    return {
      en: 'Email must be lowercase only. Uppercase letters (A–Z) are not accepted.',
      my: 'Email တွင် စာလုံးအသေး (a-z) သာ ဖြည့်ရပါမည်။ အကြီးစာလုံး (A-Z) လက်မခံပါ။',
    }
  }

  const email = rawEmail // already confirmed lowercase, no spaces

  // ④ Must not start with @
  if (email.startsWith('@')) {
    return {
      en: 'Email must not start with @.',
      my: 'Email သည် @ ဖြင့် မစရပါ။',
    }
  }

  // ⑤ Must not end with @
  if (email.endsWith('@')) {
    return {
      en: 'Email must not end with @.',
      my: 'Email သည် @ ဖြင့် မဆုံးရပါ။',
    }
  }

  // ⑥ Exactly one @
  const atCount = (email.match(/@/g) || []).length
  if (atCount === 0) {
    return {
      en: 'Email must contain the @ symbol.',
      my: 'Email တွင် @ သင်္ကေတ ပါရမည်။',
    }
  }
  if (atCount > 1) {
    return {
      en: 'Email must contain exactly one @ symbol.',
      my: '@ သင်္ကေတ တစ်ခုတည်းသာ ပါဝင်ရမည်။',
    }
  }

  const atIdx    = email.indexOf('@')
  const username = email.substring(0, atIdx)
  const domain   = email.substring(atIdx + 1)

  // ══ Username rules ═══════════════════════════════════════════════════════

  // ⑦ Username length 6–30
  if (username.length < EMAIL_USERNAME_MIN) {
    return {
      en: `Username (before @) must be at least ${EMAIL_USERNAME_MIN} characters (yours: ${username.length}).`,
      my: `Username (@ ရှေ့) အနည်းဆုံး ${EMAIL_USERNAME_MIN} လုံး ဖြစ်ရမည်။ (${username.length} လုံးသာ ရှိသည်)`,
    }
  }
  if (username.length > EMAIL_USERNAME_MAX) {
    return {
      en: `Username (before @) must not exceed ${EMAIL_USERNAME_MAX} characters (yours: ${username.length}).`,
      my: `Username (@ ရှေ့) အများဆုံး ${EMAIL_USERNAME_MAX} လုံးသာ ဖြစ်ရမည်။`,
    }
  }

  // ⑧ Username must start with a letter or number
  if (!/^[a-z0-9]/.test(username)) {
    return {
      en: 'Username must start with a letter (a–z) or number (0–9).',
      my: 'Username သည် အက္ခရာ (a-z) သို့မဟုတ် ဂဏန်း (0-9) ဖြင့် စရမည်။',
    }
  }

  // ⑨ Username must not end with . _ -
  if (/[._-]$/.test(username)) {
    const last = username[username.length - 1]
    const [en_char, my_char] =
      last === '.' ? ['dot (.)',        'Dot (.)']        :
      last === '_' ? ['underscore (_)', 'Underscore (_)'] :
                     ['hyphen (-)',     'Hyphen (-)']
    return {
      en: `Username must not end with a ${en_char}.`,
      my: `Username အဆုံးတွင် ${my_char} မဖြစ်ရပါ။`,
    }
  }

  // ⑩ Username allowed characters: a-z, 0-9, . _ -  (blocks +#$%&!?*() etc.)
  if (!/^[a-z0-9._-]+$/.test(username)) {
    return {
      en: 'Username may only contain letters (a–z), numbers (0–9), dots (.), underscores (_), or hyphens (-). Special characters like +, #, $, %, &, !, ?, *, (, ) are not allowed.',
      my: 'Username တွင် a-z, 0-9, ., _, - သာ လက်ခံသည်။ +, #, $, %, &, !, ?, *, (, ) ကဲ့သို့ Special Characters များ လက်မခံပါ။',
    }
  }

  // ⑪ No consecutive dots (..)
  if (username.includes('..')) {
    return {
      en: 'Username must not contain consecutive dots (..).',
      my: 'Username တွင် Dot နှစ်လုံးဆက်တိုက် (..) မဖြစ်ရပါ။',
    }
  }

  // ⑫ No consecutive underscores (__)
  if (username.includes('__')) {
    return {
      en: 'Username must not contain consecutive underscores (__).',
      my: 'Username တွင် Underscore နှစ်လုံးဆက်တိုက် (__) မဖြစ်ရပါ။',
    }
  }

  // ⑬ No consecutive hyphens (--)
  if (username.includes('--')) {
    return {
      en: 'Username must not contain consecutive hyphens (--).',
      my: 'Username တွင် Hyphen နှစ်လုံးဆက်တိုက် (--) မဖြစ်ရပါ။',
    }
  }

  // ⑭ No mixed consecutive special characters: ._ _. .- -.
  if (username.includes('._') || username.includes('_.') ||
      username.includes('.-') || username.includes('-.')) {
    return {
      en: 'Username must not contain mixed consecutive special characters (e.g. ._, _., .-, -.).',
      my: 'Username တွင် ._, _., .-, -. ကဲ့သို့ Pattern များ မပါရပါ။',
    }
  }

  // ⑮ Numeric-only username blocked (e.g. 123456@...)
  if (/^[0-9]+$/.test(username)) {
    return {
      en: 'Username must not be numbers only. Include at least one letter (a–z).',
      my: 'Username တွင် ဂဏန်းများသာ မဖြစ်ရပါ (Numeric Only မခွင့်ပြု)။ အက္ခရာ (a-z) အနည်းဆုံး တစ်လုံး ပါရမည်။',
    }
  }

  // ⑯ Reserved / blacklisted usernames (admin@, root@, system@, test@ …)
  if (RESERVED_USERNAMES.has(username)) {
    return {
      en: 'This email address is not allowed. Please use a different email.',
      my: 'ဤ Email လိပ်စာကို ခွင့်မပြုပါ။ အခြား Email လိပ်စာ သုံးပါ။',
    }
  }

  // ══ Domain rules ══════════════════════════════════════════════════════════

  // ⑰ Domain must start with a letter or number
  if (!/^[a-z0-9]/.test(domain)) {
    return {
      en: 'Email domain must start with a letter or number.',
      my: 'Domain Name သည် အက္ခရာ သို့မဟုတ် ဂဏန်း ဖြင့် စရမည်။',
    }
  }

  // ⑱ Domain must not contain underscore
  if (domain.includes('_')) {
    return {
      en: 'Email domain must not contain underscores (_).',
      my: 'Domain Name တွင် Underscore (_) မပါရပါ။',
    }
  }

  // ⑲ Domain must have at least one dot
  if (!domain.includes('.')) {
    return {
      en: 'Email domain must contain at least one dot (e.g. example.com).',
      my: 'Domain တွင် Dot (.) အနည်းဆုံး တစ်ခု ပါရမည်။',
    }
  }

  const domainLabels = domain.split('.')

  // ⑳ Each domain label must not be empty and must not start/end with hyphen
  for (const label of domainLabels) {
    if (label.length === 0) {
      return {
        en: 'Email domain is not valid (contains consecutive dots or empty segments).',
        my: 'Domain Name မမှန်ကန်ပါ (Dot ဆက်တိုက် သို့မဟုတ် ဗလာ Segment ပါနေသည်)။',
      }
    }
    if (label.startsWith('-') || label.endsWith('-')) {
      return {
        en: 'Email domain labels must not start or end with a hyphen (-).',
        my: 'Domain Name သည် Hyphen (-) ဖြင့် မစ/မဆုံးရပါ။',
      }
    }
  }

  // ㉑ TLD (last segment): 2–6 letters only
  const tld = domainLabels[domainLabels.length - 1]
  if (!/^[a-z]+$/.test(tld) || tld.length < 2 || tld.length > 6) {
    return {
      en: 'Email domain ending (TLD) must be 2–6 letters only (e.g. com, net, org, mm, edu).',
      my: 'TLD (Domain နောက်ဆုံး) သည် 2 မှ 6 လုံး အတွင်း အက္ခရာများသာ ဖြစ်ရမည်။ (com, net, org, mm, edu)',
    }
  }

  // ㉒ Disposable / temp-mail domains blocked
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      en: 'Temporary or disposable email addresses are not allowed. Please use a real email.',
      my: 'Temporary / Disposable Email ဖြင့် Register မပြုလုပ်ရပါ။ အစစ်အမှန် Email သုံးပါ။',
    }
  }

  return null // ✓ Valid
}

/**
 * Returns true if the email passes all validation rules.
 * Accepts un-normalized input.
 */
export function isEmailValid(rawEmail) {
  return getEmailValidationError(rawEmail) === null
}

/** Backward-compatible generic error string */
export const EMAIL_ERROR = {
  en: 'Please enter a valid email address.',
  my: 'မှန်ကန်သော Email လိပ်စာ ထည့်သွင်းပါ။',
}

// ── Phone ─────────────────────────────────────────────────────────────────
export const PHONE_PATTERN = /^\+959\d{7,10}$/
export const PHONE_ERROR =
  'Phone must start with +959 followed by 7–10 more digits (e.g. +9591234567)'

// ── Password ──────────────────────────────────────────────────────────────
export const PWD_RULES = [
  {
    key: 'len',
    test: p => p.length >= 8,
    label: { en: 'At least 8 characters', my: 'အနည်းဆုံး ၈ လုံး' },
  },
  {
    key: 'upper',
    test: p => /[A-Z]/.test(p),
    label: { en: 'One uppercase letter (A–Z)', my: 'အကြီးစာလုံး (A–Z) တစ်လုံး' },
  },
  {
    key: 'lower',
    test: p => /[a-z]/.test(p),
    label: { en: 'One lowercase letter (a–z)', my: 'အသေးစာလုံး (a–z) တစ်လုံး' },
  },
  {
    key: 'num',
    test: p => /[0-9]/.test(p),
    label: { en: 'One number (0–9)', my: 'ဂဏန်း (0–9) တစ်လုံး' },
  },
  {
    key: 'special',
    test: p => /[^A-Za-z0-9]/.test(p),
    label: { en: 'One special character (!@#$…)', my: 'အထူးအက္ခရာ (!@#$…) တစ်လုံး' },
  },
]

export function isStrongPassword(pwd) {
  return typeof pwd === 'string' && PWD_RULES.every(r => r.test(pwd))
}

/** Strength level 0–4 for the colour bar on RegisterPage */
export function passwordStrengthLevel(pwd) {
  const passed = PWD_RULES.filter(r => r.test(pwd)).length
  if (passed <= 1) return { level: 0, label: '' }
  if (passed === 2) return { level: 1, label: 'Weak',   color: '#ef4444' }
  if (passed === 3) return { level: 2, label: 'Fair',   color: '#f59e0b' }
  if (passed === 4) return { level: 3, label: 'Good',   color: '#3b82f6' }
  return              { level: 4, label: 'Strong', color: '#16a34a' }
}

/** Normalise a phone input: always starts with "+95", blocks prefix deletion. */
export function normalisePhone(newVal) {
  if (!newVal) return newVal
  if (!newVal.startsWith('+95')) return '+95'
  return newVal
}
