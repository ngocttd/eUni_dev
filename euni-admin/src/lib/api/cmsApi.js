/**
 * Lớp gọi cms-api cho các thao tác GHI của CMS admin (đã sẵn sàng để gắn vào màn hình).
 * Mọi thay đổi ở đây phản ánh ngay trên website public vì public đọc cùng cms-api (xem docs/API_CONTRACT.md).
 *
 * Ví dụ trong màn hình:
 *   const reload = useReloadDatasets()
 *   await cmsApi.contents.update(post.id, { status: POST_STATUS_VALUE['Đã xuất bản'] })
 *   await reload()
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

export const cmsApi = {
  /* Bài viết (Contents): status 0 Nháp · 1 Chờ duyệt · 2 Xuất bản · 3 Lưu trữ; contentBody = chuỗi JSON các khối */
  contents: {
    ...resource('Contents'),
    publish: (id) => cms.put(`/api/Contents/${id}`, { status: 2 }),
    unpublish: (id) => cms.put(`/api/Contents/${id}`, { status: 0 }),
  },
  categories: resource('Categories'),
  users: resource('Users'),
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

  roles: {
    list: () => cms.get('/api/Roles'),
    create: (body) => cms.post('/api/Roles', body),
    update: (id, body) => cms.put(`/api/Roles/${id}`, body),
    remove: (id) => cms.delete(`/api/Roles/${id}`),
    permissionMatrix: () => cms.get('/api/Roles/permission-matrix'),
    savePermissionMatrix: (matrix) => cms.put('/api/Roles/permission-matrix', matrix),
  },

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
