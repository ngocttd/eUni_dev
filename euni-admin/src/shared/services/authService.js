import api, { SERVICE } from '../../lib/api/client.js'
import tokenService from './tokenService.js'
import { startLogin, refreshSession as refreshSso, logoutUrl } from '../../lib/sso/oidc.js'

const auth = api(SERVICE.auth)

/**
 * Hai cách đăng nhập:
 *  1. SSO Microsoft 365 qua Keycloak (OIDC + PKCE) — loginWithSso(); phiên có `sso: true`, token là token của Keycloak.
 *     Backend/gateway phải kiểm tra JWT của Keycloak (JWKS của realm).
 *  2. auth-api của gateway (mock/dev & tài khoản nội bộ):
 *       POST /api/auth/login   { username, password } | { role }
 *       GET  /api/auth/me · POST /api/auth/refresh · POST /api/auth/logout
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
  /** Chuyển hướng sang Keycloak → Microsoft 365. `returnTo`: trang quay lại sau khi đăng nhập. */
  async loginWithSso(opts) {
    return startLogin(opts)
  },
  /** Lưu phiên SSO sau khi trang callback đổi code lấy token. */
  setSsoSession(session) {
    tokenService.setSession(session)
    return session.user
  },
  async me() {
    const session = tokenService.getSession()
    if (!session?.accessToken) return null
    if (session.sso) {
      if (session.expiresAt && session.expiresAt - Date.now() < 30_000) {
        try { const next = await refreshSso(session); tokenService.setSession(next); return next.user } catch { tokenService.clear(); return null }
      }
      return session.user
    }
    try {
      const data = await auth.get('/api/auth/me')
      return data?.user || null
    } catch (err) {
      if (err.status === 401) { tokenService.clear(); return null }
      throw err
    }
  },
  async refresh() {
    const session = tokenService.getSession()
    if (!session?.accessToken) return null
    try {
      if (session.sso) { const next = await refreshSso(session); tokenService.setSession(next); return { accessToken: next.accessToken, user: next.user } }
      const data = await auth.post('/api/auth/refresh')
      tokenService.setSession({ accessToken: data.accessToken, user: data.user })
      return data
    } catch {
      tokenService.clear()
      return null
    }
  },
  async logout() {
    const session = tokenService.getSession()
    tokenService.clear()
    if (session?.sso) { window.location.assign(logoutUrl(session)); return }  // đăng xuất tập trung, Keycloak đưa về trang chủ
    try { await auth.post('/api/auth/logout') } catch { /* bỏ qua */ }
  },
}

export default authService
