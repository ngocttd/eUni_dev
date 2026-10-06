'use client'
import { useEffect, useMemo, useState } from 'react'
import ProtectedRoute from '../guards/ProtectedRoute.jsx'
import RoleRoute from '../guards/RoleRoute.jsx'
import PortalLayout from '../components/layout/PortalLayout.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { ClientDatasets } from '../../lib/datasets/useModuleData.jsx'
import { loadDataset } from '../../lib/datasets/loaders.js'
import { cmsApi } from '../../lib/api/cmsApi.js'
import tenantService from '../services/tenantService.js'
import { cmsConfig } from '../../routes/cmsConfig.js'
import Icon from '../lib/Icon.jsx'
import { setTenantSite, publicSiteUrl } from '../../config/apps.js'

/** Chọn trang (tenant) đang quản trị — danh sách lấy từ claim tenant[] của token qua /api/v1/me/context. */
function TenantSwitcher({ tenants, current }) {
  if (!tenants.length) return null
  const change = (id) => { tenantService.set(id); window.location.reload() }
  return (
    <label className="cms-tenant" title="Trang đang quản trị">
      <Icon name="globe" size={15} />
      {tenants.length > 1
        ? <select value={current} onChange={(e) => change(e.target.value)} aria-label="Chọn trang quản trị">{tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        : <span>{tenants[0].name}</span>}
    </label>
  )
}

/**
 * Khung CMS: bắt buộc đăng nhập tài khoản có quyền cms.access, xác định tenant đang quản trị,
 * rồi nạp dữ liệu quản trị từ cms-api (mọi lời gọi gửi X-Tenant).
 */
function CmsFrame({ children }) {
  const { user } = useAuth()
  const [ctx, setCtx] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    cmsApi.me.context().then((c) => {
      if (!alive) return
      if (!c.currentTenant) { setError('Tài khoản chưa được giao quản trị trang nào. Liên hệ quản trị hệ thống.'); return }
      if (tenantService.get() !== c.currentTenant) tenantService.set(c.currentTenant)
      setTenantSite(c.tenants.find((x) => x.id === c.currentTenant)?.domains)
      setCtx(c)
    }).catch((e) => alive && setError(e?.message || 'Không tải được ngữ cảnh người dùng.'))
    return () => { alive = false }
  }, [])

  const config = useMemo(() => {
    const roleLabel = user?.roleLabel || (user?.role === 'cms-admin' ? 'Quản trị CMS' : 'Biên tập viên')
    const tenantName = ctx?.tenants.find((t) => t.id === ctx.currentTenant)?.name
    return {
      ...cmsConfig,
      ...(user?.name ? { user: user.name, role: roleLabel } : {}),
      meta: [roleLabel, tenantName].filter(Boolean).join(' · ') || cmsConfig.meta,
      items: cmsConfig.items.filter((it) => !it.requires || (user?.permissions || []).some((p) => p === 'cms.*' || p === it.requires)),
      topbarExtra: ctx ? <TenantSwitcher tenants={ctx.tenants} current={ctx.currentTenant} /> : null,
      /* nút "Xem website" mở website của trang đang quản trị */
      siteUrl: ctx ? publicSiteUrl('/') : null,
    }
  }, [user, ctx])

  return (
    <PortalLayout config={config} variant="cms">
      {error ? <p className="cms-empty" role="alert">{error}</p>
        : !ctx ? <div style={{ padding: 24 }}>Đang tải…</div>
          : <ClientDatasets key={ctx.currentTenant} modules={['cms']} load={loadDataset}>{children}</ClientDatasets>}
    </PortalLayout>
  )
}

export default function CmsShell({ children }) {
  return (
    <ProtectedRoute>
      <RoleRoute roles={['cms-admin', 'cms-editor']} permission="cms.access" fallback="/dang-nhap">
        <CmsFrame>{children}</CmsFrame>
      </RoleRoute>
    </ProtectedRoute>
  )
}
