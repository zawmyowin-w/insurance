import React, { useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import ProfileAvatar from '../../components/ProfileAvatar'

const EMAIL_PATTERN = /^[a-z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const EMAIL_ERROR = 'Email must start with a lowercase letter — it cannot begin with a capital letter or a number'
const PHONE_PATTERN = /^\+95\d{7,10}$/
const PHONE_ERROR = 'Phone must start with +95 followed by 7–10 digits (e.g. +959xxxxxxx)'

export default function AdminProfilePage() {
  const { user, setUser } = useAuth()
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  })
  const [pendingPhotoFile, setPendingPhotoFile] = useState(null)
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState(null)
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [showPwdModal, setShowPwdModal] = useState(false)

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
    if (!EMAIL_PATTERN.test(form.email)) { toast.error(EMAIL_ERROR); return }
    if (form.phone && !PHONE_PATTERN.test(form.phone)) { toast.error(PHONE_ERROR); return }
    setSavingProfile(true)
    try {
      if (pendingPhotoFile) {
        const formData = new FormData()
        formData.append('file', pendingPhotoFile)
        await api.post('/auth/profile/picture', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      const { data } = await api.put('/auth/profile', {
        name: form.name, email: form.email, phone: form.phone, address: form.address,
      })
      setUser(data)
      clearPendingPhoto()
      toast.success('Profile updated')
      setEditMode(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally { setSavingProfile(false) }
  }

  const handleCancelEdit = () => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
    })
    clearPendingPhoto()
    setEditMode(false)
  }

  const handlePasswordSubmit = async e => {
    e.preventDefault()
    if (pwd.newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return }
    if (pwd.newPassword !== pwd.confirmPassword) { toast.error('New passwords do not match'); return }
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

  const closePwdModal = () => {
    setShowPwdModal(false)
    setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' })
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
                  <input
                    disabled={!editMode}
                    className="form-control-custom w-100"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
                    style={!editMode ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Email</label>
                  <input
                    type="email"
                    disabled={!editMode}
                    className="form-control-custom w-100"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
                    style={{
                      ...(editMode && form.email && !EMAIL_PATTERN.test(form.email) ? { borderColor: '#ef4444' } : undefined),
                      ...(!editMode ? { opacity: 0.6, cursor: 'not-allowed' } : undefined),
                    }}
                  />
                  {editMode && form.email && !EMAIL_PATTERN.test(form.email) && (
                    <p style={{ fontSize: '0.76rem', color: '#ef4444', margin: '0.25rem 0 0' }}>{EMAIL_ERROR}</p>
                  )}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Phone</label>
                  <input
                    disabled={!editMode}
                    className="form-control-custom w-100"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+95xxxxxxxx"
                    onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
                    style={{
                      ...(editMode && form.phone && !PHONE_PATTERN.test(form.phone) ? { borderColor: '#ef4444' } : undefined),
                      ...(!editMode ? { opacity: 0.6, cursor: 'not-allowed' } : undefined),
                    }}
                  />
                  {editMode && form.phone && !PHONE_PATTERN.test(form.phone) && (
                    <p style={{ fontSize: '0.76rem', color: '#ef4444', margin: '0.25rem 0 0' }}>{PHONE_ERROR}</p>
                  )}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Address</label>
                  <input
                    disabled={!editMode}
                    className="form-control-custom w-100"
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Your address"
                    onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
                    style={!editMode ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                  />
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
          <div className="card-custom fade-in" style={{ maxWidth: 420, width: '100%', margin: 0 }} onClick={e => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Change Password</h6>
              <button className="icon-btn" onClick={closePwdModal}><i className="bi bi-x-lg"></i></button>
            </div>

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
              <div className="d-flex gap-2">
                <button type="submit" disabled={savingPwd} className="btn-primary-custom" style={{ justifyContent: 'center' }}>
                  {savingPwd ? <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</> : 'Update Password'}
                </button>
                <button type="button" className="btn-outline-custom" onClick={closePwdModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
