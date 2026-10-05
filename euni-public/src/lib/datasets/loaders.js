/**
 * Nạp dataset của từng module cho website người dùng.
 *
 *  - content, home  → CMS API (cms-api) — dữ liệu do quản trị CMS cập nhật; adapter đổi về dạng giao diện đang dùng.
 *  - module khác    → service ngoài theo MODULE_SERVICE:  GET {gateway}/{service}/api/v1/datasets/{module}
 *
 * Khi backend thật sẵn sàng chỉ sửa file này (đổi endpoint / viết adapter) — giao diện không phải đổi.
 */
import api, { SERVICE } from '../api/client.js'
import { fmtDate, fmtTime, dayMonth, fmtDuration, parseBody } from './format.js'

/** module → service gateway (đồng bộ với euni-api-mock/src/datasets.js và docs/API_CONTRACT.md) */
export const MODULE_SERVICE = {
  about: SERVICE.qlns, 'staff-hub': SERVICE.qlns, 'portal-staff': SERVICE.qlns, 'portal-staff-tools': SERVICE.qlns, 'portal-leader': SERVICE.qlns,
  research: SERVICE.qlkhcn,
  admissions: SERVICE.qldt, education: SERVICE.qldt, 'student-hub': SERVICE.qldt, 'portal-student': SERVICE.qldt, 'portal-parent': SERVICE.qldt,
  cooperation: SERVICE.portal, library: SERVICE.portal, life: SERVICE.portal, utilities: SERVICE.portal,
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

export async function loadContent() {
  const d = await cms.get('/api/Public/content')
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

export async function loadHome() {
  const d = await cms.get('/api/Public/home')
  const media = (list, map) => list.map((x, i) => ({ label: map(x), size: i === 0 ? 'wide' : 'small' }))
  return {
    heroSlides: d.heroSlides.map((s) => ({ id: s.code, kicker: s.kicker, title: s.title, years: s.subtitle, motto: s.motto, primary: { label: s.primaryLabel, to: s.primaryUrl }, accent: { label: s.accentLabel, to: s.accentUrl } })),
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

export async function loadDataset(module) {
  if (module === 'content') return loadContent()
  if (module === 'home') return loadHome()
  const service = MODULE_SERVICE[module]
  if (!service) throw new Error(`Module "${module}" chưa được khai báo trong MODULE_SERVICE.`)
  return api(service).get(`/api/v1/datasets/${module}`)
}

export const loadDatasets = async (modules) => Object.fromEntries(await Promise.all(modules.map(async (m) => [m, await loadDataset(m)])))
