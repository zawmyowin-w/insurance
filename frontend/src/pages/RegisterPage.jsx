import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import { issueOtp } from '../services/otpService'

const rules = [
  { key: 'len',     test: p => p.length >= 8,          label: { en: 'At least 8 characters',          my: 'အနည်းဆုံး ၈ လုံး' } },
  { key: 'upper',   test: p => /[A-Z]/.test(p),        label: { en: 'One uppercase letter (A–Z)',      my: 'အကြီးစာလုံး (A–Z) တစ်လုံး' } },
  { key: 'lower',   test: p => /[a-z]/.test(p),        label: { en: 'One lowercase letter (a–z)',      my: 'အသေးစာလုံး (a–z) တစ်လုံး' } },
  { key: 'num',     test: p => /[0-9]/.test(p),        label: { en: 'One number (0–9)',                my: 'ဂဏန်း (0–9) တစ်လုံး' } },
  { key: 'special', test: p => /[^A-Za-z0-9]/.test(p), label: { en: 'One special character (!@#$…)',  my: 'အထူးအက္ခရာ (!@#$…) တစ်လုံး' } },
]

function strengthLevel(pwd) {
  const passed = rules.filter(r => r.test(pwd)).length
  if (passed <= 1) return { level: 0, label: '' }
  if (passed === 2) return { level: 1, label: 'Weak',   color: '#ef4444' }
  if (passed === 3) return { level: 2, label: 'Fair',   color: '#f59e0b' }
  if (passed === 4) return { level: 3, label: 'Good',   color: '#3b82f6' }
  return              { level: 4, label: 'Strong', color: '#16a34a' }
}

export default function RegisterPage() {
  const { t, i18n } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', password: '', confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [agree, setAgree] = useState(false)
  const [pwdFocused, setPwdFocused] = useState(false)

  const lang = i18n.language?.startsWith('my') ? 'my' : 'en'
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const allRulesPassed = rules.every(r => r.test(form.password))
  const { level, label: strengthLabel, color: strengthColor } = strengthLevel(form.password)

  const handleSubmit = async e => {
    e.preventDefault()
    const digitsOnly = form.phone.replace(/\D/g, '')
    if (digitsOnly.length !== 11) { toast.error(t('auth.phoneInvalid')); return }
    if (!allRulesPassed) { toast.error(t('auth.pwdWeak')); return }
    if (form.password !== form.confirmPassword) { toast.error(t('auth.passwordMismatch')); return }
    if (!agree) { toast.error(t('auth.mustAgree')); return }
    setLoading(true)
    try {
      const { confirmPassword, ...payload } = form
      await register({ ...payload, role: 'CUSTOMER' })
      // issue OTP and go to verify page
      const code = await issueOtp(payload.email, 'verify')
      if (!import.meta.env.VITE_EMAILJS_SERVICE_ID) {
        toast.info(`Demo OTP: ${code}`, { autoClose: 20000 })
      } else {
        toast.success(t('otp.sent'))
      }
      navigate(`/verify-email?email=${encodeURIComponent(payload.email)}`)
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

            {/* Password with Google-style live requirements */}
            <div className="col-12">
              <label className="form-label-custom">{t('auth.password')} *</label>
              <div style={{ position: 'relative' }}>
                <input
                  name="password" type={showPwd ? 'text' : 'password'} required
                  className="form-control-custom w-100" style={{ paddingRight: '2.5rem' }}
                  placeholder="Create a strong password"
                  value={form.password} onChange={handleChange}
                  onFocus={() => setPwdFocused(true)}
                  onBlur={() => setPwdFocused(false)}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0
                }}>
                  <i className={`bi bi-eye${showPwd ? '-slash' : ''}`}></i>
                </button>
              </div>

              {/* Strength bar */}
              {form.password.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 99,
                        background: i <= level ? strengthColor : 'var(--border)',
                        transition: 'background 0.25s',
                      }} />
                    ))}
                  </div>
                  {strengthLabel && (
                    <p style={{ fontSize: '0.78rem', color: strengthColor, margin: '0.25rem 0 0', fontWeight: 600 }}>
                      {strengthLabel}
                    </p>
                  )}
                </div>
              )}

              {/* Requirements checklist — shows on focus or while typing */}
              {(pwdFocused || form.password.length > 0) && (
                <div style={{
                  marginTop: '0.6rem', padding: '0.75rem 1rem',
                  background: 'var(--bg-secondary, #f8fafc)',
                  border: '1px solid var(--border)', borderRadius: 10,
                }}>
                  {rules.map(r => {
                    const passed = r.test(form.password)
                    return (
                      <div key={r.key} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        marginBottom: '0.3rem', fontSize: '0.82rem',
                        color: passed ? '#16a34a' : 'var(--text-muted)',
                        transition: 'color 0.2s',
                      }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: passed ? '#16a34a' : 'transparent',
                          border: `1.5px solid ${passed ? '#16a34a' : 'var(--text-muted)'}`,
                          transition: 'all 0.2s',
                        }}>
                          {passed && <i className="bi bi-check" style={{ color: '#fff', fontSize: '0.6rem', lineHeight: 1 }}></i>}
                        </div>
                        {r.label[lang]}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="col-12">
              <label className="form-label-custom">{t('auth.confirmPassword')} *</label>
              <div style={{ position: 'relative' }}>
                <input name="confirmPassword" type={showPwd ? 'text' : 'password'} required
                  className="form-control-custom w-100" style={{ paddingRight: '2.5rem' }}
                  placeholder="Repeat password"
                  value={form.confirmPassword} onChange={handleChange} />
                {form.confirmPassword.length > 0 && (
                  <span style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '1rem',
                    color: form.confirmPassword === form.password ? '#16a34a' : '#ef4444',
                  }}>
                    <i className={`bi bi-${form.confirmPassword === form.password ? 'check-circle-fill' : 'x-circle-fill'}`}></i>
                  </span>
                )}
              </div>
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
