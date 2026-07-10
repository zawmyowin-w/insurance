import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Fetch current user info
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => { logout() })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token: t, user: u } = res.data
    localStorage.setItem('token', t)
    api.defaults.headers.common['Authorization'] = `Bearer ${t}`
    setToken(t)
    setUser(u)
    return u
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

  const value = { user, token, loading, login, register, logout, setUser }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
