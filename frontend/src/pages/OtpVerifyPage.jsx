import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { verifyOtp, issueOtp, otpSecondsLeft } from '../services/otpService'
import { mockVerifyEmail } from '../services/mockAuth'

const BOX_COUNT = 6

export default function OtpVerifyPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email = params.get('email') || ''

  const [digits, setDigits] = useState(Array(BOX_COUNT).fill(''))
  const [seconds, setSeconds] = useState(() => otpSecondsLeft(email, 'verify'))
  const [resending, setResending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [demoCode, setDemoCode] = useState(null)
  const inputs = useRef([])

  // Countdown timer
  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(otpSecondsLeft(email, 'verify'))
    }, 1000)
    return () => clearInterval(id)
  }, [email])

  const focus = i => inputs.current[i]?.focus()

  const handleChange = (i, val) => {
    const ch = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = ch
    setDigits(next)
    if (ch && i < BOX_COUNT - 1) focus(i + 1)
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = [...digits]; next[i] = ''; setDigits(next)
      } else if (i > 0) {
        const next = [...digits]; next[i - 1] = ''; setDigits(next); focus(i - 1)
      }
    } else if (e.key === 'ArrowLeft' && i > 0) focus(i - 1)
    else if (e.key === 'ArrowRight' && i < BOX_COUNT - 1) focus(i + 1)
  }

  const handlePaste = e => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, BOX_COUNT)
    if (!text) return
    const next = Array(BOX_COUNT).fill('')
    text.split('').forEach((c, i) => { next[i] = c })
    setDigits(next)
    focus(Math.min(text.length, BOX_COUNT - 1))
  }

  const handleVerify = async e => {
    e?.preventDefault()
    const code = digits.join('')
    if (code.length < BOX_COUNT) { toast.error(t('otp.enterAll')); return }
    setVerifying(true)
    await new Promise(r => setTimeout(r, 400)) // small UX delay
    const result = verifyOtp(email, 'verify', code)
    setVerifying(false)
    if (result.ok) {
      mockVerifyEmail(email)
      toast.success(t('otp.verified'))
      navigate('/login')
    } else if (result.reason === 'expired') {
      toast.error(t('otp.expired'))
      setDigits(Array(BOX_COUNT).fill(''))
      focus(0)
    } else {
      toast.error(t('otp.invalid'))
      setDigits(Array(BOX_COUNT).fill(''))
      focus(0)
    }
  }

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (digits.every(d => d !== '')) handleVerify()
  }, [digits]) // eslint-disable-line

  const handleResend = async () => {
    setResending(true)
    try {
      const code = await issueOtp(email, 'verify')
      setSeconds(300)
      setDigits(Array(BOX_COUNT).fill(''))
      focus(0)
      if (!import.meta.env.VITE_EMAILJS_SERVICE_ID) {
        setDemoCode(code)
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

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 420, textAlign: 'center' }}>

        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg,#1a3a5c,#16a34a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem',
        }}>
          <i className="bi bi-envelope-check" style={{ color: '#fff', fontSize: '1.6rem' }}></i>
        </div>

        <h2 style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          {t('otp.title')}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.25rem' }}>
          {t('otp.subtitle')}
        </p>
        <p style={{
          color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem',
          marginBottom: '1.75rem', wordBreak: 'break-all',
        }}>
          {email}
        </p>

        {/* Demo code hint */}
        {demoCode && (
          <div style={{
            background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8,
            padding: '0.6rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#92400e',
          }}>
            <i className="bi bi-info-circle me-1"></i>
            Demo mode — your OTP: <strong style={{ letterSpacing: 2 }}>{demoCode}</strong>
          </div>
        )}

        {/* 6-box OTP input */}
        <form onSubmit={handleVerify}>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.25rem' }}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                type="text" inputMode="numeric" maxLength={1}
                value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                onFocus={e => e.target.select()}
                style={{
                  width: 48, height: 56, textAlign: 'center',
                  fontSize: '1.4rem', fontWeight: 700, letterSpacing: 0,
                  border: `2px solid ${d ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 10, background: 'var(--bg-primary)',
                  color: 'var(--text-primary)', outline: 'none',
                  transition: 'border-color 0.15s',
                  caretColor: 'var(--primary)',
                }}
              />
            ))}
          </div>

          {/* Timer */}
          {seconds > 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginBottom: '1rem' }}>
              <i className="bi bi-clock me-1"></i>
              {t('otp.expiresIn')} <strong style={{ color: seconds < 60 ? '#ef4444' : 'var(--text-primary)' }}>
                {mm}:{ss}
              </strong>
            </p>
          )}

          <button
            type="submit"
            disabled={verifying || digits.join('').length < BOX_COUNT}
            className="btn-primary-custom w-100"
            style={{ justifyContent: 'center', marginBottom: '0.75rem' }}
          >
            {verifying
              ? <><span className="spinner-border spinner-border-sm me-2"></span>{t('otp.verifying')}</>
              : t('otp.verify')}
          </button>
        </form>

        {/* Resend */}
        <div style={{ marginBottom: '1rem' }}>
          {seconds > 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0 }}>
              {t('otp.resendIn')} {mm}:{ss}
            </p>
          ) : (
            <button
              onClick={handleResend} disabled={resending}
              style={{
                background: 'none', border: 'none', color: 'var(--primary)',
                fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem', padding: 0,
              }}
            >
              {resending
                ? <><span className="spinner-border spinner-border-sm me-1"></span>{t('otp.resending')}</>
                : <><i className="bi bi-arrow-repeat me-1"></i>{t('otp.resend')}</>}
            </button>
          )}
        </div>

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
