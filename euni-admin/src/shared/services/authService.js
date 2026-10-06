import api, { SERVICE } from '../../lib/api/client.js'
import tokenService from './tokenService.js'
import { startLogin, refreshSession as refreshSso, logoutUrl } from '../../lib/sso/oidc.js'

const auth = api(SERVICE.auth)

/**
 * Đăng nhập (docs/design/CMS_DESIGN.md §3):
 *  1. Identity Server (OIDC + PKCE) — loginWithSso({ method: 'school' | 'm365' }); phiên có `sso: true`, token do IdS cấp.
 *     Tài khoản trường và Microsoft 365 là cùng một người dùng (`sub`) trên IdS. Backend kiểm tra JWT bằng JWKS của IdS.
 *  2. auth-api của euni-api-mock (chỉ khi dev, NEXT_PUBLIC_AUTH_MODE=mock — mock đóng vai IdS):
 *       POST /api/v1/auth/login   { username, password } | { role }
 *       GET  /api/v1/auth/me · POST /api/v1/auth/refresh · POST /api/v1/auth/logout
 */
export const authService = {
  async login(credentials) {
    const data = await auth.post('/api/v1/auth/login', credentials)
    tokenService.setSession({ accessToken: data.accessToken, user: data.user })
    return data
  },
  async loginAs(role) {
    return this.login({ role })
  },
  /** Chuyển hướng sang Identity Server. `method`: 'school' | 'm365'; `returnTo`: trang quay lại sau khi đăng nhập. */
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
      const data = await auth.get('/api/v1/auth/me')
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
      const data = await auth.post('/api/v1/auth/refresh')
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
    if (session?.sso) { window.location.assign(logoutUrl(session)); return }  // đăng xuất tập trung, IdS đưa về trang chủ
    try { await auth.post('/api/v1/auth/logout') } catch { /* bỏ qua */ }
  },
}

export default authService
