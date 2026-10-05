/**
 * Dataset "cms" cho CMS admin: gọi các endpoint quản trị của cms-api rồi đổi về dạng dữ liệu
 * mà các màn hình CMS đang dùng (cmsPosts, cmsUsers, cmsActivity…).
 * Hằng số giao diện (tab, danh sách lựa chọn, giá trị mặc định form) nằm ở config/cmsUi.js — không lấy từ API.
 */
import api, { SERVICE, asPage } from '../api/client.js'
import tokenService from '../../shared/services/tokenService.js'
import * as ui from '../../config/cmsUi.js'
import { fmtDate, fmtDateTime, fmtBytes } from './format.js'

const cms = api(SERVICE.cms)
const big = { pageSize: 500 }
const safe = (p, fallback) => p.catch((e) => (e.status === 403 || e.status === 404 ? fallback : Promise.reject(e)))
const empty = { items: [], totalItems: 0 }
const page = (p) => p.then(asPage)

export const POST_STATUS_LABEL = { 0: 'Bản nháp', 1: 'Chờ duyệt', 2: 'Đã xuất bản', 3: 'Lưu trữ' }
export const POST_STATUS_VALUE = { 'Bản nháp': 0, 'Chờ duyệt': 1, 'Đã xuất bản': 2, 'Lưu trữ': 3 }
const KIND_LABEL = { image: 'Hình ảnh', document: 'Tài liệu', video: 'Video', audio: 'Âm thanh', other: 'Khác' }
const TR_LABEL = { done: 'Đã dịch', in_progress: 'Đang dịch', missing: 'Chưa dịch' }
export const TR_VALUE = { 'Đã dịch': 'done', 'Đang dịch': 'in_progress', 'Chưa dịch': 'missing' }
const MENU_TYPE = { page: 'Trang', link: 'Liên kết', category: 'Chuyên mục' }
const BANNER_POS = { home_slider: 'Trang chủ – Slider', home_popup: 'Trang chủ – Popup', sidebar_right: 'Cột phải', footer: 'Chân trang' }
export const BANNER_POS_VALUE = Object.fromEntries(Object.entries(BANNER_POS).map(([k, v]) => [v, k]))
const ACTION_LABEL = {
  login: 'Đăng nhập', 'post.publish': 'Đăng bài viết', 'post.create': 'Tạo bài viết', 'post.update': 'Cập nhật bài viết', 'post.delete': 'Xóa bài viết',
  'media.upload': 'Tải lên file', 'media.delete': 'Xóa file', 'user.delete': 'Xóa người dùng', 'user.create': 'Thêm người dùng', 'user.update': 'Cập nhật người dùng',
  'settings.update': 'Đổi cấu hình', 'backup.create': 'Sao lưu',
}
const dm = (iso) => { const d = fmtDate(iso); return d ? d.slice(0, 5) : '' }

export async function loadCms() {
  const [dashApi, contents, cats, media, pages, menuItems, users, roles, matrix, settings, logs, backups, banners, langs] = await Promise.all([
    safe(cms.get('/api/Dashboard'), null),
    page(cms.get('/api/Contents', { query: big })),
    page(cms.get('/api/Categories', { query: big })),
    safe(page(cms.get('/api/Media', { query: big })), empty),
    safe(page(cms.get('/api/Pages', { query: big })), empty),
    safe(page(cms.get('/api/MenuItems', { query: big })), empty),
    safe(page(cms.get('/api/Users', { query: big })), empty),
    safe(cms.get('/api/Roles'), []),
    safe(cms.get('/api/Roles/permission-matrix'), { roles: [], rows: [] }),
    safe(cms.get('/api/Settings'), {}),
    safe(page(cms.get('/api/ActivityLogs', { query: { pageSize: 200 } })), empty),
    safe(page(cms.get('/api/Backups', { query: big })), empty),
    safe(page(cms.get('/api/Banners', { query: big })), empty),
    safe(cms.get('/api/Languages'), []),
  ])

  // /api/Dashboard là endpoint mở rộng: nếu backend chưa có thì tự tính từ dữ liệu đã tải
  const dashFallback = () => {
    const by = (st) => contents.items.filter((c) => c.status === st).length
    const total = contents.items.length || 1
    const part = (label, value) => ({ label, value, pct: Math.round((value / total) * 1000) / 10 })
    return {
      stats: { posts: contents.totalItems, pages: pages.totalItems, categories: cats.totalItems, users: users.totalItems },
      status: { total: contents.items.length, parts: [part('published', by(2)), part('draft', by(0)), part('pending', by(1)), part('archived', by(3))] },
      latestPosts: [...contents.items].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 3),
      upcomingEvents: [], latestMedia: media.items.slice(0, 3), onlineUsers: 0, trend: [],
    }
  }
  const dash = dashApi || dashFallback()
  const catName = new Map(cats.items.map((c) => [c.id, c.name]))
  const roleName = new Map(roles.map((r) => [r.code, r.name]))
  const postCount = new Map()
  contents.items.forEach((c) => postCount.set(c.categoryId, (postCount.get(c.categoryId) || 0) + 1))

  const cmsPosts = contents.items.map((c) => ({
    id: c.id, title: c.title, category: c.categoryName || catName.get(c.categoryId) || '', author: c.authorName || '',
    status: POST_STATUS_LABEL[c.status] || '', date: fmtDate(c.createdAt), raw: c,
  }))

  const catNode = (c) => ({ id: c.id, name: c.name, posts: postCount.get(c.id) || 0, status: c.isActive ? 'Hiển thị' : 'Ẩn', slug: c.slug, parentId: c.parentId ?? null, sortOrder: c.sortOrder ?? 1, description: c.description || '' })
  const isRoot = (list, c) => !c.parentId || !list.some((x) => x.id === c.parentId)
  const cmsCategories = cats.items.filter((c) => isRoot(cats.items, c)).sort((a, b) => a.sortOrder - b.sortOrder).map((c) => {
    const children = cats.items.filter((x) => x.parentId === c.id).map(catNode)
    return { ...catNode(c), ...(children.length ? { children } : {}) }
  })

  const pageNode = (p) => {
    const children = pages.items.filter((x) => x.parentId === p.id).sort((a, b) => a.sortOrder - b.sortOrder).map(pageNode)
    return { id: p.id, name: p.title, slug: p.slug, parentId: p.parentId ?? null, template: p.template, sortOrder: p.sortOrder, translations: p.translations || {}, ...(children.length ? { children } : {}) }
  }
  const cmsPageTree = pages.items.filter((p) => isRoot(pages.items, p)).sort((a, b) => a.sortOrder - b.sortOrder).map(pageNode)

  const stat = (value, label) => ({ value: String(value ?? 0), label, delta: '' })
  const cmsDashboard = {
    stats: [stat(dash.stats.posts, 'Bài viết'), stat(dash.stats.pages, 'Trang'), stat(dash.stats.categories, 'Danh mục'), stat(dash.stats.users, 'Người dùng')],
    trend: dash.trend || [],
    status: { total: dash.status.total, parts: dash.status.parts.map((p) => ({ ...p, label: { published: 'Đã xuất bản', draft: 'Bản nháp', pending: 'Chờ duyệt', archived: 'Khác' }[p.label] || p.label })) },
    latestPosts: dash.latestPosts.map((c) => ({ title: c.title, meta: `${c.categoryName || ''} · ${fmtDate(c.createdAt)}` })),
    upcomingEvents: dash.upcomingEvents.map((e) => ({ title: e.title, meta: fmtDate(e.startsAt) })),
    latestMedia: dash.latestMedia.map((m) => ({ title: m.fileName, meta: `${KIND_LABEL[m.kind] || ''} · ${fmtDate(m.createdAt)}` })),
    onlineUsers: dash.onlineUsers,
  }

  const session = tokenService.getSession()?.user
  const lang = settings.language || {}
  const roleNames = (matrix.roles || []).map((code) => roleName.get(code) || code)

  return {
    ...ui,
    cmsUser: { name: session?.name || '', role: roleName.get(session?.roleCode) || session?.roleCode || '' },
    cmsDashboard,
    cmsPostCategories: ['Tất cả danh mục', ...cats.items.map((c) => c.name)],
    cmsPosts,
    cmsPostTotal: contents.totalItems,
    cmsCategories,
    cmsMedia: media.items.map((m) => ({ id: m.id, name: m.fileName, kind: KIND_LABEL[m.kind] || 'Khác', ext: m.ext, date: fmtDate(m.createdAt), size: fmtBytes(m.sizeBytes), url: m.url })),
    cmsMediaTotal: media.totalItems,
    cmsPageTree,
    cmsMenus: menuItems.items.sort((a, b) => a.sortOrder - b.sortOrder).map((m) => ({ id: m.id, label: m.label, url: m.url, type: MENU_TYPE[m.type] || 'Liên kết', typeValue: m.type, order: m.sortOrder, groupCode: m.groupCode, translations: m.translations || {} })),
    cmsUsers: users.items.map((u) => ({ id: u.id, name: u.fullName, email: u.email, role: roleName.get(u.roleCode) || u.roleCode, roleCode: u.roleCode, status: u.status === 1 ? 'Hoạt động' : 'Không hoạt động', last: fmtDateTime(u.lastLoginAt) })),
    cmsUserTotal: users.totalItems,
    cmsRoles: roles.map((r) => ({ id: r.id, code: r.code, role: r.name, users: r.userCount, desc: r.description || '', isSystem: !!r.isSystem })),
    cmsPermissionMatrix: { roles: roleNames, roleCodes: matrix.roles || [], rows: matrix.rows || [] },
    cmsSettings: { general: settings.general || {}, seo: settings.seo || {}, email: settings.email || {} },
    cmsSettingsAll: settings,
    cmsLogUsers: ['Tất cả người dùng', ...new Set(logs.items.map((l) => l.userName).filter(Boolean))],
    cmsActivity: logs.items.map((l) => ({ time: fmtDateTime(l.createdAt), user: l.userName, action: ACTION_LABEL[l.action] || l.action, target: l.targetLabel, ip: l.ipAddress })),
    cmsLogTotal: logs.totalItems,
    cmsBackups: backups.items.map((b) => ({ id: b.id, hasData: !!b.hasData, time: fmtDateTime(b.createdAt), size: fmtBytes(b.sizeBytes), by: b.trigger === 'cron' ? 'Hệ thống (Cron)' : b.createdByName, status: b.status === 'success' ? 'Thành công' : 'Lỗi' })),
    cmsBanners: banners.items.map((b) => ({ id: b.id, name: b.title, position: BANNER_POS[b.position] || b.position, status: b.isVisible ? 'Hiển thị' : 'Ẩn', order: b.sortOrder, period: `${b.startsOn ? dm(b.startsOn) : ''} – ${b.endsOn ? fmtDate(b.endsOn) : ''}` })),
    cmsLanguages: langs,
    cmsPostI18n: Object.fromEntries(contents.items.map((c) => [c.id, TR_LABEL[c.translations?.en?.status] || 'Chưa dịch'])),
    cmsI18nCoverage: settings.i18nCoverage || [],
    cmsLanguageSettings: { ...ui.cmsLanguageSettings, ...lang },
  }
}

export async function loadDataset(module) {
  if (module === 'cms') return loadCms()
  throw new Error(`Module "${module}" không thuộc CMS admin.`)
}
