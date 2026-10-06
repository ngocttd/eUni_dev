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

/** CRUD chuẩn dưới /api/v1/admin/{name}: GET list (phân trang) · GET {id} · POST · PUT {id} · DELETE {id} */
const resource = (name) => ({
  list: (query) => cms.get(`/api/v1/admin/${name}`, { query }),
  get: (id) => cms.get(`/api/v1/admin/${name}/${id}`),
  create: (body) => cms.post(`/api/v1/admin/${name}`, body),
  update: (id, body) => cms.put(`/api/v1/admin/${name}/${id}`, body),
  remove: (id) => cms.delete(`/api/v1/admin/${name}/${id}`),
})

/**
 * Nội dung có workflow (docs/design/CMS_DESIGN.md §7–8): status draft | pending_review | published | archived,
 * đổi trạng thái qua workflow(id, action) — submit · reject · approve · publish · unpublish · archive · approve-revision · reject-revision.
 */
const lifecycle = (name) => ({
  ...resource(name),
  trash: (query) => cms.get(`/api/v1/admin/${name}/trash`, { query }),
  restore: (id) => cms.post(`/api/v1/admin/${name}/${id}/restore`),
  purge: (id) => cms.delete(`/api/v1/admin/${name}/${id}/purge`),
  workflow: (id, action, body = {}) => cms.post(`/api/v1/admin/${name}/${id}/workflow/${action}`, body),
  revisions: (id) => cms.get(`/api/v1/admin/${name}/${id}/revisions`),
  revision: (id, version) => cms.get(`/api/v1/admin/${name}/${id}/revisions/${version}`),
  restoreRevision: (id, version) => cms.post(`/api/v1/admin/${name}/${id}/revisions/${version}/restore`),
  history: (id) => cms.get(`/api/v1/admin/${name}/${id}/history`),
})

export const cmsApi = {
  /** Ngữ cảnh: tenants được quản trị, quyền chức năng, đơn vị của tôi */
  me: { context: () => cms.get('/api/v1/me/context') },

  /* Tin tức (Contents): contentBody = HTML; bản dịch ở translations.en */
  contents: lifecycle('contents'),
  /* Thông báo theo đối tượng: targets[] = [{ audience?, unitCode?, userSub? | userKey?, isExclude? }] */
  announcements: {
    ...lifecycle('announcements'),
    stats: (id) => cms.get(`/api/v1/admin/announcements/${id}/stats`),
    options: () => cms.get('/api/v1/admin/announcements/meta/options'),
  },
  /* Phân quyền mức bản ghi — user/role quản lý ở Identity Server */
  grants: {
    ...resource('grants'),
    effective: (sub) => cms.get(`/api/v1/admin/grants/effective/${encodeURIComponent(sub)}`),
  },
  directory: {
    users: (keyword, query = {}) => cms.get('/api/v1/admin/directory/users', { query: { keyword, ...query } }),
    roles: () => cms.get('/api/v1/admin/directory/roles'),
  },
  orgUnits: { list: () => cms.get('/api/v1/admin/org-units') },
  /* Trang đơn vị (tenant) — chỉ cms.admin. create({ id, name, rootUnit, domains[], ownerSub?, scaffold? }) */
  tenants: {
    list: () => cms.get('/api/v1/admin/tenants'),
    create: (body) => cms.post('/api/v1/admin/tenants', body),
    update: (id, body) => cms.put(`/api/v1/admin/tenants/${id}`, body),
  },
  audit: { list: (query) => cms.get('/api/v1/admin/audit-logs', { query }) },

  categories: resource('categories'),
  events: resource('events'),
  albums: resource('albums'),
  videos: resource('videos'),
  podcasts: resource('podcasts'),
  pages: resource('pages'),
  menuItems: resource('menu-items'),
  banners: resource('banners'),
  heroSlides: resource('hero-slides'),
  quickLinks: resource('quick-links'),
  audiences: resource('audiences'),
  strengths: resource('strengths'),
  partners: resource('partners'),
  siteStats: resource('site-stats'),

  media: {
    list: (query) => cms.get('/api/v1/admin/media', { query }),
    get: (id) => cms.get(`/api/v1/admin/media/${id}`),
    /** multipart: file, altText, caption, folder, uploadedBy */
    upload: (file, extra = {}) => {
      const form = new FormData()
      form.append('file', file)
      Object.entries(extra).forEach(([k, v]) => v != null && form.append(k, v))
      return cms.upload('/api/v1/admin/media/upload', form)
    },
    remove: (id) => cms.delete(`/api/v1/admin/media/${id}`),
  },

  settings: {
    get: (group) => cms.get(group ? `/api/v1/admin/settings/${group}` : '/api/v1/admin/settings'),
    save: (group, values) => cms.put(`/api/v1/admin/settings/${group}`, values),
    /** Gửi email thử tới địa chỉ `to` bằng cấu hình SMTP hiện tại */
    testEmail: (to) => cms.post('/api/v1/admin/settings/email/test', { to }),
  },

  logs: { list: (query) => cms.get('/api/v1/admin/activity-logs', { query }) },
  backups: {
    list: (query) => cms.get('/api/v1/admin/backups', { query }),
    create: () => cms.post('/api/v1/admin/backups'),
    remove: (id) => cms.delete(`/api/v1/admin/backups/${id}`),
    /** Phục hồi từ bản sao lưu có sẵn / từ tệp JSON tải lên (ghi đè dữ liệu CMS hiện tại) */
    restore: (id) => cms.post(`/api/v1/admin/backups/${id}/restore`),
    restoreFile: (file) => { const f = new FormData(); f.append('file', file); return cms.upload('/api/v1/admin/backups/restore', f) },
    /** Tải tệp sao lưu về máy (kèm Bearer token nên không dùng thẻ <a> trực tiếp) */
    download: async (id) => {
      const token = tokenService.getAccessToken()
      const res = await fetch(`${env.apiGateway}/${SERVICE.cms}/api/v1/admin/backups/${id}/download`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
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
