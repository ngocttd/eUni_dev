// Kho dữ liệu CMS trong bộ nhớ (có lưu ra data/store.json) dựng từ mock-data/*.json.
// Đây là bản MOCK của backend: mọi thay đổi từ CMS admin được phản ánh ngay ở các endpoint public.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const STORE_FILE = join(root, 'data', 'store.json')
const load = (name) => JSON.parse(readFileSync(join(root, 'mock-data', `${name}.json`), 'utf8'))

export const slugify = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const iso = (dmy, hm = '08:00') => { const [d, m, y] = dmy.split('/'); return `${y}-${m}-${d}T${hm}:00+07:00` }
const isoDate = (dmy) => { const [d, m, y] = dmy.split('/'); return `${y}-${m}-${d}` }
const bytes = (s) => { const [n, u] = s.split(' '); return Math.round(parseFloat(n) * ({ KB: 1024, MB: 1048576 }[u] || 1)) }
const secs = (s) => { const p = s.split(':').map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1] }

export const POST_STATUS = { draft: 0, pending: 1, published: 2, archived: 3 }
const STATUS_BY_LABEL = { 'Đã xuất bản': 2, 'Bản nháp': 0, 'Chờ duyệt': 1 }
const TR_BY_LABEL = { 'Đã dịch': 'done', 'Đang dịch': 'in_progress', 'Chưa dịch': 'missing' }
const BANNER_POS = { 'Trang chủ – Slider': 'home_slider', 'Trang chủ – Popup': 'home_popup', 'Cột phải': 'sidebar_right', 'Chân trang': 'footer' }
const ROLE_CODE = { 'Super Admin': 'super_admin', Editor: 'editor', Author: 'author', Viewer: 'viewer' }
const ACTION = { 'Đăng nhập': 'login', 'Đăng bài viết': 'post.publish', 'Cập nhật bài viết': 'post.update', 'Xóa bài viết': 'post.delete', 'Tải lên file': 'media.upload', 'Xóa người dùng': 'user.delete', 'Đổi cấu hình': 'settings.update' }
const MEDIA_KIND = { 'Hình ảnh': 'image', 'Tài liệu': 'document', 'Video': 'video', 'Âm thanh': 'audio' }
const MENU_TYPE = { 'Trang': 'page', 'Liên kết': 'link', 'Chuyên mục': 'category' }

/** Quyền chi tiết của từng hàng trong ma trận phân quyền */
export const MODULE_PERMS = {
  'Bài viết': ['post.view', 'post.create', 'post.update'], 'Xuất bản bài viết': ['post.publish'], 'Danh mục': ['category.manage'],
  'Media thư viện': ['media.manage'], 'Trang & Menu': ['page.manage', 'menu.manage'], 'Người dùng': ['user.manage'],
  'Cấu hình hệ thống': ['settings.manage'], 'Nhật ký & Sao lưu': ['log.view', 'backup.manage'],
}

function build() {
  const cms = load('cms'); const pub = load('content'); const home = load('home')
  const s = { seq: {}, collections: {} }
  const col = (n) => (s.collections[n] ||= [])
  const nextId = (n) => (s.seq[n] = (s.seq[n] || 0) + 1)
  const add = (n, row) => { const r = { id: nextId(n), ...row }; col(n).push(r); return r }

  /* languages & settings */
  s.collections.languages = cms.cmsLanguages.map((l) => ({ code: l.code, label: l.label, flag: l.flag, isSource: l.isSource, isEnabled: true }))
  s.settings = {
    ...cms.cmsSettings,
    language: { ...cms.cmsLanguageSettings },
    backup: { cronSchedule: '0 3 * * *', retentionCount: 7, storagePath: '/backup/cms_humg' },
    home: { heroChips: home.heroChips },
  }
  s.i18nCoverage = cms.cmsI18nCoverage
  s.trend = cms.cmsDashboard.trend

  /* roles + permissions */
  const m = cms.cmsPermissionMatrix
  cms.cmsRoles.forEach((r) => add('roles', { code: ROLE_CODE[r.role], name: r.role, description: r.desc, isSystem: true }))
  s.permissionMatrix = { roles: m.roles.map((n) => ROLE_CODE[n]), rows: m.rows.map((r) => ({ module: r.module, perms: r.perms })) }
  const rolePerms = MODULE_PERMS
  s.rolePermissions = {}
  m.roles.forEach((rn, i) => {
    const set = new Set()
    m.rows.forEach((row) => row.perms[i] && rolePerms[row.module].forEach((p) => set.add(p)))
    if (rn !== 'Viewer') set.add('cms.access')
    s.rolePermissions[ROLE_CODE[rn]] = [...set]
  })

  /* users */
  cms.cmsUsers.forEach((u) => add('users', {
    username: u.email.split('@')[0], email: u.email, fullName: u.name, roleCode: ROLE_CODE[u.role],
    status: u.status === 'Hoạt động' ? 1 : 0, lastLoginAt: iso(u.last.split(' ')[0], u.last.split(' ')[1]), createdAt: '2025-01-10T08:00:00+07:00',
  }))
  const userByName = (n) => col('users').find((u) => u.fullName === n)
  for (const name of new Set(cms.cmsPosts.map((p) => p.author))) {
    if (userByName(name)) continue
    const parts = slugify(name).split('-')
    const uname = `${parts.slice(-1)[0]}${parts.slice(0, -1).map((w) => w[0]).join('')}`
    add('users', { username: uname, email: `${uname}@humg.edu.vn`, fullName: name, roleCode: 'author', status: 1, lastLoginAt: null, createdAt: '2025-01-10T08:00:00+07:00' })
  }

  /* categories (cây) */
  let order = 0
  const addCat = (name, parentId = null, active = true) => {
    const ex = col('categories').find((c) => c.name === name)
    if (ex) return ex
    return add('categories', { parentId, name, slug: slugify(name), description: null, sortOrder: order++, isActive: active, translations: {} })
  }
  cms.cmsCategories.forEach((c) => { const p = addCat(c.name, null, c.status === 'Hiển thị'); (c.children || []).forEach((ch) => addCat(ch.name, p.id, ch.status === 'Hiển thị')) })
  ;[...cms.cmsPostCategories.slice(1), ...pub.newsCategories, ...pub.articles.map((a) => a.category)].forEach((n) => addCat(n))
  const catByName = (n) => col('categories').find((c) => c.name === n)

  /* media */
  cms.cmsMedia.forEach((f) => add('media', {
    fileName: f.name, kind: MEDIA_KIND[f.kind] || 'other', ext: f.ext, mimeType: null, sizeBytes: bytes(f.size), url: `/cms-api/uploads/${f.name}`,
    altText: null, caption: null, folder: null, uploadedBy: userByName('Lê Thị Mai').id, createdAt: iso(f.date),
  }))

  /* contents (bài viết) = bài quản trị + bài công khai */
  const featuredSlug = home.featuredNews.slug
  const homeSlugs = new Set([featuredSlug, ...home.newsList.map((n) => n.slug)])
  const byTitle = new Map(pub.articles.map((a) => [a.title, a]))
  const used = new Set()
  const addContent = (o) => {
    const author = userByName(o.authorName) || col('users')[0]
    return add('contents', {
      categoryId: catByName(o.category)?.id ?? null, title: o.title, slug: o.slug, excerpt: o.excerpt ?? null, status: o.status,
      isFeatured: o.slug === featuredSlug, showOnHome: homeSlugs.has(o.slug), contentBody: JSON.stringify(o.body ?? []),
      metaTitle: o.seo?.title ?? null, metaDescription: o.seo?.desc ?? null, metaKeywords: o.seo?.keywords ?? null,
      featuredImageId: null, attachmentId: null, authorId: author.id, authorName: author.fullName, source: null, unit: o.unit ?? null,
      viewCount: o.views ?? 0, tags: o.tags ?? [], attachments: (o.docs ?? []).map((d) => ({ title: d.name, meta: d.meta, url: null })),
      translations: o.en ? { en: o.en } : {}, publishedAt: o.status === 2 ? iso(o.date) : null, expiredAt: null,
      createdAt: iso(o.date), updatedAt: iso(o.date), deleteAt: null,
    })
  }
  cms.cmsPosts.forEach((p) => {
    const rich = byTitle.get(p.title); const first = p.id === 1
    const slug = first ? cms.cmsEditorDefaults.slug : rich?.slug || slugify(p.title)
    used.add(slug)
    const en = first
      ? { title: cms.cmsEditorDefaultsEn.title, excerpt: cms.cmsEditorDefaultsEn.excerpt, contentBody: JSON.stringify([cms.cmsEditorDefaultsEn.content]), metaTitle: cms.cmsEditorDefaultsEn.seoTitle, metaDescription: cms.cmsEditorDefaultsEn.seoDesc, metaKeywords: cms.cmsEditorDefaultsEn.seoKeywords, status: 'done' }
      : (cms.cmsPostI18n[p.id] && cms.cmsPostI18n[p.id] !== 'Chưa dịch' ? { title: p.title, status: TR_BY_LABEL[cms.cmsPostI18n[p.id]] } : null)
    addContent({
      slug, category: p.category, authorName: p.author, status: STATUS_BY_LABEL[p.status], date: p.date, title: p.title,
      excerpt: first ? cms.cmsEditorDefaults.excerpt : rich?.excerpt ?? `${p.title}.`, body: first ? [cms.cmsEditorDefaultContentVi] : rich?.body ?? [`${p.title}.`], unit: rich?.unit,
      views: rich?.views, tags: rich?.tags, docs: rich?.docs, en,
      seo: first ? { title: cms.cmsEditorDefaults.seoTitle, desc: cms.cmsEditorDefaults.seoDesc, keywords: cms.cmsEditorDefaults.seoKeywords } : null,
    })
  })
  pub.articles.forEach((a) => {
    if (used.has(a.slug)) return
    addContent({ slug: a.slug, category: a.category, authorName: 'Nguyễn Thị Hoa', status: 2, date: a.date, title: a.title, excerpt: a.excerpt, body: a.body, unit: a.unit, views: a.views, tags: a.tags, docs: a.docs })
  })
  // bài #1 của editor mẫu không chiếm ô "nổi bật" trang chủ
  col('contents').forEach((c) => { if (c.slug === cms.cmsEditorDefaults.slug) { c.isFeatured = false; c.showOnHome = false } })

  /* events / albums / videos / podcasts */
  pub.events.forEach((e) => {
    const [start, end] = (e.time || '').split('–').map((x) => x.trim())
    add('events', {
      slug: e.slug, title: e.title, startsAt: iso(e.date, start || '00:00'), endsAt: end ? iso(e.date, end) : null, place: e.place, placeFull: e.placeFull,
      organizer: e.organizer, audience: e.audience, contact: e.contact ?? null, status: 'upcoming', description: e.desc ?? [], agenda: e.agenda ?? [], isVisible: true,
    })
  })
  pub.albums.forEach((a) => add('albums', { slug: a.slug, title: a.title, publishedAt: isoDate(a.date), isVisible: true, photos: a.photos.map((p, i) => ({ id: i + 1, caption: p.label, mediaId: null, sortOrder: i })) }))
  pub.videos.forEach((v) => add('videos', { slug: v.slug, title: v.title, channel: v.channel, durationSec: secs(v.duration), videoUrl: null, viewCount: v.views, publishedAt: isoDate(v.date), description: v.desc, isVisible: true }))
  pub.podcasts.forEach((p) => add('podcasts', { slug: p.slug, title: p.title, episode: p.episode, host: p.host, durationSec: secs(p.duration), audioUrl: null, playCount: p.plays, publishedAt: isoDate(p.date), description: p.desc, notes: p.notes ?? [], isVisible: true }))
  s.searchPages = pub.searchPages

  /* trang & menu */
  let po = 0
  const addPage = (n, parentId = null) => { const r = add('pages', { parentId, slug: n.slug, title: n.name, template: 'default', status: 'published', sortOrder: po++, body: [] }); (n.children || []).forEach((c) => addPage(c, r.id)) }
  cms.cmsPageTree.forEach((n) => addPage(n))
  s.menuGroups = cms.cmsMenuGroups.map((name, i) => ({ code: ['header', 'footer', 'utility'][i], name }))
  cms.cmsMenus.forEach((it) => add('menuItems', { groupCode: 'header', parentId: null, type: MENU_TYPE[it.type] || 'link', url: it.url, label: it.label, sortOrder: it.order, isVisible: true, openInNewTab: false }))

  /* banners */
  cms.cmsBanners.forEach((b) => {
    const [from, to] = b.period.split('–').map((x) => x.trim()); const y = to.split('/')[2] || '2025'
    const sh = (x) => { const [d, mo] = x.split('/'); return `${y}-${mo}-${d}` }
    add('banners', { position: BANNER_POS[b.position], title: b.name, imageId: null, linkUrl: null, isVisible: b.status === 'Hiển thị', sortOrder: b.order, startsOn: sh(from), endsOn: sh(to) })
  })

  /* khối trang chủ */
  home.heroSlides.forEach((x, i) => add('heroSlides', { code: x.id, kicker: x.kicker, title: x.title, subtitle: x.years, motto: x.motto, primaryLabel: x.primary.label, primaryUrl: x.primary.to, accentLabel: x.accent.label, accentUrl: x.accent.to, isVisible: true, sortOrder: i }))
  home.quickLinks.forEach((x, i) => add('quickLinks', { label: x.label, icon: x.icon, url: x.to, isVisible: true, sortOrder: i }))
  home.audiences.forEach((x, i) => add('audiences', { code: x.id, title: x.title, description: x.desc, icon: x.icon, color: x.color, url: x.to, isVisible: true, sortOrder: i }))
  home.strengths.forEach((x, i) => add('strengths', { icon: x.icon, title: x.title, text: x.text, isVisible: true, sortOrder: i }))
  home.partners.forEach((x, i) => add('partners', { name: x.name, shortName: x.short, color: x.color, website: null, isVisible: true, sortOrder: i }))
  home.heroStats.forEach((x, i) => add('siteStats', { placement: 'hero', value: x.value, label: x.label, sub: null, isVisible: true, sortOrder: i }))
  home.universityStats.forEach((x, i) => add('siteStats', { placement: 'about', value: x.value, label: x.label, sub: x.sub ?? null, isVisible: true, sortOrder: i }))

  /* nhật ký & sao lưu */
  cms.cmsActivity.forEach((a) => add('activityLogs', { userId: userByName(a.user)?.id ?? null, userName: a.user, action: ACTION[a.action] || a.action, targetLabel: a.target, ipAddress: a.ip, createdAt: iso(a.time.split(' ')[0], a.time.split(' ')[1]) }))
  cms.cmsBackups.forEach((b) => add('backups', { filePath: `/backup/cms_humg/cms_${b.time.split(' ')[0].split('/').reverse().join('')}.sql.gz`, sizeBytes: bytes(b.size), trigger: b.by.includes('Cron') ? 'cron' : 'manual', createdByName: b.by, status: 'success', createdAt: iso(b.time.split(' ')[0], b.time.split(' ')[1]) }))
  return s
}

let state
export function getStore() {
  if (state) return state
  if (existsSync(STORE_FILE)) { try { state = JSON.parse(readFileSync(STORE_FILE, 'utf8')); return state } catch { /* dựng lại */ } }
  state = build()
  persist()
  return state
}
export function persist() {
  mkdirSync(dirname(STORE_FILE), { recursive: true })
  writeFileSync(STORE_FILE, JSON.stringify(state))
}
export function resetStore() { state = build(); persist(); return state }

/* tiện ích CRUD cho collection */
export const rows = (name) => (getStore().collections[name] ||= [])
export function insert(name, data) {
  const s = getStore(); s.seq[name] = (s.seq[name] || Math.max(0, ...rows(name).map((r) => r.id))) + 1
  const row = { id: s.seq[name], ...data }; rows(name).push(row); persist(); return row
}
export function update(name, id, patch) {
  const row = rows(name).find((r) => r.id === Number(id)); if (!row) return null
  Object.assign(row, patch, { id: row.id }); persist(); return row
}
export function remove(name, id) {
  const list = rows(name); const i = list.findIndex((r) => r.id === Number(id)); if (i < 0) return false
  list.splice(i, 1); persist(); return true
}
