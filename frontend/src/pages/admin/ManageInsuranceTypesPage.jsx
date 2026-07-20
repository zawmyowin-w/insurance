import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { toast } from 'react-toastify'

const ICON_MAP = {
  LIFE: '❤️', HEALTH: '🏥', VEHICLE: '🚗', PROPERTY: '🏠',
  FIRE: '🔥', MARINE: '⚓', TRAVEL: '✈️', ACCIDENT: '🩺',
  BUSINESS: '🏢', CROP: '🌾', DEFAULT: '🛡️',
}
const COLOR_MAP = {
  LIFE: '#dc2626', HEALTH: '#16a34a', VEHICLE: '#1d4ed8', PROPERTY: '#ca8a04',
  FIRE: '#ea580c', MARINE: '#0891b2', TRAVEL: '#7c3aed', ACCIDENT: '#be123c',
  BUSINESS: '#1e40af', CROP: '#15803d', DEFAULT: '#6366f1',
}

const typeIcon  = name => ICON_MAP[name?.toUpperCase()] || ICON_MAP.DEFAULT
const typeColor = name => COLOR_MAP[name?.toUpperCase()] || COLOR_MAP.DEFAULT

const emptyForm = { name: '', description: '', benefits: '', rules: '' }

export default function ManageInsuranceTypesPage() {
  const { t } = useTranslation()
  const [types, setTypes]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState(emptyForm)
  const [saving, setSaving]     = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [editingId, setEditingId]   = useState(null)   // which row is being edited
  const [editForm, setEditForm]     = useState({})     // inline edit form state

  const load = () => {
    setLoading(true)
    api.get('/admin/insurance-types')
      .then(res => setTypes(Array.isArray(res.data) ? res.data : []))
      .catch(() => setTypes([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // ── Create ──────────────────────────────────────────────────────
  const handleAdd = async e => {
    e.preventDefault()
    const name = form.name.trim().toUpperCase()
    if (!name) return
    if (types.some(t => t.name.toUpperCase() === name)) {
      toast.error(`"${name}" သည် ရှိပြီးသားဖြစ်သည်`)
      return
    }
    setSaving(true)
    try {
      await api.post('/admin/insurance-types', {
        name,
        description: form.description.trim(),
        benefits:    form.benefits.trim(),
        rules:       form.rules.trim(),
      })
      toast.success(`"${name}" ${t('admin.insuranceTypes.addedSuccess')}`)
      setForm(emptyForm)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.insuranceTypes.addFailed'))
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" ကို ဖျက်မည်လား? ၎င်းကို အသုံးပြုနေသည့် Package နှင့် Agent များ ရှိနိုင်သည်။`)) return
    setDeletingId(id)
    try {
      await api.delete(`/admin/insurance-types/${id}`)
      toast.success(`"${name}" ${t('admin.insuranceTypes.deletedSuccess')}`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.insuranceTypes.deleteFailed'))
    } finally {
      setDeletingId(null)
    }
  }

  // ── Inline Edit ─────────────────────────────────────────────────
  const startEdit = t => {
    setEditingId(t.id)
    setEditForm({ description: t.description || '', benefits: t.benefits || '', rules: t.rules || '' })
  }
  const cancelEdit = () => { setEditingId(null); setEditForm({}) }

  const handleSaveEdit = async (id, name) => {
    setSaving(true)
    try {
      await api.put(`/admin/insurance-types/${id}`, editForm)
      toast.success(`"${name}" ${t('admin.insuranceTypes.savedSuccess')}`)
      setEditingId(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.insuranceTypes.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-tags-fill" style={{ color: '#fff', fontSize: '1.1rem' }}></i>
        </div>
        <div>
          <h5 style={{ fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{t('admin.insuranceTypes.title')}</h5>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Type များကို ဖန်တီးပြီး Home Page နှင့် Package တွင် ဖော်ပြမည်
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* ── Left: Create Form ── */}
        <div className="col-12 col-xl-5">
          <div className="card-custom h-100">
            <h6 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
              <i className="bi bi-plus-circle me-2" style={{ color: 'var(--primary)' }}></i>Type အသစ်ထည့်ရန်
            </h6>
            <form onSubmit={handleAdd} className="d-flex flex-column gap-3">

              {/* Name */}
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.83rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Type အမည် *
                </label>
                <input
                  className="form-control-custom w-100"
                  placeholder="ဥပမာ — FIRE, MARINE, TRAVEL"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value.toUpperCase() }))}
                  maxLength={50}
                  required
                  style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}
                />
                <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                  LIFE, HEALTH, VEHICLE, PROPERTY — uppercase ဖြင့် သိမ်းမည်
                </p>
              </div>

              {/* Description */}
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.83rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  ရှင်းလင်းချက် / Description
                </label>
                <textarea
                  className="form-control-custom w-100"
                  placeholder="ဤ အာမခံအမျိုးအစား၏ အကျဉ်းချုပ် ရှင်းလင်းချက်..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Benefits */}
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.83rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  <i className="bi bi-check2-circle me-1" style={{ color: '#16a34a' }}></i>
                  အကျိုးခံစားခွင့်များ / Benefits
                </label>
                <textarea
                  className="form-control-custom w-100"
                  placeholder="ဥပမာ — ကျန်းမာရေးကုသစရိတ် အပြည့်အဝ ကျခံပေးသည်, ဆေးရုံဆင်းလျှင် လစ်လပ်ငွေ ရရှိသည်..."
                  value={form.benefits}
                  onChange={e => setForm(f => ({ ...f, benefits: e.target.value }))}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Rules */}
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.83rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  <i className="bi bi-file-text me-1" style={{ color: '#f59e0b' }}></i>
                  စည်းမျဉ်းစည်းကမ်း / Rules & Conditions
                </label>
                <textarea
                  className="form-control-custom w-100"
                  placeholder="ဥပမာ — အသက် ၁၈ မှ ၆၀ နှစ် အတွင်းသာ လျှောက်ထားနိုင်သည်, ကြိုတင်ရောဂါများ မပါဝင်ပါ..."
                  value={form.rules}
                  onChange={e => setForm(f => ({ ...f, rules: e.target.value }))}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={saving || !form.name.trim()}
                className="btn-primary-custom"
                style={{ justifyContent: 'center' }}
              >
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-1"></span>သိမ်းနေသည်…</>
                  : <><i className="bi bi-plus-lg me-1"></i>Type ထည့်မည်</>
                }
              </button>
            </form>
          </div>
        </div>

        {/* ── Right: List ── */}
        <div className="col-12 col-xl-7">
          <div className="card-custom">
            <h6 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              <i className="bi bi-list-ul me-2" style={{ color: 'var(--primary)' }}></i>
              ရှိပြီးသား Types ({types.length})
            </h6>

            {loading ? (
              <div className="text-center py-4">
                <span className="spinner-border" style={{ color: 'var(--primary)' }}></span>
              </div>
            ) : types.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-muted)' }}>
                <i className="bi bi-tags" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8 }}></i>
                Type မရှိသေးပါ — ဘယ်ဖက် Form မှ ထည့်ပါ
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {types.map(t => (
                  <TypeRow
                    key={t.id}
                    t={t}
                    isEditing={editingId === t.id}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    saving={saving}
                    deletingId={deletingId}
                    onEdit={() => startEdit(t)}
                    onCancelEdit={cancelEdit}
                    onSaveEdit={() => handleSaveEdit(t.id, t.name)}
                    onDelete={() => handleDelete(t.id, t.name)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Type Row (with inline edit) ─────────────────────────────────────────────

function TypeRow({ t, isEditing, editForm, setEditForm, saving, deletingId, onEdit, onCancelEdit, onSaveEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const color = typeColor(t.name)
  const icon  = typeIcon(t.name)
  const hasDetails = t.description || t.benefits || t.rules

  return (
    <div style={{
      borderRadius: 12, border: `1.5px solid ${isEditing ? 'var(--primary)' : 'var(--border)'}`,
      background: isEditing ? 'var(--bg-secondary)' : 'var(--bg)',
      transition: 'border-color .15s',
      overflow: 'hidden',
    }}>
      {/* Row header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 0.9rem', gap: 8 }}>
        <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
          <span style={{
            width: 38, height: 38, borderRadius: 9, background: color + '18',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0,
          }}>
            {icon}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em', fontSize: '0.95rem' }}>
              {t.name}
            </div>
            {t.createdAt && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                ထည့်သွင်းသည် — {new Date(t.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
          {hasDetails && (
            <button type="button"
              onClick={() => setExpanded(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: 6, color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
              <i className={`bi bi-chevron-${expanded || isEditing ? 'up' : 'down'}`}></i>
              {expanded || isEditing ? 'ပိတ်မည်' : 'အသေးစိတ်'}
            </button>
          )}
        </div>
        <div className="d-flex gap-1 flex-shrink-0">
          {!isEditing ? (
            <button className="icon-btn" onClick={onEdit} title="တည်းဖြတ်မည်" style={{ color: 'var(--primary)' }}>
              <i className="bi bi-pencil"></i>
            </button>
          ) : (
            <>
              <button className="icon-btn" onClick={onCancelEdit} title="မလုပ်တော့ပါ" style={{ color: 'var(--text-muted)' }}>
                <i className="bi bi-x-lg"></i>
              </button>
              <button className="icon-btn" onClick={onSaveEdit} disabled={saving} title="သိမ်းမည်" style={{ color: '#16a34a' }}>
                {saving ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-check-lg"></i>}
              </button>
            </>
          )}
          <button
            className="icon-btn"
            onClick={onDelete}
            disabled={deletingId === t.id}
            title="ဖျက်မည်"
            style={{ color: '#ef4444' }}
          >
            {deletingId === t.id
              ? <span className="spinner-border spinner-border-sm"></span>
              : <i className="bi bi-trash3"></i>}
          </button>
        </div>
      </div>

      {/* Expanded details / edit form */}
      {(expanded || isEditing) && (
        <div className="fade-in" style={{ padding: '0 0.9rem 0.9rem', borderTop: '1px solid var(--border)' }}>
          {isEditing ? (
            <div className="d-flex flex-column gap-2 pt-3">
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  ရှင်းလင်းချက်
                </label>
                <textarea className="form-control-custom w-100" rows={2} style={{ resize: 'vertical' }}
                  placeholder="Description..."
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  <i className="bi bi-check2-circle me-1" style={{ color: '#16a34a' }}></i>အကျိုးခံစားခွင့်များ
                </label>
                <textarea className="form-control-custom w-100" rows={2} style={{ resize: 'vertical' }}
                  placeholder="Benefits..."
                  value={editForm.benefits}
                  onChange={e => setEditForm(f => ({ ...f, benefits: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  <i className="bi bi-file-text me-1" style={{ color: '#f59e0b' }}></i>စည်းမျဉ်းစည်းကမ်း
                </label>
                <textarea className="form-control-custom w-100" rows={2} style={{ resize: 'vertical' }}
                  placeholder="Rules..."
                  value={editForm.rules}
                  onChange={e => setEditForm(f => ({ ...f, rules: e.target.value }))} />
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2 pt-3">
              {t.description && (
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 3 }}>ရှင်းလင်းချက်</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{t.description}</div>
                </div>
              )}
              {t.benefits && (
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#16a34a', marginBottom: 3 }}>
                    <i className="bi bi-check2-circle me-1"></i>အကျိုးခံစားခွင့်များ
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{t.benefits}</div>
                </div>
              )}
              {t.rules && (
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#f59e0b', marginBottom: 3 }}>
                    <i className="bi bi-file-text me-1"></i>စည်းမျဉ်းစည်းကမ်း
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{t.rules}</div>
                </div>
              )}
              {!hasDetails && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
                  အချက်အလက်မထည့်ရသေးပါ — ✏️ Edit ကိုနှိပ်၍ ထည့်ပါ
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
