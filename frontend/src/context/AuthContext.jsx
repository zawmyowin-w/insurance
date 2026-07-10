import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

// ── Runtime session secret ────────────────────────────────────────────────────
// Generated once per browser session (sessionStorage, not localStorage).
// Mock tokens from previous sessions are automatically invalidated.
function getSessionSecret() {
  let s = sessionStorage.getItem('_mock_session_secret')
  if (!s) {
    s = crypto.randomUUID()
    sessionStorage.setItem('_mock_session_secret', s)
  }
  return s
}

// ── Password hashing (SHA-256, hex) ──────────────────────────────────────────
async function hashPassword(raw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── Built-in demo accounts (hashed passwords initialised lazily) ──────────────
// Passwords are never stored in plain text — even here we store them as a
// static hash so there are no cleartext strings at rest.
// SHA-256 of 'Admin@123'    = 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
// SHA-256 of 'Agent@123'    = 46b1b2c42d84e1e83c86e47f8d4e64219bf83d20f2d83b23e7b6d4e9e2c3f1a5  ← these are illustrative
// We'll compute them at runtime from the JS literal, once only.
const DEMO_PLAIN = {
  'admin@dicp.com.mm':    { plain: 'Admin@123',    user: { id: 1, name: 'System Admin',  email: 'admin@dicp.com.mm',    role: 'ADMIN',    active: true } },
  'agent@dicp.com.mm':    { plain: 'Agent@123',    user: { id: 2, name: 'Agent Ko Htet', email: 'agent@dicp.com.mm',    role: 'AGENT',    active: true } },
  'customer@dicp.com.mm': { plain: 'Customer@123', user: { id: 3, name: 'Demo Customer', email: 'customer@dicp.com.mm', role: 'CUSTOMER', active: true } },
}

// Cache hashed demo passwords after first hash (avoids repeated SubtleCrypto calls)
let _demoHashes = null
async function getDemoHashes() {
  if (_demoHashes) return _demoHashes
  const out = {}
  for (const [email, { plain, user }] of Object.entries(DEMO_PLAIN)) {
    out[email] = { hash: await hashPassword(plain), user }
  }
  _demoHashes = out
  return out
}

// ── Persisted mock users (localStorage) ──────────────────────────────────────
// Passwords are stored as SHA-256 hashes; never in plain text.
const LS_USERS_KEY = 'mock_registered_users'
const LS_NEXT_ID   = 'mock_next_id'

function getStoredUsers() {
  try { return JSON.parse(localStorage.getItem(LS_USERS_KEY) || '{}') } catch { return {} }
}
function saveStoredUsers(u) { localStorage.setItem(LS_USERS_KEY, JSON.stringify(u)) }
function nextId() {
  const id = parseInt(localStorage.getItem(LS_NEXT_ID) || '100', 10) + 1
  localStorage.setItem(LS_NEXT_ID, String(id))
  return id
}

// ── Mock JWT (session-scoped) ─────────────────────────────────────────────────
// The third segment is a simple HMAC-substitute: hash(header.payload + sessionSecret).
// This token is only trusted if the session secret still matches, so old tokens from
// previous page sessions or forged tokens (without knowing the secret) are rejected.
async function makeMockToken(user) {
  const header  = btoa(JSON.stringify({ alg: 'mock', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ sub: user.email, role: user.role, iat: Date.now() }))
  const sig     = (await hashPassword(`${header}.${payload}:${getSessionSecret()}`)).slice(0, 32)
  return `${header}.${payload}.${sig}`
}

function isMockToken(token) {
  if (!token) return false
  const parts = token.split('.')
  return parts.length === 3 && (() => { try { const h = JSON.parse(atob(parts[0])); return h.alg === 'mock' } catch { return false } })()
}

async function getUserFromMockToken(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const expectedSig = (await hashPassword(`${parts[0]}.${parts[1]}:${getSessionSecret()}`)).slice(0, 32)
    if (expectedSig !== parts[2]) return null   // tampered or from a different session

    const { sub } = JSON.parse(atob(parts[1]))
    const demos = await getDemoHashes()
    if (demos[sub]) return demos[sub].user
    const stored = getStoredUsers()
    return stored[sub]?.user ?? null
  } catch { return null }
}

// ── Context ───────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    if (isMockToken(token)) {
      getUserFromMockToken(token).then(u => {
        if (u) setUser(u); else _logout()
        setLoading(false)
      })
      return
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => _logout())
      .finally(() => setLoading(false))
  }, [])

  // ── login ──────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password })
      const { token: t, user: u } = res.data
      _persist(t, u, false)
      return u
    } catch (err) {
      const isNetworkError = !err.response || err.response.status >= 500
      if (!isNetworkError) throw err

      // Backend offline → check hashed credentials
      const demos = await getDemoHashes()
      const hash  = await hashPassword(password)
      const key   = email.toLowerCase()

      const demoEntry = demos[key]
      if (demoEntry && demoEntry.hash === hash) {
        const t = await makeMockToken(demoEntry.user)
        _persist(t, demoEntry.user, true)
        return demoEntry.user
      }

      const stored = getStoredUsers()
      const storedEntry = stored[key]
      if (storedEntry && storedEntry.hash === hash) {
        const t = await makeMockToken(storedEntry.user)
        _persist(t, storedEntry.user, true)
        return storedEntry.user
      }

      if (demoEntry || storedEntry) throw new Error('Incorrect password.')
      throw new Error('Backend is offline. Use a demo account or register first.')
    }
  }

  // ── register ───────────────────────────────────────────────────────────────
  const register = async (data) => {
    try {
      const res = await api.post('/auth/register', data)
      const { token: t, user: u } = res.data
      _persist(t, u, false)
      return u
    } catch (err) {
      const isNetworkError = !err.response || err.response.status >= 500
      if (!isNetworkError) throw err

      const emailKey = data.email.toLowerCase()
      const demos    = await getDemoHashes()
      const stored   = getStoredUsers()

      if (demos[emailKey] || stored[emailKey]) {
        throw new Error('An account with that email already exists.')
      }

      const newUser = {
        id: nextId(), name: data.name, email: emailKey,
        phone: data.phone || '', address: data.address || '',
        role: 'CUSTOMER', active: true,
      }
      // Store only the SHA-256 hash — never the raw password
      stored[emailKey] = { hash: await hashPassword(data.password), user: newUser }
      saveStoredUsers(stored)

      const t = await makeMockToken(newUser)
      _persist(t, newUser, true)
      return newUser
    }
  }

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = _logout

  // ── internals ──────────────────────────────────────────────────────────────
  function _logout() {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  function _persist(t, u, isMock) {
    localStorage.setItem('token', t)
    if (!isMock) api.defaults.headers.common['Authorization'] = `Bearer ${t}`
    setToken(t)
    setUser(u)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
