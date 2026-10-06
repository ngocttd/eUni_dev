'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import authService from '../services/authService.js'
import tokenService from '../services/tokenService.js'
import authNotice, { AUTH_EXPIRED_EVENT } from '../services/authNotice.js'

const AuthContext = createContext(null)

function matchPermission(granted = [], required) {
  if (!required) return true
  if (granted.includes(required)) return true
  return granted.some((item) => item.endsWith('.*') && required.startsWith(item.slice(0, -1)))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const bootstrap = useCallback(async () => {
    setIsLoading(true)
    try {
      setUser((await authService.me()) || null)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { bootstrap() }, [bootstrap])

  /* API trả 401 (token hết hạn / bị thu hồi): xóa phiên; các trang cần đăng nhập tự chuyển về /dang-nhap */
  useEffect(() => {
    const onExpired = () => { if (!tokenService.getSession()) return; tokenService.clear(); authNotice.set('expired'); setUser(null) }
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [])

  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials)
    setUser(result?.user || null)
    return result
  }, [])

  const loginAs = useCallback(async (roleKey) => {
    const result = await authService.loginAs(roleKey)
    setUser(result?.user || null)
    return result
  }, [])

  const loginWithSso = useCallback((opts) => authService.loginWithSso(opts), [])

  /** → { redirected } — true khi đang chuyển sang trang đăng xuất SSO (không cần điều hướng tiếp) */
  const logout = useCallback(async () => {
    const r = await authService.logout()
    setUser(null)
    return r || { redirected: false }
  }, [])

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    loginAs,
    loginWithSso,
    logout,
    refreshSession: bootstrap,
    // vai trò chính (user.role) hoặc bất kỳ role nào trên SSO (user.roles) — vd. biên tập CMS đồng thời là giảng viên
    hasRole: (roles) => !roles || [].concat(roles).some((r) => r === user?.role || (user?.roles || []).includes(r)),
    hasPermission: (permission) => matchPermission(user?.permissions || [], permission),
  }), [user, isLoading, login, loginAs, loginWithSso, logout, bootstrap])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth() phải được dùng bên trong <AuthProvider>.')
  return value
}
