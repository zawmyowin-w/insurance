// ─────────────────────────────────────────────────────────────────────────────
// Mock data returned when the Spring Boot backend is offline.
// Keyed by a simple pattern match on the request URL + method.
// ─────────────────────────────────────────────────────────────────────────────

const now   = new Date().toISOString()
const ago   = d => new Date(Date.now() - d * 86_400_000).toISOString()

// ── Shared seed data ──────────────────────────────────────────────────────────
export const MOCK_PACKAGES = [
  { id: 1, name: 'Basic Life Cover',    type: 'LIFE',     coverageAmount: 10_000_000, annualPremium: 120_000,  durationYears: 1,  description: 'Entry-level life insurance for individuals.',    features: ['Death benefit','Accidental cover'],                   active: true  },
  { id: 2, name: 'Family Health Shield',type: 'HEALTH',   coverageAmount: 30_000_000, annualPremium: 350_000,  durationYears: 1,  description: 'Comprehensive health plan for the whole family.',features: ['Hospitalization','OPD visits','Dental & vision'],       active: true  },
  { id: 3, name: 'Vehicle Guard Plus',  type: 'VEHICLE',  coverageAmount: 15_000_000, annualPremium: 200_000,  durationYears: 1,  description: 'Full-coverage motor insurance.',                  features: ['Collision','Theft','Third-party liability'],            active: true  },
  { id: 4, name: 'Home & Property',     type: 'PROPERTY', coverageAmount: 50_000_000, annualPremium: 480_000,  durationYears: 1,  description: 'Protects your home against fire, flood & more.',  features: ['Natural disaster','Fire & smoke','Burglary'],           active: true  },
  { id: 5, name: 'Premium Life Plus',   type: 'LIFE',     coverageAmount: 50_000_000, annualPremium: 550_000,  durationYears: 5,  description: 'High-value life coverage with investment returns.',features: ['Death & disability','Investment component','Tax benefit'],active: false },
]

const MOCK_APPLICATIONS = [
  { id: 1, packageName: 'Basic Life Cover',     status: 'PENDING',  appliedAt: ago(5),  fullName: 'Aung Ko',    age: 29, premium: 120_000 },
  { id: 2, packageName: 'Family Health Shield', status: 'VERIFIED', appliedAt: ago(12), fullName: 'Ma Thida',   age: 34, premium: 350_000 },
  { id: 3, packageName: 'Vehicle Guard Plus',   status: 'APPROVED', appliedAt: ago(20), fullName: 'Ko Zaw',     age: 41, premium: 200_000 },
  { id: 4, packageName: 'Home & Property',      status: 'REJECTED', appliedAt: ago(30), fullName: 'Daw Aye',    age: 55, premium: 480_000 },
  { id: 5, packageName: 'Premium Life Plus',    status: 'PENDING',  appliedAt: ago(2),  fullName: 'Kyaw Soe',   age: 27, premium: 550_000 },
]

const MOCK_CLAIMS = [
  { id: 1, claimNumber: 'CLM-2024-001', applicationId: 3, packageName: 'Vehicle Guard Plus', type: 'VEHICLE',  amount: 2_500_000, status: 'PENDING',  submittedAt: ago(3),  description: 'Rear-end collision on Yangon-Mandalay highway.' },
  { id: 2, claimNumber: 'CLM-2024-002', applicationId: 2, packageName: 'Family Health Shield',type: 'HEALTH',   amount: 850_000,  status: 'VERIFIED', submittedAt: ago(8),  description: 'Emergency hospitalization – appendectomy.' },
  { id: 3, claimNumber: 'CLM-2024-003', applicationId: 3, packageName: 'Vehicle Guard Plus', type: 'VEHICLE',  amount: 500_000,  status: 'APPROVED', submittedAt: ago(15), description: 'Windshield replacement.' },
  { id: 4, claimNumber: 'CLM-2024-004', applicationId: 2, packageName: 'Family Health Shield',type: 'HEALTH',   amount: 120_000,  status: 'REJECTED', submittedAt: ago(22), description: 'OPD visit – pre-existing condition.' },
]

const MOCK_PAYMENTS = [
  { id: 1, applicationId: 3, packageName: 'Vehicle Guard Plus',    amount: 200_000, status: 'PAID',    paidAt: ago(18), method: 'KBZ Pay'    },
  { id: 2, applicationId: 2, packageName: 'Family Health Shield',  amount: 350_000, status: 'PAID',    paidAt: ago(10), method: 'Wave Money' },
  { id: 3, applicationId: 1, packageName: 'Basic Life Cover',      amount: 120_000, status: 'PENDING', paidAt: null,    method: null         },
]

const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'Application Received',  message: 'Your application for Basic Life Cover has been received and is under review.', type: 'INFO',    read: false, createdAt: ago(2) },
  { id: 2, title: 'Payment Confirmed',     message: 'Payment of MMK 350,000 for Family Health Shield has been confirmed.',          type: 'SUCCESS', read: true,  createdAt: ago(9) },
  { id: 3, title: 'Claim Update',          message: 'Your claim CLM-2024-002 has been verified and forwarded for approval.',        type: 'INFO',    read: false, createdAt: ago(7) },
  { id: 4, title: 'Document Required',     message: 'Please upload your NRC copy for application #1 to proceed.',                   type: 'WARNING', read: true,  createdAt: ago(14)},
]

const MOCK_USERS = [
  { id: 1, name: 'System Admin',   email: 'admin@dicp.com.mm',    role: 'ADMIN',    active: true,  createdAt: ago(90) },
  { id: 2, name: 'Agent Ko Htet', email: 'agent@dicp.com.mm',    role: 'AGENT',    active: true,  createdAt: ago(60), insuranceType: 'LIFE'   },
  { id: 3, name: 'Demo Customer', email: 'customer@dicp.com.mm', role: 'CUSTOMER', active: true,  createdAt: ago(30) },
  { id: 4, name: 'Ma Su Su',      email: 'masu@example.com',     role: 'CUSTOMER', active: true,  createdAt: ago(20) },
  { id: 5, name: 'U Tin Win',     email: 'tinwin@example.com',   role: 'CUSTOMER', active: false, createdAt: ago(45) },
]

const MOCK_ACTIVITIES = [
  { id: 1, type: 'APPLICATION', message: 'New application submitted by Aung Ko',          timestamp: ago(0.1) },
  { id: 2, type: 'CLAIM',       message: 'Claim CLM-2024-002 verified by Agent Ko Htet',  timestamp: ago(0.3) },
  { id: 3, type: 'PAYMENT',     message: 'Payment of MMK 350,000 confirmed for Ma Thida', timestamp: ago(1)   },
  { id: 4, type: 'USER',        message: 'New customer Ma Su Su registered',               timestamp: ago(2)   },
  { id: 5, type: 'APPLICATION', message: 'Application #4 rejected – incomplete documents', timestamp: ago(3)   },
]

// ── Route resolver ────────────────────────────────────────────────────────────
// Returns { data } shaped like an axios response, or null to pass through.

export function resolveMock(method, url) {
  const m = method.toLowerCase()
  const u = url.replace(/^\/api/, '').split('?')[0]   // strip /api prefix + query

  // ── Auth ──────────────────────────────────────────────────────────────────
  if (u === '/auth/login'    && m === 'post') return null  // handled in AuthContext
  if (u === '/auth/register' && m === 'post') return null  // handled in AuthContext
  if (u === '/auth/me'       && m === 'get' ) return null  // handled in AuthContext

  // ── Public packages ───────────────────────────────────────────────────────
  if (u === '/packages/public' && m === 'get') return { data: MOCK_PACKAGES.filter(p => p.active) }

  // ── Customer ──────────────────────────────────────────────────────────────
  if (u === '/customer/dashboard/stats' && m === 'get')
    return { data: { totalApplications: 3, activePolicies: 1, pendingClaims: 1, totalPremiumPaid: 550_000 } }

  if (u.startsWith('/customer/applications') && m === 'get')
    return { data: MOCK_APPLICATIONS.slice(0, 3) }

  if (u.startsWith('/customer/claims') && m === 'get')
    return { data: MOCK_CLAIMS.slice(0, 2) }

  if (u.startsWith('/customer/payments') && m === 'get')
    return { data: MOCK_PAYMENTS }

  if (u.startsWith('/customer/notifications') && m === 'get')
    return { data: MOCK_NOTIFICATIONS }

  // ── Agent ─────────────────────────────────────────────────────────────────
  if (u === '/agent/dashboard/stats' && m === 'get')
    return { data: { pendingApplications: 2, pendingClaims: 1, verifiedToday: 1, totalAssigned: 5 } }

  if (u.startsWith('/agent/applications') && m === 'get')
    return { data: MOCK_APPLICATIONS.filter(a => ['PENDING','VERIFIED'].includes(a.status)) }

  if (u.startsWith('/agent/claims') && m === 'get')
    return { data: MOCK_CLAIMS.filter(c => ['PENDING','VERIFIED'].includes(c.status)) }

  if (u.startsWith('/agent/notifications') && m === 'get')
    return { data: MOCK_NOTIFICATIONS }

  // ── Admin ─────────────────────────────────────────────────────────────────
  if (u === '/admin/dashboard/stats' && m === 'get')
    return { data: { totalUsers: 5, totalApplications: 5, totalClaims: 4, totalRevenue: 1_220_000, pendingApplications: 2, pendingClaims: 1 } }

  if (u === '/admin/recent-activities' && m === 'get')
    return { data: MOCK_ACTIVITIES }

  if (u.startsWith('/admin/packages') && m === 'get')
    return { data: MOCK_PACKAGES }

  if (u.startsWith('/admin/users') && m === 'get')
    return { data: MOCK_USERS }

  if (u.startsWith('/admin/applications') && m === 'get')
    return { data: MOCK_APPLICATIONS }

  if (u.startsWith('/admin/claims') && m === 'get')
    return { data: MOCK_CLAIMS }

  if (u.startsWith('/admin/notifications') && m === 'get')
    return { data: MOCK_NOTIFICATIONS }

  // ── Write mutations (POST/PUT/DELETE) → acknowledge silently ─────────────
  if (['post', 'put', 'delete', 'patch'].includes(m))
    return { data: { success: true, message: 'Demo mode: changes are not persisted.' } }

  return null   // unknown route → let it fail normally
}
