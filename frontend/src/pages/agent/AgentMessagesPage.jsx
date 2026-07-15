import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

export default function AgentMessagesPage() {
  const [contacts, setContacts] = useState({ admins: [], customers: [] })
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [recipientType, setRecipientType] = useState('ADMIN')
  const [recipientId, setRecipientId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    api.get('/agent/contacts')
      .then(res => {
        setContacts({
          admins: Array.isArray(res.data.admins) ? res.data.admins : [],
          customers: Array.isArray(res.data.customers) ? res.data.customers : [],
        })
      })
      .catch(() => setContacts({ admins: [], customers: [] }))
      .finally(() => setLoadingContacts(false))
  }, [])

  const recipientList = recipientType === 'ADMIN' ? contacts.admins : contacts.customers

  // Reset selected recipient when type changes
  const handleTypeChange = (t) => { setRecipientType(t); setRecipientId('') }

  const handleSend = async e => {
    e.preventDefault()
    if (!recipientId) { toast.error('Please select a recipient'); return }
    if (!subject.trim()) { toast.error('Subject is required'); return }
    if (!body.trim()) { toast.error('Message body is required'); return }
    setSending(true)
    try {
      await api.post('/agent/messages', { recipientId: String(recipientId), subject, body })
      toast.success('Message sent successfully!')
      setSent(true)
      setSubject(''); setBody(''); setRecipientId('')
      setTimeout(() => setSent(false), 3000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message')
    } finally { setSending(false) }
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Send Message</h4>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
          Contact an admin or a customer directly — messages are delivered as notifications
        </p>
      </div>

      <div className="row g-4">
        {/* Compose panel */}
        <div className="col-12 col-lg-7">
          <div className="card-custom">
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              <i className="bi bi-envelope-plus me-2" style={{ color: 'var(--primary)' }}></i>Compose Message
            </h6>

            {loadingContacts ? (
              <div className="text-center py-4">
                <span className="spinner-border" style={{ color: 'var(--primary)' }}></span>
              </div>
            ) : (
              <form onSubmit={handleSend}>
                {/* Recipient type toggle */}
                <div className="mb-3">
                  <label className="form-label-custom">Send To</label>
                  <div className="d-flex gap-2">
                    {[
                      { value: 'ADMIN', label: 'Admin', icon: 'bi-shield-lock', color: '#9333ea' },
                      { value: 'CUSTOMER', label: 'Customer', icon: 'bi-person', color: '#16a34a' },
                    ].map(opt => (
                      <button type="button" key={opt.value} onClick={() => handleTypeChange(opt.value)} style={{
                        flex: 1, padding: '0.6rem 1rem', borderRadius: 10, border: '1.5px solid',
                        borderColor: recipientType === opt.value ? opt.color : 'var(--border)',
                        background: recipientType === opt.value
                          ? (opt.value === 'ADMIN' ? '#faf5ff' : '#f0fdf4') : 'var(--bg-secondary)',
                        color: recipientType === opt.value ? opt.color : 'var(--text-secondary)',
                        cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', transition: 'all .15s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                      }}>
                        <i className={`bi ${opt.icon}`}></i>{opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipient select */}
                <div className="mb-3">
                  <label className="form-label-custom">
                    Select {recipientType === 'ADMIN' ? 'Admin' : 'Customer'} *
                  </label>
                  {recipientList.length === 0 ? (
                    <div style={{
                      padding: '0.75rem 1rem', borderRadius: 8, background: 'var(--bg-secondary)',
                      border: '1px dashed var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)'
                    }}>
                      {recipientType === 'CUSTOMER'
                        ? 'No customers are assigned to you yet'
                        : 'No admins found'}
                    </div>
                  ) : (
                    <select className="form-select-custom w-100" value={recipientId}
                      onChange={e => setRecipientId(e.target.value)} required>
                      <option value="">— Choose recipient —</option>
                      {recipientList.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Subject */}
                <div className="mb-3">
                  <label className="form-label-custom">Subject *</label>
                  <input className="form-control-custom w-100" value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Brief subject line…" required />
                </div>

                {/* Body */}
                <div className="mb-4">
                  <label className="form-label-custom">Message *</label>
                  <textarea rows={6} className="form-control-custom w-100" style={{ resize: 'vertical' }}
                    value={body} onChange={e => setBody(e.target.value)}
                    placeholder="Write your message here…" required />
                </div>

                <button type="submit" disabled={sending || recipientList.length === 0}
                  className="btn-primary-custom w-100" style={{ justifyContent: 'center' }}>
                  {sending
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Sending…</>
                    : sent
                    ? <><i className="bi bi-check-circle me-2"></i>Sent!</>
                    : <><i className="bi bi-send me-2"></i>Send Message</>}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Info panel */}
        <div className="col-12 col-lg-5">
          <div className="card-custom" style={{ background: 'var(--bg-secondary)' }}>
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              <i className="bi bi-info-circle me-2" style={{ color: 'var(--primary)' }}></i>How it works
            </h6>
            <div className="d-flex flex-column gap-3">
              {[
                { icon: 'bi-shield-lock', color: '#9333ea', title: 'Message Admin', desc: 'Admins are always available as recipients. Use for escalations, questions, or reporting.' },
                { icon: 'bi-person', color: '#16a34a', title: 'Message Customer', desc: 'Only customers assigned to your applications or claims appear in the list.' },
                { icon: 'bi-bell', color: '#1d4ed8', title: 'Notification delivery', desc: 'Messages are delivered as in-app notifications. Recipients see them in their Notifications page.' },
              ].map(item => (
                <div key={item.title} className="d-flex gap-3">
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <i className={`bi ${item.icon}`} style={{ color: item.color, fontSize: '1rem' }}></i>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contacts summary */}
          <div className="card-custom mt-3">
            <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '0.88rem' }}>
              Available Contacts
            </h6>
            <div className="d-flex gap-3">
              {[
                { label: 'Admins', count: contacts.admins.length, color: '#9333ea', bg: '#faf5ff' },
                { label: 'Customers', count: contacts.customers.length, color: '#16a34a', bg: '#f0fdf4' },
              ].map(c => (
                <div key={c.label} style={{
                  flex: 1, textAlign: 'center', padding: '0.75rem',
                  borderRadius: 10, background: c.bg
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c.color }}>{c.count}</div>
                  <div style={{ fontSize: '0.78rem', color: c.color, fontWeight: 600 }}>{c.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
