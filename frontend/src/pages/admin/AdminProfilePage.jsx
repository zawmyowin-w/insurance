import React, { useState, useRef, useEffect } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import ProfileAvatar from '../../components/ProfileAvatar'
import { issueOtp, verifyOtp, otpSecondsLeft } from '../../services/otpService'

const EMAIL_PATTERN = /^[a-z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const EMAIL_ERROR = 'Email must start with a lowercase letter — it cannot begin with a capital letter or a number'
const OTP_TYPE = 'changePassword'
const OTP_LEN = 6

export default function AdminProfilePage() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  })
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [showPwdModal, setShowPwdModal] = useState(false)
  const [pwdStep, setPwdStep] = useState('form') // 'form' | 'otp'
  const [sendingOtp, setSendingOtp] = useState(false)
  const [resendingOtp, setResendingOtp] = useState(false)
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LEN).fill(''))
  const [otpSeconds, setOtpSeconds] = useState(0)
  const otpInputs = useRef([])

  const handleProfileSubmit = async e => {
    e.preventDefault()
    if (!EMAIL_PATTERN.test(form.email)) { toast.error(EMAIL_ERROR); return }
    setSavingProfile(true)
    try {
      const { data } = await api.put('/auth/profile', {
        name: form.name, email: form.email, phone: form.phone, address: form.address,
      })
      setUser(data)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally { setSavingProfile(false) }
  }

  // Step 1: validate the password form, then send an OTP to the admin's email.
  const handleRequestOtp = async e => {
    e.preventDefault()
    if (pwd.newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return }
    if (pwd.newPassword !== pwd.confirmPassword) { toast.error('New passwords do not match'); return }
    setSendingOtp(true)
    try {
      const code = await issueOtp(user.email, OTP_TYPE)
      setOtpSeconds(otpSecondsLeft(user.email, OTP_TYPE))
      setOtpDigits(Array(OTP_LEN).fill(''))
      setPwdStep('otp')
      if (!import.meta.env.VITE_EMAILJS_SERVICE_ID) {
        toast.info(`Demo OTP: ${code}`, { autoClose: 15000 })
      } else {
        toast.success(`Verification code sent to ${user.email}`)
      }
    } catch (err) {
      console.error('[EmailJS error]', err)
      toast.error('Failed to send verification code')
    } finally { setSendingOtp(false) }
  }

  const handleResendOtp = async () => {
    setResendingOtp(true)
    try {
      const code = await issueOtp(user.email, OTP_TYPE)
      setOtpSeconds(otpSecondsLeft(user.email, OTP_TYPE))
      setOtpDigits(Array(OTP_LEN).fill(''))
      otpInputs.current[0]?.focus()
      if (!import.meta.env.VITE_EMAILJS_SERVICE_ID) {
        toast.info(`Demo OTP: ${code}`, { autoClose: 15000 })
      } else {
        toast.success('A new code has been sent')
      }
    } catch { toast.error('Failed to resend code') }
    finally { setResendingOtp(false) }
  }

  const handleOtpDigitChange = (i, val) => {
    const ch = val.replace(/\D/g, '').slice(-1)
    const next = [...otpDigits]; next[i] = ch; setOtpDigits(next)
    if (ch && i < OTP_LEN - 1) otpInputs.current[i + 1]?.focus()
  }

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (otpDigits[i]) { const n = [...otpDigits]; n[i] = ''; setOtpDigits(n) }
      else if (i > 0) { const n = [...otpDigits]; n[i - 1] = ''; setOtpDigits(n); otpInputs.current[i - 1]?.focus() }
    } else if (e.key === 'ArrowLeft' && i > 0) otpInputs.current[i - 1]?.focus()
    else if (e.key === 'ArrowRight' && i < OTP_LEN - 1) otpInputs.current[i + 1]?.focus()
  }

  const handleOtpPaste = e => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN)
    const next = Array(OTP_LEN).fill('')
    text.split('').forEach((c, i) => { next[i] = c })
    setOtpDigits(next)
    otpInputs.current[Math.min(text.length, OTP_LEN - 1)]?.focus()
  }

  // Step 2: verify the OTP, then submit the password change to the backend.
  const handlePasswordSubmit = async e => {
    e.preventDefault()
    const code = otpDigits.join('')
    if (code.length < OTP_LEN) { toast.error('Enter the full 6-digit code'); return }
    const result = verifyOtp(user.email, OTP_TYPE, code)
    if (!result.ok) {
      toast.error(result.reason === 'expired' ? 'Code expired — request a new one' : 'Incorrect code')
      setOtpDigits(Array(OTP_LEN).fill(''))
      otpInputs.current[0]?.focus()
      return
    }
    setSavingPwd(true)
    try {
      const { data } = await api.put('/auth/profile', {
        currentPassword: pwd.currentPassword, newPassword: pwd.newPassword,
      })
      setUser(data)
      toast.success('Password changed successfully')
      closePwdModal()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally { setSavingPwd(false) }
  }

  useEffect(() => {
    if (pwdStep !== 'otp') return
    const id = setInterval(() => setOtpSeconds(otpSecondsLeft(user.email, OTP_TYPE)), 1000)
    return () => clearInterval(id)
  }, [pwdStep, user?.email])

  const closePwdModal = () => {
    setShowPwdModal(false)
    setPwdStep('form')
    setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setOtpDigits(Array(OTP_LEN).fill(''))
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>My Profile</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
          Manage your own admin account details
        </p>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card-custom">
            <div className="d-flex align-items-center gap-3 mb-4">
              <ProfileAvatar
                fetchUrl="/auth/profile/picture"
                uploadUrl="/auth/profile/picture"
                hasPicture={user?.hasProfilePicture}
                name={user?.name}
                size={80}
                editable
                onUploaded={setUser}
              />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Click the camera icon to change your photo</div>
              </div>
            </div>
            <h6 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Profile Information</h6>
            <form onSubmit={handleProfileSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Full Name</label>
                  <input required className="form-control-custom w-100" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Email</label>
                  <input type="email" required className="form-control-custom w-100" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    style={form.email && !EMAIL_PATTERN.test(form.email) ? { borderColor: '#ef4444' } : undefined} />
                  {form.email && !EMAIL_PATTERN.test(form.email) && (
                    <p style={{ fontSize: '0.76rem', color: '#ef4444', margin: '0.25rem 0 0' }}>{EMAIL_ERROR}</p>
                  )}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Phone</label>
                  <input className="form-control-custom w-100" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Address</label>
                  <input className="form-control-custom w-100" value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button type="submit" disabled={savingProfile} className="btn-primary-custom" style={{ justifyContent: 'center' }}>
                  {savingProfile ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : 'Save Changes'}
                </button>
                <button type="button" className="btn-outline-custom" onClick={() => setShowPwdModal(true)}>
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPwdModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }} onClick={closePwdModal}>
          <div className="card-custom fade-in" style={{ maxWidth: 420, width: '100%', margin: 0 }} onClick={e => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Change Password</h6>
              <button className="icon-btn" onClick={closePwdModal}><i className="bi bi-x-lg"></i></button>
            </div>

            {pwdStep === 'form' ? (
              <form onSubmit={handleRequestOtp}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  We'll send a verification code to <strong>{user?.email}</strong> before the password is changed.
                </p>
                <div className="mb-3">
                  <label className="form-label-custom">Current Password</label>
                  <input type="password" required className="form-control-custom w-100" value={pwd.currentPassword}
                    onChange={e => setPwd(p => ({ ...p, currentPassword: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label-custom">New Password</label>
                  <input type="password" required minLength={8} className="form-control-custom w-100" value={pwd.newPassword}
                    onChange={e => setPwd(p => ({ ...p, newPassword: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label-custom">Confirm New Password</label>
                  <input type="password" required minLength={8} className="form-control-custom w-100" value={pwd.confirmPassword}
                    onChange={e => setPwd(p => ({ ...p, confirmPassword: e.target.value }))} />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" disabled={sendingOtp} className="btn-primary-custom" style={{ justifyContent: 'center' }}>
                    {sendingOtp ? <><span className="spinner-border spinner-border-sm me-2"></span>Sending code...</> : 'Send Verification Code'}
                  </button>
                  <button type="button" className="btn-outline-custom" onClick={closePwdModal}>Cancel</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Enter the 6-digit code sent to
                </p>
                <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', wordBreak: 'break-all' }}>
                  {user?.email}
                </p>

                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  {otpDigits.map((d, i) => (
                    <input key={i} ref={el => otpInputs.current[i] = el}
                      type="text" inputMode="numeric" maxLength={1} value={d}
                      onChange={e => handleOtpDigitChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      onFocus={e => e.target.select()}
                      style={{
                        width: 42, height: 48, textAlign: 'center',
                        fontSize: '1.2rem', fontWeight: 700,
                        border: `2px solid ${d ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 10, background: 'var(--bg-primary)',
                        color: 'var(--text-primary)', outline: 'none',
                      }} />
                  ))}
                </div>

                {otpSeconds > 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    <i className="bi bi-clock me-1"></i>
                    Code expires in <strong style={{ color: otpSeconds < 60 ? '#ef4444' : 'var(--text-primary)' }}>
                      {String(Math.floor(otpSeconds / 60)).padStart(2, '0')}:{String(otpSeconds % 60).padStart(2, '0')}
                    </strong>
                  </p>
                ) : (
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <button type="button" onClick={handleResendOtp} disabled={resendingOtp} style={{
                      background: 'none', border: 'none', color: 'var(--primary)',
                      fontWeight: 600, cursor: 'pointer', fontSize: '0.86rem', padding: 0,
                    }}>
                      {resendingOtp ? <><span className="spinner-border spinner-border-sm me-1"></span>Resending...</> :
                        <><i className="bi bi-arrow-repeat me-1"></i>Resend Code</>}
                    </button>
                  </div>
                )}

                <div className="d-flex gap-2">
                  <button type="submit" disabled={savingPwd} className="btn-primary-custom" style={{ justifyContent: 'center' }}>
                    {savingPwd ? <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</> : 'Verify & Update Password'}
                  </button>
                  <button type="button" className="btn-outline-custom" onClick={() => setPwdStep('form')}>Back</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
