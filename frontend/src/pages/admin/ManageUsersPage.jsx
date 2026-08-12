import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { toast } from 'react-toastify'
import DeleteConfirmModal from '../../components/DeleteConfirmModal'
import ProfileAvatar from '../../components/ProfileAvatar'
import PasswordStrengthWidget from '../../components/PasswordStrengthWidget'
import {
  EMAIL_ERROR, isEmailValid,
  getPhoneValidationError, isPhoneValid, isStrongPassword,
} from '../../utils/validation'

const EMPTY_FORM = { name: '', email: '', phone: '', address: '', password: '', insuranceType: 'LIFE' }
const EMPTY_EDIT = { name: '', email: '', phone: '', address: '', insuranceType: 'LIFE', newPassword: '' }
const PAGE_SIZE = 10

function handlePhoneChange(val, setter) {
  if (!val) { setter(''); return }
  if (!val.startsWith('+959')) { setter('+959'); return }
  const prefix = '+959'
  const rest = val.slice(4).replace(/\D/g, '')
  setter(prefix + rest)
}

export default function ManageUsersPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('my') ? 'my' : 'en'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromDashboard = searchParams.get('action') === 'create'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab')
    return tabParam && ['CUSTOMER', 'AGENT'].includes(tabParam) ? tabParam : 'CUSTOMER'
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
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, loading: false })
  const [previewModal, setPreviewModal] = useState({ open: false, user: null, summary: null, loading: false })

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
    const phoneVal = createForm.phone === '+959' ? '' : createForm.phone
    const phoneErr = getPhoneValidationError(phoneVal)
    if (phoneErr) { toast.error(phoneErr[lang] ?? phoneErr.en); return }
    if (!isStrongPassword(createForm.password)) {
      toast.error(t('admin.users.passwordStrengthError'))
      return
    }
    setSaving(true)
    try {
      await api.post('/admin/users/agents', { ...createForm, phone: phoneVal })
      toast.success(t('admin.users.agentCreated'))
      setShowCreatePanel(false); setCreateForm(EMPTY_FORM); fetchUsers()
    } catch (err) { toast.error(err.response?.data?.message || t('admin.users.failedCreate')) }
    finally { setSaving(false) }
  }

  const handleToggle = async (id, active) => {
    try {
      await api.put(`/admin/users/${id}/toggle`, { active: !active })
      toast.success(active ? t('admin.users.deactivated') : t('admin.users.activated'))
      fetchUsers()
    } catch { toast.error(t('admin.users.failed')) }
  }

  const handleDelete = async id => {
    const user = users.find(u => u.id === id)
    setPreviewModal({ open: true, user, summary: null, loading: true })
    try {
      const res = await api.get(`/admin/users/${id}/summary`)
      setPreviewModal(m => ({ ...m, summary: res.data, loading: false }))
    } catch {
      setPreviewModal(m => ({ ...m, loading: false }))
    }
  }

  const proceedToDelete = () => {
    setDeleteModal({ open: true, id: previewModal.user?.id, loading: false })
    setPreviewModal({ open: false, user: null, summary: null, loading: false })
  }

  const confirmDelete = async () => {
    setDeleteModal(m => ({ ...m, loading: true }))
    try {
      await api.delete(`/admin/users/${deleteModal.id}`)
      toast.success(t('admin.users.deleted'))
      setDeleteModal({ open: false, id: null, loading: false })
      fetchUsers()
    } catch {
      toast.error(t('admin.users.failedDelete'))
      setDeleteModal(m => ({ ...m, loading: false }))
    }
  }

  const openEdit = (u) => {
    setEditingUser(u)
    setEditForm({ name: u.name || '', email: u.email || '', phone: u.phone || '', address: u.address || '', insuranceType: u.insuranceType || 'LIFE', newPassword: '' })
  }
  const closeEdit = () => { setEditingUser(null); setEditForm(EMPTY_EDIT); setEditPwdFocused(false) }

  const handleEditSubmit = async e => {
    e.preventDefault()
    if (!isEmailValid(editForm.email)) { toast.error(EMAIL_ERROR.en); return }
    const phoneVal = editForm.phone === '+959' ? '' : editForm.phone
    const phoneErr = getPhoneValidationError(phoneVal)
    if (phoneErr) { toast.error(phoneErr[lang] ?? phoneErr.en); return }
    if (editForm.newPassword && !isStrongPassword(editForm.newPassword)) {
      toast.error(t('admin.users.passwordStrengthError'))
      return
    }
    setEditSaving(true)
    try {
      const payload = { name: editForm.name, email: editForm.email, phone: phoneVal, address: editForm.address }
      if (editingUser.role === 'AGENT') payload.insuranceType = editForm.insuranceType
      if (editForm.newPassword) payload.newPassword = editForm.newPassword
      await api.put(`/admin/users/${editingUser.id}`, payload)
      toast.success(t('admin.users.profileUpdated'))
      closeEdit(); fetchUsers()
    } catch (err) { toast.error(err.response?.data?.message || t('admin.users.failed')) }
    finally { setEditSaving(false) }
  }

  const tabMeta = {
    CUSTOMER: { label: t('admin.users.customers'), icon: 'bi-people', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    AGENT:    { label: t('admin.users.agents'),    icon: 'bi-person-badge', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  }

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('admin.users.title')}</h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{t('admin.users.subtitle')}</p>
        </div>
        {activeTab === 'AGENT' && !showCreatePanel && (
          <button className="btn-primary-custom" style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}
            onClick={() => setShowCreatePanel(true)}>
            <i className="bi bi-person-plus me-1"></i>
            {t('admin.users.createAgent')}
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
            {t('admin.users.createAgent')}
          </h6>
          <form onSubmit={handleCreate}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label-custom">{t('admin.users.name')} *</label>
                <input required className="form-control-custom w-100" value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label-custom">{t('admin.users.email')} *</label>
                <input type="email" required className="form-control-custom w-100" value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  style={createForm.email && !isEmailValid(createForm.email) ? { borderColor: '#ef4444' } : undefined} />
                {createForm.email && !isEmailValid(createForm.email) && (
                  <p style={{ fontSize: '0.76rem', color: '#ef4444', margin: '0.25rem 0 0' }}>{EMAIL_ERROR.en}</p>
                )}
              </div>
              <div className={activeTab === 'AGENT' ? 'col-12 col-md-4' : 'col-12 col-md-6'}>
                <label className="form-label-custom">{t('admin.users.phone')}</label>
                <input className="form-control-custom w-100" placeholder={t('admin.users.phonePlaceholder')} value={createForm.phone}
                  onChange={e => handlePhoneChange(e.target.value, v => setCreateForm(f => ({ ...f, phone: v })))}
                  onFocus={() => { if (!createForm.phone) setCreateForm(f => ({ ...f, phone: '+959' })) }}
                  onBlur={() => { if (createForm.phone === '+959') setCreateForm(f => ({ ...f, phone: '' })) }}
                  style={createForm.phone && createForm.phone !== '+959' && getPhoneValidationError(createForm.phone) ? { borderColor: '#ef4444' } : undefined} />
                {createForm.phone && createForm.phone !== '+959' && getPhoneValidationError(createForm.phone) && (
                  <p style={{ fontSize: '0.76rem', color: '#ef4444', margin: '0.25rem 0 0' }}>
                    <i className="bi bi-exclamation-circle me-1" />
                    {(getPhoneValidationError(createForm.phone))[lang] ?? (getPhoneValidationError(createForm.phone)).en}
                  </p>
                )}
              </div>
              {activeTab === 'AGENT' && (
                <div className="col-12 col-md-4">
                  <label className="form-label-custom">{t('admin.users.insuranceType')}</label>
                  <select className="form-select-custom w-100" value={createForm.insuranceType}
                    onChange={e => setCreateForm(f => ({ ...f, insuranceType: e.target.value }))}>
                    {insuranceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {agentTypeMap[createForm.insuranceType] && (
                    <p style={{ fontSize: '0.76rem', color: '#d97706', margin: '0.25rem 0 0' }}>
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      {t('admin.users.agentConflictWarning', { name: agentTypeMap[createForm.insuranceType].name })}
                    </p>
                  )}
                </div>
              )}
              <div className={activeTab === 'AGENT' ? 'col-12 col-md-4' : 'col-12 col-md-6'}>
                <label className="form-label-custom">{t('admin.users.password')} *</label>
                <div style={{ position: 'relative' }}>
                  <input type={showCreatePwd ? 'text' : 'password'} required className="form-control-custom w-100"
                    value={createForm.password} style={{ paddingRight: '2.5rem' }}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    onFocus={() => setCreatePwdFocused(true)} onBlur={() => setCreatePwdFocused(false)} />
                  <button type="button" onClick={() => setShowCreatePwd(v => !v)}
                    style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1 }}>
                    <i className={`bi bi-eye${showCreatePwd ? '-slash' : ''}`}></i>
                  </button>
                  <PasswordStrengthWidget
                    password={createForm.password}
                    popup show={(createPwdFocused || createForm.password.length > 0) && !isStrongPassword(createForm.password)}
                  />
                </div>
              </div>
              <div className="col-12">
                <label className="form-label-custom">{t('admin.users.address')}</label>
                <input className="form-control-custom w-100" value={createForm.address}
                  onChange={e => setCreateForm(f => ({ ...f, address: e.target.value }))} />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button type="submit" disabled={saving} className="btn-primary-custom" style={{ justifyContent: 'center' }}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>{t('admin.users.creatingBtn')}</> : (activeTab === 'AGENT' ? t('admin.users.createAgent') : t('admin.users.createAdminBtn'))}
              </button>
              <button type="button" className="btn-outline-custom" onClick={() => setShowCreatePanel(false)}>{t('admin.users.cancelBtn')}</button>
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
          placeholder={t('admin.users.searchPlaceholder')}
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
                    {[t('admin.users.name'), t('admin.users.email'), t('admin.users.phone'), t('admin.users.address'),
                      ...(activeTab === 'AGENT' ? [t('admin.users.typeHeader')] : []),
                      t('admin.common.status'), t('admin.users.joinedDate'), t('admin.common.actions')].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      {search ? t('admin.users.noMatchSearch', { label: tabMeta[activeTab].label.toLowerCase(), search }) : t('admin.users.noUsersYet', { label: tabMeta[activeTab].label.toLowerCase() })}
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
                        <td><span className="type-badge-pill">{u.insuranceType || '—'}</span></td>
                      )}
                      <td>
                        <span className={`badge-status ${u.active ? 'badge-active' : 'badge-cancelled'}`}>
                          {u.active ? t('admin.users.active') : t('admin.users.inactive')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button title={t('admin.common.edit')} className="btn-outline-custom"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                            onClick={() => openEdit(u)}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <>
                            <button className="btn-outline-custom" style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                              onClick={() => handleToggle(u.id, u.active)}>
                              {u.active ? t('admin.users.disableBtn') : t('admin.users.enableBtn')}
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
                {t('admin.users.paginationShowing')} {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} {t('admin.users.paginationOf')} {filtered.length} {tabMeta[activeTab].label.toLowerCase()}
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

      {/* ── Step 1: Data Preview Modal ───────────────────────── */}
      {previewModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, width: '100%', maxWidth: 600, padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 style={{ fontWeight: 700, margin: 0 }}>
                <i className="bi bi-person-lines-fill me-2" style={{ color: '#1d4ed8' }}></i>
                {t('admin.users.previewTitle')}
              </h5>
              <button onClick={() => setPreviewModal({ open: false, user: null, summary: null, loading: false })}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>×</button>
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#dc2626' }}>
              <i className="bi bi-exclamation-triangle-fill me-1"></i>
              {t('admin.users.previewWarning')}
            </div>

            {previewModal.loading ? (
              <div className="text-center py-4"><div className="spinner-border" style={{ color: 'var(--primary)' }}></div></div>
            ) : previewModal.summary ? (
              <>
                {/* User info */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{previewModal.summary.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{previewModal.summary.email}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {t('admin.users.previewRole')}: {previewModal.summary.role} | {t('admin.users.previewJoined')}: {previewModal.summary.joinedAt ? new Date(previewModal.summary.joinedAt).toLocaleDateString() : '—'} |
                    {t('admin.users.previewStatus')}: <span style={{ color: previewModal.summary.active ? '#15803d' : '#dc2626', fontWeight: 600 }}>{previewModal.summary.active ? t('admin.users.previewActive') : t('admin.users.previewInactive')}</span>
                  </div>
                </div>

                {/* Customer stats */}
                {previewModal.summary.role === 'CUSTOMER' && (
                  <>
                    <div className="row g-2 mb-3">
                      {[
                        { label: t('admin.users.previewApplications'), value: previewModal.summary.applicationCount, icon: 'bi-file-earmark-text', color: '#1d4ed8' },
                        { label: t('admin.users.previewClaims'), value: previewModal.summary.claimCount, icon: 'bi-file-earmark-medical', color: '#d97706' },
                        { label: t('admin.users.previewPayments'), value: previewModal.summary.paymentCount, icon: 'bi-credit-card', color: '#15803d' },
                      ].map(stat => (
                        <div key={stat.label} className="col-4">
                          <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.6rem', textAlign: 'center' }}>
                            <i className={`bi ${stat.icon}`} style={{ color: stat.color, fontSize: '1.1rem' }}></i>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: 2 }}>{stat.value}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {previewModal.summary.applications?.length > 0 && (
                      <div className="mb-3">
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>{t('admin.users.previewAppsShowing', { count: 5 })}</div>
                        {previewModal.summary.applications.map(a => (
                          <div key={a.id} style={{ fontSize: '0.82rem', padding: '0.35rem 0.6rem', borderRadius: 6, background: 'var(--bg-secondary)', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                            <span><span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{a.policyNumber || `#${a.id}`}</span> — {a.packageName}</span>
                            <span style={{ color: a.status === 'APPROVED' ? '#15803d' : a.status === 'REJECTED' ? '#dc2626' : '#d97706', fontWeight: 600 }}>{a.status}</span>
                          </div>
                        ))}
                        {previewModal.summary.applicationCount > 5 && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{t('admin.users.previewMore', { count: previewModal.summary.applicationCount - 5 })}</div>
                        )}
                      </div>
                    )}

                    {previewModal.summary.claims?.length > 0 && (
                      <div className="mb-3">
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>{t('admin.users.previewClaimsShowing', { count: 5 })}</div>
                        {previewModal.summary.claims.map(c => (
                          <div key={c.id} style={{ fontSize: '0.82rem', padding: '0.35rem 0.6rem', borderRadius: 6, background: 'var(--bg-secondary)', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                            <span>Claim #{c.id} — {Number(c.amount).toLocaleString()} MMK</span>
                            <span style={{ color: c.status === 'APPROVED' ? '#15803d' : c.status === 'REJECTED' ? '#dc2626' : '#d97706', fontWeight: 600 }}>{c.status}</span>
                          </div>
                        ))}
                        {previewModal.summary.claimCount > 5 && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{t('admin.users.previewMore', { count: previewModal.summary.claimCount - 5 })}</div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Agent stats */}
                {previewModal.summary.role === 'AGENT' && (
                  <div className="mb-3">
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.6rem 0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 700 }}>{previewModal.summary.assignedApplicationCount}</span>
                      <span style={{ color: 'var(--text-secondary)', marginLeft: 4 }}>{t('admin.users.previewAssignedApps')}</span>
                    </div>
                    {previewModal.summary.assignedApplications?.map(a => (
                      <div key={a.id} style={{ fontSize: '0.82rem', padding: '0.35rem 0.6rem', borderRadius: 6, background: 'var(--bg-secondary)', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                        <span><span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{a.policyNumber || `#${a.id}`}</span> — {a.customerName}</span>
                        <span style={{ color: a.status === 'APPROVED' ? '#15803d' : '#d97706', fontWeight: 600 }}>{a.status}</span>
                      </div>
                    ))}
                    {previewModal.summary.assignedApplicationCount > 5 && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('admin.users.previewMore', { count: previewModal.summary.assignedApplicationCount - 5 })}</div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>{t('admin.users.previewLoadFailed')}</div>
            )}

            <div className="d-flex gap-2 justify-content-end mt-3">
              <button onClick={() => setPreviewModal({ open: false, user: null, summary: null, loading: false })}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem 1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                {t('admin.common.cancel')}
              </button>
              <button onClick={proceedToDelete} disabled={previewModal.loading}
                style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, padding: '0.5rem 1.4rem', cursor: 'pointer', fontWeight: 600 }}>
                <i className="bi bi-trash me-1"></i>{t('admin.users.proceedToDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={deleteModal.open}
        title={t('admin.users.deleteTitle')}
        message={t('admin.users.deleteMessage')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ open: false, id: null, loading: false })}
        loading={deleteModal.loading}
      />

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
                {t('admin.users.editModalTitle')}
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
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{t('admin.users.clickCameraHint')}</div>
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">{t('admin.users.name')} *</label>
                  <input required className="form-control-custom w-100" value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">{t('admin.users.email')} *</label>
                  <input type="email" required className="form-control-custom w-100" value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    style={editForm.email && !isEmailValid(editForm.email) ? { borderColor: '#ef4444' } : undefined} />
                  {editForm.email && !isEmailValid(editForm.email) && (
                    <p style={{ fontSize: '0.76rem', color: '#ef4444', margin: '0.25rem 0 0' }}>{EMAIL_ERROR.en}</p>
                  )}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-custom">{t('admin.users.phone')}</label>
                  <input className="form-control-custom w-100" placeholder={t('admin.users.phonePlaceholder')} value={editForm.phone}
                    onChange={e => handlePhoneChange(e.target.value, v => setEditForm(f => ({ ...f, phone: v })))}
                    onFocus={() => { if (!editForm.phone) setEditForm(f => ({ ...f, phone: '+959' })) }}
                    onBlur={() => { if (editForm.phone === '+959') setEditForm(f => ({ ...f, phone: '' })) }}
                    style={editForm.phone && editForm.phone !== '+959' && getPhoneValidationError(editForm.phone) ? { borderColor: '#ef4444' } : undefined} />
                  {editForm.phone && editForm.phone !== '+959' && getPhoneValidationError(editForm.phone) && (
                    <p style={{ fontSize: '0.76rem', color: '#ef4444', margin: '0.25rem 0 0' }}>
                      <i className="bi bi-exclamation-circle me-1" />
                      {(getPhoneValidationError(editForm.phone))[lang] ?? (getPhoneValidationError(editForm.phone)).en}
                    </p>
                  )}
                </div>
                {editingUser.role === 'AGENT' && (
                  <div className="col-12 col-md-6">
                    <label className="form-label-custom">{t('admin.users.insuranceType')}</label>
                    <select className="form-select-custom w-100" value={editForm.insuranceType}
                      onChange={e => setEditForm(f => ({ ...f, insuranceType: e.target.value }))}>
                      {insuranceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {agentTypeMap[editForm.insuranceType] &&
                      agentTypeMap[editForm.insuranceType].id !== editingUser.id && (
                      <p style={{ fontSize: '0.76rem', color: '#d97706', margin: '0.25rem 0 0' }}>
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        {t('admin.users.agentConflictWarning', { name: agentTypeMap[editForm.insuranceType].name })}
                      </p>
                    )}
                  </div>
                )}
                <div className="col-12">
                  <label className="form-label-custom">{t('admin.users.address')}</label>
                  <input className="form-control-custom w-100" value={editForm.address}
                    onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label-custom">
                    {t('admin.users.password')} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{t('admin.users.passwordHint')}</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type={showEditPwd ? 'text' : 'password'} className="form-control-custom w-100"
                      placeholder={t('admin.users.passwordNew')} value={editForm.newPassword}
                      style={{ paddingRight: '2.5rem' }}
                      onChange={e => setEditForm(f => ({ ...f, newPassword: e.target.value }))}
                      onFocus={() => setEditPwdFocused(true)} onBlur={() => setEditPwdFocused(false)} />
                    <button type="button" onClick={() => setShowEditPwd(v => !v)}
                      style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1 }}>
                      <i className={`bi bi-eye${showEditPwd ? '-slash' : ''}`}></i>
                    </button>
                    <PasswordStrengthWidget
                      password={editForm.newPassword}
                      popup show={(editPwdFocused || editForm.newPassword.length > 0) && !isStrongPassword(editForm.newPassword)}
                    />
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button type="submit" disabled={editSaving} className="btn-primary-custom" style={{ justifyContent: 'center' }}>
                  {editSaving ? <><span className="spinner-border spinner-border-sm me-2"></span>{t('admin.common.saving')}</> : t('admin.users.saveChanges')}
                </button>
                <button type="button" className="btn-outline-custom" onClick={closeEdit}>{t('admin.users.cancelBtn')}</button>
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
