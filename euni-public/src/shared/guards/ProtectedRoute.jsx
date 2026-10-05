'use client'
import { Navigate, useLocation } from '../../lib/router.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

export default function ProtectedRoute({ children, loginPath = '/dang-nhap' }) {
  const { isAuthenticated, isLoading } = useAuth()
  const { pathname } = useLocation()
  if (isLoading) return <div style={{ padding: 24 }}>Đang kiểm tra phiên đăng nhập...</div>
  if (!isAuthenticated) return <Navigate to={`${loginPath}?next=${encodeURIComponent(pathname)}`} replace />
  return children
}
