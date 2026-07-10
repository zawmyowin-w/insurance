import axios from 'axios'
import { resolveMock } from './mockData'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Response interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status
    const config = err.config || {}

    // Only intercept pure network failures (no response at all) or Vite proxy 502
    // — NOT genuine 500/503 backend errors, so real server faults are not masked.
    const isOffline = !err.response || status === 502

    if (isOffline && config.url) {
      // Auth endpoints are handled by AuthContext — don't mock them here
      const path = config.url.replace(/^\/api/, '').split('?')[0]
      const authRoutes = ['/auth/login', '/auth/register', '/auth/me']
      if (!authRoutes.includes(path)) {
        const mock = resolveMock(config.method || 'get', config.url)
        if (mock) {
          return Promise.resolve({
            ...mock,
            status: 200,
            statusText: 'OK (mock)',
            headers: {},
            config,
          })
        }
      }
    }

    // Real 401 → force logout
    if (status === 401) {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(err)
  }
)

export default api
