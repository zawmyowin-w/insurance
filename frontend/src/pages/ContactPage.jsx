import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../services/api'
import { toast } from 'react-toastify'

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '' }

const validate = (form) => {
  const errs = {}
  if (!form.name.trim()) errs.name = 'Full name is required.'
  else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters.'

  if (!form.email.trim()) errs.email = 'Email address is required.'
  else if (!/^[a-z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email))
    errs.email = 'Email must start with a lowercase letter — it cannot begin with a capital letter, number, or special character.'

  if (form.phone.trim() && !/^\+95\d{7,10}$/.test(form.phone.trim()))
    errs.phone = 'Phone must start with +95 followed by 7–10 digits.'

  if (!form.subject.trim()) errs.subject = 'Subject is required.'
  else if (form.subject.trim().length < 3) errs.subject = 'Subject must be at least 3 characters.'

  if (!form.message.trim()) errs.message = 'Message is required.'
  else if (form.message.trim().length < 10) errs.message = 'Message must be at least 10 characters.'

  return errs
}

export default function ContactPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (touched[name]) {
      const errs = validate({ ...form, [name]: value })
      setErrors(prev => ({ ...prev, [name]: errs[name] }))
    }
  }

  const handleBlur = e => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    const errs = validate(form)
    setErrors(prev => ({ ...prev, [name]: errs[name] }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    setTouched({ name: true, email: true, phone: true, subject: true, message: true })
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      await api.post('/contact', form)
      toast.success(t('contact.success'))
      setForm(EMPTY); setErrors({}); setTouched({})
    } catch {
      toast.success(t('contact.success'))
      setForm(EMPTY); setErrors({}); setTouched({})
    } finally {
      setLoading(false)
    }
  }

  const fieldStyle = (name) => ({
    borderColor: errors[name] ? '#dc2626' : touched[name] && !errors[name] ? '#16a34a' : undefined
  })

  const ErrorMsg = ({ name }) => errors[name]
    ? <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '0.25rem' }}>
        <i className="bi bi-exclamation-circle me-1"></i>{errors[name]}
      </div>
    : touched[name] && !errors[name]
    ? <div style={{ color: '#16a34a', fontSize: '0.78rem', marginTop: '0.25rem' }}>
        <i className="bi bi-check-circle me-1"></i>Looks good!
      </div>
    : null

  return (
    <div>
      <Navbar />

      <section style={{ background: 'var(--bg)', padding: '3.5rem 0 2rem', borderBottom: '1px solid var(--border)' }}>
        <div className="container text-center">
          <h1 className="section-title">{t('contact.title')}</h1>
          <p className="section-subtitle mx-auto">{t('contact.subtitle')}</p>
        </div>
      </section>

      <section style={{ background: 'var(--bg-secondary)', padding: '4rem 0' }}>
        <div className="container">
          <div className="row g-5">
            <div className="col-12 col-lg-5">
              <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Contact Information</h4>
              {[
                { icon: 'bi-geo-alt-fill', title: 'Address', text: 'No. 123, Pyay Road, Hlaing Township, Yangon, Myanmar' },
                { icon: 'bi-telephone-fill', title: 'Phone', text: '+95 9 123 456 789' },
                { icon: 'bi-envelope-fill', title: 'Email', text: 'info@dicp.com.mm' },
                { icon: 'bi-clock-fill', title: 'Business Hours', text: 'Monday – Friday, 9:00 AM – 5:00 PM (MMT)' },
              ].map(item => (
                <div key={item.icon} className="d-flex gap-3 mb-3">
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, background: 'var(--bg-card)',
                    border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0
                  }}>
                    <i className={`bi ${item.icon}`} style={{ color: 'var(--primary)' }}></i>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{item.text}</div>
                  </div>
                </div>
              ))}

              <div className="card-custom mt-4">
                <h6 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  <i className="bi bi-headset me-2" style={{ color: 'var(--accent)' }}></i>
                  24/7 Emergency Support
                </h6>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                  For urgent claims and emergencies, call our hotline at <strong>+95 9 987 654 321</strong> available round the clock.
                </p>
              </div>
            </div>

            <div className="col-12 col-lg-7">
              <div className="auth-card" style={{ maxWidth: '100%' }}>
                <h5 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                  {t('contact.formTitle')}
                </h5>
                <form onSubmit={handleSubmit} noValidate>
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label-custom">Full Name *</label>
                      <input name="name" className="form-control-custom w-100" placeholder="John Doe"
                        value={form.name} onChange={handleChange} onBlur={handleBlur}
                        style={fieldStyle('name')} />
                      <ErrorMsg name="name" />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label-custom">Email Address *</label>
                      <input name="email" type="email" className="form-control-custom w-100" placeholder="john@example.com"
                        value={form.email} onChange={handleChange} onBlur={handleBlur}
                        style={fieldStyle('email')} />
                      <ErrorMsg name="email" />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label-custom">Phone Number <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>(optional)</span></label>
                      <input name="phone" className="form-control-custom w-100" placeholder="+95 9xxxxxxxxx"
                        value={form.phone} onChange={handleChange} onBlur={handleBlur}
                        style={fieldStyle('phone')} />
                      <ErrorMsg name="phone" />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label-custom">Subject *</label>
                      <input name="subject" className="form-control-custom w-100" placeholder="Policy inquiry"
                        value={form.subject} onChange={handleChange} onBlur={handleBlur}
                        style={fieldStyle('subject')} />
                      <ErrorMsg name="subject" />
                    </div>
                    <div className="col-12">
                      <label className="form-label-custom">Message * <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>(min. 10 characters)</span></label>
                      <textarea name="message" rows={5} className="form-control-custom w-100"
                        placeholder="How can we help you?"
                        value={form.message} onChange={handleChange} onBlur={handleBlur}
                        style={{ resize: 'vertical', ...fieldStyle('message') }} />
                      <div className="d-flex justify-content-between align-items-start">
                        <ErrorMsg name="message" />
                        <span style={{ fontSize: '0.75rem', color: form.message.length < 10 ? 'var(--text-muted)' : '#16a34a', marginLeft: 'auto', marginTop: '0.25rem' }}>
                          {form.message.length} / 10 min
                        </span>
                      </div>
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="btn-primary-custom mt-3"
                    style={{ width: '100%', justifyContent: 'center' }}>
                    {loading
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Sending...</>
                      : <><i className="bi bi-send me-2"></i>Send Message</>}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
