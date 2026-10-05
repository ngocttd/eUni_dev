import api, { SERVICE } from '../../lib/api/client.js'
import tokenService from './tokenService.js'

const auth = api(SERVICE.auth)

/**
 * Xác thực qua auth-api của API gateway:
 *   POST /api/auth/login   { username, password } | { role }   (role: chỉ dùng cho "vào cổng demo")
 *   GET  /api/auth/me
 *   POST /api/auth/refresh
 *   POST /api/auth/logout
 */
export const authService = {
  async login(credentials) {
    const data = await auth.post('/api/auth/login', credentials)
    tokenService.setSession({ accessToken: data.accessToken, user: data.user })
    return data
  },
  async loginAs(role) {
    return this.login({ role })
  },
  async me() {
    if (!tokenService.getAccessToken()) return null
    try {
      const data = await auth.get('/api/auth/me')
      return data?.user || null
    } catch (err) {
      if (err.status === 401) { tokenService.clear(); return null }
      throw err
    }
  },
  async refresh() {
    if (!tokenService.getAccessToken()) return null
    try {
      const data = await auth.post('/api/auth/refresh')
      tokenService.setSession({ accessToken: data.accessToken, user: data.user })
      return data
    } catch {
      tokenService.clear()
      return null
    }
  },
  async logout() {
    try { await auth.post('/api/auth/logout') } catch { /* bỏ qua */ }
    tokenService.clear()
  },
}

export default authService
