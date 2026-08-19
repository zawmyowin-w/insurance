/**
 * Shared validation constants and helpers used across all roles.
 *
 * EMAIL validation rules:
 *   - Required, not empty, not null
 *   - Lowercase (a-z) only — uppercase not accepted
 *   - No spaces anywhere (leading, trailing, or internal)
 *   - Exactly one @ symbol; must not start or end with @
 *   - Username (before @): a-z / 0-9 / . / _ / - only; no arbitrary length limit
 *       • Must start and end with a letter or number
 *       • No consecutive .. __ --
 *       • No mixed consecutive patterns: ._ _. .- -.
 *       • Numeric-only usernames blocked (e.g. 123456)
 *       • Reserved usernames blocked (admin, root, system, test …)
 *   - Domain (after @): letter or number start, no underscore,
 *       no leading/trailing hyphen per label, at least one dot
 *   - TLD (last domain segment): at least 2 letters
 *   - Disposable/temp-mail domains blocked
 *   - SQL injection / XSS inputs blocked by strict character whitelist
 */

/**
 * Loose pattern for quick sanity-check fallbacks.
 * Full validation is done by getEmailValidationError().
 */
export const EMAIL_PATTERN = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/

/** Normalize: trim + lowercase (use before persisting, not as a validation bypass) */
export function normalizeEmail(raw) {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : ''
}

// ── Name ───────────────────────────────────────────────────────────────────

/**
 * Validates a person's full name for account registration.
 * Names can be written in any language, including Myanmar, but must contain
 * at least six letters and use letters/spaces only.
 */
export function getNameValidationError(rawName) {
  if (rawName === undefined || rawName === null || rawName.trim() === '') {
    return {
      en: 'Full name is required.',
      my: 'အမည်အပြည့်အစုံ ဖြည့်သွင်းရန် လိုအပ်ပါသည်။',
    }
  }

  if (rawName !== rawName.trim() || /\s{2,}/.test(rawName)) {
    return {
      en: 'Full name must use single spaces only, with no space at the beginning or end.',
      my: 'အမည်တွင် အစ/အဆုံး၌ Space မပါရဘဲ စကားလုံးများကြားတွင် Space တစ်လုံးသာ ထည့်ပါ။',
    }
  }

  if (!/^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u.test(rawName)) {
    return {
      en: 'Full name may contain letters and spaces only. Numbers and special characters are not allowed.',
      my: 'အမည်တွင် အက္ခရာနှင့် Space သာ ပါရမည်။ ဂဏန်းနှင့် Special Character များ မပါရပါ။',
    }
  }

  const letterCount = [...rawName].filter(char => /[\p{L}\p{M}]/u.test(char)).length
  if (letterCount < 6) {
    return {
      en: 'Full name must contain at least 6 letters.',
      my: 'အမည်အပြည့်အစုံတွင် အက္ခရာ အနည်းဆုံး ၆ လုံး ပါရမည်။',
    }
  }

  return null
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

  // ⑦ Username must start with a letter or number
  if (!/^[a-z0-9]/.test(username)) {
    return {
      en: 'Username must start with a letter (a–z) or number (0–9).',
      my: 'Username သည် အက္ခရာ (a-z) သို့မဟုတ် ဂဏန်း (0-9) ဖြင့် စရမည်။',
    }
  }

  // ⑧ Username must not end with . _ -
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

  // ⑨ Username allowed characters: a-z, 0-9, . _ -  (blocks +#$%&!?*() etc.)
  if (!/^[a-z0-9._-]+$/.test(username)) {
    return {
      en: 'Username may only contain letters (a–z), numbers (0–9), dots (.), underscores (_), or hyphens (-). Special characters like +, #, $, %, &, !, ?, *, (, ) are not allowed.',
      my: 'Username တွင် a-z, 0-9, ., _, - သာ လက်ခံသည်။ +, #, $, %, &, !, ?, *, (, ) ကဲ့သို့ Special Characters များ လက်မခံပါ။',
    }
  }

  // ⑩ No consecutive dots (..)
  if (username.includes('..')) {
    return {
      en: 'Username must not contain consecutive dots (..).',
      my: 'Username တွင် Dot နှစ်လုံးဆက်တိုက် (..) မဖြစ်ရပါ။',
    }
  }

  // ⑪ No consecutive underscores (__)
  if (username.includes('__')) {
    return {
      en: 'Username must not contain consecutive underscores (__).',
      my: 'Username တွင် Underscore နှစ်လုံးဆက်တိုက် (__) မဖြစ်ရပါ။',
    }
  }

  // ⑫ No consecutive hyphens (--)
  if (username.includes('--')) {
    return {
      en: 'Username must not contain consecutive hyphens (--).',
      my: 'Username တွင် Hyphen နှစ်လုံးဆက်တိုက် (--) မဖြစ်ရပါ။',
    }
  }

  // ⑬ No mixed consecutive special characters: ._ _. .- -.
  if (username.includes('._') || username.includes('_.') ||
      username.includes('.-') || username.includes('-.')) {
    return {
      en: 'Username must not contain mixed consecutive special characters (e.g. ._, _., .-, -.).',
      my: 'Username တွင် ._, _., .-, -. ကဲ့သို့ Pattern များ မပါရပါ။',
    }
  }

  // ⑭ Numeric-only username blocked (e.g. 123456@...)
  if (/^[0-9]+$/.test(username)) {
    return {
      en: 'Username must not be numbers only. Include at least one letter (a–z).',
      my: 'Username တွင် ဂဏန်းများသာ မဖြစ်ရပါ (Numeric Only မခွင့်ပြု)။ အက္ခရာ (a-z) အနည်းဆုံး တစ်လုံး ပါရမည်။',
    }
  }

  // ⑮ Reserved / blacklisted usernames (admin@, root@, system@, test@ …)
  if (RESERVED_USERNAMES.has(username)) {
    return {
      en: 'This email address is not allowed. Please use a different email.',
      my: 'ဤ Email လိပ်စာကို ခွင့်မပြုပါ။ အခြား Email လိပ်စာ သုံးပါ။',
    }
  }

  // ══ Domain rules ══════════════════════════════════════════════════════════

  // ⑯ Domain must start with a letter or number
  if (!/^[a-z0-9]/.test(domain)) {
    return {
      en: 'Email domain must start with a letter or number.',
      my: 'Domain Name သည် အက္ခရာ သို့မဟုတ် ဂဏန်း ဖြင့် စရမည်။',
    }
  }

  // ⑰ Domain must not contain underscore
  if (domain.includes('_')) {
    return {
      en: 'Email domain must not contain underscores (_).',
      my: 'Domain Name တွင် Underscore (_) မပါရပါ။',
    }
  }

  // ⑱ Domain must have at least one dot
  if (!domain.includes('.')) {
    return {
      en: 'Email domain must contain at least one dot (e.g. example.com).',
      my: 'Domain တွင် Dot (.) အနည်းဆုံး တစ်ခု ပါရမည်။',
    }
  }

  const domainLabels = domain.split('.')

  // ⑲ Each domain label must not be empty and must not start/end with hyphen
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

  // ⑳ TLD (last segment): at least 2 letters; no arbitrary maximum
  const tld = domainLabels[domainLabels.length - 1]
  if (!/^[a-z]+$/.test(tld) || tld.length < 2) {
    return {
      en: 'Email domain ending (TLD) must contain at least 2 letters (e.g. com, net, org, mm, edu).',
      my: 'TLD (Domain နောက်ဆုံး) သည် အနည်းဆုံး အက္ခရာ ၂ လုံး ပါရမည်။ (com, net, org, mm, edu)',
    }
  }

  // ㉑ Disposable / temp-mail domains blocked
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

/**
 * Comprehensive Myanmar phone number validation.
 *
 * Rules enforced:
 *  1. Required
 *  2. Trim leading/trailing spaces before validation
 *  3. Must start with exactly +959
 *  4. No spaces anywhere (leading, trailing, internal)
 *  5. Only '+' at the very start (once); no other special characters
 *  6. No letters (English/Myanmar), emoji, or Unicode symbols
 *  7. After +959: digits 0–9 only, length exactly 7 or 9
 *  8. No double country code (+95959…)
 *  9. Fake numbers blocked: all-same digit (111111111, 000000000…)
 * 10. Sequential numbers blocked: 123456789, 987654321…
 *
 * DB uniqueness is enforced server-side.
 *
 * @param {string} rawPhone – raw value from the input (not yet trimmed)
 * @returns {{ en: string, my: string } | null}  error object or null if valid
 */
export function getPhoneValidationError(rawPhone) {
  // ① Required
  if (rawPhone === undefined || rawPhone === null || rawPhone === '') {
    return {
      en: 'Phone number is required.',
      my: 'ဖုန်းနံပါတ် ဖြည့်သွင်းရန် လိုအပ်ပါသည်။',
    }
  }

  // ② Trim leading/trailing spaces
  const phone = rawPhone.trim()

  if (phone === '') {
    return {
      en: 'Phone number is required.',
      my: 'ဖုန်းနံပါတ် ဖြည့်သွင်းရန် လိုအပ်ပါသည်။',
    }
  }

  // ③ No internal spaces
  if (/\s/.test(phone)) {
    return {
      en: 'Phone number must not contain any spaces (including in the middle).',
      my: 'ဖုန်းနံပါတ်တွင် Space မပါရပါ။ (ရှေ့၊ နောက်၊ အလယ် မည်သည့်နေရာတွင်မဆို)',
    }
  }

  // ④ No special characters (hyphen, underscore, dot, slash, backslash, parens, comma, hash, asterisk…)
  if (/[-_./\\(),"'#*@!$%^&=<>?|;:`~]/.test(phone)) {
    return {
      en: "Phone number must not contain special characters (-, _, ., /, \\, (, ), ,, #, * etc.).",
      my: 'ဖုန်းနံပါတ်တွင် -, _, ., /, \\, (, ), ,, #, * နှင့် အခြား Special Characters မပါရပါ။',
    }
  }

  // ⑤ Only digits and one leading '+' allowed  (catches letters, Myanmar, emoji, Unicode)
  if (/[^+0-9]/.test(phone)) {
    return {
      en: 'Phone number must contain only digits (0–9) after +959. Letters, Myanmar characters, emoji and symbols are not allowed.',
      my: '+959 နောက်တွင် ဂဏန်း (0-9) များသာ ပါရမည်။ အင်္ဂလိပ်စာ၊ မြန်မာစာ၊ Emoji နှင့် Symbol များ လက်မခံပါ။',
    }
  }

  // ⑥ '+' only at start, only once
  const plusCount = (phone.match(/\+/g) || []).length
  if (plusCount > 1) {
    return {
      en: "The '+' symbol may only appear once, at the beginning of the number.",
      my: "'+' သင်္ကေတကို အစတွင် တစ်ကြိမ်သာ အသုံးပြုခွင့်ရှိသည်။",
    }
  }
  if (plusCount === 1 && !phone.startsWith('+')) {
    return {
      en: "The '+' symbol must be at the very start of the phone number.",
      my: "'+' သင်္ကေတသည် ဖုန်းနံပါတ် အစတွင်သာ ဖြစ်ရမည်။",
    }
  }

  // ⑦ Must start with +959 (not 09, 959, +95 alone, +9509…, etc.)
  if (!phone.startsWith('+959')) {
    if (phone.startsWith('09')) {
      return {
        en: 'Phone number must start with +959. The format "09..." is not accepted.',
        my: 'ဖုန်းနံပါတ်သည် +959 ဖြင့်သာ စရမည်။ "09..." Format ကို လက်မခံပါ။',
      }
    }
    if (phone.startsWith('959') || (phone.startsWith('+95') && !phone.startsWith('+959'))) {
      return {
        en: 'Phone number must start with +959. The format "959..." or "+95..." (without the trailing 9) is not accepted.',
        my: 'ဖုန်းနံပါတ်သည် +959 ဖြင့်သာ စရမည်။ 959... သို့မဟုတ် +95... (9 မပါဘဲ) Format ကို လက်မခံပါ။',
      }
    }
    return {
      en: 'Phone number must start with +959 (Myanmar mobile country code).',
      my: 'ဖုန်းနံပါတ်သည် +959 ဖြင့်သာ စရမည်။',
    }
  }

  const digits = phone.slice(4) // everything after +959

  // ⑧ No double country code: +95959… or +959095…
  if (digits.startsWith('95') || digits.startsWith('059') || digits.startsWith('09')) {
    return {
      en: 'Phone number contains a duplicated country code (+95959…). Enter only the subscriber digits after +959.',
      my: '+95959… ကဲ့သို့ Country Code ထပ်နေသော Format များကို လက်မခံပါ။ +959 နောက်တွင် ဂဏန်းများသာ ဖြည့်ပါ။',
    }
  }

  // A Myanmar mobile subscriber number must not begin with 0 after +959.
  if (digits.startsWith('0')) {
    return {
      en: 'The digit immediately after +959 must not be 0. Enter a valid Myanmar mobile number.',
      my: '+959 ၏နောက်တွင် 0 မဖြစ်ရပါ။ မှန်ကန်သော မြန်မာမိုဘိုင်းဖုန်းနံပါတ်ကို ဖြည့်ပါ။',
    }
  }

  // ⑨ Digits after prefix must be digits only (guard)
  if (!/^\d*$/.test(digits)) {
    return {
      en: 'Only digits (0–9) are allowed after +959.',
      my: '+959 နောက်တွင် ဂဏန်း (0-9) များသာ ဖြည့်ရမည်။',
    }
  }

  // ⑩ Length: exactly 7 or 9 digits after +959 (8 is intentionally invalid)
  if (digits.length < 7) {
    return {
      en: `Phone number is too short. +959 must be followed by exactly 7 or 9 digits (you entered ${digits.length}).`,
      my: `ဖုန်းနံပါတ် တိုနေသည်။ +959 နောက် ဂဏန်း 7 လုံး သို့မဟုတ် 9 လုံး အတိအကျ ဖြည့်ရမည်။ (${digits.length} လုံးသာ ဖြည့်ထားသည်)`,
    }
  }
  if (digits.length === 8) {
    return {
      en: 'Phone number must contain exactly 7 or 9 digits after +959. 8 digits are not accepted.',
      my: 'ဖုန်းနံပါတ်တွင် +959 နောက် ဂဏန်း 7 လုံး သို့မဟုတ် 9 လုံး အတိအကျ ပါရမည်။ 8 လုံးကို လက်မခံပါ။',
    }
  }
  if (digits.length > 9) {
    return {
      en: `Phone number is too long. +959 must be followed by exactly 7 or 9 digits (you entered ${digits.length}).`,
      my: `ဖုန်းနံပါတ် ရှည်နေသည်။ +959 နောက် ဂဏန်း 7 လုံး သို့မဟုတ် 9 လုံးသာ အတိအကျ ဖြည့်ရမည်။ (${digits.length} လုံး ဖြည့်ထားသည်)`,
    }
  }

  // ⑪ Fake number: all same digit (111111111, 000000000, 999999999…)
  if (/^(\d)\1+$/.test(digits)) {
    return {
      en: 'Phone number appears to be fake (all same digits). Please enter a real phone number.',
      my: 'ဖုန်းနံပါတ်မှာ Fake ဖြစ်နေသည် (ဂဏန်းတူများသာ)။ စစ်မှန်သော ဖုန်းနံပါတ် ဖြည့်ပါ။',
    }
  }

  // ⑫ Sequential digits (123456789, 987654321…)
  let asc = true, desc = true
  for (let i = 1; i < digits.length; i++) {
    if (Number(digits[i]) !== Number(digits[i - 1]) + 1) asc = false
    if (Number(digits[i]) !== Number(digits[i - 1]) - 1) desc = false
    if (!asc && !desc) break
  }
  if (asc || desc) {
    return {
      en: 'Phone number appears to be sequential (e.g. 123456789). Please enter a real phone number.',
      my: '123456789, 987654321 ကဲ့သို့ အစဉ်လိုက် ဂဏန်းများကို လက်မခံပါ။ စစ်မှန်သော ဖုန်းနံပါတ် ဖြည့်ပါ။',
    }
  }

  return null // ✓ Valid
}

/** Returns true if the phone passes all format rules (not DB-uniqueness). */
export function isPhoneValid(rawPhone) {
  return getPhoneValidationError(rawPhone) === null
}

/** Legacy pattern kept for any callers not yet migrated. */
export const PHONE_PATTERN = /^\+959(?:\d{7}|\d{9})$/
/** Legacy error string. */
export const PHONE_ERROR = 'Phone must start with +959 followed by exactly 7 or 9 digits (e.g. +9591234567)'

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

/**
 * Normalise a phone input — locks the mandatory +959 prefix so the user
 * cannot accidentally delete it while typing.
 */
export function normalisePhone(newVal) {
  if (!newVal) return newVal
  if (!newVal.startsWith('+959')) return '+959'
  return newVal
}
