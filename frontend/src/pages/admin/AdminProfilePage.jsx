import React, { useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'

const EMAIL_PATTERN = /^[a-z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const EMAIL_ERROR = 'Email must start with a lowercase letter — it cannot begin with a capital letter or a number'

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
          Manage your own admin account details
        </p>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <div className="card-custom">
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
