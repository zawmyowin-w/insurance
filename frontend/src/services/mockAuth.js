/**
 * Mock auth service — stores users in localStorage so the app works
 * without the Spring Boot backend running.
 */

const USERS_KEY = 'mock_users'
const TOKEN_PREFIX = 'mock_token_'

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') } catch { return [] }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function makeToken(user) {
  return TOKEN_PREFIX + btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role }))
}

function decodeToken(token) {
  try {
    if (!token?.startsWith(TOKEN_PREFIX)) return null
    return JSON.parse(atob(token.slice(TOKEN_PREFIX.length)))
  } catch { return null }
}

// Seed default admin on first load
;(function seedAdmin() {
  const users = getUsers()
  if (!users.find(u => u.email === 'admin@dicp.com.mm')) {
    users.push({
      id: 1,
      name: 'Admin',
      email: 'admin@dicp.com.mm',
      phone: '09123456789',
      address: 'Yangon, Myanmar',
      role: 'ADMIN',
      password: 'Admin@123',
      emailVerified: true,
    })
    saveUsers(users)
  }
})()

export function mockRegister(data) {
  const users = getUsers()
  if (users.find(u => u.email === data.email)) {
    return Promise.reject({ response: { data: { message: 'Email already registered' } } })
  }
  const user = {
    id: Date.now(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address || '',
    role: data.role || 'CUSTOMER',
    password: data.password,
    emailVerified: false,
  }
  users.push(user)
  saveUsers(users)
  const { password, ...safeUser } = user
  return Promise.resolve({ user: safeUser })
}

export function mockLogin(email, password) {
  const users = getUsers()
  const user = users.find(u => u.email === email && u.password === password)
  if (!user) {
    return Promise.reject({ response: { data: { message: 'Invalid email or password' } } })
  }
  if (!user.emailVerified) {
    return Promise.reject({ response: { data: { message: 'EMAIL_NOT_VERIFIED', email } } })
  }
  const { password: _pw, ...safeUser } = user
  const token = makeToken(safeUser)
  return Promise.resolve({ token, user: safeUser })
}

export function mockMe(token) {
  const payload = decodeToken(token)
  if (!payload) return Promise.reject({ response: { status: 401 } })
  const users = getUsers()
  const user = users.find(u => u.id === payload.id)
  if (!user) return Promise.reject({ response: { status: 401 } })
  const { password, ...safeUser } = user
  return Promise.resolve(safeUser)
}

export function mockVerifyEmail(email) {
  const users = getUsers()
  const idx = users.findIndex(u => u.email === email)
  if (idx === -1) return false
  users[idx].emailVerified = true
  saveUsers(users)
  return true
}

export function mockGetUserByEmail(email) {
  return getUsers().find(u => u.email === email) || null
}

export function mockUpdatePassword(email, newPassword) {
  const users = getUsers()
  const idx = users.findIndex(u => u.email === email)
  if (idx === -1) return false
  users[idx].password = newPassword
  saveUsers(users)
  return true
}
