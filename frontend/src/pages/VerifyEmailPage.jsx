import React, { useState, useRef, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { verifyOtp, issueOtp, otpSecondsLeft } from '../services/otpService'

const BOX_COUNT = 6

export default function VerifyEmailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email = params.get('email') || ''

  const [digits, setDigits] = useState(Array(BOX_COUNT).fill(''))
  const [seconds, setSeconds] = useState(() => otpSecondsLeft(email, 'verify'))
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const inputs = useRef([])

  useEffect(() => {
    const id = setInterval(() => setSeconds(otpSecondsLeft(email, 'verify')), 1000)
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

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  const handleSubmit = async e => {
    e.preventDefault()
    const code = digits.join('')
    if (code.length < BOX_COUNT) { toast.error(t('otp.enterAll')); return }

    setLoading(true)
    await new Promise(r => setTimeout(r, 300))
    const result = verifyOtp(email, 'verify', code)
    setLoading(false)

    if (!result.ok) {
      toast.error(result.reason === 'expired' ? t('otp.expired') : t('otp.invalid'))
      setDigits(Array(BOX_COUNT).fill(''))
      focus(0)
      return
    }

    toast.success(t('emailVerify.confirmSuccessTitle') || 'Email verified! Please log in.')
    navigate('/login')
  }

  const handleResend = async () => {
    setResending(true)
    try {
      const code = await issueOtp(email, 'verify')
      setSeconds(300)
      setDigits(Array(BOX_COUNT).fill(''))
      focus(0)
      if (!import.meta.env.VITE_EMAILJS_SERVICE_ID) {
        toast.info(`Demo OTP: ${code}`, { autoClose: 15000 })
      } else {
        toast.success(t('otp.resent'))
      }
    } catch {
      toast.error(t('otp.sendError'))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <div className="text-center mb-4">
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'linear-gradient(135deg,#1a3a5c,#16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.1rem',
          }}>
            <i className="bi bi-envelope-check" style={{ color: '#fff', fontSize: '1.5rem' }}></i>
          </div>
          <h2 style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
            {t('emailVerify.title') || 'Verify your email'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '0.2rem' }}>
            {t('otp.subtitle') || 'Enter the 6-digit code sent to'}
          </p>
          <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.88rem', wordBreak: 'break-all' }}>
            {email}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="form-label-custom mb-2">{t('otp.code') || 'Verification Code'}</label>
          <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
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
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
              <i className="bi bi-clock me-1"></i>
              {t('otp.expiresIn') || 'Expires in'}{' '}
              <strong style={{ color: seconds < 60 ? '#ef4444' : 'var(--text-primary)' }}>{mm}:{ss}</strong>
            </p>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <button type="button" onClick={handleResend} disabled={resending} style={{
                background: 'none', border: 'none', color: 'var(--primary)',
                fontWeight: 600, cursor: 'pointer', fontSize: '0.86rem', padding: 0,
              }}>
                {resending
                  ? <><span className="spinner-border spinner-border-sm me-1"></span>{t('otp.resending') || 'Resending…'}</>
                  : <><i className="bi bi-arrow-repeat me-1"></i>{t('otp.resend') || 'Resend code'}</>}
              </button>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary-custom w-100" style={{ justifyContent: 'center' }}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2"></span>{t('auth.verifying') || 'Verifying…'}</>
              : <><i className="bi bi-check-lg me-2"></i>{t('otp.verify')}</>}
          </button>
        </form>

        <div className="divider"></div>
        <Link to="/login" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem',
        }}>
          <i className="bi bi-arrow-left"></i> {t('auth.backToLogin') || 'Back to Login'}
        </Link>
      </div>
    </div>
  )
}
