import React, { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { sendVerificationEmail } from '../services/emailVerifyService'

export default function VerifyEmailPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const email = params.get('email') || ''

  const [resending, setResending] = useState(false)
  const [demoLink, setDemoLink] = useState(null)

  const handleResend = async () => {
    setResending(true)
    try {
      const link = await sendVerificationEmail(email)
      if (!import.meta.env.VITE_EMAILJS_SERVICE_ID) {
        setDemoLink(link)
      } else {
        toast.success(t('emailVerify.resent'))
      }
    } catch {
      toast.error(t('emailVerify.sendError'))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 440, textAlign: 'center' }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'linear-gradient(135deg,#1a3a5c,#16a34a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem',
        }}>
          <i className="bi bi-envelope-check" style={{ color: '#fff', fontSize: '1.6rem' }}></i>
        </div>

        <h2 style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
          {t('emailVerify.title')}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
          {t('emailVerify.sentTo')} <strong style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{email}</strong>.{' '}
          {t('emailVerify.checkInbox')}
        </p>

        {demoLink && (
          <div style={{
            background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8,
            padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.82rem', color: '#92400e', textAlign: 'left',
          }}>
            <i className="bi bi-info-circle me-1"></i>
            {t('emailVerify.demoHint')}
            <div style={{ marginTop: '0.4rem' }}>
              <Link to={demoLink.replace(window.location.origin, '')} style={{ color: '#92400e', fontWeight: 600, wordBreak: 'break-all' }}>
                {demoLink}
              </Link>
            </div>
          </div>
        )}

        <button
          onClick={handleResend} disabled={resending}
          className="btn-primary-custom w-100" style={{ justifyContent: 'center', marginBottom: '1rem' }}
        >
          {resending
            ? <><span className="spinner-border spinner-border-sm me-2"></span>{t('emailVerify.resending')}</>
            : <><i className="bi bi-arrow-repeat me-2"></i>{t('emailVerify.resend')}</>}
        </button>

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
