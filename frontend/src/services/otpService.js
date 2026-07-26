/**
 * OTP Service — generates, stores, verifies 6-digit OTPs.
 *
 * Security controls:
 *   - OTP stored in localStorage with 5-minute TTL
 *   - Max 5 wrong-attempt lock-out per OTP session
 *   - Max 5 resends per registration/reset flow
 *   - Single-use: OTP is cleared on first successful verify
 *   - Resend resets the attempt counter (fresh OTP, fresh attempts)
 */
import emailjs from '@emailjs/browser'

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID
const PUB_KEY     = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const VERIFY_TPL  = import.meta.env.VITE_EMAILJS_VERIFY_TEMPLATE
const RESET_TPL   = import.meta.env.VITE_EMAILJS_RESET_TEMPLATE

export const OTP_TTL_MS      = 5 * 60 * 1000 // 5 minutes
export const MAX_OTP_ATTEMPTS = 5             // wrong guesses before lock-out
export const MAX_OTP_RESENDS  = 5             // resend button presses before hard block

// ── Storage key helpers ───────────────────────────────────────────────────
function otpKey(email, type)      { return `otp_${type}_${email}` }
function attemptsKey(email, type) { return `otp_attempts_${type}_${email}` }
function resendsKey(email, type)  { return `otp_resends_${type}_${email}` }

// ── OTP storage ───────────────────────────────────────────────────────────
export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function storeOtp(email, type, code) {
  localStorage.setItem(otpKey(email, type), JSON.stringify({
    code,
    expiry: Date.now() + OTP_TTL_MS,
  }))
}

export function clearOtp(email, type) {
  localStorage.removeItem(otpKey(email, type))
}

export function isOtpActive(email, type) {
  const raw = localStorage.getItem(otpKey(email, type))
  if (!raw) return false
  const { expiry } = JSON.parse(raw)
  return Date.now() < expiry
}

export function otpSecondsLeft(email, type) {
  const raw = localStorage.getItem(otpKey(email, type))
  if (!raw) return 0
  const { expiry } = JSON.parse(raw)
  return Math.max(0, Math.ceil((expiry - Date.now()) / 1000))
}

// ── Attempt tracking ──────────────────────────────────────────────────────
export function getOtpAttempts(email, type) {
  const raw = localStorage.getItem(attemptsKey(email, type))
  return raw ? parseInt(raw, 10) : 0
}

export function getOtpAttemptsLeft(email, type) {
  return Math.max(0, MAX_OTP_ATTEMPTS - getOtpAttempts(email, type))
}

export function isOtpLocked(email, type) {
  return getOtpAttempts(email, type) >= MAX_OTP_ATTEMPTS
}

function incrementAttempts(email, type) {
  const count = getOtpAttempts(email, type) + 1
  localStorage.setItem(attemptsKey(email, type), String(count))
  return count
}

function clearAttempts(email, type) {
  localStorage.removeItem(attemptsKey(email, type))
}

// ── Resend tracking ───────────────────────────────────────────────────────
export function getOtpResends(email, type) {
  const raw = localStorage.getItem(resendsKey(email, type))
  return raw ? parseInt(raw, 10) : 0
}

export function getOtpResendsLeft(email, type) {
  return Math.max(0, MAX_OTP_RESENDS - getOtpResends(email, type))
}

export function isResendAllowed(email, type) {
  return getOtpResends(email, type) < MAX_OTP_RESENDS
}

function incrementResends(email, type) {
  const count = getOtpResends(email, type) + 1
  localStorage.setItem(resendsKey(email, type), String(count))
  return count
}

function clearResends(email, type) {
  localStorage.removeItem(resendsKey(email, type))
}

// ── Verify ────────────────────────────────────────────────────────────────
/**
 * Verify an OTP with built-in attempt tracking.
 *
 * Returns:
 *   { ok: true }                              — correct code, OTP consumed (single-use)
 *   { ok: false, reason: 'expired' }          — OTP expired or not found
 *   { ok: false, reason: 'invalid',
 *     attemptsLeft: N }                       — wrong code, N attempts remaining
 *   { ok: false, reason: 'locked' }           — max attempts exceeded; OTP voided
 */
export function verifyOtp(email, type, input) {
  // Check lock state first
  if (isOtpLocked(email, type)) {
    clearOtp(email, type) // ensure OTP is wiped
    return { ok: false, reason: 'locked' }
  }

  const raw = localStorage.getItem(otpKey(email, type))
  if (!raw) return { ok: false, reason: 'expired' }

  const { code, expiry } = JSON.parse(raw)
  if (Date.now() > expiry) {
    clearOtp(email, type)
    clearAttempts(email, type)
    return { ok: false, reason: 'expired' }
  }

  if (input !== code) {
    const attempts = incrementAttempts(email, type)
    if (attempts >= MAX_OTP_ATTEMPTS) {
      clearOtp(email, type) // void OTP — user must request a new one
      return { ok: false, reason: 'locked' }
    }
    return { ok: false, reason: 'invalid', attemptsLeft: MAX_OTP_ATTEMPTS - attempts }
  }

  // ✓ Correct — consume (single-use) and reset counters
  clearOtp(email, type)
  clearAttempts(email, type)
  return { ok: true }
}

// ── Email sending ─────────────────────────────────────────────────────────
export async function sendOtpEmail(email, code, type) {
  if (SERVICE_ID && PUB_KEY) {
    const templateId = type === 'verify' ? VERIFY_TPL : RESET_TPL
    const cleanKey = PUB_KEY.trim()
    const cleanSvc = SERVICE_ID.trim()
    const cleanTpl = templateId.trim()
    console.info(`[EmailJS debug] svc="${cleanSvc}" tpl="${cleanTpl}" key_len=${cleanKey.length} key_preview="${cleanKey.slice(0,4)}..."`)
    try {
      await emailjs.send(
        cleanSvc,
        cleanTpl,
        { email, passcode: code, valid_minutes: '5' },
        { publicKey: cleanKey },
      )
    } catch (ejsErr) {
      const detail = ejsErr?.text || ejsErr?.message || JSON.stringify(ejsErr)
      console.error('[EmailJS send error]', detail)
      const enriched = new Error(`EmailJS: ${detail}`)
      enriched.emailjsDetail = detail
      throw enriched
    }
  } else {
    throw new Error('Email service is not configured. Please set up EmailJS credentials.')
  }
}

// ── Issue (initial) ───────────────────────────────────────────────────────
/**
 * Initial OTP issue — resets ALL counters (attempts + resends) for a fresh session.
 * Use this when the user first submits the register form.
 */
export async function issueOtp(email, type) {
  clearAttempts(email, type)
  clearResends(email, type)
  const code = generateOtp()
  storeOtp(email, type, code)
  await sendOtpEmail(email, code, type)
  return code
}

/**
 * Resend OTP — checks and increments the resend counter.
 * Resets attempt counter so the user gets fresh MAX_OTP_ATTEMPTS on the new code.
 * Throws with err.code === 'resend_limit_exceeded' when the cap is hit.
 */
export async function resendOtp(email, type) {
  if (!isResendAllowed(email, type)) {
    const err = new Error('Maximum resend attempts reached. Please start registration again.')
    err.code = 'resend_limit_exceeded'
    throw err
  }
  clearAttempts(email, type) // fresh attempts for the new code
  const code = generateOtp()
  storeOtp(email, type, code)
  await sendOtpEmail(email, code, type)
  incrementResends(email, type)
  return code
}

// ── Pending registration store (sessionStorage) ───────────────────────────
const pendingKey = email => `pending_reg_${email}`

export function storePendingRegistration(payload) {
  sessionStorage.setItem(pendingKey(payload.email), JSON.stringify(payload))
}

export function getPendingRegistration(email) {
  const raw = sessionStorage.getItem(pendingKey(email))
  return raw ? JSON.parse(raw) : null
}

export function clearPendingRegistration(email) {
  sessionStorage.removeItem(pendingKey(email))
}
