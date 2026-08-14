import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { issueOtp, storePendingRegistration } from '../services/otpService'
import api from '../services/api'
import {
  EMAIL_ERROR,
  getEmailValidationError, normalizeEmail,
  getPhoneValidationError, isPhoneValid,
  passwordStrengthLevel, isStrongPassword,
} from '../utils/validation'
import PasswordStrengthWidget from '../components/PasswordStrengthWidget'
import { apiError } from '../utils/apiError'

export default function RegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    _website: '', // honeypot — should always stay empty; bots fill this in
  })
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [agree, setAgree] = useState(false)
  const [pwdFocused, setPwdFocused] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)

  const lang = i18n.language?.startsWith('my') ? 'my' : 'en'

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handlePhoneChange = e => {
    let val = e.target.value
    if (!val) { setForm(f => ({ ...f, phone: '' })); return }
    if (!val.startsWith('+959')) { setForm(f => ({ ...f, phone: '+959' })); return }
    // Only allow digits after +959
    const prefix = '+959'
    const rest = val.slice(4).replace(/\D/g, '')
    setForm(f => ({ ...f, phone: prefix + rest }))
  }

  const handleEmailBlur = () => setEmailTouched(true)
  const handlePhoneBlur = () => {
    if (form.phone === '+959') setForm(f => ({ ...f, phone: '' }))
    setPhoneTouched(true)
  }

  const emailError   = emailTouched ? getEmailValidationError(form.email) : null
  const emailValid   = emailError === null
  const phoneError   = phoneTouched ? getPhoneValidationError(form.phone) : null
  const allRulesPassed = isStrongPassword(form.password)
  const { level, label: strengthLabel, color: strengthColor } = passwordStrengthLevel(form.password)

  const handleSubmit = async e => {
    e.preventDefault()
    setEmailTouched(true)

    const normalizedEmail = form.email.trim()

    // Honeypot check — bots fill in the hidden field
    if (form._website && form._website.trim() !== '') {
      // Silently reject; don't tell bots what triggered it
      setLoading(false)
      return
    }

    setPhoneTouched(true)
    const emailErr = getEmailValidationError(normalizedEmail)
    if (emailErr) {
      toast.error(emailErr[lang])
      return
    }
    const phoneErr = getPhoneValidationError(form.phone)
    if (phoneErr) {
      toast.error(phoneErr[lang])
      return
    }
    if (!allRulesPassed) { toast.error(t('auth.pwdWeak')); return }
    if (form.password !== form.confirmPassword) { toast.error(t('auth.passwordMismatch')); return }
    if (!agree) { toast.error(t('auth.mustAgree')); return }

    setLoading(true)
    const payload = { name: form.name, email: normalizedEmail, phone: form.phone, password: form.password }

    // Step 1: Server-side Gmail format + blacklist + MX record validation
    try {
      await api.get(`/auth/validate-email?email=${encodeURIComponent(normalizedEmail)}`)
    } catch (err) {
      apiError(err, EMAIL_ERROR[lang])
      setLoading(false)
      return
    }

    // Step 2: Check email availability (not yet registered)
    try {
      await api.get(`/auth/check-email?email=${encodeURIComponent(normalizedEmail)}`)
    } catch (err) {
      apiError(err, t('auth.registerError'))
      setLoading(false)
      return
    }

    // Step 3: Stash pending registration in sessionStorage
    storePendingRegistration(payload)

    // Step 4: Send OTP — account stays out of DB until code is verified
    try {
      await issueOtp(normalizedEmail, 'verify')
      toast.success(t('otp.sent') || 'Verification code sent to your Gmail!')
    } catch (err) {
      const detail = err?.emailjsDetail || err?.message || ''
      toast.warn(`${t('otp.sendError') || 'Could not send code'} — ${detail}`, { autoClose: false })
    }
    setLoading(false)
    navigate(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`)
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="text-center mb-4">
          <div className="auth-logo-wrap">
            <img src="/logo-transparent.png" alt="DICP Logo" className="auth-logo-img" />
          </div>
          <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '1.5rem' }}>
            {t('auth.createAccount')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t('auth.registerSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Honeypot — hidden from real users, bots fill it in */}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
            <label htmlFor="_website">Website</label>
            <input
              id="_website" name="_website" type="text"
              tabIndex={-1} autoComplete="off"
              value={form._website} onChange={handleChange}
            />
          </div>

          <div className="row g-3">
            <div className="col-12">
              <label className="form-label-custom">{t('auth.fullName')} <span style={{color: 'red'}}>*</span></label>
              <input name="name" required className="form-control-custom w-100" placeholder="John Doe"
                value={form.name} onChange={handleChange} />
            </div>
            <div className="col-12">
              <label className="form-label-custom">{t('auth.email')} <span style={{color: 'red'}}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  name="email" type="email" required
                  className="form-control-custom w-100"
                  placeholder="yourname@example.com"
                  value={form.email} onChange={handleChange}
                  onBlur={handleEmailBlur}
                  style={emailError ? { borderColor: '#ef4444' } : undefined}
                />
                {emailTouched && emailValid && form.email && (
                  <span style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    color: '#16a34a', fontSize: '1rem',
                  }}>
                    <i className="bi bi-check-circle-fill"></i>
                  </span>
                )}
              </div>
              {emailError && (
                <p style={{ fontSize: '0.76rem', color: '#ef4444', margin: '0.25rem 0 0', lineHeight: 1.4 }}>
                  <i className="bi bi-exclamation-circle me-1"></i>
                  {emailError[lang]}
                </p>
              )}
              {!emailError && !emailTouched && (
                <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                  {lang === 'my' ? 'Email ပုံစံမှန်ကန်ရမည်' : 'Valid email format required'}
                </p>
              )}
            </div>
            <div className="col-12">
              <label className="form-label-custom">{t('auth.phone')} <span style={{color: 'red'}}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  name="phone" type="tel" required
                  className="form-control-custom w-100"
                  placeholder="+959xxxxxxxx"
                  value={form.phone}
                  onChange={handlePhoneChange}
                  onFocus={() => { if (!form.phone) setForm(f => ({ ...f, phone: '+959' })) }}
                  onBlur={handlePhoneBlur}
                  style={phoneError ? { borderColor: '#ef4444' } : undefined}
                />
                {phoneTouched && !phoneError && form.phone && form.phone !== '+959' && (
                  <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#16a34a', fontSize: '1rem' }}>
                    <i className="bi bi-check-circle-fill" />
                  </span>
                )}
              </div>
              {phoneError ? (
                <p style={{ fontSize: '0.76rem', color: '#ef4444', margin: '0.25rem 0 0', lineHeight: 1.4 }}>
                  <i className="bi bi-exclamation-circle me-1" />{phoneError[lang]}
                </p>
              ) : (
                <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                  {lang === 'my' ? '+959 ဖြင့်စပြီး ဂဏန်း 7 လုံး သို့မဟုတ် 9 လုံး ဖြည့်ပါ' : 'Start with +959 then exactly 7 or 9 digits'}
                </p>
              )}
            </div>

            {/* Password with live requirements */}
            <div className="col-12">
              <label className="form-label-custom">{t('auth.password')} <span style={{color: 'red'}}>*</span></label>
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
                <PasswordStrengthWidget
                  password={form.password} lang={lang}
                  popup show={(pwdFocused || form.password.length > 0) && !allRulesPassed}
                />
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
            </div>

            <div className="col-12">
              <label className="form-label-custom">{t('auth.confirmPassword')} <span style={{color: 'red'}}>*</span></label>
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
              <Link to="/terms" style={{ color: 'var(--primary)' }}>{t('auth.termsLink')}</Link>{' & '}
              <Link to="/privacy" style={{ color: 'var(--primary)' }}>{t('auth.privacyLink')}</Link>
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
