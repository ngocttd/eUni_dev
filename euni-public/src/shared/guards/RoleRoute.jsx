'use client'
import { Navigate } from '../../lib/router.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

export default function RoleRoute({ children, roles, permission, fallback = '/' }) {
  const { hasRole, hasPermission } = useAuth()
  if (roles && !hasRole(roles)) return <Navigate to={fallback} replace />
  if (permission && !hasPermission(permission)) return <Navigate to={fallback} replace />
  return children
}
