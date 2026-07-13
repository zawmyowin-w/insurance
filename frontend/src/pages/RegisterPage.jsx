import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'

export default function RegisterPage() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', password: '', confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [agree, setAgree] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    const digitsOnly = form.phone.replace(/\D/g, '')
    if (digitsOnly.length !== 11) {
      toast.error(t('auth.phoneInvalid'))
      return
    }
    if (form.password !== form.confirmPassword) {
      toast.error(t('auth.passwordMismatch'))
      return
    }
    if (!agree) { toast.error(t('auth.mustAgree')); return }
    setLoading(true)
    try {
      const { confirmPassword, ...payload } = form
      await register({ ...payload, role: 'CUSTOMER' })
      toast.success(t('auth.registerSuccess'))
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.registerError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="text-center mb-4">
          <div style={{
            width: 52, height: 52, background: 'var(--primary)', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
          }}>
            <i className="bi bi-shield-check" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
          </div>
          <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '1.5rem' }}>
            {t('auth.createAccount')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t('auth.registerSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <label className="form-label-custom">{t('auth.fullName')} *</label>
              <input name="name" required className="form-control-custom w-100" placeholder="John Doe"
                value={form.name} onChange={handleChange} />
            </div>
            <div className="col-12 col-sm-6">
              <label className="form-label-custom">{t('auth.email')} *</label>
              <input name="email" type="email" required className="form-control-custom w-100"
                placeholder="you@example.com" value={form.email} onChange={handleChange} />
            </div>
            <div className="col-12 col-sm-6">
              <label className="form-label-custom">{t('auth.phone')} *</label>
              <input name="phone" required className="form-control-custom w-100"
                placeholder="+95 9 xxx xxx xxx" value={form.phone} onChange={handleChange} />
            </div>
            <div className="col-12 col-sm-6">
              <label className="form-label-custom">{t('auth.address')}</label>
              <input name="address" className="form-control-custom w-100"
                placeholder="Yangon, Myanmar" value={form.address} onChange={handleChange} />
            </div>
            <div className="col-12 col-sm-6">
              <label className="form-label-custom">{t('auth.password')} *</label>
              <div style={{ position: 'relative' }}>
                <input name="password" type={showPwd ? 'text' : 'password'} required
                  className="form-control-custom w-100" style={{ paddingRight: '2.5rem' }}
                  placeholder="Min. 8 characters" minLength={8}
                  value={form.password} onChange={handleChange} />
                <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0
                }}>
                  <i className={`bi bi-eye${showPwd ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <label className="form-label-custom">{t('auth.confirmPassword')} *</label>
              <input name="confirmPassword" type={showPwd ? 'text' : 'password'} required
                className="form-control-custom w-100" placeholder="Repeat password"
                value={form.confirmPassword} onChange={handleChange} />
            </div>
          </div>

          <div className="d-flex align-items-start gap-2 mt-3">
            <input type="checkbox" id="agree" checked={agree} onChange={e => setAgree(e.target.checked)}
              style={{ marginTop: '0.2rem', flexShrink: 0 }} />
            <label htmlFor="agree" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              {t('auth.agreeText')}{' '}
              <Link to="/terms" target="_blank" style={{ color: 'var(--primary)' }}>{t('auth.termsLink')}</Link>{' & '}
              <Link to="/privacy" target="_blank" style={{ color: 'var(--primary)' }}>{t('auth.privacyLink')}</Link>
            </label>
          </div>

          <button type="submit" disabled={loading || !agree}
            className="btn-primary-custom mt-3 w-100" style={{ justifyContent: 'center' }}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2"></span>{t('auth.registering')}</>
              : t('auth.register')}
          </button>
        </form>

        <div className="text-center mt-4">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            {t('auth.haveAccount')}{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              {t('auth.loginHere')}
            </Link>
          </p>
        </div>
        <div className="divider"></div>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem' }}>
          <i className="bi bi-arrow-left"></i> {t('auth.backHome')}
        </Link>
      </div>
    </div>
  )
}
