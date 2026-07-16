import React, { useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

const CATEGORIES = ['General', 'Claims', 'Payments', 'Policies', 'Applications', 'Support', 'Other']

export default function SendFeedbackPage() {
  const [form, setForm] = useState({ rating: 5, category: 'General', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.message.trim()) { toast.error('Please enter your message'); return }
    setSubmitting(true)
    try {
      await api.post('/customer/feedback', form)
      setSubmitted(true)
      toast.success('Feedback sent to admin successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNew = () => {
    setForm({ rating: 5, category: 'General', message: '' })
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <div className="fade-in" style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="card-custom text-center py-5">
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <i className="bi bi-check-circle-fill" style={{ fontSize: '2rem', color: '#16a34a' }}></i>
          </div>
          <h5 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Thank you for your feedback!</h5>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Your message has been sent to our admin team. We appreciate your input and will use it to improve our services.
          </p>
          <button className="btn-primary-custom" onClick={handleNew}>
            <i className="bi bi-plus-circle me-2"></i>Send Another Feedback
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Send Feedback</h4>
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
          Share your experience and help us improve our services
        </p>
      </div>

      <div className="card-custom">
        <form onSubmit={handleSubmit}>

          {/* Rating */}
          <div className="mb-4">
            <label className="form-label-custom mb-2">Your Rating *</label>
            <div className="d-flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, rating: star }))}
                  style={{
                    background: 'none', border: 'none', padding: '0.15rem 0.1rem',
                    fontSize: '2rem', cursor: 'pointer', lineHeight: 1,
                    color: star <= form.rating ? '#f59e0b' : 'var(--border)',
                    transition: 'color 0.15s'
                  }}
                  title={`${star} star${star > 1 ? 's' : ''}`}
                >
                  <i className={`bi bi-star${star <= form.rating ? '-fill' : ''}`}></i>
                </button>
              ))}
              <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.88rem', alignSelf: 'center' }}>
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][form.rating]}
              </span>
            </div>
          </div>

          {/* Category */}
          <div className="mb-3">
            <label className="form-label-custom">Category *</label>
            <select
              className="form-select-custom w-100"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Message */}
          <div className="mb-4">
            <label className="form-label-custom">
              Your Message *
              <span style={{ float: 'right', color: 'var(--text-muted)', fontWeight: 400 }}>
                {form.message.length}/1000
              </span>
            </label>
            <textarea
              required
              rows={5}
              maxLength={1000}
              className="form-control-custom w-100"
              style={{ resize: 'vertical' }}
              placeholder="Tell us about your experience, suggestions, or any issues you've encountered..."
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !form.message.trim()}
            className="btn-primary-custom w-100"
            style={{ justifyContent: 'center' }}
          >
            {submitting
              ? <><span className="spinner-border spinner-border-sm me-2"></span>Sending...</>
              : <><i className="bi bi-send me-2"></i>Send Feedback</>}
          </button>
        </form>
      </div>
    </div>
  )
}
