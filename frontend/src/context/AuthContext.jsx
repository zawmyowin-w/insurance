import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { mockRegister, mockLogin, mockMe } from '../services/mockAuth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }

    mockMe(token)
      .then(u => setUser(u))
      .catch(() => {
        localStorage.removeItem('token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const { token: t, user: u } = await mockLogin(email, password)
    localStorage.setItem('token', t)
    setToken(t)
    setUser(u)
    return u
  }

  const register = async (data) => {
    const { token: t, user: u } = await mockRegister(data)
    localStorage.setItem('token', t)
    setToken(t)
    setUser(u)
    return u
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
