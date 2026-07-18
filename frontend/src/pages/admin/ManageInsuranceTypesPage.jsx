import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

export default function ManageInsuranceTypesPage() {
  const [types, setTypes]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [input, setInput]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetch = () => {
    setLoading(true)
    api.get('/admin/insurance-types')
      .then(res => setTypes(Array.isArray(res.data) ? res.data : []))
      .catch(() => setTypes([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const handleAdd = async e => {
    e.preventDefault()
    const name = input.trim().toUpperCase()
    if (!name) return
    if (types.some(t => t.name.toUpperCase() === name)) {
      toast.error(`"${name}" သည် ရှိပြီးသားဖြစ်သည်`)
      return
    }
    setSaving(true)
    try {
      await api.post('/admin/insurance-types', { name })
      toast.success(`"${name}" ထည့်သွင်းပြီး`)
      setInput('')
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'ထည့်သွင်းမရပါ')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" ကို ဖျက်မည်လား? ၎င်းကို အသုံးပြုနေသည့် Package နှင့် Agent များ ရှိနိုင်သည်။`)) return
    setDeletingId(id)
    try {
      await api.delete(`/admin/insurance-types/${id}`)
      toast.success(`"${name}" ဖျက်ပြီး`)
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'ဖျက်မရပါ')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 640 }}>
      <div className="d-flex align-items-center gap-3 mb-4">
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-tags-fill" style={{ color: '#fff', fontSize: '1.1rem' }}></i>
        </div>
        <div>
          <h5 style={{ fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Insurance Types</h5>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Type များသည် Package နှင့် Agent တည်ဆောက်ရာတွင် select box ဖြင့်ပေါ်လာမည်
          </p>
        </div>
      </div>

      {/* Add form */}
      <div className="card-custom mb-4">
        <h6 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          <i className="bi bi-plus-circle me-2" style={{ color: 'var(--primary)' }}></i>Type အသစ်ထည့်ရန်
        </h6>
        <form onSubmit={handleAdd} className="d-flex gap-2 align-items-start">
          <div style={{ flex: 1 }}>
            <input
              className="form-control-custom w-100"
              placeholder="ဥပမာ — FIRE, MARINE, TRAVEL"
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
              maxLength={50}
              style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}
            />
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>
              စာလုံးကြီး (uppercase) ဖြင့် သိမ်းမည် — ဥပမာ LIFE, HEALTH, VEHICLE
            </p>
          </div>
          <button
            type="submit"
            disabled={saving || !input.trim()}
            className="btn-primary-custom"
            style={{ whiteSpace: 'nowrap' }}
          >
            {saving
              ? <><span className="spinner-border spinner-border-sm me-1"></span>သိမ်းနေသည်…</>
              : <><i className="bi bi-plus-lg me-1"></i>ထည့်မည်</>
            }
          </button>
        </form>
      </div>

      {/* List */}
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
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
            <i className="bi bi-tags" style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}></i>
            Type မရှိသေးပါ
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {types.map(t => (
              <div
                key={t.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.6rem 0.875rem', borderRadius: 10,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)'
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <span style={{
                    width: 34, height: 34, borderRadius: 8, background: '#eff6ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', color: '#1d4ed8'
                  }}>
                    <i className="bi bi-tag-fill"></i>
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                      {t.name}
                    </div>
                    {t.createdAt && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        ထည့်သွင်းသည် — {new Date(t.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className="icon-btn"
                  onClick={() => handleDelete(t.id, t.name)}
                  disabled={deletingId === t.id}
                  title="ဖျက်မည်"
                  style={{ color: '#ef4444' }}
                >
                  {deletingId === t.id
                    ? <span className="spinner-border spinner-border-sm"></span>
                    : <i className="bi bi-trash3"></i>
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
