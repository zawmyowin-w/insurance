import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { toast } from 'react-toastify'

const STAR_COLOR = '#f59e0b'
const CATEGORY_COLORS = {
  General: '#6b7280', Claims: '#f59e0b', Payments: '#1d4ed8',
  Policies: '#16a34a', Applications: '#9333ea', Support: '#0891b2', Other: '#dc2626'
}

const CATEGORY_KEY_MAP = {
  General: 'categoryGeneral', Claims: 'categoryClaims', Payments: 'categoryPayments',
  Policies: 'categoryPolicies', Applications: 'categoryApplications',
  Support: 'categorySupport', Other: 'categoryOther',
}
const RATING_COLORS = ['#dc2626', '#f97316', '#f59e0b', '#84cc16', '#16a34a']

function StarDisplay({ rating }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(s => (
        <i key={s} className={`bi bi-star${s <= rating ? '-fill' : ''}`}
          style={{ color: s <= rating ? STAR_COLOR : 'var(--border)', fontSize: '0.85rem', marginRight: 1 }} />
      ))}
    </span>
  )
}

function RatingOverview({ feedbacks, t }) {
  const ratings = feedbacks
    .map(feedback => Number(feedback.rating))
    .filter(rating => Number.isInteger(rating) && rating >= 1 && rating <= 5)
  const counts = [1, 2, 3, 4, 5].map(rating => ratings.filter(value => value === rating).length)
  const ratingCount = ratings.length
  const totalScore = ratings.reduce((sum, rating) => sum + rating, 0)
  const average = ratingCount > 0 ? totalScore / ratingCount : 0
  const maxCount = Math.max(...counts, 1)
  const averagePercent = (average / 5) * 100
  const averageColor = average >= 4 ? '#16a34a' : average >= 3 ? '#f59e0b' : '#dc2626'

  return (
    <div className="card-custom mb-4">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            <i className="bi bi-bar-chart-fill me-2" style={{ color: 'var(--primary)' }}></i>
            {t('admin.feedback.ratingOverview')}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {ratingCount > 0
              ? t('admin.feedback.basedOnRatings', { count: ratingCount })
              : t('admin.feedback.noRatingsYet')}
          </div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, padding: '0.35rem 0.7rem',
          borderRadius: 20, background: averageColor + '14', color: averageColor, fontWeight: 700, fontSize: '0.8rem',
        }}>
          <i className="bi bi-star-fill"></i>{t('admin.feedback.averageRating')}
        </div>
      </div>

      <div className="row g-4 align-items-center">
        <div className="col-12 col-md-4">
          <div style={{
            padding: '1rem 1.15rem', borderRadius: 14, background: 'var(--bg-secondary)',
            border: '1px solid var(--border)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.35rem', lineHeight: 1, fontWeight: 800, color: averageColor }}>
              {ratingCount > 0 ? average.toFixed(2) : '—'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 5 }}>
              {t('admin.feedback.outOfFive')}
            </div>
            <div style={{ height: 7, borderRadius: 999, background: 'var(--border-light)', overflow: 'hidden', marginTop: '0.85rem' }}>
              <div style={{
                width: `${averagePercent}%`, height: '100%', borderRadius: 'inherit',
                background: `linear-gradient(90deg, #f59e0b, ${averageColor})`, transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        </div>

        <div className="col-12 col-md-8">
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            {t('admin.feedback.ratingDistribution')}
          </div>
          <div style={{ height: 140, display: 'flex', alignItems: 'stretch', gap: 10, padding: '0 2px', borderBottom: '1px solid var(--border)' }}>
            {counts.map((count, index) => {
              const rating = index + 1
              const percent = ratingCount > 0 ? (count / ratingCount) * 100 : 0
              const barHeight = count > 0 ? Math.max((count / maxCount) * 100, 8) : 2
              return (
                <div key={rating} style={{ flex: 1, minWidth: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)' }}>{count}</div>
                  <div style={{ width: '100%', height: 100, display: 'flex', alignItems: 'flex-end' }}>
                    <div
                      title={`${rating} star: ${count} (${percent.toFixed(1)}%)`}
                      style={{
                        width: '100%', height: `${barHeight}%`, minHeight: count > 0 ? 8 : 2, borderRadius: '6px 6px 2px 2px',
                        background: RATING_COLORS[index], opacity: count > 0 ? 0.9 : 0.25, transition: 'height 0.3s ease',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: RATING_COLORS[index], fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {rating}<i className="bi bi-star-fill ms-1" style={{ fontSize: '0.65rem' }}></i>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminFeedbackPage() {
  const { t } = useTranslation()
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL') // ALL | UNREAD | READ
  const [selected, setSelected] = useState(null)
  const [markingAll, setMarkingAll] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/admin/feedback')
      .then(res => setFeedbacks(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error(t('admin.feedback.loadFailed')))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const markRead = async (id) => {
    try {
      await api.put(`/admin/feedback/${id}/read`)
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, read: true } : f))
      if (selected?.id === id) setSelected(s => ({ ...s, read: true }))
    } catch { toast.error(t('admin.feedback.markReadFailed')) }
  }

  const markAllRead = async () => {
    setMarkingAll(true)
    try {
      await api.put('/admin/feedback/read-all')
      setFeedbacks(prev => prev.map(f => ({ ...f, read: true })))
      if (selected) setSelected(s => ({ ...s, read: true }))
      toast.success(t('admin.feedback.markAllReadSuccess'))
    } catch { toast.error(t('admin.feedback.markAllReadFailed')) } finally { setMarkingAll(false) }
  }

  const openDetail = (fb) => {
    setSelected(fb)
    if (!fb.read) markRead(fb.id)
  }

  const filtered = feedbacks.filter(f =>
    filter === 'ALL' ? true : filter === 'UNREAD' ? !f.read : f.read
  )

  const unreadCount = feedbacks.filter(f => !f.read).length

  const ratingLabel = r => [
    '',
    t('admin.feedback.ratingPoor'),
    t('admin.feedback.ratingFair'),
    t('admin.feedback.ratingGood'),
    t('admin.feedback.ratingVeryGood'),
    t('admin.feedback.ratingExcellent'),
  ][r] || ''

  const categoryLabel = cat =>
    CATEGORY_KEY_MAP[cat] ? t(`admin.feedback.${CATEGORY_KEY_MAP[cat]}`) : (cat || '')

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {t('admin.feedback.title')}
            {unreadCount > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: '#dc2626', color: '#fff', borderRadius: '999px',
                fontSize: '0.72rem', fontWeight: 700, minWidth: 20, height: 20,
                padding: '0 6px', marginLeft: 8, verticalAlign: 'middle'
              }}>{unreadCount}</span>
            )}
          </h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            {feedbacks.length} {t('admin.feedback.total')} · {unreadCount} {t('admin.feedback.unread')}
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          {/* Filter tabs */}
          {['ALL', 'UNREAD', 'READ'].map(tab => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={filter === tab ? 'btn-primary-sm' : 'btn-outline-custom'}
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.9rem' }}>
              {tab === 'ALL' ? t('admin.feedback.allTab') : tab === 'UNREAD' ? `${t('admin.feedback.unreadTab')} (${unreadCount})` : t('admin.feedback.readTab')}
            </button>
          ))}
          {unreadCount > 0 && (
            <button onClick={markAllRead} disabled={markingAll}
              className="btn-outline-custom"
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.9rem' }}>
              {markingAll ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-check2-all me-1"></i>{t('admin.feedback.markAllRead')}</>}
            </button>
          )}
        </div>
      </div>

      {!loading && <RatingOverview feedbacks={feedbacks} t={t} />}

      <div className="row g-4">
        {/* Left: list */}
        <div className="col-12 col-lg-5">
          <div className="card-custom p-0" style={{ maxHeight: 620, overflow: 'auto' }}>
            {loading ? (
              <div className="text-center py-5"><span className="spinner-border" style={{ color: 'var(--primary)' }}></span></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-chat-square-text" style={{ fontSize: '2rem', color: 'var(--text-muted)' }}></i>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{t('admin.feedback.noFeedback')}</p>
              </div>
            ) : filtered.map(fb => (
              <div
                key={fb.id}
                onClick={() => openDetail(fb)}
                style={{
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  background: selected?.id === fb.id ? 'var(--bg-hover)' : fb.read ? 'transparent' : 'var(--bg-hover)',
                  transition: 'background 0.15s',
                  borderLeft: !fb.read ? '3px solid var(--primary)' : '3px solid transparent'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = selected?.id === fb.id ? 'var(--bg-hover)' : fb.read ? 'transparent' : 'var(--bg-hover)'}
              >
                <div className="d-flex align-items-start gap-2">
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--primary)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 700
                  }}>
                    {fb.customerName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="d-flex align-items-center gap-2 mb-0.5">
                      <span style={{ fontWeight: fb.read ? 500 : 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {fb.customerName}
                      </span>
                      {!fb.read && (
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#dc2626', flexShrink: 0, display: 'inline-block' }}></span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <StarDisplay rating={fb.rating} />
                      <span style={{
                        fontSize: '0.72rem', padding: '0.1rem 0.5rem', borderRadius: 20,
                        background: (CATEGORY_COLORS[fb.category] || '#6b7280') + '18',
                        color: CATEGORY_COLORS[fb.category] || '#6b7280', fontWeight: 600
                      }}>{categoryLabel(fb.category)}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fb.message}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {fb.createdAt ? new Date(fb.createdAt).toLocaleString() : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: detail */}
        <div className="col-12 col-lg-7">
          {selected ? (
            <div className="card-custom">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'var(--primary)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', fontWeight: 700
                  }}>
                    {selected.customerName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selected.customerName}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{selected.customerEmail}</div>
                  </div>
                </div>
                <span style={{
                  fontSize: '0.75rem', padding: '0.2rem 0.75rem', borderRadius: 20,
                  background: selected.read ? '#f0fdf4' : '#fff0f0',
                  color: selected.read ? '#16a34a' : '#dc2626', fontWeight: 600
                }}>
                  {selected.read ? t('admin.feedback.alreadyRead') : t('admin.feedback.unread')}
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{t('admin.feedback.rating')}</div>
                    <div className="d-flex align-items-center gap-2">
                      <StarDisplay rating={selected.rating} />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{ratingLabel(selected.rating)}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{t('admin.feedback.category')}</div>
                    <span style={{
                      fontSize: '0.82rem', padding: '0.2rem 0.75rem', borderRadius: 20, fontWeight: 600,
                      background: (CATEGORY_COLORS[selected.category] || '#6b7280') + '18',
                      color: CATEGORY_COLORS[selected.category] || '#6b7280'
                    }}>{categoryLabel(selected.category)}</span>
                  </div>
                  <div className="col-12">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{t('admin.feedback.submittedAt')}</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : ''}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{t('admin.feedback.messageHeader')}</div>
                  <div style={{
                    background: 'var(--bg-secondary)', borderRadius: 10, padding: '1rem 1.25rem',
                    color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.65,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                  }}>
                    {selected.message}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-custom text-center py-5" style={{ color: 'var(--text-muted)' }}>
              <i className="bi bi-chat-left-quote" style={{ fontSize: '2.5rem', opacity: 0.4 }}></i>
              <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>{t('admin.feedback.selectToView')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
