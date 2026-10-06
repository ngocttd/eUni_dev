/**
 * Nạp dataset cho trang công khai render phía server, theo tenant của request (docs/design/CMS_DESIGN.md §2.2):
 * host (vd. cntt.humg.edu.vn) → tenant qua NEXT_PUBLIC_TENANT_HOSTS, không khớp → tenant mặc định.
 * Chỉ dùng trong server component (app/(site)/**). Ở client dùng loaders.js.
 */
import { headers } from 'next/headers'
import { loadDatasets as load } from './loaders.js'
import { tenantForHost } from '../../shared/services/tenantService.js'

export async function currentTenant() {
  const h = await headers()
  return tenantForHost(h.get('x-forwarded-host') || h.get('host'))
}

export async function loadDatasets(modules) {
  return load(modules, { tenant: await currentTenant() })
}

/** Dữ liệu chung (cấu hình, menu, banner) cho khung website — xem shared/site/SiteContext.jsx */
export async function loadSiteData() {
  const { loadSite } = await import('./loaders.js')
  return loadSite({ tenant: await currentTenant() })
}
