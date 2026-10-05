'use client'
import { useEffect, useMemo, useState } from 'react'
import ProtectedRoute from '../guards/ProtectedRoute.jsx'
import RoleRoute from '../guards/RoleRoute.jsx'
import PortalLayout from '../components/layout/PortalLayout.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { ClientDatasets } from '../../lib/datasets/useModuleData.jsx'
import { loadDataset } from '../../lib/datasets/loaders.js'
import { fmtDateTime } from '../../lib/datasets/format.js'
import { portals } from '../../routes/sitemap.js'
import { inboxApi } from './AnnouncementInbox.jsx'

/** Chuông thông báo trên topbar: 5 thông báo mới nhất từ hộp thư của người dùng (cms-api). */
function useInboxBell(enabled) {
  const [items, setItems] = useState(null)
  useEffect(() => {
    if (!enabled) return undefined
    let alive = true
    inboxApi.list().then((d) => alive && setItems(d.items.slice(0, 5).map((x) => ({ title: x.title, time: fmtDateTime(x.publishAt), unread: !x.readAt })))).catch(() => alive && setItems(null))
    return () => { alive = false }
  }, [enabled])
  return items
}

/**
 * Khung My eUni Portal: bắt buộc đăng nhập + đúng vai trò, nạp dataset của cổng từ API
 * (sau khi có token) rồi mới render trang con.
 */
export default function PortalShell({ portal, roles, modules, children }) {
  const { user } = useAuth()
  const bell = useInboxBell(Boolean(user))
  const config = useMemo(() => {
    const base = portals.find((p) => p.key === portal)
    return {
      ...base,
      ...(user?.name ? { user: user.name } : {}),
      ...(bell ? { notifications: bell, notifTo: `${base.base}/thong-bao` } : {}),
    }
  }, [portal, user?.name, bell])

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
