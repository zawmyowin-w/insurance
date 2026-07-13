import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function TermsPage() {
  const { t } = useTranslation()
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <div className="mb-4">
          <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem' }}>
            <i className="bi bi-arrow-left me-1"></i> Back to Register
          </Link>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '2.5rem' }}>
          <div className="d-flex align-items-center gap-3 mb-4">
            <div style={{ width: 44, height: 44, background: 'var(--primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="bi bi-file-earmark-text" style={{ color: '#fff', fontSize: '1.2rem' }}></i>
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>Terms of Service</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Last updated: January 1, 2025</p>
            </div>
          </div>

          <Section title="1. Acceptance of Terms">
            By creating an account and using the Digital Insurance Claim and Premiums Portal ("the Portal"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Portal.
          </Section>

          <Section title="2. Eligibility">
            You must be at least 18 years of age and a resident of Myanmar to register and use our services. By registering, you confirm that all information you provide is accurate, current, and complete.
          </Section>

          <Section title="3. Account Registration">
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 2 }}>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree to notify us immediately of any unauthorized access to your account.</li>
              <li>One person may not maintain more than one active customer account.</li>
              <li>We reserve the right to suspend or terminate accounts found to violate these terms.</li>
            </ul>
          </Section>

          <Section title="4. Insurance Services">
            The Portal facilitates access to insurance products. By submitting a policy application you acknowledge:
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 2, marginTop: '0.5rem' }}>
              <li>All information provided in applications must be truthful and accurate.</li>
              <li>Providing false information may result in policy cancellation and legal action.</li>
              <li>Policy approval is subject to underwriting review and is not guaranteed.</li>
              <li>Premium amounts shown in the calculator are estimates only.</li>
            </ul>
          </Section>

          <Section title="5. Claims">
            When filing a claim you agree to:
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 2, marginTop: '0.5rem' }}>
              <li>Submit only honest and truthful claims supported by valid documentation.</li>
              <li>Cooperate fully with any investigation conducted by our claims team.</li>
              <li>Fraudulent claims will be rejected and may result in criminal prosecution.</li>
            </ul>
          </Section>

          <Section title="6. Payments">
            All premium payments must be made according to your policy schedule. Late or missed payments may result in policy lapse. Payment receipts must be uploaded accurately — submitting fraudulent payment screenshots constitutes fraud.
          </Section>

          <Section title="7. Privacy">
            Your use of the Portal is also governed by our <Link to="/privacy" style={{ color: 'var(--primary)' }}>Privacy Policy</Link>, which is incorporated into these Terms by reference.
          </Section>

          <Section title="8. Limitation of Liability">
            To the fullest extent permitted by law, the Portal and its operators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.
          </Section>

          <Section title="9. Changes to Terms">
            We reserve the right to update these Terms at any time. Continued use of the Portal after changes constitutes acceptance of the updated Terms.
          </Section>

          <Section title="10. Governing Law">
            These Terms are governed by the laws of the Republic of the Union of Myanmar. Any disputes shall be resolved in the courts of Yangon.
          </Section>

          <Section title="11. Contact">
            For questions about these Terms, contact us at <strong>legal@dicp.com.mm</strong> or call <strong>+95 1 234 5678</strong>.
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.6rem' }}>{title}</h2>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0, fontSize: '0.95rem' }}>{children}</p>
    </div>
  )
}
