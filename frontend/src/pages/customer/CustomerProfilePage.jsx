import React, { useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import ProfileAvatar from '../../components/ProfileAvatar'

export default function CustomerProfilePage() {
  const { user, setUser } = useAuth()
  const [address, setAddress] = useState(user?.address || '')
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)

  const handleProfileSubmit = async e => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const { data } = await api.put('/auth/profile', { address })
      setUser(data)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally { setSavingProfile(false) }
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
        <div className="col-12 col-lg-7">
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
            <h6 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Profile Information</h6>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              <i className="bi bi-lock-fill me-1"></i>
              Name, phone, and email are your core account details — contact an admin if these need to change.
            </p>
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
                  <input disabled className="form-control-custom w-100" value={user?.phone || ''} style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Address</label>
                  <input className="form-control-custom w-100" value={address}
                    onChange={e => setAddress(e.target.value)} placeholder="Your address" />
                </div>
              </div>
              <div className="mt-3">
                <button type="submit" disabled={savingProfile} className="btn-primary-custom" style={{ justifyContent: 'center' }}>
                  {savingProfile ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card-custom">
            <h6 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Change Password</h6>
            <form onSubmit={handlePasswordSubmit}>
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
              <button type="submit" disabled={savingPwd} className="btn-primary-custom" style={{ justifyContent: 'center' }}>
                {savingPwd ? <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</> : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
