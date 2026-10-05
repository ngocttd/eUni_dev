/**
 * Dataset "cms" cho CMS admin: gọi các endpoint quản trị của cms-api (theo tenant đang chọn) rồi đổi về dạng dữ liệu
 * mà các màn hình CMS đang dùng (cmsPosts, cmsAnnouncements, cmsGrants, cmsActivity…).
 * Người dùng / vai trò KHÔNG còn ở đây — quản lý trên Identity Server; CMS chỉ phân quyền mức bản ghi (grants).
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

/** Trạng thái workflow (docs/design/CMS_DESIGN.md §7). "Hẹn giờ" = published + publishAt trong tương lai. */
export const STATUS_LABEL = { draft: 'Bản nháp', pending_review: 'Chờ duyệt', published: 'Đã xuất bản', archived: 'Lưu trữ' }
export const statusLabel = (r) => (r.status === 'published' && r.isScheduled ? 'Hẹn giờ' : r.status === 'published' && r.isExpired ? 'Hết hạn' : STATUS_LABEL[r.status] || r.status)
export const ACTION_LABEL_WF = {
  edit: 'Sửa', submit: 'Gửi duyệt', approve: 'Duyệt & xuất bản', reject: 'Trả lại', publish: 'Xuất bản', unpublish: 'Gỡ xuống', archive: 'Lưu trữ',
  'approve-revision': 'Duyệt bản sửa đổi', 'reject-revision': 'Từ chối bản sửa đổi', delete: 'Xóa', restore: 'Khôi phục',
}
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
  'news.create': 'Tạo bài viết', 'news.update': 'Cập nhật bài viết', 'news.delete': 'Xóa bài viết', 'news.restore': 'Khôi phục bài viết', 'news.submit': 'Gửi duyệt bài viết',
  'news.approve': 'Duyệt bài viết', 'news.reject': 'Trả lại bài viết', 'news.publish': 'Xuất bản bài viết', 'news.unpublish': 'Gỡ bài viết', 'news.archive': 'Lưu trữ bài viết',
  'news.propose': 'Đề xuất sửa bài viết', 'news.approve-revision': 'Duyệt bản sửa đổi', 'news.reject-revision': 'Từ chối bản sửa đổi',
  'announcement.create': 'Tạo thông báo', 'announcement.update': 'Cập nhật thông báo', 'announcement.submit': 'Gửi duyệt thông báo', 'announcement.approve': 'Duyệt thông báo',
  'announcement.publish': 'Phát hành thông báo', 'announcement.archive': 'Thu hồi / lưu trữ thông báo', 'announcement.delete': 'Xóa thông báo', 'announcement.reject': 'Trả lại thông báo',
  'grant.create': 'Cấp quyền', 'grant.update': 'Sửa quyền', 'grant.delete': 'Thu hồi quyền',
}
const dm = (iso) => { const d = fmtDate(iso); return d ? d.slice(0, 5) : '' }

export async function loadCms() {
  const [ctx, dashApi, contents, cats, media, pages, menuItems, anns, grants, orgUnits, settings, logs, backups, banners, langs] = await Promise.all([
    cms.get('/api/Me/context'),
    safe(cms.get('/api/Dashboard'), null),
    page(cms.get('/api/Contents', { query: big })),
    page(cms.get('/api/Categories', { query: big })),
    safe(page(cms.get('/api/Media', { query: big })), empty),
    safe(page(cms.get('/api/Pages', { query: big })), empty),
    safe(page(cms.get('/api/MenuItems', { query: big })), empty),
    safe(page(cms.get('/api/Announcements', { query: big })), empty),
    safe(page(cms.get('/api/Grants', { query: big })), null),
    safe(cms.get('/api/OrgUnits'), []),
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
      stats: { posts: contents.totalItems, pages: pages.totalItems, categories: cats.totalItems, announcements: anns.totalItems },
      status: { total: contents.items.length, parts: [part('published', by('published')), part('draft', by('draft')), part('pending_review', by('pending_review')), part('archived', by('archived'))] },
      awaitingReview: [],
      latestPosts: [...contents.items].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 3),
      upcomingEvents: [], latestMedia: media.items.slice(0, 3), onlineUsers: 0, trend: [],
    }
  }
  const dash = dashApi || dashFallback()
  const catName = new Map(cats.items.map((c) => [c.id, c.name]))
  const postCount = new Map()
  contents.items.forEach((c) => postCount.set(c.categoryId, (postCount.get(c.categoryId) || 0) + 1))

  const cmsPosts = contents.items.map((c) => ({
    id: c.id, title: c.title, category: c.categoryName || catName.get(c.categoryId) || '', author: c.authorName || '',
    status: statusLabel(c), statusCode: c.status, date: fmtDate(c.updatedAt || c.createdAt), unit: c.ownerUnitName || c.ownerUnitCode || '',
    actions: c.allowedActions || [], hasPendingRevision: !!c.pendingRevision, raw: c,
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
    stats: [stat(dash.stats.posts, 'Bài viết'), stat(dash.stats.announcements ?? anns.totalItems, 'Thông báo'), stat(dash.stats.pages, 'Trang'), stat(dash.stats.categories, 'Danh mục')],
    trend: dash.trend || [],
    status: { total: dash.status.total, parts: dash.status.parts.map((p) => ({ ...p, label: STATUS_LABEL[p.label] || p.label })) },
    awaitingReview: (dash.awaitingReview || []).map((x) => ({ ...x, to: `/cms/${x.type === 'announcement' ? 'thong-bao' : 'bai-viet'}/moi/${x.id}`, meta: `${x.type === 'announcement' ? 'Thông báo' : 'Bài viết'} · ${x.hasPendingRevision ? 'bản sửa đổi chờ duyệt' : STATUS_LABEL[x.status]}` })),
    latestPosts: dash.latestPosts.map((c) => ({ title: c.title, meta: `${c.categoryName || ''} · ${fmtDate(c.createdAt)}` })),
    upcomingEvents: dash.upcomingEvents.map((e) => ({ title: e.title, meta: fmtDate(e.startsAt) })),
    latestMedia: dash.latestMedia.map((m) => ({ title: m.fileName, meta: `${KIND_LABEL[m.kind] || ''} · ${fmtDate(m.createdAt)}` })),
    onlineUsers: dash.onlineUsers,
  }

  const session = tokenService.getSession()?.user
  const lang = settings.language || {}
  const unitName = new Map(orgUnits.map((u) => [u.code, u.name]))

  return {
    ...ui,
    cmsUser: { name: session?.name || ctx.user?.name || '', role: session?.roleLabel || (ctx.user?.roles || []).filter((r) => r.startsWith('cms.')).join(', ') },
    cmsContext: ctx,
    cmsCan: ctx.can || {},
    cmsTenants: ctx.tenants || [],
    cmsTenant: ctx.currentTenant,
    cmsOrgUnits: orgUnits,
    cmsUnitName: (code) => unitName.get(code) || code,
    cmsAnnouncements: anns.items.map((a) => ({
      id: a.id, title: a.title, unit: a.ownerUnitName || a.ownerUnitCode, category: a.categoryLabel || a.category, priority: a.priority, priorityLabel: a.priorityLabel,
      status: statusLabel(a), statusCode: a.status, targets: a.targetSummary || '', stats: a.stats || { recipients: 0, read: 0, acked: 0 },
      date: fmtDateTime(a.publishAt || a.updatedAt), actions: a.allowedActions || [], hasPendingRevision: !!a.pendingRevision, raw: a,
    })),
    cmsAnnouncementTotal: anns.totalItems,
    cmsGrants: grants ? grants.items : null,
    cmsDashboard,
    cmsPostCategories: ['Tất cả danh mục', ...cats.items.map((c) => c.name)],
    cmsPosts,
    cmsPostTotal: contents.totalItems,
    cmsCategories,
    cmsMedia: media.items.map((m) => ({ id: m.id, name: m.fileName, kind: KIND_LABEL[m.kind] || 'Khác', ext: m.ext, date: fmtDate(m.createdAt), size: fmtBytes(m.sizeBytes), url: m.url })),
    cmsMediaTotal: media.totalItems,
    cmsPageTree,
    cmsMenus: menuItems.items.sort((a, b) => a.sortOrder - b.sortOrder).map((m) => ({ id: m.id, label: m.label, url: m.url, type: MENU_TYPE[m.type] || 'Liên kết', typeValue: m.type, order: m.sortOrder, groupCode: m.groupCode, translations: m.translations || {} })),
    cmsSettings: { general: settings.general || {}, seo: settings.seo || {}, email: settings.email || {} },
    cmsSettingsAll: settings,
    cmsLogUsers: ['Tất cả người dùng', ...new Set(logs.items.map((l) => l.userName).filter(Boolean))],
    cmsActivity: logs.items.map((l) => ({ time: fmtDateTime(l.createdAt), user: l.userName, action: ACTION_LABEL[l.action] || l.action, target: l.targetLabel, ip: l.ipAddress, changes: l.changes || null })),
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
