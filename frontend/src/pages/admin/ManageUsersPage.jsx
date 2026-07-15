import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import ProfileAvatar from '../../components/ProfileAvatar'

const EMPTY_AGENT = { name: '', email: '', phone: '', address: '', password: '', insuranceType: 'LIFE' }
const EMPTY_EDIT = { name: '', email: '', phone: '', address: '', insuranceType: 'LIFE', newPassword: '' }
const EMAIL_PATTERN = /^[a-z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const EMAIL_ERROR = 'Email must start with a lowercase letter — it cannot begin with a capital letter or a number'

export default function ManageUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [showAgentForm, setShowAgentForm] = useState(false)
  const [agentForm, setAgentForm] = useState(EMPTY_AGENT)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_EDIT)
  const [editSaving, setEditSaving] = useState(false)

  const fetchUsers = () => {
    api.get('/admin/users').then(res => setUsers(Array.isArray(res.data) ? res.data : [])).catch(() => setUsers([])).finally(() => setLoading(false))
  }
  useEffect(() => { fetchUsers() }, [])

  const filteredUsers = users.filter(u => {
    const matchRole = filter === 'ALL' || u.role === filter
    const matchSearch = search === '' || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  const handleCreateAgent = async e => {
    e.preventDefault()
    if (!EMAIL_PATTERN.test(agentForm.email)) { toast.error(EMAIL_ERROR); return }
    setSaving(true)
    try {
      await api.post('/admin/users/agents', { ...agentForm, role: 'AGENT' })
      toast.success('Agent account created')
      setShowAgentForm(false); setAgentForm(EMPTY_AGENT); fetchUsers()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create agent') } finally { setSaving(false) }
  }

  const handleToggle = async (id, active) => {
    try {
      await api.put(`/admin/users/${id}/toggle`, { active: !active })
      toast.success(active ? 'User deactivated' : 'User activated')
      fetchUsers()
    } catch { toast.error('Failed') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return
    try { await api.delete(`/admin/users/${id}`); toast.success('User deleted'); fetchUsers() } catch { toast.error('Failed to delete') }
  }

  const openEdit = (u) => {
    setEditingUser(u)
    setEditForm({
      name: u.name || '', email: u.email || '', phone: u.phone || '',
      address: u.address || '', insuranceType: u.insuranceType || 'LIFE', newPassword: '',
    })
  }

  const closeEdit = () => { setEditingUser(null); setEditForm(EMPTY_EDIT) }

  const handleEditSubmit = async e => {
    e.preventDefault()
    if (!EMAIL_PATTERN.test(editForm.email)) { toast.error(EMAIL_ERROR); return }
    setEditSaving(true)
    try {
      const payload = { name: editForm.name, email: editForm.email, phone: editForm.phone, address: editForm.address }
      if (editingUser.role === 'AGENT') payload.insuranceType = editForm.insuranceType
      if (editForm.newPassword) payload.newPassword = editForm.newPassword
      await api.put(`/admin/users/${editingUser.id}`, payload)
      toast.success('Profile updated')
      closeEdit(); fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally { setEditSaving(false) }
  }

  const roleColor = (role) => ({ ADMIN: '#9333ea', AGENT: '#1d4ed8', CUSTOMER: '#16a34a' }[role] || '#6b7280')
  const roleBg = (role) => ({ ADMIN: '#faf5ff', AGENT: '#eff6ff', CUSTOMER: '#f0fdf4' }[role] || '#f3f4f6')

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Manage Users</h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Manage customers, agents, and admins</p>
        </div>
        <button className="btn-primary-custom" style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}
          onClick={() => setShowAgentForm(!showAgentForm)}>
          <i className={`bi bi-${showAgentForm ? 'x-lg' : 'person-plus'} me-1`}></i>{showAgentForm ? 'Cancel' : 'Create Agent'}
        </button>
      </div>

      {/* Create Agent Form */}
      {showAgentForm && (
        <div className="card-custom mb-4 fade-in">
          <h6 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Create Agent Account</h6>
          <form onSubmit={handleCreateAgent}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Full Name *</label>
                <input required className="form-control-custom w-100" value={agentForm.name}
                  onChange={e => setAgentForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Email *</label>
                <input type="email" required className="form-control-custom w-100" value={agentForm.email}
                  onChange={e => setAgentForm(f => ({ ...f, email: e.target.value }))}
                  style={agentForm.email && !EMAIL_PATTERN.test(agentForm.email) ? { borderColor: '#ef4444' } : undefined} />
                {agentForm.email && !EMAIL_PATTERN.test(agentForm.email) && (
                  <p style={{ fontSize: '0.76rem', color: '#ef4444', margin: '0.25rem 0 0' }}>{EMAIL_ERROR}</p>
                )}
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label-custom">Phone</label>
                <input className="form-control-custom w-100" value={agentForm.phone}
                  onChange={e => setAgentForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label-custom">Insurance Type</label>
                <select className="form-select-custom w-100" value={agentForm.insuranceType}
                  onChange={e => setAgentForm(f => ({ ...f, insuranceType: e.target.value }))}>
                  {['LIFE', 'HEALTH', 'VEHICLE', 'PROPERTY', 'ALL'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label-custom">Temporary Password *</label>
                <input type="password" required minLength={8} className="form-control-custom w-100" value={agentForm.password}
                  onChange={e => setAgentForm(f => ({ ...f, password: e.target.value }))} />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button type="submit" disabled={saving} className="btn-primary-custom" style={{ justifyContent: 'center' }}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating...</> : 'Create Agent'}
              </button>
              <button type="button" className="btn-outline-custom" onClick={() => setShowAgentForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="d-flex gap-3 mb-3 flex-wrap align-items-center">
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}></i>
          <input className="form-control-custom w-100" style={{ paddingLeft: '2.2rem' }} placeholder="Search name or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="d-flex gap-2">
          {['ALL', 'CUSTOMER', 'AGENT', 'ADMIN'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '0.4rem 0.85rem', borderRadius: 20, border: '1px solid',
              borderColor: filter === f ? 'var(--primary)' : 'var(--border)',
              background: filter === f ? 'var(--primary)' : 'var(--bg-card)',
              color: filter === f ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.82rem', cursor: 'pointer'
            }}>{f}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : (
        <div className="card-custom p-0">
          <div className="table-custom">
            <table className="w-100">
              <thead>
                <tr>{['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No users found</td></tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: roleColor(u.role), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{u.email}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{u.phone || '—'}</td>
                    <td><span style={{ fontSize: '0.75rem', fontWeight: 700, color: roleColor(u.role), background: roleBg(u.role), padding: '0.2rem 0.6rem', borderRadius: 20 }}>{u.role}</span></td>
                    <td><span className={`badge-status ${u.active ? 'badge-active' : 'badge-cancelled'}`}>{u.active ? 'Active' : 'Inactive'}</span></td>
                    <td style={{ fontSize: '0.85rem' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="d-flex gap-1">
                        {u.role === 'AGENT' && (
                          <button className="btn-outline-custom" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }} onClick={() => openEdit(u)}>
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}
                        {u.role !== 'ADMIN' && (
                          <>
                            <button className="btn-outline-custom" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }} onClick={() => handleToggle(u.id, u.active)}>
                              {u.active ? 'Disable' : 'Enable'}
                            </button>
                            <button className="btn-danger-sm" style={{ padding: '0.3rem 0.6rem' }} onClick={() => handleDelete(u.id)}><i className="bi bi-trash"></i></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Agent Profile Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }} onClick={closeEdit}>
          <div className="card-custom fade-in" style={{ maxWidth: 480, width: '100%', margin: 0 }} onClick={e => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Edit Agent Profile</h6>
              <button className="icon-btn" onClick={closeEdit}><i className="bi bi-x-lg"></i></button>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Only an admin can update an agent's profile. Leave the password blank to keep it unchanged.
            </p>
            <div className="d-flex align-items-center gap-3 mb-3">
              <ProfileAvatar
                fetchUrl={`/admin/users/${editingUser.id}/picture`}
                uploadUrl={`/admin/users/${editingUser.id}/picture`}
                hasPicture={editingUser.hasProfilePicture}
                name={editingUser.name}
                size={72}
                editable
                onUploaded={(updated) => { setEditingUser(updated); fetchUsers() }}
              />
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Click the camera icon to set this agent's photo</div>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Full Name *</label>
                  <input required className="form-control-custom w-100" value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Email *</label>
                  <input type="email" required className="form-control-custom w-100" value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    style={editForm.email && !EMAIL_PATTERN.test(editForm.email) ? { borderColor: '#ef4444' } : undefined} />
                  {editForm.email && !EMAIL_PATTERN.test(editForm.email) && (
                    <p style={{ fontSize: '0.76rem', color: '#ef4444', margin: '0.25rem 0 0' }}>{EMAIL_ERROR}</p>
                  )}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Phone</label>
                  <input className="form-control-custom w-100" value={editForm.phone}
                    onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Insurance Type</label>
                  <select className="form-select-custom w-100" value={editForm.insuranceType}
                    onChange={e => setEditForm(f => ({ ...f, insuranceType: e.target.value }))}>
                    {['LIFE', 'HEALTH', 'VEHICLE', 'PROPERTY', 'ALL'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label-custom">Address</label>
                  <input className="form-control-custom w-100" value={editForm.address}
                    onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label-custom">Reset Password (optional)</label>
                  <input type="password" minLength={8} className="form-control-custom w-100" value={editForm.newPassword}
                    placeholder="Leave blank to keep current password"
                    onChange={e => setEditForm(f => ({ ...f, newPassword: e.target.value }))} />
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button type="submit" disabled={editSaving} className="btn-primary-custom" style={{ justifyContent: 'center' }}>
                  {editSaving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : 'Save Changes'}
                </button>
                <button type="button" className="btn-outline-custom" onClick={closeEdit}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
