/**
 * Tenant (đơn vị có website riêng: humg, cntt…) — docs/design/CMS_DESIGN.md §2.
 *
 *  - Website công khai: phía server suy ra tenant từ tên miền — NEXT_PUBLIC_TENANT_HOSTS (tùy chọn, tra nhanh) rồi tới
 *    API `GET /api/v1/public/tenants/resolve?host=` (trang đơn vị tạo trong CMS, không cần build lại), không thấy → mặc định.
 *    Kết quả được SiteProvider ghi lại (setResolved) để các lời gọi API phía trình duyệt dùng cùng tenant.
 *  - CMS admin: tenant người quản trị đang chọn (lưu sessionStorage), ưu tiên hơn host.
 * Mọi lời gọi API gửi header `X-Tenant` (lib/api/client.js).
 */
const KEY = 'humg-tenant'
export const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'humg'
const HOSTS = Object.fromEntries(String(process.env.NEXT_PUBLIC_TENANT_HOSTS || '')
  .split(',').map((s) => s.trim().split('=').map((x) => x.trim().toLowerCase())).filter((p) => p.length === 2 && p[0] && p[1]))

/** Tra theo NEXT_PUBLIC_TENANT_HOSTS; null nếu không khai báo */
export const envTenantForHost = (host) => HOSTS[String(host || '').toLowerCase()] || null
export const tenantForHost = (host) => envTenantForHost(host) || DEFAULT_TENANT
let resolved = null

export const tenantService = {
  /** Tenant hiện hành ở trình duyệt; phía server trả null (caller tự truyền). */
  get() {
    if (typeof window === 'undefined') return null
    try { const picked = window.sessionStorage.getItem(KEY); if (picked) return picked } catch { /* private mode */ }
    return resolved || tenantForHost(window.location.host)
  },
  /** Tenant server đã xác định cho trang đang xem (website công khai) */
  setResolved(id) { resolved = id || null },
  /** Chọn tenant (CMS admin). null = quay về theo host. */
  set(id) {
    if (typeof window === 'undefined') return
    try { id ? window.sessionStorage.setItem(KEY, id) : window.sessionStorage.removeItem(KEY) } catch { /* private mode */ }
  },
}

export default tenantService
