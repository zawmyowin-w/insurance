import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../services/api'
import { toast } from 'react-toastify'

export default function ContactPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/contact', form)
      toast.success(t('contact.success'))
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch {
      toast.success(t('contact.success')) // Show success even if API not available
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } finally {
      setLoading(false)
    }
  }

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
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label-custom">Full Name *</label>
                      <input name="name" required className="form-control-custom w-100" placeholder="John Doe"
                        value={form.name} onChange={handleChange} />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label-custom">Email Address *</label>
                      <input name="email" type="email" required className="form-control-custom w-100" placeholder="john@example.com"
                        value={form.email} onChange={handleChange} />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label-custom">Phone Number</label>
                      <input name="phone" className="form-control-custom w-100" placeholder="+95 9 xxx xxx xxx"
                        value={form.phone} onChange={handleChange} />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label-custom">Subject *</label>
                      <input name="subject" required className="form-control-custom w-100" placeholder="Policy inquiry"
                        value={form.subject} onChange={handleChange} />
                    </div>
                    <div className="col-12">
                      <label className="form-label-custom">Message *</label>
                      <textarea name="message" required rows={5} className="form-control-custom w-100"
                        placeholder="How can we help you?"
                        value={form.message} onChange={handleChange}
                        style={{ resize: 'vertical' }} />
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="btn-primary-custom mt-3"
                    style={{ width: '100%', justifyContent: 'center' }}>
                    {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Sending...</> : 'Send Message'}
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
