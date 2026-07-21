import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const steps = [
  { num: 1, icon: 'bi-person-plus', title: 'Register an Account', desc: 'Create your free customer account with your basic information. No upfront payment required to register.' },
  { num: 2, icon: 'bi-search', title: 'Explore Insurance Plans', desc: 'Browse all available insurance plans. Use the premium calculator to estimate your costs before committing.' },
  { num: 3, icon: 'bi-file-earmark-text', title: 'Submit Your Application', desc: 'Choose your desired plan, fill in the application form with your personal details, and submit it to the assigned agent.' },
  { num: 4, icon: 'bi-person-badge', title: 'Agent Review', desc: 'A licensed insurance agent reviews your application for completeness and accuracy, then forwards it to admin as "Verified".' },
  { num: 5, icon: 'bi-clipboard-check', title: 'Admin Approval', desc: 'Our admin team conducts a final review. If approved, you receive a notification to proceed with payment.' },
  { num: 6, icon: 'bi-credit-card', title: 'Make Premium Payment', desc: 'Transfer the premium amount and upload your payment screenshot. Admin verifies the payment and activates your policy.' },
  { num: 7, icon: 'bi-file-earmark-pdf', title: 'Receive Your Policy', desc: 'Once payment is confirmed, you receive your official insurance policy contract as a PDF document via the portal.' },
  { num: 8, icon: 'bi-shield-check', title: "You're Protected!", desc: 'Your insurance coverage is now active. Receive timely payment reminders and submit claims whenever needed.' },
]

const claimSteps = [
  { icon: 'bi-exclamation-triangle', title: 'Incident Occurs', desc: 'An insured event happens (accident, health issue, etc.).' },
  { icon: 'bi-file-earmark-plus', title: 'Submit a Claim', desc: 'Log in, select your active policy, and submit a claim with required documents.' },
  { icon: 'bi-person-badge', title: 'Agent Verification', desc: 'Your agent reviews the claim documents and marks it as verified.' },
  { icon: 'bi-check2-all', title: 'Admin Decision', desc: 'Admin approves or rejects the claim. You are notified of the outcome.' },
  { icon: 'bi-cash-coin', title: 'Receive Payout', desc: 'Approved claims are processed and compensation is disbursed to you.' },
]

export default function HowItWorksPage() {
  const { t } = useTranslation()

  return (
    <div>
      <Navbar />

      <section style={{ background: 'var(--bg)', padding: '3.5rem 0 2rem', borderBottom: '1px solid var(--border)' }}>
        <div className="container text-center">
          <h1 className="section-title">{t('how.title')}</h1>
          <p className="section-subtitle mx-auto">{t('how.subtitle')}</p>
        </div>
      </section>

      {/* Getting Started */}
      <section style={{ background: 'var(--bg-secondary)', padding: '4rem 0' }}>
        <div className="container">
          <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2rem', fontSize: '1.5rem' }}>
            Getting Started with Insurance
          </h2>
          <div className="row g-4">
            {steps.map((step, idx) => (
              <div key={step.num} className="col-12 col-md-6 col-lg-3">
                <div className="card-custom h-100">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="step-number">{step.num}</div>
                    <i className={`bi ${step.icon}`} style={{ fontSize: '1.3rem', color: 'var(--accent)' }}></i>
                  </div>
                  <h6 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{step.title}</h6>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Claims Process */}
      <section style={{ background: 'var(--bg)', padding: '4rem 0' }}>
        <div className="container">
          <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
            Claims Process
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>How to file and track your insurance claim</p>
          <div className="row g-4 align-items-start">
            {claimSteps.map((step, idx) => (
              <div key={step.title} className="col-12 col-sm-6 col-lg">
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'var(--bg-secondary)', border: '2px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem', fontSize: '1.5rem', color: 'var(--primary)'
                  }}>
                    <i className={`bi ${step.icon}`}></i>
                  </div>
                  <h6 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{step.title}</h6>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section style={{ background: 'var(--bg-secondary)', padding: '4rem 0' }}>
        <div className="container">
          <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2rem', fontSize: '1.5rem' }}>
            User Roles Explained
          </h2>
          <div className="row g-4">
            {[
              { icon: 'bi-person', color: '#1d4ed8', bg: '#eff6ff', title: 'Customer', desc: 'Browse plans, submit applications, pay premiums, and file claims. Self-register on the portal.' },
              { icon: 'bi-person-badge', color: '#16a34a', bg: '#f0fdf4', title: 'Agent', desc: 'Review and verify customer applications and claims before forwarding to admin. Account created by admin.' },
              { icon: 'bi-shield-lock', color: '#9333ea', bg: '#faf5ff', title: 'Admin', desc: 'Full system control: manage packages, users, approve/reject applications and claims, send notifications.' },
            ].map(role => (
              <div key={role.title} className="col-12 col-md-4">
                <div className="card-custom h-100">
                  <div style={{
                    width: 52, height: 52, borderRadius: 12,
                    background: role.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1rem'
                  }}>
                    <i className={`bi ${role.icon}`} style={{ fontSize: '1.4rem', color: role.color }}></i>
                  </div>
                  <h5 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{role.title}</h5>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>{role.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--primary)', padding: '4rem 0' }}>
        <div className="container text-center">
          <h2 style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem' }}>Ready to get started?</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', maxWidth: 460, margin: '0 auto 2rem' }}>
            Join over 1 million families already protected by our insurance plans.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/register" style={{
              background: '#fff', color: 'var(--primary)', padding: '0.75rem 2rem',
              borderRadius: 8, fontWeight: 600, textDecoration: 'none'
            }}>Register Now</Link>
            <Link to="/plans" style={{
              border: '2px solid rgba(255,255,255,0.5)', color: '#fff', padding: '0.75rem 2rem',
              borderRadius: 8, fontWeight: 600, textDecoration: 'none'
            }}>View Plans</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
