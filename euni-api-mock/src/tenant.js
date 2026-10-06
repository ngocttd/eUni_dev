// Xác định tenant của request (docs/design/CMS_DESIGN.md §2.2):
//   header X-Tenant  →  host của request (bảng domain)  →  tenant mặc định.
import { rows, DEFAULT_TENANT } from './store.js'

export const tenants = () => rows('tenants')
export const tenantById = (id) => tenants().find((t) => t.id === id && t.isActive !== false)

export function tenantMiddleware(req, res, next) {
  const header = String(req.headers['x-tenant'] || '').trim().toLowerCase()
  if (header === '*') { req.tenant = DEFAULT_TENANT; req.allTenants = true; return next() }
  /* quản lý trang đơn vị (/admin/tenants) áp dụng cho mọi trang, kể cả trang đang tắt: không chặn theo X-Tenant */
  if (/\/api\/v1\/admin\/tenants(\/|$)/.test(req.path)) { req.tenant = tenantById(header) ? header : DEFAULT_TENANT; return next() }
  if (header) {
    if (!tenantById(header)) return res.status(400).json({ message: `Tenant "${header}" không tồn tại hoặc đã tắt.` })
    req.tenant = header
    return next()
  }
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase()
  req.tenant = tenants().find((t) => t.isActive !== false && (t.domains || []).includes(host))?.id || DEFAULT_TENANT
  next()
}
