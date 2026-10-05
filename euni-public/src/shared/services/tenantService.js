/**
 * Tenant (đơn vị có website riêng: humg, cntt…) — docs/design/CMS_DESIGN.md §2.
 *
 *  - Website công khai: suy ra từ host theo NEXT_PUBLIC_TENANT_HOSTS ("cntt.humg.edu.vn=cntt,cntt.localhost:3002=cntt"),
 *    không khớp → NEXT_PUBLIC_DEFAULT_TENANT (mặc định "humg"). Phía server truyền tenant tường minh (lib/datasets/server.js).
 *  - CMS admin: tenant người quản trị đang chọn (lưu sessionStorage), ưu tiên hơn host.
 * Mọi lời gọi API gửi header `X-Tenant` (lib/api/client.js).
 */
const KEY = 'humg-tenant'
export const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'humg'
const HOSTS = Object.fromEntries(String(process.env.NEXT_PUBLIC_TENANT_HOSTS || '')
  .split(',').map((s) => s.trim().split('=').map((x) => x.trim().toLowerCase())).filter((p) => p.length === 2 && p[0] && p[1]))

export const tenantForHost = (host) => HOSTS[String(host || '').toLowerCase()] || DEFAULT_TENANT

export const tenantService = {
  /** Tenant hiện hành ở trình duyệt; phía server trả null (caller tự truyền). */
  get() {
    if (typeof window === 'undefined') return null
    try { const picked = window.sessionStorage.getItem(KEY); if (picked) return picked } catch { /* private mode */ }
    return tenantForHost(window.location.host)
  },
  /** Chọn tenant (CMS admin). null = quay về theo host. */
  set(id) {
    if (typeof window === 'undefined') return
    try { id ? window.sessionStorage.setItem(KEY, id) : window.sessionStorage.removeItem(KEY) } catch { /* private mode */ }
  },
}

export default tenantService
