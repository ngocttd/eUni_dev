/**
 * Nạp dataset của từng module cho website người dùng.
 *
 *  - content, home  → CMS API (cms-api) — dữ liệu do quản trị CMS cập nhật; adapter đổi về dạng giao diện đang dùng.
 *  - module khác    → service theo MODULE_SERVICE:  GET {gateway}/{service}/api/v1/{public|me}/datasets/{module}
 *
 * Khi backend thật sẵn sàng chỉ sửa file này (đổi endpoint / viết adapter) — giao diện không phải đổi.
 *
 * opts.tenant: tenant (X-Tenant) — trang công khai render phía server truyền tường minh (lib/datasets/server.js);
 * ở trình duyệt bỏ trống thì client tự lấy theo host (shared/services/tenantService.js).
 */
import api, { SERVICE } from '../api/client.js'
import { fmtDate, fmtTime, dayMonth, fmtDuration, parseBody } from './format.js'

/** module → service gateway (đồng bộ với euni-api-mock/src/datasets.js và docs/API_CONTRACT.md) */
export const MODULE_SERVICE = {
  about: SERVICE.qlns, 'staff-hub': SERVICE.qlns, 'portal-staff': SERVICE.qlns, 'portal-staff-tools': SERVICE.qlns, 'portal-leader': SERVICE.qlns,
  research: SERVICE.qlkhcn,
  admissions: SERVICE.edusoft, education: SERVICE.edusoft, 'student-hub': SERVICE.edusoft, 'portal-student': SERVICE.edusoft, 'portal-parent': SERVICE.edusoft,
  library: SERVICE.esb,
  cooperation: SERVICE.cms, life: SERVICE.cms, utilities: SERVICE.cms,
}

const EVENT_STATUS = { upcoming: 'Sắp diễn ra', ongoing: 'Đang diễn ra', finished: 'Đã kết thúc', cancelled: 'Đã hủy' }
const cms = api(SERVICE.cms)

/* ---------------- adapter: CMS → dạng dữ liệu giao diện ---------------- */
const toArticle = (a) => ({
  slug: a.slug, category: a.categoryName, date: fmtDate(a.publishedAt), views: a.viewCount, unit: a.unit, title: a.title, excerpt: a.excerpt,
  tags: a.tags || [], body: parseBody(a.contentBody), docs: (a.attachments || []).map((d) => ({ name: d.title, meta: d.meta })),
  // bản dịch tiếng Anh đã hoàn tất (nếu có) — DatasetProvider chọn theo ngôn ngữ đang dùng
  ...(a.translations?.en ? { en: { title: a.translations.en.title, excerpt: a.translations.en.excerpt, body: a.translations.en.contentBody ? parseBody(a.translations.en.contentBody) : [] } } : {}),
})
const toEvent = (e) => ({
  slug: e.slug, title: e.title, date: fmtDate(e.startsAt), ...dayMonth(e.startsAt),
  time: e.endsAt ? `${fmtTime(e.startsAt)} – ${fmtTime(e.endsAt)}` : fmtTime(e.startsAt),
  place: e.place, placeFull: e.placeFull, organizer: e.organizer, audience: e.audience, contact: e.contact,
  status: EVENT_STATUS[e.status] || e.status, desc: e.description || [], agenda: e.agenda || [],
})
const toAlbum = (a) => ({ slug: a.slug, title: a.title, date: fmtDate(a.publishedAt), count: a.photos.length, photos: a.photos.map((p) => ({ label: p.caption })) })
const toVideo = (v) => ({ slug: v.slug, title: v.title, date: fmtDate(v.publishedAt), duration: fmtDuration(v.durationSec), channel: v.channel, views: v.viewCount, desc: v.description })
const toPodcast = (p) => ({ slug: p.slug, title: p.title, date: fmtDate(p.publishedAt), episode: p.episode, duration: fmtDuration(p.durationSec), host: p.host, plays: p.playCount, desc: p.description, notes: p.notes || [] })

/** Bài viết soạn bằng WYSIWYG lưu dạng HTML → làm sạch (server) trước khi đưa vào trang */
async function cleanBodies(articles) {
  const hasHtml = (body = []) => body.some((b) => b?.type === 'html')
  if (!articles.some((a) => hasHtml(a.body) || hasHtml(a.en?.body))) return articles
  const { cleanHtml } = await import('./sanitize.js')
  const clean = (body = []) => body.map((b) => (b?.type === 'html' ? { ...b, html: cleanHtml(b.html) } : b))
  return articles.map((a) => ({ ...a, body: clean(a.body), ...(a.en ? { en: { ...a.en, body: clean(a.en.body) } } : {}) }))
}

export async function loadContent(opts = {}) {
  const d = await cms.get('/api/v1/public/site-content', { tenant: opts.tenant })
  return {
    newsCategories: d.categories.map((c) => c.name),
    articles: await cleanBodies(d.articles.map(toArticle)),
    events: d.events.map(toEvent),
    albums: d.albums.map(toAlbum),
    videos: d.videos.map(toVideo),
    podcasts: d.podcasts.map(toPodcast),
    searchPages: d.searchPages,
  }
}

const homeEn = (n) => (n.translations?.en ? { en: { title: n.translations.en.title, excerpt: n.translations.en.excerpt } } : {})

export async function loadHome(opts = {}) {
  const d = await cms.get('/api/v1/public/home', { tenant: opts.tenant })
  const media = (list, map) => list.map((x, i) => ({ label: map(x), size: i === 0 ? 'wide' : 'small' }))
  return {
    /* trang đơn vị mới chưa có slide → một slide mặc định theo tên trang để trang chủ vẫn hiển thị */
    heroSlides: (d.heroSlides.length ? d.heroSlides : [{ code: 'default', kicker: 'HUMG', title: (opts.siteName || 'Trường Đại học Mỏ - Địa chất').toUpperCase(), subtitle: '', motto: '', primaryLabel: 'Giới thiệu', primaryUrl: '/trang/gioi-thieu', accentLabel: 'Tin tức', accentUrl: '/tin-tuc' }]).map((s) => ({ id: s.code, kicker: s.kicker, title: s.title, years: s.subtitle, motto: s.motto, primary: { label: s.primaryLabel, to: s.primaryUrl }, accent: { label: s.accentLabel, to: s.accentUrl } })),
    quickLinks: d.quickLinks.map((q) => ({ label: q.label, icon: q.icon, to: q.url })),
    audiences: d.audiences.map((a) => ({ id: a.code, icon: a.icon, color: a.color, title: a.title, desc: a.description, to: a.url })),
    strengths: d.strengths.map((s) => ({ icon: s.icon, title: s.title, text: s.text })),
    partners: d.partners.map((p) => ({ name: p.name, short: p.shortName, color: p.color })),
    heroChips: d.heroChips,
    heroStats: d.heroStats.map((s) => ({ value: s.value, label: s.label })),
    universityStats: d.universityStats.map((s) => ({ value: s.value, label: s.label, ...(s.sub ? { sub: s.sub } : {}) })),
    featuredNews: d.featuredNews && { id: d.featuredNews.slug, slug: d.featuredNews.slug, tag: d.featuredNews.categoryName, date: fmtDate(d.featuredNews.publishedAt), title: d.featuredNews.title, excerpt: d.featuredNews.excerpt, ...homeEn(d.featuredNews) },
    newsList: d.newsList.map((n, i) => ({ id: `n${i + 1}`, slug: n.slug, tag: n.categoryName, date: fmtDate(n.publishedAt), title: n.title, ...homeEn(n) })),
    upcomingEvents: d.upcomingEvents.map((e, i) => ({ id: `e${i + 1}`, slug: e.slug, ...dayMonth(e.startsAt), title: e.title, place: e.place, time: e.endsAt ? `${fmtTime(e.startsAt)} – ${fmtTime(e.endsAt)}` : fmtTime(e.startsAt) })),
    mediaTabs: [
      { key: 'anh', label: 'Thư viện ảnh', items: media(d.mediaTabs.albums, (x) => x.title) },
      { key: 'video', label: 'Video', items: media(d.mediaTabs.videos, (x) => x.title) },
      { key: 'podcast', label: 'Podcast', items: media(d.mediaTabs.podcasts, (x) => x.title) },
    ],
  }
}

export async function loadDataset(module, opts = {}) {
  if (module === 'content') return loadContent(opts)
  if (module === 'home') return loadHome(opts)
  const service = MODULE_SERVICE[module]
  if (!service) throw new Error(`Module "${module}" chưa được khai báo trong MODULE_SERVICE.`)
  // dữ liệu cá nhân của portal (portal-*) thuộc nhóm /me/, còn lại /public/
  return api(service).get(`/api/v1/${module.startsWith('portal-') ? 'me' : 'public'}/datasets/${module}`, { tenant: opts.tenant })
}

export const loadDatasets = async (modules, opts = {}) => Object.fromEntries(await Promise.all(modules.map(async (m) => [m, await loadDataset(m, opts)])))

/* ---------------- dữ liệu chung của website: cấu hình, menu, banner ----------------
 * Mỗi phần lỗi riêng thì trả null để giao diện dùng cấu hình tĩnh dự phòng (routes/sitemap.js),
 * website vẫn chạy khi cms-api tạm lỗi. */
const tryGet = (p) => p.catch(() => null)
/** Danh sách phẳng (parentId) → cây, bỏ mục ẩn và con của mục ẩn */
export const menuTree = (rows) => {
  if (!Array.isArray(rows)) return null
  const visible = rows.filter((m) => m.isVisible !== false)
  const ids = new Set(visible.map((m) => m.id))
  const byOrder = (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  const node = (m) => ({ id: m.id, label: m.label, labelEn: m.translations?.en?.label || null, path: m.url || '', icon: m.icon || null, newTab: !!m.openInNewTab,
    children: visible.filter((c) => c.parentId === m.id).sort(byOrder).map(node) })
  return visible.filter((m) => !m.parentId || !ids.has(m.parentId)).filter((m) => !m.parentId).sort(byOrder).map(node)
}

export async function loadSite(opts = {}) {
  const o = { tenant: opts.tenant }
  const [settings, header, footer, utility, banners] = await Promise.all([
    tryGet(cms.get('/api/v1/public/settings', o)),
    tryGet(cms.get('/api/v1/public/menus/header', o)),
    tryGet(cms.get('/api/v1/public/menus/footer', o)),
    tryGet(cms.get('/api/v1/public/menus/utility', o)),
    tryGet(cms.get('/api/v1/public/banners', o)),
  ])
  return { settings, menus: { header: menuTree(header), footer: menuTree(footer), utility: menuTree(utility) }, banners: Array.isArray(banners) ? banners : null, loadedAt: Date.now() }
}

/** Trang tĩnh soạn ở CMS: null nếu không có (404) */
export async function loadCmsPage(slug, opts = {}) {
  try {
    const p = await cms.get(`/api/v1/public/pages/slug/${encodeURIComponent(slug)}`, { tenant: opts.tenant, query: { lang: opts.lang } })
    const { cleanHtml } = await import('./sanitize.js')
    return { ...p, bodyHtml: cleanHtml(p.bodyHtml || '') }
  } catch (e) {
    if (e?.status === 404) return null
    throw e
  }
}
