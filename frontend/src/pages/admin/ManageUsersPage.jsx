import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { toast } from 'react-toastify'
import ProfileAvatar from '../../components/ProfileAvatar'
import PasswordStrengthWidget from '../../components/PasswordStrengthWidget'
import {
  EMAIL_MAX_LENGTH, EMAIL_ERROR, isEmailValid,
  PHONE_PATTERN, PHONE_ERROR, isStrongPassword,
} from '../../utils/validation'

const EMPTY_FORM = { name: '', email: '', phone: '', address: '', password: '', insuranceType: 'LIFE' }
const EMPTY_EDIT = { name: '', email: '', phone: '', address: '', insuranceType: 'LIFE', newPassword: '' }
const PAGE_SIZE = 10

function handlePhoneChange(val, setter) {
  if (!val) { setter(''); return }
  if (!val.startsWith('+95')) { setter('+95'); return }
  setter(val)
}

export default function ManageUsersPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromDashboard = searchParams.get('action') === 'create'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(() => {
    const t = searchParams.get('tab')
    return t && ['CUSTOMER', 'AGENT'].includes(t) ? t : 'CUSTOMER'
  })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showCreatePanel, setShowCreatePanel] = useState(fromDashboard)
  const [createForm, setCreateForm] = useState(EMPTY_FORM)
  const [createPwdFocused, setCreatePwdFocused] = useState(false)
  const [showCreatePwd, setShowCreatePwd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_EDIT)
  const [editPwdFocused, setEditPwdFocused] = useState(false)
  const [showEditPwd, setShowEditPwd] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [insuranceTypes, setInsuranceTypes] = useState(['LIFE', 'HEALTH', 'VEHICLE', 'PROPERTY'])

  const fetchInsuranceTypes = () => {
    api.get('/admin/insurance-types')
      .then(res => {
        const types = Array.isArray(res.data) ? res.data.map(t => t.name) : []
        if (types.length > 0) setInsuranceTypes(types)
      })
      .catch(() => {/* keep fallback */})
  }

  const fetchUsers = () => {
    setLoading(true)
    api.get('/admin/users')
      .then(res => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetchUsers(); fetchInsuranceTypes() }, [])

  const switchTab = (tab) => {
    setActiveTab(tab); setPage(1); setSearch(''); setShowCreatePanel(false)
  }

  const tabUsers = users.filter(u => u.role === activeTab)
  const filtered = tabUsers.filter(u =>
    search === '' ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearch = (v) => { setSearch(v); setPage(1) }

  const counts = {
    CUSTOMER: users.filter(u => u.role === 'CUSTOMER').length,
    AGENT: users.filter(u => u.role === 'AGENT').length,
  }

  // Map of insuranceType -> { id, name } for active agents (for conflict warnings)
  const agentTypeMap = users
    .filter(u => u.role === 'AGENT' && u.active && u.insuranceType && u.insuranceType !== 'ALL')
    .reduce((acc, u) => ({ ...acc, [u.insuranceType]: { id: u.id, name: u.name } }), {})

  const handleCreate = async e => {
    e.preventDefault()
    if (!isEmailValid(createForm.email)) { toast.error(EMAIL_ERROR.en); return }
    const phoneVal = createForm.phone === '+95' ? '' : createForm.phone
    if (phoneVal && !PHONE_PATTERN.test(phoneVal)) { toast.error(PHONE_ERROR); return }
    if (!isStrongPassword(createForm.password)) {
      toast.error('Password must be at least 8 characters with uppercase, lowercase, number and special character')
      return
    }
    setSaving(true)
    try {
      await api.post('/admin/users/agents', { ...createForm, phone: phoneVal })
      toast.success('Agent account created')
      setShowCreatePanel(false); setCreateForm(EMPTY_FORM); fetchUsers()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create') }
    finally { setSaving(false) }
  }

  const handleToggle = async (id, active) => {
    try {
      await api.put(`/admin/users/${id}/toggle`, { active: !active })
      toast.success(active ? 'User deactivated' : 'User activated')
      fetchUsers()
    } catch { toast.error('Failed') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return
    try { await api.delete(`/admin/users/${id}`); toast.success('User deleted'); fetchUsers() }
    catch { toast.error('Failed to delete') }
  }

  const openEdit = (u) => {
    setEditingUser(u)
    setEditForm({ name: u.name || '', email: u.email || '', phone: u.phone || '', address: u.address || '', insuranceType: u.insuranceType || 'LIFE', newPassword: '' })
  }
  const closeEdit = () => { setEditingUser(null); setEditForm(EMPTY_EDIT); setEditPwdFocused(false) }

  const handleEditSubmit = async e => {
    e.preventDefault()
    if (!isEmailValid(editForm.email)) { toast.error(EMAIL_ERROR.en); return }
    const phoneVal = editForm.phone === '+95' ? '' : editForm.phone
    if (phoneVal && !PHONE_PATTERN.test(phoneVal)) { toast.error(PHONE_ERROR); return }
    if (editForm.newPassword && !isStrongPassword(editForm.newPassword)) {
      toast.error('Password must be at least 8 characters with uppercase, lowercase, number and special character')
      return
    }
    setEditSaving(true)
    try {
      const payload = { name: editForm.name, email: editForm.email, phone: phoneVal, address: editForm.address }
      if (editingUser.role === 'AGENT') payload.insuranceType = editForm.insuranceType
      if (editForm.newPassword) payload.newPassword = editForm.newPassword
      await api.put(`/admin/users/${editingUser.id}`, payload)
      toast.success('Profile updated')
      closeEdit(); fetchUsers()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setEditSaving(false) }
  }

  const tabMeta = {
    CUSTOMER: { label: 'Customers', icon: 'bi-people', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    AGENT:    { label: 'Agents',    icon: 'bi-person-badge', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  }

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Manage Users</h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Manage customers and agents</p>
        </div>
        {activeTab === 'AGENT' && !showCreatePanel && (
          <button className="btn-primary-custom" style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}
            onClick={() => setShowCreatePanel(true)}>
            <i className="bi bi-person-plus me-1"></i>
            Create Agent
          </button>
        )}
      </div>

      {/* Tab navigation */}
      <div className="d-flex gap-2 mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
        {(['CUSTOMER', 'AGENT']).map(tab => {
          const m = tabMeta[tab]
          const active = activeTab === tab
          return (
            <button key={tab} onClick={() => switchTab(tab)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0.5rem 1.25rem', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700,
              fontSize: '0.88rem', transition: 'all .15s',
              background: active ? m.bg : 'var(--bg-secondary)',
              color: active ? m.color : 'var(--text-muted)',
              boxShadow: active ? `0 0 0 1.5px ${m.border}` : 'none',
            }}>
              <i className={`bi ${m.icon}`}></i>
              {m.label}
              <span style={{
                background: active ? m.color : 'var(--border)', color: active ? '#fff' : 'var(--text-muted)',
                borderRadius: 20, padding: '0 7px', fontSize: '0.73rem', fontWeight: 700
              }}>{counts[tab]}</span>
            </button>
          )
        })}
      </div>

      {/* Create panel — only for AGENT tab */}
      {showCreatePanel && activeTab === 'AGENT' && (
        <div className="card-custom mb-4 fade-in" style={{ borderLeft: `3px solid ${tabMeta[activeTab].color}` }}>
          <h6 style={{ fontWeight: 700, marginBottom: '1.25rem', color: tabMeta[activeTab].color }}>
            <i className={`bi ${tabMeta[activeTab].icon} me-2`}></i>
            Create Agent Account
          </h6>
          <form onSubmit={handleCreate}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Full Name *</label>
                <input required className="form-control-custom w-100" value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Email *</label>
                <input type="email" required className="form-control-custom w-100" value={createForm.email}
                  maxLength={EMAIL_MAX_LENGTH}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  style={createForm.email && !isEmailValid(createForm.email) ? { borderColor: '#ef4444' } : undefined} />
                {createForm.email && !isEmailValid(createForm.email) && (
                  <p style={{ fontSize: '0.76rem', color: '#ef4444', margin: '0.25rem 0 0' }}>{EMAIL_ERROR.en}</p>
                )}
              </div>
              <div className={activeTab === 'AGENT' ? 'col-12 col-md-4' : 'col-12 col-md-6'}>
                <label className="form-label-custom">Phone</label>
                <input className="form-control-custom w-100" placeholder="+959xxxxxxxx" value={createForm.phone}
                  onChange={e => handlePhoneChange(e.target.value, v => setCreateForm(f => ({ ...f, phone: v })))}
                  onFocus={() => { if (!createForm.phone) setCreateForm(f => ({ ...f, phone: '+95' })) }}
                  onBlur={() => { if (createForm.phone === '+95') setCreateForm(f => ({ ...f, phone: '' })) }}
                  style={createForm.phone && createForm.phone !== '+95' && !PHONE_PATTERN.test(createForm.phone) ? { borderColor: '#ef4444' } : undefined} />
                {createForm.phone && createForm.phone !== '+95' && !PHONE_PATTERN.test(createForm.phone) && (
                  <p style={{ fontSize: '0.76rem', color: '#ef4444', margin: '0.25rem 0 0' }}>{PHONE_ERROR}</p>
                )}
              </div>
              {activeTab === 'AGENT' && (
                <div className="col-12 col-md-4">
                  <label className="form-label-custom">Insurance Type</label>
                  <select className="form-select-custom w-100" value={createForm.insuranceType}
                    onChange={e => setCreateForm(f => ({ ...f, insuranceType: e.target.value }))}>
                    {[...insuranceTypes, 'ALL'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {createForm.insuranceType !== 'ALL' && agentTypeMap[createForm.insuranceType] && (
                    <p style={{ fontSize: '0.76rem', color: '#d97706', margin: '0.25rem 0 0' }}>
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      <strong>{agentTypeMap[createForm.insuranceType].name}</strong> သည် ဤ type ကို ယူထားသည်။ သိမ်းမည်ဆိုလျှင် ပိတ်ပင်မည်။
                    </p>
                  )}
                </div>
              )}
              <div className={activeTab === 'AGENT' ? 'col-12 col-md-4' : 'col-12 col-md-6'}>
                <label className="form-label-custom">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input type={showCreatePwd ? 'text' : 'password'} required className="form-control-custom w-100"
                    value={createForm.password} style={{ paddingRight: '2.5rem' }}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    onFocus={() => setCreatePwdFocused(true)} onBlur={() => setCreatePwdFocused(false)} />
                  <button type="button" onClick={() => setShowCreatePwd(v => !v)}
                    style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1 }}>
                    <i className={`bi bi-eye${showCreatePwd ? '-slash' : ''}`}></i>
                  </button>
                </div>
                {(createPwdFocused || createForm.password.length > 0) && (
                  <PasswordStrengthWidget password={createForm.password} compact />
                )}
              </div>
              <div className="col-12">
                <label className="form-label-custom">Address</label>
                <input className="form-control-custom w-100" value={createForm.address}
                  onChange={e => setCreateForm(f => ({ ...f, address: e.target.value }))} />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button type="submit" disabled={saving} className="btn-primary-custom" style={{ justifyContent: 'center' }}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating…</> : `Create ${activeTab === 'AGENT' ? 'Agent' : 'Admin'}`}
              </button>
              <button type="button" className="btn-outline-custom" onClick={() => setShowCreatePanel(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search bar */}
      <div className="mb-3" style={{ position: 'relative', maxWidth: 380 }}>
        <i className="bi bi-search" style={{
          position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', fontSize: '0.85rem', pointerEvents: 'none'
        }}></i>
        <input className="form-control-custom w-100" style={{ paddingLeft: '2.2rem' }}
          placeholder={`Search ${tabMeta[activeTab].label.toLowerCase()} by name or email…`}
          value={search} onChange={e => handleSearch(e.target.value)} />
      </div>

      {/* User list */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
      ) : (
        <>
          <div className="card-custom p-0">
            <div className="table-custom">
              <table className="w-100">
                <thead>
                  <tr>
                    {['Name', 'Email', 'Phone', 'Address',
                      ...(activeTab === 'AGENT' ? ['Type'] : []),
                      'Status', 'Joined', 'Actions'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      {search ? `No ${tabMeta[activeTab].label.toLowerCase()} matching "${search}"` : `No ${tabMeta[activeTab].label.toLowerCase()} yet`}
                    </td></tr>
                  ) : paginated.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: tabMeta[u.role]?.color || '#6b7280',
                            color: '#fff', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0
                          }}>
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.email}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.phone || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={u.address || ''}>{u.address || '—'}</td>
                      {activeTab === 'AGENT' && (
                        <td><span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.55rem', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8' }}>{u.insuranceType || '—'}</span></td>
                      )}
                      <td>
                        <span className={`badge-status ${u.active ? 'badge-active' : 'badge-cancelled'}`}>
                          {u.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button title="Edit" className="btn-outline-custom"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                            onClick={() => openEdit(u)}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <>
                            <button className="btn-outline-custom" style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                              onClick={() => handleToggle(u.id, u.active)}>
                              {u.active ? 'Disable' : 'Enable'}
                            </button>
                            <button className="btn-danger-sm" style={{ padding: '0.3rem 0.6rem' }}
                              onClick={() => handleDelete(u.id)}>
                              <i className="bi bi-trash"></i>
                            </button>
                          </>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-between mt-3">
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} {tabMeta[activeTab].label.toLowerCase()}
              </span>
              <div className="d-flex gap-1">
                <button disabled={page === 1} onClick={() => setPage(1)} style={pageBtn(page === 1)}><i className="bi bi-chevron-double-left"></i></button>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={pageBtn(page === 1)}><i className="bi bi-chevron-left"></i></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  .reduce((acc, n, i, arr) => {
                    if (i > 0 && n - arr[i - 1] > 1) acc.push('…')
                    acc.push(n); return acc
                  }, [])
                  .map((n, i) => n === '…'
                    ? <span key={`e${i}`} style={{ padding: '0 0.4rem', color: 'var(--text-muted)', alignSelf: 'center' }}>…</span>
                    : <button key={n} onClick={() => setPage(n)} style={pageBtn(false, n === page)}>{n}</button>
                  )}
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={pageBtn(page === totalPages)}><i className="bi bi-chevron-right"></i></button>
                <button disabled={page === totalPages} onClick={() => setPage(totalPages)} style={pageBtn(page === totalPages)}><i className="bi bi-chevron-double-right"></i></button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }} onClick={closeEdit}>
          <div className="card-custom fade-in" style={{ maxWidth: 520, width: '100%', margin: 0, maxHeight: '92vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Edit {editingUser.role.charAt(0) + editingUser.role.slice(1).toLowerCase()} Profile
              </h6>
              <button className="icon-btn" onClick={closeEdit}><i className="bi bi-x-lg"></i></button>
            </div>

            {editingUser.role !== 'CUSTOMER' && (
              <div className="d-flex align-items-center gap-3 mb-3">
                <ProfileAvatar
                  fetchUrl={`/admin/users/${editingUser.id}/picture`}
                  uploadUrl={`/admin/users/${editingUser.id}/picture`}
                  hasPicture={editingUser.hasProfilePicture}
                  name={editingUser.name} size={68} editable
                  onUploaded={(updated) => { setEditingUser(updated); fetchUsers() }} />
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Click the camera to update photo</div>
              </div>
            )}

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
                    maxLength={EMAIL_MAX_LENGTH}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    style={editForm.email && !isEmailValid(editForm.email) ? { borderColor: '#ef4444' } : undefined} />
                  {editForm.email && !isEmailValid(editForm.email) && (
                    <p style={{ fontSize: '0.76rem', color: '#ef4444', margin: '0.25rem 0 0' }}>{EMAIL_ERROR.en}</p>
                  )}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">Phone</label>
                  <input className="form-control-custom w-100" placeholder="+959xxxxxxxx" value={editForm.phone}
                    onChange={e => handlePhoneChange(e.target.value, v => setEditForm(f => ({ ...f, phone: v })))}
                    onFocus={() => { if (!editForm.phone) setEditForm(f => ({ ...f, phone: '+95' })) }}
                    onBlur={() => { if (editForm.phone === '+95') setEditForm(f => ({ ...f, phone: '' })) }}
                    style={editForm.phone && editForm.phone !== '+95' && !PHONE_PATTERN.test(editForm.phone) ? { borderColor: '#ef4444' } : undefined} />
                  {editForm.phone && editForm.phone !== '+95' && !PHONE_PATTERN.test(editForm.phone) && (
                    <p style={{ fontSize: '0.76rem', color: '#ef4444', margin: '0.25rem 0 0' }}>{PHONE_ERROR}</p>
                  )}
                </div>
                {editingUser.role === 'AGENT' && (
                  <div className="col-12 col-md-6">
                    <label className="form-label-custom">Insurance Type</label>
                    <select className="form-select-custom w-100" value={editForm.insuranceType}
                      onChange={e => setEditForm(f => ({ ...f, insuranceType: e.target.value }))}>
                      {[...insuranceTypes, 'ALL'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {editForm.insuranceType !== 'ALL' &&
                      agentTypeMap[editForm.insuranceType] &&
                      agentTypeMap[editForm.insuranceType].id !== editingUser.id && (
                      <p style={{ fontSize: '0.76rem', color: '#d97706', margin: '0.25rem 0 0' }}>
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        <strong>{agentTypeMap[editForm.insuranceType].name}</strong> သည် ဤ type ကို ယူထားသည်။ သိမ်းမည်ဆိုလျှင် ပိတ်ပင်မည်။
                      </p>
                    )}
                  </div>
                )}
                <div className="col-12">
                  <label className="form-label-custom">Address</label>
                  <input className="form-control-custom w-100" value={editForm.address}
                    onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label-custom">
                    Password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(leave blank to keep)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type={showEditPwd ? 'text' : 'password'} className="form-control-custom w-100"
                      placeholder="New password…" value={editForm.newPassword}
                      style={{ paddingRight: '2.5rem' }}
                      onChange={e => setEditForm(f => ({ ...f, newPassword: e.target.value }))}
                      onFocus={() => setEditPwdFocused(true)} onBlur={() => setEditPwdFocused(false)} />
                    <button type="button" onClick={() => setShowEditPwd(v => !v)}
                      style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1 }}>
                      <i className={`bi bi-eye${showEditPwd ? '-slash' : ''}`}></i>
                    </button>
                  </div>
                  {(editPwdFocused || editForm.newPassword.length > 0) && (
                    <PasswordStrengthWidget password={editForm.newPassword} compact />
                  )}
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button type="submit" disabled={editSaving} className="btn-primary-custom" style={{ justifyContent: 'center' }}>
                  {editSaving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</> : 'Save Changes'}
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

function pageBtn(disabled, active = false) {
  return {
    padding: '0.3rem 0.6rem', borderRadius: 7, border: '1px solid',
    borderColor: active ? 'var(--primary)' : 'var(--border)',
    background: active ? 'var(--primary)' : 'var(--bg-secondary)',
    color: active ? '#fff' : disabled ? 'var(--text-muted)' : 'var(--text-primary)',
    cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.82rem',
    opacity: disabled ? 0.45 : 1, minWidth: 32
  }
}
