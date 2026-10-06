/**
 * Nạp dataset cho trang công khai render phía server, theo tenant của request (docs/design/CMS_DESIGN.md §2.2):
 * host (vd. cntt.humg.edu.vn) → tenant qua NEXT_PUBLIC_TENANT_HOSTS, không khớp → tenant mặc định.
 * Chỉ dùng trong server component (app/(site)/**). Ở client dùng loaders.js.
 */
import { headers } from 'next/headers'
import { loadDatasets as load } from './loaders.js'
import { envTenantForHost, DEFAULT_TENANT } from '../../shared/services/tenantService.js'
import api, { SERVICE } from '../api/client.js'

/* tên miền → tenant qua cms-api, nhớ 15 giây (trang đơn vị mới tạo/tắt trong CMS có hiệu lực ngay, không cần build lại).
   Tên miền chưa gắn hoặc trang đã tắt → website Trường (tenant mặc định). */
const cache = new Map()
const TTL = 15_000
async function resolveHost(host) {
  const hit = cache.get(host)
  if (hit && hit.until > Date.now()) return hit.id
  let id = DEFAULT_TENANT
  try { id = (await api(SERVICE.cms).get('/api/v1/public/tenants/resolve', { query: { host }, tenant: DEFAULT_TENANT })).id || DEFAULT_TENANT } catch { /* 404/lỗi → mặc định */ }
  cache.set(host, { id, until: Date.now() + TTL })
  return id
}

async function requestHost() {
  const h = await headers()
  return String(h.get('x-forwarded-host') || h.get('host') || '').toLowerCase()
}

export async function currentTenant() {
  const host = await requestHost()
  return envTenantForHost(host) || resolveHost(host)
}

/** Chạy fn(tenant); nếu lỗi (vd. trang vừa bị tắt nhưng còn trong bộ nhớ tạm → API trả 400) thì tra lại tên miền và thử lại một lần. */
async function withTenant(fn) {
  const host = await requestHost()
  const tenant = envTenantForHost(host) || await resolveHost(host)
  try { return await fn(tenant) } catch (e) {
    if (!cache.has(host)) throw e
    cache.delete(host)
    const again = await resolveHost(host)
    if (again === tenant) throw e
    return fn(again)
  }
}

export async function loadDatasets(modules) {
  return withTenant((tenant) => load(modules, { tenant }))
}

/** Trang tĩnh soạn ở CMS theo tenant của request (null nếu không có) */
export async function loadCmsPageFor(slug) {
  const { loadCmsPage } = await import('./loaders.js')
  return withTenant((tenant) => loadCmsPage(slug, { tenant }))
}

/** Dữ liệu chung (cấu hình, menu, banner) cho khung website — xem shared/site/SiteContext.jsx */
export async function loadSiteData() {
  const { loadSite } = await import('./loaders.js')
  return withTenant(async (tenant) => {
    const site = await loadSite({ tenant })
    /* loadSite nuốt lỗi từng phần; không lấy được cấu hình của trang đơn vị → coi là lỗi để tra lại tên miền */
    if (!site.settings && tenant !== DEFAULT_TENANT) throw new Error(`Không tải được cấu hình trang "${tenant}"`)
    return { ...site, tenant }
  }).catch(async () => { const tenant = await currentTenant(); return { ...(await loadSite({ tenant })), tenant } }) // cms-api lỗi → khung tĩnh dự phòng
}
