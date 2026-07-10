import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

// ── Mock users for demo/offline mode (backend not running) ────────────────────
const MOCK_USERS = {
  'admin@dicp.com.mm': {
    password: 'Admin@123',
    user: { id: 1, name: 'System Admin', email: 'admin@dicp.com.mm', role: 'ADMIN', active: true }
  },
  'agent@dicp.com.mm': {
    password: 'Agent@123',
    user: { id: 2, name: 'Agent Ko Htet', email: 'agent@dicp.com.mm', role: 'AGENT', insuranceType: 'LIFE', active: true }
  },
  'customer@dicp.com.mm': {
    password: 'Customer@123',
    user: { id: 3, name: 'Demo Customer', email: 'customer@dicp.com.mm', role: 'CUSTOMER', active: true }
  }
}

function makeMockToken(user) {
  // Encode a minimal mock JWT-shaped token (not cryptographically valid — dev only)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ sub: user.email, role: user.role, exp: Date.now() + 86400000 }))
  return `${header}.${payload}.mock`
}

function isMockToken(token) {
  return token && token.endsWith('.mock')
}

function getUserFromMockToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const match = Object.values(MOCK_USERS).find(u => u.user.email === payload.sub)
    return match ? match.user : null
  } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }

    // Mock token — resolve user locally without hitting the backend
    if (isMockToken(token)) {
      const u = getUserFromMockToken(token)
      if (u) { setUser(u); setLoading(false) }
      else { logout(); setLoading(false) }
      return
    }

    // Real JWT — validate with backend
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => logout())
      .finally(() => setLoading(false))
  }, [token])

  const login = async (email, password) => {
    // Try real backend first
    try {
      const res = await api.post('/auth/login', { email, password })
      const { token: t, user: u } = res.data
      localStorage.setItem('token', t)
      api.defaults.headers.common['Authorization'] = `Bearer ${t}`
      setToken(t)
      setUser(u)
      return u
    } catch (err) {
      // Backend unreachable (network error / 502 / 503) → fall back to mock
      const isNetworkError = !err.response || err.response.status >= 500
      if (isNetworkError) {
        const mock = MOCK_USERS[email.toLowerCase()]
        if (mock && mock.password === password) {
          const t = makeMockToken(mock.user)
          localStorage.setItem('token', t)
          setToken(t)
          setUser(mock.user)
          return mock.user
        }
        // If credentials don't match mock either, surface a clear message
        if (mock) throw new Error('Invalid password for demo account.')
        throw new Error('Backend is offline. Use a demo account to explore the UI.')
      }
      // Backend returned a proper error (401, 400) — propagate it
      throw err
    }
  }

  const register = async (data) => {
    const res = await api.post('/auth/register', data)
    const { token: t, user: u } = res.data
    localStorage.setItem('token', t)
    api.defaults.headers.common['Authorization'] = `Bearer ${t}`
    setToken(t)
    setUser(u)
    return u
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
