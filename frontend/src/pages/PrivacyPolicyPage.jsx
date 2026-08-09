import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function PrivacyPolicyPage() {
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
            <i className="bi bi-arrow-left"></i> {t('privacy.back')}
          </button>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '2.5rem' }}>

            <div className="d-flex align-items-center gap-3 mb-4">
              <div style={{ width: 48, height: 48, background: 'var(--primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="bi bi-shield-lock" style={{ color: '#fff', fontSize: '1.3rem' }}></i>
              </div>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
                  {t('privacy.title')}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                  {t('privacy.lastUpdated')}
                </p>
              </div>
            </div>

            <Section title={t('privacy.s1Title')}>
              {t('privacy.s1Body')}
            </Section>

            <Section title={t('privacy.s2Title')}>
              {t('privacy.s2Intro')}
              <ul style={{ paddingLeft: '1.25rem', lineHeight: 2, marginTop: '0.5rem' }}>
                {t('privacy.s2Items', { returnObjects: true }).map((item, idx) => (
                  <li key={idx}><strong>{item.label}</strong> {item.text}</li>
                ))}
              </ul>
            </Section>

            <Section title={t('privacy.s3Title')}>
              {t('privacy.s3Intro')}
              <ul style={{ paddingLeft: '1.25rem', lineHeight: 2, marginTop: '0.5rem' }}>
                {t('privacy.s3Items', { returnObjects: true }).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </Section>

            <Section title={t('privacy.s4Title')}>
              {t('privacy.s4Intro')}
              <ul style={{ paddingLeft: '1.25rem', lineHeight: 2, marginTop: '0.5rem' }}>
                {t('privacy.s4Items', { returnObjects: true }).map((item, idx) => (
                  <li key={idx}><strong>{item.label}</strong> {item.text}</li>
                ))}
              </ul>
            </Section>

            <Section title={t('privacy.s5Title')}>
              {t('privacy.s5Intro')}
              <ul style={{ paddingLeft: '1.25rem', lineHeight: 2, marginTop: '0.5rem' }}>
                {t('privacy.s5Items', { returnObjects: true }).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </Section>

            <Section title={t('privacy.s6Title')}>
              {t('privacy.s6Body')}
            </Section>

            <Section title={t('privacy.s7Title')}>
              {t('privacy.s7Intro')}
              <ul style={{ paddingLeft: '1.25rem', lineHeight: 2, marginTop: '0.5rem' }}>
                {t('privacy.s7Items', { returnObjects: true }).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              {t('privacy.s7Contact')}
            </Section>

            <Section title={t('privacy.s8Title')}>
              {t('privacy.s8Body')}
            </Section>

            <Section title={t('privacy.s9Title')}>
              {t('privacy.s9Body')}
            </Section>

            <Section title={t('privacy.s10Title')}>
              {t('privacy.s10Body')}
            </Section>

            <Section title={t('privacy.s11Title')} last>
              {t('privacy.s11Body')}
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