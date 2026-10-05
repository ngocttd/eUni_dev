/**
 * Phiên đăng nhập. Access token giữ trong bộ nhớ và sao lưu vào sessionStorage để F5 không mất phiên
 * (chế độ mock/dev — khi backend thật phát refresh-token HttpOnly cookie thì chỉ cần đổi authService.refresh).
 */
const KEY = 'humg-session'
let accessToken = null

const read = () => {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(window.sessionStorage.getItem(KEY) || 'null') } catch { return null }
}

export const tokenService = {
  getAccessToken() {
    if (accessToken) return accessToken
    accessToken = read()?.accessToken || null
    return accessToken
  },
  getSession: read,
  setSession(session) {
    accessToken = session?.accessToken || null
    if (typeof window !== 'undefined') {
      try { session ? window.sessionStorage.setItem(KEY, JSON.stringify(session)) : window.sessionStorage.removeItem(KEY) } catch { /* private mode */ }
    }
  },
  clear() { this.setSession(null) },
}

export default tokenService
