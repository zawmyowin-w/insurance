import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function PrivacyPolicyPage() {
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
              <i className="bi bi-shield-lock" style={{ color: '#fff', fontSize: '1.2rem' }}></i>
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>Privacy Policy</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Last updated: January 1, 2025</p>
            </div>
          </div>

          <Section title="1. Introduction">
            Digital Insurance Claim and Premiums Portal ("we", "our", "the Portal") is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use our services.
          </Section>

          <Section title="2. Information We Collect">
            We collect the following types of information:
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 2, marginTop: '0.5rem' }}>
              <li><strong>Account information:</strong> Full name, email address, phone number, and home address.</li>
              <li><strong>Identity documents:</strong> National Registration Card (NRC) or other identity documents submitted for policy applications.</li>
              <li><strong>Financial information:</strong> Payment screenshots and transaction references for premium payments.</li>
              <li><strong>Claims data:</strong> Incident details, supporting documents, and photographs submitted with claims.</li>
              <li><strong>Usage data:</strong> Log data, device information, and browsing activity within the Portal.</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            Your information is used to:
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 2, marginTop: '0.5rem' }}>
              <li>Create and manage your account and insurance policies.</li>
              <li>Process policy applications, premium payments, and claims.</li>
              <li>Send you notifications about your account and policy status.</li>
              <li>Comply with legal and regulatory obligations under Myanmar law.</li>
              <li>Detect and prevent fraud and unauthorized activity.</li>
              <li>Improve the Portal's features and user experience.</li>
            </ul>
          </Section>

          <Section title="4. Legal Basis for Processing">
            We process your personal data on the following legal bases:
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 2, marginTop: '0.5rem' }}>
              <li><strong>Contractual necessity:</strong> To provide insurance services you have requested.</li>
              <li><strong>Legal obligation:</strong> To comply with Myanmar insurance regulations and financial laws.</li>
              <li><strong>Legitimate interests:</strong> To prevent fraud and maintain the security of our platform.</li>
              <li><strong>Consent:</strong> Where you have explicitly agreed, such as for marketing communications.</li>
            </ul>
          </Section>

          <Section title="5. Data Sharing">
            We do not sell your personal data. We may share your information with:
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 2, marginTop: '0.5rem' }}>
              <li>Licensed insurance agents assigned to your account.</li>
              <li>Reinsurance partners and underwriters as required to process your policy.</li>
              <li>Government and regulatory authorities when legally required.</li>
              <li>Technology service providers who help us operate the Portal, under strict confidentiality agreements.</li>
            </ul>
          </Section>

          <Section title="6. Data Retention">
            We retain your personal data for as long as your account is active and for a minimum of 7 years after policy expiry, as required by Myanmar insurance regulations. Claims data may be retained longer where legal proceedings are ongoing.
          </Section>

          <Section title="7. Your Rights">
            You have the right to:
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 2, marginTop: '0.5rem' }}>
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data (subject to legal retention requirements).</li>
              <li>Withdraw consent for marketing communications at any time.</li>
            </ul>
            To exercise these rights, contact us at <strong>privacy@dicp.com.mm</strong>.
          </Section>

          <Section title="8. Security">
            We implement industry-standard security measures including encrypted data storage, secure HTTPS connections, and role-based access controls. However, no online system can guarantee absolute security.
          </Section>

          <Section title="9. Cookies">
            The Portal uses session cookies required for authentication. We do not use third-party advertising cookies. You may disable cookies in your browser settings, but this may affect Portal functionality.
          </Section>

          <Section title="10. Changes to This Policy">
            We may update this Privacy Policy periodically. We will notify you of significant changes via email or in-app notification. Continued use of the Portal constitutes acceptance of the updated policy.
          </Section>

          <Section title="11. Contact Us">
            For privacy-related enquiries, contact our Data Protection Officer at <strong>privacy@dicp.com.mm</strong> or write to us at our registered office in Yangon, Myanmar.
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
