import React, { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { consumeVerifyToken } from '../services/emailVerifyService'
import { mockVerifyEmail } from '../services/mockAuth'

/** Landing page for the link inside the confirmation email. */
export default function ConfirmEmailPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') || ''
  const emailParam = params.get('email') || ''

  const [status, setStatus] = useState('checking') // checking | success | error
  const [email, setEmail] = useState(emailParam)

  useEffect(() => {
    const result = consumeVerifyToken(token)
    if (result.ok) {
      mockVerifyEmail(result.email)
      setEmail(result.email)
      setStatus('success')
    } else {
      setStatus('error')
    }
  }, [token])

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 420, textAlign: 'center' }}>
        {status === 'checking' && (
          <>
            <span className="spinner-border" style={{ color: 'var(--primary)', marginBottom: '1rem' }}></span>
            <p style={{ color: 'var(--text-secondary)' }}>{t('emailVerify.confirming')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg,#1a3a5c,#16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: '1.6rem' }}></i>
            </div>
            <h2 style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {t('emailVerify.confirmSuccessTitle')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
              {t('emailVerify.confirmSuccessDesc')}
            </p>
            <button className="btn-primary-custom w-100" style={{ justifyContent: 'center' }}
              onClick={() => navigate('/login')}>
              {t('emailVerify.goToLogin')}
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg,#b91c1c,#f59e0b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <i className="bi bi-x-lg" style={{ color: '#fff', fontSize: '1.6rem' }}></i>
            </div>
            <h2 style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {t('emailVerify.confirmErrorTitle')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
              {t('emailVerify.confirmErrorDesc')}
            </p>
            {email && (
              <Link to={`/verify-email?email=${encodeURIComponent(email)}`} className="btn-primary-custom w-100"
                style={{ justifyContent: 'center', textDecoration: 'none' }}>
                {t('emailVerify.resend')}
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}
