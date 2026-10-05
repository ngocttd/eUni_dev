/**
 * Lớp gọi cms-api cho các thao tác GHI của CMS admin (đã sẵn sàng để gắn vào màn hình).
 * Mọi thay đổi ở đây phản ánh ngay trên website public vì public đọc cùng cms-api (xem docs/API_CONTRACT.md).
 *
 * Ví dụ trong màn hình:
 *   const reload = useReloadDatasets()
 *   await cmsApi.contents.update(post.id, { title, version: post.version })      // 409 nếu người khác đã sửa
 *   await cmsApi.contents.workflow(post.id, 'submit')                             // draft → pending_review
 *   await reload()
 * Mọi lời gọi gửi X-Tenant = tenant đang chọn (shared/services/tenantService.js).
 */
import api, { SERVICE } from './client.js'
import { env } from '../../config/env.js'
import tokenService from '../../shared/services/tokenService.js'

const cms = api(SERVICE.cms)

/** CRUD chuẩn: GET list (phân trang) · GET {id} · POST · PUT {id} · DELETE {id} */
const resource = (name) => ({
  list: (query) => cms.get(`/api/${name}`, { query }),
  get: (id) => cms.get(`/api/${name}/${id}`),
  create: (body) => cms.post(`/api/${name}`, body),
  update: (id, body) => cms.put(`/api/${name}/${id}`, body),
  remove: (id) => cms.delete(`/api/${name}/${id}`),
})

/**
 * Nội dung có workflow (docs/design/CMS_DESIGN.md §7–8): status draft | pending_review | published | archived,
 * đổi trạng thái qua workflow(id, action) — submit · reject · approve · publish · unpublish · archive · approve-revision · reject-revision.
 */
const lifecycle = (name) => ({
  ...resource(name),
  trash: (query) => cms.get(`/api/${name}/trash`, { query }),
  restore: (id) => cms.post(`/api/${name}/${id}/restore`),
  purge: (id) => cms.delete(`/api/${name}/${id}/purge`),
  workflow: (id, action, body = {}) => cms.post(`/api/${name}/${id}/workflow/${action}`, body),
  revisions: (id) => cms.get(`/api/${name}/${id}/revisions`),
  revision: (id, version) => cms.get(`/api/${name}/${id}/revisions/${version}`),
  restoreRevision: (id, version) => cms.post(`/api/${name}/${id}/revisions/${version}/restore`),
  history: (id) => cms.get(`/api/${name}/${id}/history`),
})

export const cmsApi = {
  /** Ngữ cảnh: tenants được quản trị, quyền chức năng, đơn vị của tôi */
  me: { context: () => cms.get('/api/Me/context') },

  /* Tin tức (Contents): contentBody = HTML; bản dịch ở translations.en */
  contents: lifecycle('Contents'),
  /* Thông báo theo đối tượng: targets[] = [{ audience?, unitCode?, userSub? | userKey?, isExclude? }] */
  announcements: {
    ...lifecycle('Announcements'),
    stats: (id) => cms.get(`/api/Announcements/${id}/stats`),
    options: () => cms.get('/api/Announcements/meta/options'),
  },
  /* Phân quyền mức bản ghi — user/role quản lý ở Identity Server */
  grants: {
    ...resource('Grants'),
    effective: (sub) => cms.get(`/api/Grants/effective/${encodeURIComponent(sub)}`),
  },
  directory: {
    users: (keyword, query = {}) => cms.get('/api/Directory/users', { query: { keyword, ...query } }),
    roles: () => cms.get('/api/Directory/roles'),
  },
  orgUnits: { list: () => cms.get('/api/OrgUnits') },
  audit: { list: (query) => cms.get('/api/AuditLogs', { query }) },

  categories: resource('Categories'),
  events: resource('Events'),
  albums: resource('Albums'),
  videos: resource('Videos'),
  podcasts: resource('Podcasts'),
  pages: resource('Pages'),
  menuItems: resource('MenuItems'),
  banners: resource('Banners'),
  heroSlides: resource('HeroSlides'),
  quickLinks: resource('QuickLinks'),
  audiences: resource('Audiences'),
  strengths: resource('Strengths'),
  partners: resource('Partners'),
  siteStats: resource('SiteStats'),

  media: {
    list: (query) => cms.get('/api/Media', { query }),
    get: (id) => cms.get(`/api/Media/${id}`),
    /** multipart: file, altText, caption, folder, uploadedBy */
    upload: (file, extra = {}) => {
      const form = new FormData()
      form.append('file', file)
      Object.entries(extra).forEach(([k, v]) => v != null && form.append(k, v))
      return cms.upload('/api/Media/upload', form)
    },
    remove: (id) => cms.delete(`/api/Media/${id}`),
  },

  settings: {
    get: (group) => cms.get(group ? `/api/Settings/${group}` : '/api/Settings'),
    save: (group, values) => cms.put(`/api/Settings/${group}`, values),
    /** Gửi email thử tới địa chỉ `to` bằng cấu hình SMTP hiện tại */
    testEmail: (to) => cms.post('/api/Settings/email/test', { to }),
  },

  logs: { list: (query) => cms.get('/api/ActivityLogs', { query }) },
  backups: {
    list: (query) => cms.get('/api/Backups', { query }),
    create: () => cms.post('/api/Backups'),
    remove: (id) => cms.delete(`/api/Backups/${id}`),
    /** Phục hồi từ bản sao lưu có sẵn / từ tệp JSON tải lên (ghi đè dữ liệu CMS hiện tại) */
    restore: (id) => cms.post(`/api/Backups/${id}/restore`),
    restoreFile: (file) => { const f = new FormData(); f.append('file', file); return cms.upload('/api/Backups/restore', f) },
    /** Tải tệp sao lưu về máy (kèm Bearer token nên không dùng thẻ <a> trực tiếp) */
    download: async (id) => {
      const token = tokenService.getAccessToken()
      const res = await fetch(`${env.apiGateway}/${SERVICE.cms}/api/Backups/${id}/download`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `HTTP ${res.status}`)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `cms-backup-${id}.json`
      a.click()
      URL.revokeObjectURL(a.href)
    },
  },
}

export default cmsApi
