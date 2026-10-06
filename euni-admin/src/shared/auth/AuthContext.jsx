'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import authService from '../services/authService.js'

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

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
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
