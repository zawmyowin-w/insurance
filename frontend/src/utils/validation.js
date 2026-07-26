/**
 * Shared validation constants and helpers used across all roles.
 *
 * EMAIL: Gmail-only validation
 *   - Domain must be exactly gmail.com (case-insensitive)
 *   - Username: 6–30 characters, a-z / 0-9 / dots only
 *   - No leading, trailing, or consecutive dots
 *   - No spaces anywhere
 *   - Exactly one @ symbol
 *   - Case-insensitive (normalize to lowercase before checking)
 *   - Common fake/test usernames are blacklisted
 */

// ── Email ─────────────────────────────────────────────────────────────────

export const GMAIL_DOMAIN = 'gmail.com'
export const GMAIL_USERNAME_MIN = 6
export const GMAIL_USERNAME_MAX = 30
/** Total max = username(30) + @gmail.com(10) */
export const EMAIL_MAX_LENGTH = 40

/** Kept for legacy callers — matches a valid normalized Gmail address */
export const EMAIL_PATTERN = /^[a-z0-9][a-z0-9.]{4,28}[a-z0-9]@gmail\.com$|^[a-z0-9]{6,30}@gmail\.com$/

/** Normalize: trim + lowercase */
export function normalizeEmail(raw) {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : ''
}

/**
 * Known test / disposable / spam Gmail usernames that are blocked.
 * (Temp-mail services use their own domains, so @gmail.com already blocks them.)
 */
const BLACKLISTED_USERNAMES = new Set([
  'test', 'admin', 'noreply', 'no.reply', 'donotreply', 'do.not.reply',
  'fake', 'spam', 'trash', 'disposable', 'temp', 'temporary',
  'test123', 'test.user', 'example', 'sample', 'demo', 'guest',
  'anonymous', 'abuse', 'postmaster', 'webmaster', 'info', 'support',
  'contact', 'hello', 'mail', 'email', 'user', 'account',
])

/**
 * Returns a bilingual error object { en, my } describing the first rule
 * violation, or null if the email is valid.
 *
 * @param {string} rawEmail – the raw string from the input (before normalization)
 */
export function getEmailValidationError(rawEmail) {
  // Rule 1-2: required, not empty
  if (rawEmail === undefined || rawEmail === null || rawEmail === '') {
    return {
      en: 'Email is required.',
      my: 'အီးမေးလ် ဖြည့်သွင်းရန် လိုအပ်ပါသည်။',
    }
  }

  // Rule 3: no leading/trailing spaces
  if (rawEmail !== rawEmail.trim()) {
    return {
      en: 'Email must not have spaces at the start or end.',
      my: 'အီးမေးလ် ရှေ့နှင့် နောက်တွင် Space မပါရပါ။',
    }
  }

  const email = rawEmail.toLowerCase() // Rule 12: case-insensitive

  // Rule 4 & 6: exactly one @
  const atCount = (email.match(/@/g) || []).length
  if (atCount === 0) {
    return {
      en: 'Email must contain the @ symbol.',
      my: 'အီးမေးလ်တွင် @ သင်္ကေတ ပါရမည်။',
    }
  }
  if (atCount > 1) {
    return {
      en: 'Email must contain exactly one @ symbol.',
      my: '@ သင်္ကေတ တစ်ခုတည်းသာ ပါဝင်ရမည်။',
    }
  }

  const [username, domain] = email.split('@')

  // Rules 5, 13, 14: domain must be exactly gmail.com
  if (!domain || domain !== 'gmail.com') {
    const typos = ['gmail.co', 'gamil.com', 'gmail.cm', 'gmal.com', 'gmial.com',
                   'gmail.con', 'gmail.coom', 'gmaill.com', 'gmai.com']
    const hint = typos.includes(domain)
      ? { en: `Did you mean @gmail.com? "${domain}" looks like a typo.`,
          my: `@gmail.com ဟု ဆိုလိုပါသလား? "${domain}" မှားနေပါသည်။` }
      : { en: 'Only @gmail.com addresses are accepted.',
          my: '@gmail.com Domain သာ လက်ခံပါသည်။' }
    return hint
  }

  // Rules 8-9: leading/trailing dot (checked before length for precise error messages)
  if (username.startsWith('.')) {
    return {
      en: 'Gmail username must not start with a dot.',
      my: 'Gmail username Dot (.) ဖြင့် မစရပါ။',
    }
  }
  if (username.endsWith('.')) {
    return {
      en: 'Gmail username must not end with a dot.',
      my: 'Gmail username Dot (.) ဖြင့် မဆုံးရပါ။',
    }
  }

  // Rule 7: username length 6–30
  if (username.length < GMAIL_USERNAME_MIN) {
    return {
      en: `Gmail username must be at least ${GMAIL_USERNAME_MIN} characters (yours: ${username.length}).`,
      my: `Gmail username အနည်းဆုံး ${GMAIL_USERNAME_MIN} လုံး ဖြစ်ရမည်။ (${username.length} လုံးသာ ရှိသည်)`,
    }
  }
  if (username.length > GMAIL_USERNAME_MAX) {
    return {
      en: `Gmail username must not exceed ${GMAIL_USERNAME_MAX} characters (yours: ${username.length}).`,
      my: `Gmail username အများဆုံး ${GMAIL_USERNAME_MAX} လုံးသာ ဖြစ်ရမည်။`,
    }
  }

  // Rules 8, 11: only a-z, 0-9, dots — no special characters
  if (!/^[a-z0-9.]+$/.test(username)) {
    return {
      en: 'Gmail username may only contain letters (a-z), numbers (0-9), and dots (.).',
      my: 'Gmail username တွင် အက္ခရာ (a-z)၊ ဂဏန်း (0-9) နှင့် Dot (.) သာ ပါနိုင်သည်။',
    }
  }

  // Rule 10: no consecutive dots
  if (username.includes('..')) {
    return {
      en: 'Gmail username must not contain consecutive dots (..).',
      my: 'Gmail username တွင် Dot နှစ်လုံးဆက်တိုက် (..) မဖြစ်ရပါ။',
    }
  }

  // Rules 15-17: blacklist (fake, test, temp usernames)
  if (BLACKLISTED_USERNAMES.has(username)) {
    return {
      en: 'This email address is not allowed. Please use your real Gmail address.',
      my: 'ဤ Email လိပ်စာကို ခွင့်မပြုပါ။ သင်၏ Gmail လိပ်စာအမှန်ကို ထည့်သွင်းပါ။',
    }
  }

  return null // ✓ Valid
}

/**
 * Returns true if the email passes all Gmail validation rules.
 * Accepts un-normalized input — normalizes internally for the check.
 */
export function isEmailValid(rawEmail) {
  return getEmailValidationError(rawEmail) === null
}

/** Backward-compatible single error string (English) */
export const EMAIL_ERROR = {
  en: 'Please enter a valid Gmail address (yourname@gmail.com)',
  my: 'မှန်ကန်သော Gmail လိပ်စာ ထည့်သွင်းပါ (yourname@gmail.com)',
}

// ── Phone ─────────────────────────────────────────────────────────────────
// Rules:
//   - auto-prefix: +95
//   - after +95, must start with 9
//   - total digits after +95: 8–10 (i.e. 9 + 7–9 more digits)
export const PHONE_PATTERN = /^\+959\d{7,10}$/
export const PHONE_ERROR =
  'Phone must start with +959 followed by 7–10 more digits (e.g. +9591234567)'

// ── Password ──────────────────────────────────────────────────────────────
// Rules: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character
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
