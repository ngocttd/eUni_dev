import { env } from '../../config/env.js'
import tokenService from '../../shared/services/tokenService.js'
import tenantService from '../../shared/services/tenantService.js'

export class ApiError extends Error {
  constructor(message, { status = 0, data = null, url = '' } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.url = url
  }
}

/**
 * Backend thật bọc response: cms-api `{ success, message, data }`, qlns/qlkhcn `{ code, message, data }`; mock trả dữ liệu thô.
 * FE chấp nhận cả hai: bóc `data`, và ném lỗi nếu `success === false` / `code` không phải 2xx (kể cả khi HTTP 200).
 */
function unwrap(body, ctx) {
  if (body && typeof body === 'object' && !Array.isArray(body) && 'data' in body && (typeof body.success === 'boolean' || typeof body.code === 'number')) {
    const failed = body.success === false || (typeof body.code === 'number' && (body.code < 200 || body.code >= 300))
    if (failed) throw new ApiError(body.message || 'Yêu cầu không thành công.', { ...ctx, data: body })
    return body.data
  }
  return body
}

/** Danh sách có thể là mảng thuần (backend) hoặc { items, totalItems… } (mock) → luôn trả dạng phân trang. */
export const asPage = (res) => (Array.isArray(res)
  ? { items: res, pageIndex: 1, pageSize: res.length, totalItems: res.length, totalPages: 1 }
  : res ?? { items: [], pageIndex: 1, pageSize: 0, totalItems: 0, totalPages: 1 })

/** Tên service trên API gateway (khớp https://api-gateway-demo.humg.edu.vn/<service>/swagger). */
export const SERVICE = Object.freeze({
  cms: 'cms-api',
  auth: 'auth-api',
  qlns: 'qlns-api',
  qlkhcn: 'qlkhcn-api',
  qldt: 'qldt-api',
  portal: 'portal-api',
})

function buildUrl(service, path, query) {
  const url = new URL(`${env.apiGateway}/${service}${path.startsWith('/') ? path : `/${path}`}`)
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    Array.isArray(v) ? v.forEach((x) => url.searchParams.append(k, x)) : url.searchParams.set(k, v)
  })
  return url.toString()
}

async function request(service, path, { query, body, headers, method = 'GET', token, tenant, signal } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), env.apiTimeout)
  const auth = token ?? tokenService.getAccessToken()
  const tenantId = tenant ?? tenantService.get()
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  const url = buildUrl(service, path, query)
  try {
    if (env.enableApiLog) console.info('[API]', method, url)
    const res = await fetch(url, {
      method,
      cache: 'no-store', // dữ liệu CMS phải luôn mới: admin sửa → public đổi ngay
      headers: {
        Accept: 'application/json',
        ...(body != null && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        ...(tenantId ? { 'X-Tenant': tenantId } : {}),
        ...(headers || {}),
      },
      body: body == null ? undefined : isForm ? body : JSON.stringify(body),
      signal: signal || controller.signal,
    })
    const text = res.status === 204 ? '' : await res.text()
    let data = text
    try { data = text ? JSON.parse(text) : null } catch { /* giữ nguyên text */ }
    if (!res.ok) throw new ApiError(data?.message || `HTTP ${res.status}`, { status: res.status, data, url })
    return unwrap(data, { status: res.status, url })
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (err?.name === 'AbortError') throw new ApiError('Yêu cầu API quá thời gian chờ.', { url })
    throw new ApiError(`Không kết nối được API (${url}). ${err?.message || ''}`.trim(), { url })
  } finally {
    clearTimeout(timer)
  }
}

/** Tạo client cho một service: api(SERVICE.cms).get('/api/Contents', { query }). Tùy chọn: query, headers, token, tenant (mặc định tenantService). */
export const api = (service) => ({
  get: (path, o = {}) => request(service, path, { ...o, method: 'GET' }),
  post: (path, body, o = {}) => request(service, path, { ...o, method: 'POST', body }),
  put: (path, body, o = {}) => request(service, path, { ...o, method: 'PUT', body }),
  patch: (path, body, o = {}) => request(service, path, { ...o, method: 'PATCH', body }),
  delete: (path, o = {}) => request(service, path, { ...o, method: 'DELETE' }),
  upload: (path, formData, o = {}) => request(service, path, { ...o, method: 'POST', body: formData }),
})

export default api
