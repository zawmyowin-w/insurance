import React from 'react'
import NrcInput from './NrcInput'

/**
 * System-mandatory fields always prepended to every application/claim form.
 * - Name:  auto-filled from user profile, read-only
 * - Email: auto-filled from user profile, read-only
 * - Date of Birth: date picker, customer must fill
 * - NRC No: Myanmar format, customer must fill
 *
 * Props:
 *   user        {object}   - auth user object { name, email }
 *   values      {object}   - { __dob, __nrc }
 *   onChange    {function} - (key, value) => void
 *   readOnly    {boolean}  - if true, all fields are read-only (review mode)
 */
export default function SystemFormFields({ user, values = {}, onChange, readOnly = false }) {
  const labelStyle = { fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }
  const inputStyle = readOnly
    ? { background: 'var(--bg-secondary)', color: 'var(--text-muted)', cursor: 'not-allowed' }
    : {}

  return (
    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: '0.85rem',
        padding: '0.45rem 0.75rem', borderRadius: 8,
        background: 'var(--bg-secondary)', borderLeft: '3px solid var(--primary)',
        fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem'
      }}>
        <i className="bi bi-person-fill me-1" style={{ color: 'var(--primary)' }}></i>
        Personal Information
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>(မဖြစ်မနေဖြည့်ရမည့် အချက်အလက်များ)</span>
      </div>

      <div className="row g-3">
        {/* Name — read-only */}
        <div className="col-12 col-md-6">
          <label style={labelStyle}>
            အမည် (Full Name) <span style={{ color: '#dc2626' }}>*</span>
            <span style={{ fontSize: '0.7rem', color: '#16a34a', marginLeft: 6, fontWeight: 400 }}>
              <i className="bi bi-lock-fill me-1"></i>ပရိုဖိုင်မှ အလိုလျှောက်ထည့်သည်
            </span>
          </label>
          <input
            className="form-control-custom w-100"
            value={user?.name || ''}
            readOnly
            style={{ ...inputStyle, background: '#f0fdf4', borderColor: '#86efac', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Email — read-only */}
        <div className="col-12 col-md-6">
          <label style={labelStyle}>
            အီးမေးလ် (Email) <span style={{ color: '#dc2626' }}>*</span>
            <span style={{ fontSize: '0.7rem', color: '#16a34a', marginLeft: 6, fontWeight: 400 }}>
              <i className="bi bi-lock-fill me-1"></i>ပရိုဖိုင်မှ အလိုလျှောက်ထည့်သည်
            </span>
          </label>
          <input
            className="form-control-custom w-100"
            value={user?.email || ''}
            readOnly
            style={{ ...inputStyle, background: '#f0fdf4', borderColor: '#86efac', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Date of Birth */}
        <div className="col-12 col-md-6">
          <label style={labelStyle}>
            မွေးသက္ကရာဇ် (Date of Birth) <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="date"
            className="form-control-custom w-100"
            value={values.__dob || ''}
            readOnly={readOnly}
            required={!readOnly}
            max={new Date().toISOString().split('T')[0]}
            style={readOnly ? inputStyle : undefined}
            onChange={readOnly ? undefined : e => onChange('__dob', e.target.value)}
          />
          {values.__dob && (
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {formatDob(values.__dob)}
            </small>
          )}
        </div>

        {/* NRC No */}
        <div className="col-12 col-md-6">
          <label style={labelStyle}>
            မှတ်ပုံတင်အမှတ် (NRC No.) <span style={{ color: '#dc2626' }}>*</span>
          </label>
          {readOnly ? (
            <input
              className="form-control-custom w-100"
              value={values.__nrc || '—'}
              readOnly
              style={inputStyle}
            />
          ) : (
            <NrcInput
              value={values.__nrc || ''}
              required
              onChange={val => onChange('__nrc', val)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function formatDob(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  const now = new Date()
  const age = Math.floor((now - d) / (365.25 * 24 * 60 * 60 * 1000))
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} (အသက် ${age} နှစ်)`
}
