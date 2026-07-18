import React, { useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import ProfileAvatar from '../../components/ProfileAvatar'
import {
  EMAIL_MAX_LENGTH, EMAIL_ERROR, isEmailValid,
  PHONE_PATTERN, PHONE_ERROR,
} from '../../utils/validation'

function handlePhoneChange(val, setter) {
  if (!val) { setter(''); return }
  if (!val.startsWith('+95')) { setter('+95'); return }
  setter(val)
}

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
  const [savingProfile, setSavingProfile] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)

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
    setEmailTouched(true)
    if (!isEmailValid(form.email)) { toast.error(EMAIL_ERROR.en); return }
    const phoneVal = form.phone === '+95' ? '' : form.phone
    if (phoneVal && !PHONE_PATTERN.test(phoneVal)) { toast.error(PHONE_ERROR); return }
    setSavingProfile(true)
    try {
      if (pendingPhotoFile) {
        const formData = new FormData()
        formData.append('file', pendingPhotoFile)
        await api.post('/auth/profile/picture', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      const { data } = await api.put('/auth/profile', {
        name: form.name, email: form.email, phone: phoneVal, address: form.address,
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
    setEmailTouched(false)
    clearPendingPhoto()
    setEditMode(false)
  }

  const emailInvalid = emailTouched && form.email && !isEmailValid(form.email)
  const phoneInvalid = form.phone && form.phone !== '+95' && !PHONE_PATTERN.test(form.phone)

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
                    maxLength={EMAIL_MAX_LENGTH}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    onBlur={() => setEmailTouched(true)}
                    onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
                    style={{
                      ...(emailInvalid ? { borderColor: '#ef4444' } : undefined),
                      ...(!editMode ? { opacity: 0.6, cursor: 'not-allowed' } : undefined),
                    }}
                  />
                  {emailInvalid && (
                    <p style={{ fontSize: '0.76rem', color: '#ef4444', margin: '0.25rem 0 0' }}>{EMAIL_ERROR.en}</p>
                  )}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Phone</label>
                  <input
                    disabled={!editMode}
                    className="form-control-custom w-100"
                    value={form.phone}
                    onChange={e => handlePhoneChange(e.target.value, v => setForm(f => ({ ...f, phone: v })))}
                    onFocus={() => { if (!form.phone) setForm(f => ({ ...f, phone: '+95' })) }}
                    onBlur={() => { if (form.phone === '+95') setForm(f => ({ ...f, phone: '' })) }}
                    placeholder="+959xxxxxxxx"
                    onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
                    style={{
                      ...(editMode && phoneInvalid ? { borderColor: '#ef4444' } : undefined),
                      ...(!editMode ? { opacity: 0.6, cursor: 'not-allowed' } : undefined),
                    }}
                  />
                  {editMode && phoneInvalid && (
                    <p style={{ fontSize: '0.76rem', color: '#ef4444', margin: '0.25rem 0 0' }}>{PHONE_ERROR}</p>
                  )}
                  {editMode && (
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                      e.g. +9591234567 (8–10 digits after +95, starting with 9)
                    </p>
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
                  </React.Fragment>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

    </div>
  )
}
