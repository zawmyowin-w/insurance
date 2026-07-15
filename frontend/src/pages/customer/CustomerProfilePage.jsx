import React, { useEffect, useRef, useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import ProfileAvatar from '../../components/ProfileAvatar'
import { issueOtp, verifyOtp, otpSecondsLeft } from '../../services/otpService'

const OTP_TYPE = 'profile-change'
const OTP_BOX_COUNT = 6
const PHONE_PATTERN = /^(\+95[\s-]?)?\d{7,10}$/
const PHONE_ERROR = 'Phone must be 7–10 digits, optionally starting with +95'

export default function CustomerProfilePage() {
  const { user, setUser } = useAuth()
  const [editMode, setEditMode] = useState(false)
  const [address, setAddress] = useState(user?.address || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [pendingPhotoFile, setPendingPhotoFile] = useState(null)
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState(null)
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)

  // ── Change Password modal ──
  const [showPwdModal, setShowPwdModal] = useState(false)

  // ── "Forgot password" style change — verify via emailed code instead of current password ──
  const [useOtpMode, setUseOtpMode] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpDigits, setOtpDigits] = useState(Array(OTP_BOX_COUNT).fill(''))
  const [otpPwd, setOtpPwd] = useState({ newPassword: '', confirmPassword: '' })
  const [savingOtpPwd, setSavingOtpPwd] = useState(false)
  const [otpSeconds, setOtpSeconds] = useState(0)
  const otpInputs = useRef([])

  useEffect(() => {
    if (!otpSent) return
    const id = setInterval(() => setOtpSeconds(otpSecondsLeft(user?.email, OTP_TYPE)), 1000)
    return () => clearInterval(id)
  }, [otpSent, user?.email])

  const resetOtpFlow = () => {
    setUseOtpMode(false)
    setOtpSent(false)
    setOtpDigits(Array(OTP_BOX_COUNT).fill(''))
    setOtpPwd({ newPassword: '', confirmPassword: '' })
  }

  const closePwdModal = () => {
    setShowPwdModal(false)
    setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' })
    resetOtpFlow()
  }

  const handleSendOtp = async () => {
    setSendingOtp(true)
    try {
      const code = await issueOtp(user.email, OTP_TYPE)
      setOtpSent(true)
      setOtpSeconds(otpSecondsLeft(user.email, OTP_TYPE))
      if (!import.meta.env.VITE_EMAILJS_SERVICE_ID) {
        toast.info(`Demo code: ${code}`, { autoClose: 15000 })
      } else {
        toast.success('Verification code sent to your email')
      }
    } catch {
      toast.error('Failed to send verification code')
    } finally { setSendingOtp(false) }
  }

  const handleOtpDigitChange = (i, val) => {
    const ch = val.replace(/\D/g, '').slice(-1)
    const next = [...otpDigits]; next[i] = ch; setOtpDigits(next)
    if (ch && i < OTP_BOX_COUNT - 1) otpInputs.current[i + 1]?.focus()
  }

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
      const n = [...otpDigits]; n[i - 1] = ''; setOtpDigits(n); otpInputs.current[i - 1]?.focus()
    }
  }

  const handleOtpPwdSubmit = async e => {
    e.preventDefault()
    const code = otpDigits.join('')
    if (code.length < OTP_BOX_COUNT) { toast.error('Enter the full 6-digit code'); return }
    if (otpPwd.newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return }
    if (otpPwd.newPassword !== otpPwd.confirmPassword) { toast.error('New passwords do not match'); return }

    const result = verifyOtp(user.email, OTP_TYPE, code)
    if (!result.ok) {
      toast.error(result.reason === 'expired' ? 'Code expired — request a new one' : 'Incorrect code')
      setOtpDigits(Array(OTP_BOX_COUNT).fill(''))
      otpInputs.current[0]?.focus()
      return
    }

    setSavingOtpPwd(true)
    try {
      const { data } = await api.put('/auth/profile/password-otp', { newPassword: otpPwd.newPassword })
      setUser(data)
      toast.success('Password changed successfully')
      resetOtpFlow()
      setShowPwdModal(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally { setSavingOtpPwd(false) }
  }

  const handleResendOtp = async () => {
    setSendingOtp(true)
    try {
      const code = await issueOtp(user.email, OTP_TYPE)
      setOtpSeconds(otpSecondsLeft(user.email, OTP_TYPE))
      setOtpDigits(Array(OTP_BOX_COUNT).fill(''))
      otpInputs.current[0]?.focus()
      if (!import.meta.env.VITE_EMAILJS_SERVICE_ID) {
        toast.info(`Demo code: ${code}`, { autoClose: 15000 })
      } else {
        toast.success('Code resent')
      }
    } catch { toast.error('Failed to resend code') }
    finally { setSendingOtp(false) }
  }

  const otpMM = String(Math.floor(otpSeconds / 60)).padStart(2, '0')
  const otpSS = String(otpSeconds % 60).padStart(2, '0')

  const handlePhotoSelected = file => {
    setPendingPhotoFile(file)
    setPendingPhotoPreview(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  const clearPendingPhoto = () => {
    setPendingPhotoPreview(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setPendingPhotoFile(null)
  }

  const handleProfileSubmit = async e => {
    e.preventDefault()
    if (phone && !PHONE_PATTERN.test(phone)) { toast.error(PHONE_ERROR); return }
    setSavingProfile(true)
    try {
      if (pendingPhotoFile) {
        const formData = new FormData()
        formData.append('file', pendingPhotoFile)
        await api.post('/auth/profile/picture', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      const { data } = await api.put('/auth/profile', { address, phone })
      setUser(data)
      clearPendingPhoto()
      toast.success('Update successful')
      setEditMode(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally { setSavingProfile(false) }
  }

  const handleCancelEdit = () => {
    setAddress(user?.address || '')
    setPhone(user?.phone || '')
    clearPendingPhoto()
    setEditMode(false)
  }

  const handlePasswordSubmit = async e => {
    e.preventDefault()
    if (pwd.newPassword !== pwd.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    setSavingPwd(true)
    try {
      const { data } = await api.put('/auth/profile', {
        currentPassword: pwd.currentPassword, newPassword: pwd.newPassword,
      })
      setUser(data)
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password changed successfully')
      setShowPwdModal(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally { setSavingPwd(false) }
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>My Profile</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
          View your account details and update what's yours to change
        </p>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card-custom">
            <div className="d-flex align-items-center gap-3 mb-4">
              <ProfileAvatar
                fetchUrl="/auth/profile/picture"
                hasPicture={user?.hasProfilePicture}
                name={user?.name}
                size={80}
                editable={editMode}
                deferUpload
                onFileSelected={handlePhotoSelected}
                previewOverrideUrl={pendingPhotoPreview}
              />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {editMode ? 'Click the camera icon to change your photo' : 'Your account photo'}
                </div>
              </div>
            </div>
            <h6 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              {editMode ? 'Edit Profile Information' : 'Profile Information'}
            </h6>
            <form onSubmit={handleProfileSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Full Name</label>
                  <input disabled className="form-control-custom w-100" value={user?.name || ''} style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Email</label>
                  <input disabled className="form-control-custom w-100" value={user?.email || ''} style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Phone</label>
                  <input disabled={!editMode} className="form-control-custom w-100" value={phone}
                    onChange={e => setPhone(e.target.value)} placeholder="+95xxxxxxxx"
                    onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
                    style={{
                      ...(phone && !PHONE_PATTERN.test(phone) ? { borderColor: '#ef4444' } : undefined),
                      ...(!editMode ? { opacity: 0.6, cursor: 'not-allowed' } : undefined),
                    }} />
                  {editMode && phone && !PHONE_PATTERN.test(phone) && (
                    <p style={{ fontSize: '0.76rem', color: '#ef4444', margin: '0.25rem 0 0' }}>{PHONE_ERROR}</p>
                  )}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Address</label>
                  <input disabled={!editMode} className="form-control-custom w-100" value={address}
                    onChange={e => setAddress(e.target.value)} placeholder="Your address"
                    onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
                    style={!editMode ? { opacity: 0.6, cursor: 'not-allowed' } : undefined} />
                </div>
              </div>
              <div className="mt-3 d-flex gap-2">
                {editMode ? (
                  <React.Fragment key="edit-actions">
                    <button type="submit" disabled={savingProfile} className="btn-primary-custom" style={{ justifyContent: 'center' }}>
                      {savingProfile ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : 'Save Changes'}
                    </button>
                    <button type="button" onClick={handleCancelEdit} className="btn-outline-custom" style={{ justifyContent: 'center' }}>
                      Cancel
                    </button>
                  </React.Fragment>
                ) : (
                  <React.Fragment key="view-actions">
                    <button type="button" onClick={() => setEditMode(true)} className="btn-primary-custom" style={{ justifyContent: 'center' }}>
                      <i className="bi bi-pencil me-2"></i>Update
                    </button>
                    <button type="button" onClick={() => setShowPwdModal(true)} className="btn-outline-custom" style={{ justifyContent: 'center' }}>
                      <i className="bi bi-key me-2"></i>Change Password
                    </button>
                  </React.Fragment>
                )}
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
          <div className="card-custom fade-in" style={{ maxWidth: 440, width: '100%', margin: 0 }} onClick={e => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between mb-1">
              <h6 style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Change Password</h6>
              <button className="icon-btn" onClick={closePwdModal}><i className="bi bi-x-lg"></i></button>
            </div>

            <div className="mb-3">
              {!useOtpMode ? (
                <button type="button" onClick={() => setUseOtpMode(true)} style={{
                  background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600,
                  fontSize: '0.8rem', cursor: 'pointer', padding: 0,
                }}>
                  <i className="bi bi-envelope-check me-1"></i>Forgot it? Use email code
                </button>
              ) : (
                <button type="button" onClick={resetOtpFlow} style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600,
                  fontSize: '0.8rem', cursor: 'pointer', padding: 0,
                }}>
                  <i className="bi bi-arrow-left me-1"></i>Use current password
                </button>
              )}
            </div>

            {!useOtpMode ? (
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label className="form-label-custom">Current Password</label>
                  <input type="password" className="form-control-custom w-100" value={pwd.currentPassword}
                    onChange={e => setPwd(p => ({ ...p, currentPassword: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label-custom">New Password</label>
                  <input type="password" minLength={8} className="form-control-custom w-100" value={pwd.newPassword}
                    onChange={e => setPwd(p => ({ ...p, newPassword: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label-custom">Confirm New Password</label>
                  <input type="password" minLength={8} className="form-control-custom w-100" value={pwd.confirmPassword}
                    onChange={e => setPwd(p => ({ ...p, confirmPassword: e.target.value }))} />
                </div>
                <button type="submit" disabled={savingPwd} className="btn-primary-custom w-100" style={{ justifyContent: 'center' }}>
                  {savingPwd ? <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</> : 'Change Password'}
                </button>
              </form>
            ) : (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  We'll email a 6-digit verification code to <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong> — enter it below to set a new password without your old one.
                </p>

                {!otpSent ? (
                  <button type="button" onClick={handleSendOtp} disabled={sendingOtp}
                    className="btn-primary-custom w-100" style={{ justifyContent: 'center' }}>
                    {sendingOtp
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Sending...</>
                      : <><i className="bi bi-send me-2"></i>Send Verification Code</>}
                  </button>
                ) : (
                  <form onSubmit={handleOtpPwdSubmit}>
                    <label className="form-label-custom mb-2">Verification Code</label>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      {otpDigits.map((d, i) => (
                        <input key={i} ref={el => otpInputs.current[i] = el}
                          type="text" inputMode="numeric" maxLength={1} value={d}
                          onChange={e => handleOtpDigitChange(i, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(i, e)}
                          onFocus={e => e.target.select()}
                          style={{
                            width: 40, height: 46, textAlign: 'center',
                            fontSize: '1.1rem', fontWeight: 700,
                            border: `2px solid ${d ? 'var(--primary)' : 'var(--border)'}`,
                            borderRadius: 8, background: 'var(--bg-primary)',
                            color: 'var(--text-primary)', outline: 'none',
                          }}
                        />
                      ))}
                    </div>

                    {otpSeconds > 0 ? (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        <i className="bi bi-clock me-1"></i>
                        Expires in <strong style={{ color: otpSeconds < 60 ? '#ef4444' : 'var(--text-primary)' }}>{otpMM}:{otpSS}</strong>
                      </p>
                    ) : (
                      <div style={{ marginBottom: '1rem' }}>
                        <button type="button" onClick={handleResendOtp} disabled={sendingOtp} style={{
                          background: 'none', border: 'none', color: 'var(--primary)',
                          fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', padding: 0,
                        }}>
                          {sendingOtp ? <><span className="spinner-border spinner-border-sm me-1"></span>Resending...</> :
                            <><i className="bi bi-arrow-repeat me-1"></i>Resend Code</>}
                        </button>
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label-custom">New Password</label>
                      <input type="password" minLength={8} className="form-control-custom w-100" value={otpPwd.newPassword}
                        onChange={e => setOtpPwd(p => ({ ...p, newPassword: e.target.value }))} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label-custom">Confirm New Password</label>
                      <input type="password" minLength={8} className="form-control-custom w-100" value={otpPwd.confirmPassword}
                        onChange={e => setOtpPwd(p => ({ ...p, confirmPassword: e.target.value }))} />
                    </div>
                    <button type="submit" disabled={savingOtpPwd} className="btn-primary-custom w-100" style={{ justifyContent: 'center' }}>
                      {savingOtpPwd ? <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</> : 'Change Password'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
