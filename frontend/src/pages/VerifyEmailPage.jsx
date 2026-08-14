import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { verifyOtp, getPendingRegistration, clearPendingRegistration, MAX_OTP_ATTEMPTS } from '../services/otpService'
import { useAuth } from '../context/AuthContext'
import { useOtpInput } from '../hooks/useOtpInput'
import { apiError } from '../utils/apiError'

export default function VerifyEmailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email = params.get('email') || ''
  const { register } = useAuth()

  const [loading, setLoading] = useState(false)
  const {
    digits, setDigits, seconds, resending,
    inputs, mm, ss, code, BOX_COUNT,
    handleChange, handleKeyDown, handlePaste, handleResend, focus,
    attemptsLeft, resendsLeft, locked,
    refreshAttemptCounters,
  } = useOtpInput(email, 'verify', t)

  const handleSubmit = async e => {
    e.preventDefault()
    if (locked) return
    if (code.length < BOX_COUNT) { toast.error(t('otp.enterAll') || 'Please enter all 6 digits.'); return }

    setLoading(true)
    await new Promise(r => setTimeout(r, 300))
    const result = verifyOtp(email, 'verify', code)

    if (!result.ok) {
      setLoading(false)
      refreshAttemptCounters()
      setDigits(Array(BOX_COUNT).fill(''))
      focus(0)

      if (result.reason === 'expired') {
        toast.error(t('otp.expired') || 'Code expired. Please request a new one.')
        return
      }
      if (result.reason === 'locked') {
        toast.error(
          t('otp.locked') ||
          'Too many wrong attempts — this code has been voided. Please request a new code.',
          { autoClose: false }
        )
        return
      }
      // reason === 'invalid'
      const left = result.attemptsLeft ?? (attemptsLeft - 1)
      if (left <= 2 && left > 0) {
        toast.warn(
          `${t('otp.invalid') || 'Incorrect code.'} ${left} attempt${left === 1 ? '' : 's'} remaining.`
        )
      } else if (left === 0) {
        toast.error(
          t('otp.locked') ||
          'Too many wrong attempts — this code has been voided. Please request a new code.',
          { autoClose: false }
        )
      } else {
        toast.error(t('otp.invalid') || 'Incorrect code. Please try again.')
      }
      return
    }

    // OTP verified — now create the account in the database
    const pending = getPendingRegistration(email)
    if (pending) {
      try {
        await register(pending)
        clearPendingRegistration(email)
      } catch (err) {
        setLoading(false)
        apiError(err, t('auth.registerError'))
        return
      }
    }

    setLoading(false)
    toast.success(t('emailVerify.confirmSuccessTitle') || 'Email verified! Your account is now active.')
    navigate('/login')
  }

  const showAttemptsWarning = !locked && attemptsLeft < MAX_OTP_ATTEMPTS && attemptsLeft > 0

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <div className="text-center mb-4">
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: locked
              ? 'linear-gradient(135deg,#ef4444,#b91c1c)'
              : 'linear-gradient(135deg,#1a3a5c,#16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.1rem',
          }}>
            <i className={`bi bi-${locked ? 'shield-x' : 'envelope-check'}`} style={{ color: '#fff', fontSize: '1.5rem' }}></i>
          </div>
          <h2 style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
            {locked
              ? (t('otp.lockedTitle') || 'Code Voided')
              : (t('emailVerify.title') || 'Verify your email')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '0.2rem' }}>
            {locked
              ? (t('otp.lockedSubtitle') || 'Too many incorrect attempts. Request a new code below.')
              : (t('otp.subtitle') || 'Enter the 6-digit code sent to')}
          </p>
          {!locked && (
            <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.88rem', wordBreak: 'break-all' }}>
              {email}
            </p>
          )}
        </div>

        {/* Attempt warning banner */}
        {showAttemptsWarning && (
          <div style={{
            background: attemptsLeft === 1 ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${attemptsLeft === 1 ? '#fca5a5' : '#fcd34d'}`,
            borderRadius: 8, padding: '0.55rem 0.85rem',
            marginBottom: '0.85rem', fontSize: '0.8rem',
            color: attemptsLeft === 1 ? '#b91c1c' : '#92400e',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <i className={`bi bi-exclamation-${attemptsLeft === 1 ? 'octagon' : 'triangle'}-fill`}></i>
            {attemptsLeft === 1
              ? (t('otp.lastAttempt') || 'Last attempt! The code will be voided if wrong.')
              : `${attemptsLeft} ${t('otp.attemptsLeft') || 'attempts remaining'}`}
          </div>
        )}

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
                disabled={locked}
                style={{
                  width: 46, height: 52, textAlign: 'center',
                  fontSize: '1.3rem', fontWeight: 700,
                  border: `2px solid ${locked ? '#fca5a5' : d ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 10, background: locked ? '#fef2f2' : 'var(--bg-primary)',
                  color: locked ? '#b91c1c' : 'var(--text-primary)', outline: 'none',
                  transition: 'border-color 0.15s', opacity: locked ? 0.7 : 1,
                }}
              />
            ))}
          </div>

          {/* Timer / resend */}
          {!locked && (
            seconds > 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                <i className="bi bi-clock me-1"></i>
                {t('otp.expiresIn') || 'Expires in'}{' '}
                <strong style={{ color: seconds < 60 ? '#ef4444' : 'var(--text-primary)' }}>{mm}:{ss}</strong>
              </p>
            ) : (
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                {resendsLeft > 0 ? (
                  <button type="button" onClick={handleResend} disabled={resending} style={{
                    background: 'none', border: 'none', color: 'var(--primary)',
                    fontWeight: 600, cursor: 'pointer', fontSize: '0.86rem', padding: 0,
                  }}>
                    {resending
                      ? <><span className="spinner-border spinner-border-sm me-1"></span>{t('otp.resending') || 'Resending…'}</>
                      : <><i className="bi bi-arrow-repeat me-1"></i>{t('otp.resend') || 'Resend code'} ({resendsLeft} left)</>}
                  </button>
                ) : (
                  <p style={{ color: '#ef4444', fontSize: '0.82rem' }}>
                    <i className="bi bi-x-circle me-1"></i>
                    {t('otp.resendLimitReached') || 'No more resends allowed. Please start registration again.'}
                  </p>
                )}
              </div>
            )
          )}

          {/* Resend available but still in timer — show remaining count */}
          {!locked && seconds > 0 && resendsLeft < 5 && resendsLeft > 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
              {resendsLeft} resend{resendsLeft === 1 ? '' : 's'} remaining
            </p>
          )}

          {/* Locked state - resend to get new code */}
          {locked && (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              {resendsLeft > 0 ? (
                <button type="button" onClick={handleResend} disabled={resending} style={{
                  background: 'none', border: 'none', color: 'var(--primary)',
                  fontWeight: 600, cursor: 'pointer', fontSize: '0.86rem', padding: 0,
                }}>
                  {resending
                    ? <><span className="spinner-border spinner-border-sm me-1"></span>Sending…</>
                    : <><i className="bi bi-arrow-repeat me-1"></i>Request a new code ({resendsLeft} left)</>}
                </button>
              ) : (
                <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.86rem' }}>
                  <i className="bi bi-arrow-left me-1"></i>Start registration again
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || locked}
            className="btn-primary-custom w-100"
            style={{ justifyContent: 'center', opacity: locked ? 0.5 : 1 }}
          >
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2"></span>{t('auth.verifying') || 'Verifying…'}</>
              : <><i className="bi bi-check-lg me-2"></i>{t('otp.verify') || 'Verify'}</>}
          </button>
        </form>

        <div className="divider"></div>
        <Link to="/register" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem',
        }}>
          <i className="bi bi-arrow-left"></i> Back to Register
        </Link>
      </div>
    </div>
  )
}
