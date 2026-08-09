import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function TermsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--page-bg)', color: 'var(--text-primary)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 1rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.9rem', cursor: 'pointer', padding: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <i className="bi bi-arrow-left"></i> {t('terms.back')}
          </button>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '2.5rem' }}>

            <div className="d-flex align-items-center gap-3 mb-4">
              <div style={{ width: 48, height: 48, background: 'var(--primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="bi bi-file-earmark-text" style={{ color: '#fff', fontSize: '1.3rem' }}></i>
              </div>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
                  {t('terms.title')}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                  {t('terms.lastUpdated')}
                </p>
              </div>
            </div>

            <Section title={t('terms.s1Title')}>
              {t('terms.s1Body')}
            </Section>

            <Section title={t('terms.s2Title')}>
              {t('terms.s2Body')}
            </Section>

            <Section title={t('terms.s3Title')}>
              <ul style={{ paddingLeft: '1.25rem', lineHeight: 2 }}>
                {t('terms.s3Items', { returnObjects: true }).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </Section>

            <Section title={t('terms.s4Title')}>
              {t('terms.s4Intro')}
              <ul style={{ paddingLeft: '1.25rem', lineHeight: 2, marginTop: '0.5rem' }}>
                {t('terms.s4Items', { returnObjects: true }).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </Section>

            <Section title={t('terms.s5Title')}>
              {t('terms.s5Intro')}
              <ul style={{ paddingLeft: '1.25rem', lineHeight: 2, marginTop: '0.5rem' }}>
                {t('terms.s5Items', { returnObjects: true }).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </Section>

            <Section title={t('terms.s6Title')}>
              {t('terms.s6Body')}
            </Section>

            <Section title={t('terms.s7Title')}>
              {t('terms.s7Intro')}{' '}
              <Link to="/privacy" style={{ color: 'var(--primary)' }}>{t('terms.s7Link')}</Link>
              {' '}{t('terms.s7Outro')}
            </Section>

            <Section title={t('terms.s8Title')}>
              {t('terms.s8Body')}
            </Section>

            <Section title={t('terms.s9Title')}>
              {t('terms.s9Body')}
            </Section>

            <Section title={t('terms.s10Title')}>
              {t('terms.s10Body')}
            </Section>

            <Section title={t('terms.s11Title')} last>
              {t('terms.s11Body')}
            </Section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function Section({ title, children, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : '1.75rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>{title}</h2>
      <div style={{ color: 'var(--text-secondary)', lineHeight: 1.85, fontSize: '0.93rem' }}>{children}</div>
    </div>
  )
}