'use client'
import { useMemo } from 'react'
import ProtectedRoute from '../guards/ProtectedRoute.jsx'
import RoleRoute from '../guards/RoleRoute.jsx'
import PortalLayout from '../components/layout/PortalLayout.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { ClientDatasets } from '../../lib/datasets/useModuleData.jsx'
import { loadDataset } from '../../lib/datasets/loaders.js'
import { cmsConfig } from '../../routes/cmsConfig.js'

/** Khung CMS: bắt buộc đăng nhập tài khoản CMS, có quyền cms.access, nạp dữ liệu quản trị từ cms-api. */
export default function CmsShell({ children }) {
  const { user } = useAuth()
  const config = useMemo(() => (user?.name ? { ...cmsConfig, user: user.name, role: user.roleCode === 'super_admin' ? 'Super Admin' : cmsConfig.role } : cmsConfig), [user])

  return (
    <ProtectedRoute>
      <RoleRoute roles={['cms-admin', 'cms-editor']} permission="cms.access" fallback="/dang-nhap">
        <PortalLayout config={config} variant="cms">
          <ClientDatasets modules={['cms']} load={loadDataset}>{children}</ClientDatasets>
        </PortalLayout>
      </RoleRoute>
    </ProtectedRoute>
  )
}
