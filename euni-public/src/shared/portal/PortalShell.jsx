'use client'
import { useMemo } from 'react'
import ProtectedRoute from '../guards/ProtectedRoute.jsx'
import RoleRoute from '../guards/RoleRoute.jsx'
import PortalLayout from '../components/layout/PortalLayout.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { ClientDatasets } from '../../lib/datasets/useModuleData.jsx'
import { loadDataset } from '../../lib/datasets/loaders.js'
import { portals } from '../../routes/sitemap.js'

/**
 * Khung My eUni Portal: bắt buộc đăng nhập + đúng vai trò, nạp dataset của cổng từ API
 * (sau khi có token) rồi mới render trang con.
 */
export default function PortalShell({ portal, roles, modules, children }) {
  const { user } = useAuth()
  const config = useMemo(() => {
    const base = portals.find((p) => p.key === portal)
    return user?.name ? { ...base, user: user.name } : base
  }, [portal, user?.name])

  return (
    <ProtectedRoute>
      <RoleRoute roles={roles}>
        <PortalLayout config={config}>
          <ClientDatasets modules={modules} load={loadDataset}>{children}</ClientDatasets>
        </PortalLayout>
      </RoleRoute>
    </ProtectedRoute>
  )
}
