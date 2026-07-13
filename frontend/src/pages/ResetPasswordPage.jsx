import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { verifyOtp, issueOtp, otpSecondsLeft } from '../services/otpService'
// NOTE: mockUpdatePassword removed. A backend /auth/reset-password endpoint
// (TODO) is needed to persist the new password. Currently the OTP is verified
// client-side but the password update is a no-op until that endpoint exists.

const BOX_COUNT = 6

const pwdRules = [
  { test: p => p.length >= 8,            label: { en: 'At least 8 characters',         my: 'အနည်းဆုံး ၈ လုံး' } },
  { test: p => /[A-Z]/.test(p),          label: { en: 'One uppercase letter (A–Z)',     my: 'အကြီးစာလုံး (A–Z)' } },
  { test: p => /[a-z]/.test(p),          label: { en: 'One lowercase letter (a–z)',     my: 'အသေးစာလုံး (a–z)' } },
  { test: p => /[0-9]/.test(p),          label: { en: 'One number (0–9)',               my: 'ဂဏန်း (0–9)' } },
  { test: p => /[^A-Za-z0-9]/.test(p),   label: { en: 'One special character (!@#$…)', my: 'အထူးအက္ခရာ (!@#$…)' } },
]

export default function ResetPasswordPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('my') ? 'my' : 'en'
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email = params.get('email') || ''

  const [digits, setDigits] = useState(Array(BOX_COUNT).fill(''))
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [pwdFocused, setPwdFocused] = useState(false)
  const [seconds, setSeconds] = useState(() => otpSecondsLeft(email, 'reset'))
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const inputs = useRef([])

  useEffect(() => {
    const id = setInterval(() => setSeconds(otpSecondsLeft(email, 'reset')), 1000)
    return () => clearInterval(id)
  }, [email])

  const focus = i => inputs.current[i]?.focus()

  const handleChange = (i, val) => {
    const ch = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]; next[i] = ch; setDigits(next)
    if (ch && i < BOX_COUNT - 1) focus(i + 1)
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) { const n = [...digits]; n[i] = ''; setDigits(n) }
      else if (i > 0) { const n = [...digits]; n[i - 1] = ''; setDigits(n); focus(i - 1) }
    } else if (e.key === 'ArrowLeft' && i > 0) focus(i - 1)
    else if (e.key === 'ArrowRight' && i < BOX_COUNT - 1) focus(i + 1)
  }

  const handlePaste = e => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, BOX_COUNT)
    const next = Array(BOX_COUNT).fill('')
    text.split('').forEach((c, i) => { next[i] = c })
    setDigits(next)
    focus(Math.min(text.length, BOX_COUNT - 1))
  }

  const allPwdPassed = pwdRules.every(r => r.test(password))
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  const handleSubmit = async e => {
    e.preventDefault()
    const code = digits.join('')
    if (code.length < BOX_COUNT) { toast.error(t('otp.enterAll')); return }
    if (!allPwdPassed) { toast.error(t('auth.pwdWeak')); return }
    if (password !== confirm) { toast.error(t('auth.passwordMismatch')); return }

    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    const result = verifyOtp(email, 'reset', code)
    if (!result.ok) {
      setLoading(false)
      toast.error(result.reason === 'expired' ? t('otp.expired') : t('otp.invalid'))
      setDigits(Array(BOX_COUNT).fill(''))
      focus(0)
      return
    }
    // TODO: call POST /auth/reset-password { email, password } once backend endpoint exists
    setLoading(false)
    toast.success(t('auth.resetSuccess'))
    navigate('/login')
  }

  const handleResend = async () => {
    setResending(true)
    try {
      const code = await issueOtp(email, 'reset')
      setSeconds(300)
      setDigits(Array(BOX_COUNT).fill(''))
      focus(0)
      if (!import.meta.env.VITE_EMAILJS_SERVICE_ID) {
        toast.info(`Demo OTP: ${code}`, { autoClose: 15000 })
      } else {
        toast.success(t('otp.resent'))
      }
    } catch { toast.error(t('otp.sendError')) }
    finally { setResending(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <div className="text-center mb-4">
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'linear-gradient(135deg,#1a3a5c,#f59e0b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.1rem',
          }}>
            <i className="bi bi-shield-lock" style={{ color: '#fff', fontSize: '1.5rem' }}></i>
          </div>
          <h2 style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
            {t('auth.resetTitle')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '0.2rem' }}>
            {t('otp.subtitle')}
          </p>
          <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.88rem', wordBreak: 'break-all' }}>
            {email}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* OTP boxes */}
          <label className="form-label-custom mb-2">{t('otp.code')}</label>
          <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
            {digits.map((d, i) => (
              <input key={i} ref={el => inputs.current[i] = el}
                type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                onFocus={e => e.target.select()}
                style={{
                  width: 46, height: 52, textAlign: 'center',
                  fontSize: '1.3rem', fontWeight: 700,
                  border: `2px solid ${d ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 10, background: 'var(--bg-primary)',
                  color: 'var(--text-primary)', outline: 'none',
                  transition: 'border-color 0.15s',
                }}
              />
            ))}
          </div>

          {seconds > 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
              <i className="bi bi-clock me-1"></i>
              {t('otp.expiresIn')} <strong style={{ color: seconds < 60 ? '#ef4444' : 'var(--text-primary)' }}>{mm}:{ss}</strong>
            </p>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <button type="button" onClick={handleResend} disabled={resending} style={{
                background: 'none', border: 'none', color: 'var(--primary)',
                fontWeight: 600, cursor: 'pointer', fontSize: '0.86rem', padding: 0,
              }}>
                {resending ? <><span className="spinner-border spinner-border-sm me-1"></span>{t('otp.resending')}</> :
                  <><i className="bi bi-arrow-repeat me-1"></i>{t('otp.resend')}</>}
              </button>
            </div>
          )}

          {/* New password */}
          <div className="mb-2">
            <label className="form-label-custom">{t('auth.newPassword')} *</label>
            <div style={{ position: 'relative' }}>
              <input type={showPwd ? 'text' : 'password'} required
                className="form-control-custom w-100" style={{ paddingRight: '2.5rem' }}
                placeholder="Create a strong password"
                value={password} onChange={e => setPassword(e.target.value)}
                onFocus={() => setPwdFocused(true)} onBlur={() => setPwdFocused(false)}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0,
              }}>
                <i className={`bi bi-eye${showPwd ? '-slash' : ''}`}></i>
              </button>
            </div>

            {(pwdFocused || password.length > 0) && (
              <div style={{
                marginTop: '0.5rem', padding: '0.6rem 0.85rem',
                background: 'var(--bg-secondary, #f8fafc)',
                border: '1px solid var(--border)', borderRadius: 9,
              }}>
                {pwdRules.map((r, idx) => {
                  const ok = r.test(password)
                  return (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: '0.45rem',
                      marginBottom: idx < pwdRules.length - 1 ? '0.25rem' : 0,
                      fontSize: '0.8rem', color: ok ? '#16a34a' : 'var(--text-muted)',
                      transition: 'color 0.2s',
                    }}>
                      <div style={{
                        width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: ok ? '#16a34a' : 'transparent',
                        border: `1.5px solid ${ok ? '#16a34a' : 'var(--text-muted)'}`,
                        transition: 'all 0.2s',
                      }}>
                        {ok && <i className="bi bi-check" style={{ color: '#fff', fontSize: '0.55rem', lineHeight: 1 }}></i>}
                      </div>
                      {r.label[lang]}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label-custom">{t('auth.confirmPassword')} *</label>
            <div style={{ position: 'relative' }}>
              <input type={showPwd ? 'text' : 'password'} required
                className="form-control-custom w-100" style={{ paddingRight: '2.5rem' }}
                placeholder="Repeat new password"
                value={confirm} onChange={e => setConfirm(e.target.value)}
              />
              {confirm.length > 0 && (
                <span style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  color: confirm === password ? '#16a34a' : '#ef4444',
                }}>
                  <i className={`bi bi-${confirm === password ? 'check-circle-fill' : 'x-circle-fill'}`}></i>
                </span>
              )}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary-custom w-100" style={{ justifyContent: 'center' }}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2"></span>{t('auth.resetting')}</>
              : <><i className="bi bi-check-lg me-2"></i>{t('auth.resetPassword')}</>}
          </button>
        </form>

        <div className="divider"></div>
        <Link to="/login" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem',
        }}>
          <i className="bi bi-arrow-left"></i> {t('auth.backToLogin')}
        </Link>
      </div>
    </div>
  )
}
