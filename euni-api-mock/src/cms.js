// CMS API mock — /cms-api/api/...
// Tên endpoint theo mẫu Swagger HUMG.CMS (Categories, Contents, Media, Users) + phần mở rộng cùng phong cách.
// Mọi thay đổi ghi vào store → các endpoint /Public/* phản ánh ngay.
import { Router } from 'express'
import multer from 'multer'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getStore, persist, rows, insert, update, remove, resetStore, slugify, POST_STATUS, MODULE_PERMS } from './store.js'
import { requireCms, readToken } from './auth.js'

const here = dirname(fileURLToPath(import.meta.url))
const uploadDir = join(here, '..', 'uploads')
mkdirSync(uploadDir, { recursive: true })
const upload = multer({ storage: multer.diskStorage({ destination: uploadDir, filename: (_r, f, cb) => cb(null, `${Date.now()}-${slugify(f.originalname.replace(/\.[^.]+$/, ''))}${f.originalname.match(/\.[^.]+$/)?.[0] || ''}`) }) })

export const cms = Router()

/* ---------- tiện ích ---------- */
const now = () => new Date().toISOString()
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
const toInt = (v, d) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : d }
const notFound = (res, what = 'Không tìm thấy dữ liệu.') => res.status(404).json({ message: what })

export function paged(list, q = {}) {
  const pageIndex = toInt(q.pageIndex, 1)
  const pageSize = Math.min(toInt(q.pageSize, 20), 500)
  const totalItems = list.length
  return { items: list.slice((pageIndex - 1) * pageSize, pageIndex * pageSize), pageIndex, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) }
}
const matchKeyword = (row, q, fields) => !q.keyword || norm(fields.map((f) => row[f]).join(' ')).includes(norm(q.keyword))

function log(req, action, targetType, target) {
  const u = req.user || readToken(req) || {}
  const store = getStore()
  insert('activityLogs', { userId: u.uid ?? null, userName: u.name ?? 'Hệ thống', action, targetType, targetLabel: String(target ?? ''), ipAddress: req.ip?.replace('::ffff:', '') ?? null, createdAt: now() })
  return store
}

const statusInt = (v) => (typeof v === 'string' && v in POST_STATUS ? POST_STATUS[v] : Number.isFinite(Number(v)) ? Number(v) : undefined)
const catName = (id) => rows('categories').find((c) => c.id === id)?.name ?? null
const contentOut = (c) => ({ ...c, categoryName: catName(c.categoryId) })

/** Chỉ các bản dịch ĐÃ HOÀN TẤT (status done) mới được công khai; bản đang dịch/chưa dịch → website dùng lại tiếng Việt */
const doneTranslations = (c, withBody) => Object.fromEntries(Object.entries(c.translations || {})
  .filter(([, t]) => t && t.status === 'done' && t.title)
  .map(([k, t]) => [k, { title: t.title, excerpt: t.excerpt ?? null, ...(withBody ? { contentBody: t.contentBody ?? null } : {}) }]))

/** Bản hiển thị công khai của bài viết — lang=en: dùng bản dịch nếu có, thiếu thì quay về tiếng Việt. */
function publicArticle(c, lang = 'vi', withBody = true) {
  const tr = lang !== 'vi' ? c.translations?.[lang] : null
  const ok = tr && tr.status !== 'missing' && tr.title
  const body = ok && tr.contentBody ? tr.contentBody : c.contentBody
  return {
    id: c.id, slug: c.slug, categoryId: c.categoryId, categoryName: catName(c.categoryId), unit: c.unit, tags: c.tags, authorName: c.authorName,
    title: ok ? tr.title : c.title, excerpt: ok && tr.excerpt ? tr.excerpt : c.excerpt, metaTitle: ok ? tr.metaTitle ?? c.metaTitle : c.metaTitle,
    metaDescription: ok ? tr.metaDescription ?? c.metaDescription : c.metaDescription, isFeatured: c.isFeatured, showOnHome: c.showOnHome,
    viewCount: c.viewCount, publishedAt: c.publishedAt, attachments: c.attachments, language: ok ? lang : 'vi',
    translations: doneTranslations(c, withBody),
    ...(withBody ? { contentBody: body } : {}),
  }
}
const ts = (v) => (v ? Date.parse(v) || 0 : 0)
const isLive = (c) => c.status === 2 && !c.deleteAt && (!c.publishedAt || ts(c.publishedAt) <= Date.now()) && (!c.expiredAt || ts(c.expiredAt) > Date.now())
const liveContents = () => rows('contents').filter(isLive).sort((a, b) => ts(b.publishedAt) - ts(a.publishedAt))
const visible = (list) => list.filter((x) => x.isVisible !== false)
const bySort = (list) => [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

/* ============================================================
 * PUBLIC (không cần đăng nhập) — website người dùng đọc từ đây
 * ============================================================ */
cms.get('/api/Public/content', (req, res) => {
  const lang = req.query.lang || 'vi'
  const upcoming = rows('events').filter((e) => e.isVisible !== false).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  res.json({
    categories: bySort(rows('categories')).filter((c) => c.isActive).map((c) => ({ id: c.id, parentId: c.parentId, name: c.name, slug: c.slug })),
    articles: liveContents().map((c) => publicArticle(c, lang)),
    events: upcoming,
    albums: visible(rows('albums')).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    videos: visible(rows('videos')).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    podcasts: visible(rows('podcasts')).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    searchPages: getStore().searchPages,
  })
})

cms.get('/api/Public/home', (req, res) => {
  const lang = req.query.lang || 'vi'
  const live = liveContents()
  const homeItems = live.filter((c) => c.showOnHome)
  const featured = homeItems.find((c) => c.isFeatured) || homeItems[0] || live[0] || null
  const stats = visible(rows('siteStats'))
  res.json({
    heroSlides: bySort(visible(rows('heroSlides'))),
    quickLinks: bySort(visible(rows('quickLinks'))),
    audiences: bySort(visible(rows('audiences'))),
    strengths: bySort(visible(rows('strengths'))),
    partners: bySort(visible(rows('partners'))),
    heroStats: bySort(stats.filter((s) => s.placement === 'hero')),
    universityStats: bySort(stats.filter((s) => s.placement === 'about')),
    heroChips: getStore().settings.home?.heroChips ?? [],
    featuredNews: featured ? publicArticle(featured, lang, false) : null,
    newsList: homeItems.filter((c) => c !== featured).slice(0, 3).map((c) => publicArticle(c, lang, false)),
    upcomingEvents: rows('events').filter((e) => e.isVisible !== false).sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 5),
    mediaTabs: {
      albums: visible(rows('albums')).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 3),
      videos: visible(rows('videos')).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 3),
      podcasts: visible(rows('podcasts')).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 3),
    },
  })
})

cms.get('/api/Public/menus/:code', (req, res) => {
  const items = bySort(rows('menuItems').filter((m) => m.groupCode === req.params.code && m.isVisible))
  res.json(items)
})
cms.get('/api/Public/banners', (req, res) => {
  const today = new Date().toISOString().slice(0, 10)
  res.json(bySort(rows('banners').filter((b) => b.isVisible && (!req.query.position || b.position === req.query.position) && (!b.startsOn || b.startsOn <= today) && (!b.endsOn || b.endsOn >= today))))
})
cms.get('/api/Public/settings', (_req, res) => { const { general, seo, language } = getStore().settings; res.json({ general, seo, language }) })

/* Danh sách bài viết công khai (theo mẫu Swagger: Contents/view/list) */
cms.get('/api/Contents/view/list', (req, res) => {
  const lang = req.query.lang || 'vi'
  let list = liveContents()
  if (req.query.categoryId) list = list.filter((c) => c.categoryId === Number(req.query.categoryId))
  if (req.query.keyword) list = list.filter((c) => matchKeyword(c, req.query, ['title', 'excerpt']))
  const p = paged(list, req.query)
  res.json({ ...p, items: p.items.map((c) => publicArticle(c, lang, false)) })
})
cms.get('/api/Contents/slug/:slug', (req, res) => {
  const c = liveContents().find((x) => x.slug === req.params.slug)
  return c ? res.json(publicArticle(c, req.query.lang || 'vi')) : notFound(res, 'Không tìm thấy bài viết.')
})
/* Contents/function/{id}: ghi nhận lượt xem bài viết công khai */
cms.get('/api/Contents/function/:id', (req, res) => {
  const c = rows('contents').find((x) => x.id === Number(req.params.id))
  if (!c) return notFound(res, 'Không tìm thấy bài viết.')
  update('contents', c.id, { viewCount: (c.viewCount || 0) + 1 })
  res.json({ id: c.id, viewCount: c.viewCount })
})
cms.get('/api/Public/search', (req, res) => {
  const q = norm(req.query.q || '')
  const hit = (...f) => !q || f.some((x) => norm(x).includes(q))
  const out = []
  liveContents().forEach((a) => hit(a.title, a.excerpt) && out.push({ type: 'Bài viết', title: a.title, excerpt: a.excerpt, publishedAt: a.publishedAt, category: catName(a.categoryId), to: `/tin-tuc/${a.slug}` }))
  rows('events').forEach((e) => hit(e.title) && out.push({ type: 'Sự kiện', title: e.title, excerpt: e.place, publishedAt: e.startsAt, to: `/su-kien/${e.slug}` }))
  rows('videos').forEach((v) => hit(v.title, v.description) && out.push({ type: 'Media', title: v.title, excerpt: v.description, publishedAt: v.publishedAt, to: `/media/video/${v.slug}` }))
  rows('podcasts').forEach((p) => hit(p.title, p.description) && out.push({ type: 'Media', title: p.title, excerpt: p.description, publishedAt: p.publishedAt, to: `/media/podcast/${p.slug}` }))
  rows('albums').forEach((a) => hit(a.title) && out.push({ type: 'Media', title: a.title, excerpt: `Album ảnh · ${a.photos.length} ảnh`, publishedAt: a.publishedAt, to: `/media/anh/${a.slug}` }))
  getStore().searchPages.forEach((p) => hit(p.title, p.excerpt) && out.push(p))
  res.json(paged(out, req.query))
})

/* ============================================================
 * CONTENTS (bài viết) — quản trị
 * ============================================================ */
cms.get('/api/Contents', requireCms('post.view'), (req, res) => {
  const q = req.query; const st = statusInt(q.status)
  let list = rows('contents').filter((c) => !c.deleteAt)
  if (st !== undefined) list = list.filter((c) => c.status === st)
  if (q.categoryId) list = list.filter((c) => c.categoryId === Number(q.categoryId))
  if (q.translation) list = list.filter((c) => (c.translations?.en?.status || 'missing') === q.translation)
  if (q.keyword) list = list.filter((c) => matchKeyword(c, q, ['title', 'authorName']))
  list = [...list].sort((a, b) => ts(b.createdAt) - ts(a.createdAt) || b.id - a.id)
  const p = paged(list, q)
  res.json({ ...p, items: p.items.map(contentOut) })
})
cms.get('/api/Contents/:id', requireCms('post.view'), (req, res) => {
  const c = rows('contents').find((x) => x.id === Number(req.params.id) && !x.deleteAt)
  return c ? res.json(contentOut(c)) : notFound(res, 'Không tìm thấy bài viết.')
})
function contentFields(b, existing) {
  const f = {}
  for (const k of ['title', 'excerpt', 'metaTitle', 'metaDescription', 'metaKeywords', 'source', 'unit', 'authorName', 'expiredAt', 'publishedAt', 'tags', 'attachments', 'featuredImageId', 'attachmentId', 'translations', 'isFeatured', 'showOnHome']) if (b[k] !== undefined) f[k] = b[k]
  if (b.categoryId !== undefined) f.categoryId = b.categoryId === '' || b.categoryId === null ? null : Number(b.categoryId)
  if (b.contentBody !== undefined) f.contentBody = typeof b.contentBody === 'string' ? b.contentBody : JSON.stringify(b.contentBody)
  const st = statusInt(b.status); if (st !== undefined) f.status = st
  if (b.slug !== undefined || (!existing && b.title)) f.slug = slugify(b.slug || b.title)
  if (b.authorId !== undefined) f.authorId = Number(b.authorId)
  return f
}
cms.post('/api/Contents', requireCms('post.create'), (req, res) => {
  const b = req.body || {}
  if (!b.title) return res.status(422).json({ message: 'Thiếu tiêu đề.', errors: { title: ['Bắt buộc'] } })
  const f = contentFields(b)
  if (rows('contents').some((c) => c.slug === f.slug)) f.slug = `${f.slug}-${Date.now().toString(36)}`
  const user = rows('users').find((u) => u.id === req.user.uid)
  if (f.status === 2 && !req.user.perms.some((p) => p === 'post.publish' || p === 'cms.*')) return res.status(403).json({ message: 'Thiếu quyền xuất bản (post.publish).' })
  const row = insert('contents', {
    categoryId: null, excerpt: null, status: 0, isFeatured: false, showOnHome: false, contentBody: '[]', metaTitle: null, metaDescription: null, metaKeywords: null,
    featuredImageId: null, attachmentId: null, authorId: user?.id ?? null, authorName: user?.fullName ?? req.user.name, source: null, unit: null, viewCount: 0,
    tags: [], attachments: [], translations: {}, expiredAt: null, deleteAt: null, createdAt: now(), updatedAt: now(), publishedAt: null, ...f,
  })
  if (row.status === 2 && !row.publishedAt) update('contents', row.id, { publishedAt: now() })
  log(req, row.status === 2 ? 'post.publish' : 'post.create', 'content', row.title)
  res.status(201).json(contentOut(rows('contents').find((c) => c.id === row.id)))
})
cms.put('/api/Contents/:id', requireCms('post.update'), (req, res) => {
  const cur = rows('contents').find((x) => x.id === Number(req.params.id) && !x.deleteAt)
  if (!cur) return notFound(res, 'Không tìm thấy bài viết.')
  const f = contentFields(req.body || {}, cur)
  if (f.slug && rows('contents').some((c) => c.slug === f.slug && c.id !== cur.id)) return res.status(409).json({ message: 'Slug đã tồn tại.' })
  if (f.status === 2 && cur.status !== 2) {
    if (!req.user.perms.some((p) => p === 'post.publish' || p === 'cms.*')) return res.status(403).json({ message: 'Thiếu quyền xuất bản (post.publish).' })
    if (!cur.publishedAt && !f.publishedAt) f.publishedAt = now()
  }
  const row = update('contents', cur.id, { ...f, updatedAt: now() })
  log(req, f.status === 2 && cur.status !== 2 ? 'post.publish' : 'post.update', 'content', row.title)
  res.json(contentOut(row))
})
cms.delete('/api/Contents/:id', requireCms('post.update'), (req, res) => {
  const cur = rows('contents').find((x) => x.id === Number(req.params.id) && !x.deleteAt)
  if (!cur) return notFound(res, 'Không tìm thấy bài viết.')
  update('contents', cur.id, { deleteAt: now() }) // xóa mềm
  log(req, 'post.delete', 'content', cur.title)
  res.status(204).end()
})

/* ============================================================
 * CRUD chung cho các tài nguyên còn lại
 * ============================================================ */
function crud(path, name, { perm, fields = ['title'], defaults = {}, publicRead = false, onWrite, slugFrom, label = (r) => r.title ?? r.name ?? r.label ?? r.id, beforeSave }) {
  const guard = (p) => requireCms(p)
  const list = (req, res) => {
    let l = rows(name)
    if (req.query.keyword) l = l.filter((r) => matchKeyword(r, req.query, fields))
    for (const [k, v] of Object.entries(req.query)) if (!['keyword', 'pageIndex', 'pageSize', 'lang'].includes(k) && l.length && k in l[0]) l = l.filter((r) => String(r[k]) === String(v))
    res.json(paged(l, req.query))
  }
  cms.get(`/api/${path}`, publicRead ? list : [guard(perm), list])
  cms.get(`/api/${path}/:id`, guard(perm), (req, res) => { const r = rows(name).find((x) => x.id === Number(req.params.id) || (x.slug && x.slug === req.params.id)); return r ? res.json(r) : notFound(res) })
  cms.post(`/api/${path}`, guard(perm), (req, res) => {
    const b = { ...(req.body || {}) }; delete b.id
    if (slugFrom && !b.slug && b[slugFrom]) b.slug = slugify(b[slugFrom])
    const row = insert(name, { ...defaults, ...b, createdAt: now() })
    if (beforeSave) beforeSave(row); log(req, `${name}.create`, name, label(row)); onWrite?.(); res.status(201).json(row)
  })
  cms.put(`/api/${path}/:id`, guard(perm), (req, res) => {
    const b = { ...(req.body || {}) }; delete b.id
    const row = update(name, req.params.id, { ...b, updatedAt: now() })
    if (!row) return notFound(res)
    log(req, `${name}.update`, name, label(row)); onWrite?.(); res.json(row)
  })
  cms.delete(`/api/${path}/:id`, guard(perm), (req, res) => {
    const row = rows(name).find((x) => x.id === Number(req.params.id)); if (!row) return notFound(res)
    remove(name, row.id); log(req, `${name}.delete`, name, label(row)); onWrite?.(); res.status(204).end()
  })
}

crud('Categories', 'categories', { perm: 'category.manage', fields: ['name', 'slug'], publicRead: true, slugFrom: 'name', defaults: { parentId: null, isActive: true, sortOrder: 99, description: null, translations: {} } })
crud('Events', 'events', { perm: 'post.update', fields: ['title', 'place'], slugFrom: 'title', defaults: { status: 'upcoming', isVisible: true, description: [], agenda: [], contact: null, endsAt: null } })
crud('Albums', 'albums', { perm: 'post.update', fields: ['title'], slugFrom: 'title', defaults: { photos: [], isVisible: true, publishedAt: now().slice(0, 10) } })
crud('Videos', 'videos', { perm: 'post.update', fields: ['title'], slugFrom: 'title', defaults: { viewCount: 0, isVisible: true, publishedAt: now().slice(0, 10) } })
crud('Podcasts', 'podcasts', { perm: 'post.update', fields: ['title'], slugFrom: 'title', defaults: { playCount: 0, notes: [], isVisible: true, publishedAt: now().slice(0, 10) } })
crud('Pages', 'pages', { perm: 'page.manage', fields: ['title', 'slug'], defaults: { parentId: null, template: 'default', status: 'published', sortOrder: 99, body: [] } })
crud('MenuItems', 'menuItems', { perm: 'menu.manage', fields: ['label', 'url'], label: (r) => r.label, defaults: { groupCode: 'header', parentId: null, type: 'page', sortOrder: 99, isVisible: true, openInNewTab: false } })
crud('Banners', 'banners', { perm: 'post.update', fields: ['title'], defaults: { isVisible: true, sortOrder: 99, imageId: null, linkUrl: null } })
crud('HeroSlides', 'heroSlides', { perm: 'post.update', fields: ['title'], defaults: { isVisible: true, sortOrder: 99 } })
crud('QuickLinks', 'quickLinks', { perm: 'post.update', fields: ['label'], label: (r) => r.label, defaults: { isVisible: true, sortOrder: 99 } })
crud('Audiences', 'audiences', { perm: 'post.update', fields: ['title'], defaults: { isVisible: true, sortOrder: 99 } })
crud('Strengths', 'strengths', { perm: 'post.update', fields: ['title'], defaults: { isVisible: true, sortOrder: 99 } })
crud('Partners', 'partners', { perm: 'post.update', fields: ['name', 'shortName'], defaults: { isVisible: true, sortOrder: 99, website: null } })
crud('SiteStats', 'siteStats', { perm: 'post.update', fields: ['label', 'value'], label: (r) => `${r.label}: ${r.value}`, defaults: { placement: 'hero', isVisible: true, sortOrder: 99, sub: null } })

cms.get('/api/MenuGroups', requireCms('menu.manage'), (_req, res) => res.json(getStore().menuGroups))
cms.get('/api/Languages', (_req, res) => res.json(rows('languages')))

/* ============================================================
 * MEDIA (theo mẫu Swagger: POST /api/Media/upload multipart)
 * ============================================================ */
const kindOf = (mime = '', ext = '') => mime.startsWith('image/') ? 'image' : mime.startsWith('video/') ? 'video' : mime.startsWith('audio/') ? 'audio' : /pdf|doc|xls|ppt|txt/i.test(ext + mime) ? 'document' : 'other'
cms.get('/api/Media', requireCms('media.manage'), (req, res) => {
  let l = [...rows('media')].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (req.query.kind) l = l.filter((m) => m.kind === req.query.kind)
  if (req.query.folder) l = l.filter((m) => m.folder === req.query.folder)
  if (req.query.keyword) l = l.filter((m) => matchKeyword(m, req.query, ['fileName']))
  res.json(paged(l, req.query))
})
cms.get('/api/Media/:id', requireCms('media.manage'), (req, res) => { const m = rows('media').find((x) => x.id === Number(req.params.id)); return m ? res.json(m) : notFound(res) })
cms.get('/api/Media/:id/url', (req, res) => { const m = rows('media').find((x) => x.id === Number(req.params.id)); return m ? res.json({ url: m.url }) : notFound(res) })
cms.post('/api/Media/upload', requireCms('media.manage'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(422).json({ message: 'Thiếu file.' })
  const ext = (req.file.originalname.match(/\.([^.]+)$/)?.[1] || '').toLowerCase()
  const row = insert('media', {
    fileName: req.file.originalname, kind: kindOf(req.file.mimetype, ext), ext, mimeType: req.file.mimetype, sizeBytes: req.file.size, url: `/cms-api/uploads/${req.file.filename}`,
    altText: req.body.altText ?? null, caption: req.body.caption ?? null, folder: req.body.folder ?? null, uploadedBy: Number(req.body.uploadedBy) || req.user.uid || null, createdAt: now(),
  })
  log(req, 'media.upload', 'media', row.fileName)
  res.status(201).json(row)
})
cms.delete('/api/Media/:id', requireCms('media.manage'), (req, res) => {
  const m = rows('media').find((x) => x.id === Number(req.params.id)); if (!m) return notFound(res)
  remove('media', m.id); log(req, 'media.delete', 'media', m.fileName); res.status(204).end()
})

/* ============================================================
 * USERS / ROLES
 * ============================================================ */
const userOut = ({ passwordHash, ...u }) => u
cms.get('/api/Users', requireCms('user.manage'), (req, res) => {
  let l = rows('users')
  if (req.query.keyword) l = l.filter((u) => matchKeyword(u, req.query, ['fullName', 'email', 'username']))
  if (req.query.roleCode) l = l.filter((u) => u.roleCode === req.query.roleCode)
  if (req.query.status !== undefined && req.query.status !== '') l = l.filter((u) => u.status === Number(req.query.status))
  const p = paged(l, req.query); res.json({ ...p, items: p.items.map(userOut) })
})
cms.get('/api/Users/:id', requireCms('user.manage'), (req, res) => { const u = rows('users').find((x) => x.id === Number(req.params.id)); return u ? res.json(userOut(u)) : notFound(res) })
cms.post('/api/Users', requireCms('user.manage'), (req, res) => {
  const b = req.body || {}
  if (!b.email || !b.fullName) return res.status(422).json({ message: 'Thiếu họ tên hoặc email.' })
  if (rows('users').some((u) => u.email.toLowerCase() === String(b.email).toLowerCase())) return res.status(409).json({ message: 'Email đã tồn tại.' })
  const row = insert('users', { username: b.username || b.email.split('@')[0], email: b.email, fullName: b.fullName, roleCode: b.roleCode || 'author', status: statusInt(b.status) ?? 1, lastLoginAt: null, createdAt: now() })
  log(req, 'user.create', 'user', row.fullName); res.status(201).json(userOut(row))
})
cms.put('/api/Users/:id', requireCms('user.manage'), (req, res) => {
  const { id, passwordHash, password, ...b } = req.body || {}
  if (b.status !== undefined) b.status = statusInt(b.status)
  const row = update('users', req.params.id, b); if (!row) return notFound(res)
  log(req, 'user.update', 'user', row.fullName); res.json(userOut(row))
})
cms.delete('/api/Users/:id', requireCms('user.manage'), (req, res) => {
  const u = rows('users').find((x) => x.id === Number(req.params.id)); if (!u) return notFound(res)
  if (u.id === req.user.uid) return res.status(409).json({ message: 'Không thể xóa tài khoản đang đăng nhập.' })
  remove('users', u.id); log(req, 'user.delete', 'user', u.fullName); res.status(204).end()
})

cms.get('/api/Roles', requireCms('user.manage'), (_req, res) => {
  const store = getStore()
  res.json(rows('roles').map((r) => ({ ...r, userCount: rows('users').filter((u) => u.roleCode === r.code).length, permissions: store.rolePermissions[r.code] || [] })))
})
cms.post('/api/Roles', requireCms('user.manage'), (req, res) => {
  const b = req.body || {}; if (!b.name) return res.status(422).json({ message: 'Thiếu tên vai trò.' })
  const code = slugify(b.code || b.name).replace(/-/g, '_')
  const row = insert('roles', { code, name: b.name, description: b.description ?? null, isSystem: false })
  getStore().rolePermissions[code] = b.permissions || (b.copyFrom ? [...(getStore().rolePermissions[b.copyFrom] || [])] : []); persist()
  log(req, 'role.create', 'role', row.name); res.status(201).json(row)
})
cms.get('/api/Roles/permission-matrix', requireCms('user.manage'), (_req, res) => res.json(getStore().permissionMatrix))
cms.put('/api/Roles/permission-matrix', requireCms('user.manage'), (req, res) => {
  const m = req.body
  if (!m?.roles || !m?.rows) return res.status(422).json({ message: 'Ma trận không hợp lệ.' })
  const store = getStore()
  store.permissionMatrix = m
  // đồng bộ quyền thật của từng vai trò từ ma trận (Super Admin luôn giữ toàn quyền)
  m.roles.forEach((code, i) => {
    if (code === 'super_admin') return
    const set = new Set()
    m.rows.forEach((row) => row.perms[i] && (MODULE_PERMS[row.module] || []).forEach((p) => set.add(p)))
    if (code !== 'viewer') set.add('cms.access')
    store.rolePermissions[code] = [...set]
  })
  persist(); log(req, 'role.update', 'role', 'Ma trận phân quyền'); res.json(m)
})
cms.put('/api/Roles/:id', requireCms('user.manage'), (req, res) => {
  const { id, permissions, ...b } = req.body || {}
  const row = update('roles', req.params.id, b); if (!row) return notFound(res)
  if (permissions) { getStore().rolePermissions[row.code] = permissions; persist() }
  log(req, 'role.update', 'role', row.name); res.json(row)
})
cms.delete('/api/Roles/:id', requireCms('user.manage'), (req, res) => {
  const r = rows('roles').find((x) => x.id === Number(req.params.id)); if (!r) return notFound(res)
  if (r.isSystem) return res.status(409).json({ message: 'Không thể xóa vai trò hệ thống.' })
  if (rows('users').some((u) => u.roleCode === r.code)) return res.status(409).json({ message: 'Vai trò đang được gán cho người dùng.' })
  remove('roles', r.id); delete getStore().rolePermissions[r.code]; persist(); log(req, 'role.delete', 'role', r.name); res.status(204).end()
})

/* ============================================================
 * SETTINGS · LOGS · BACKUPS · DASHBOARD
 * ============================================================ */
cms.get('/api/Settings', requireCms('settings.manage'), (_req, res) => res.json({ ...getStore().settings, i18nCoverage: getStore().i18nCoverage }))
cms.get('/api/Settings/:group', requireCms('settings.manage'), (req, res) => { const g = getStore().settings[req.params.group]; return g ? res.json(g) : notFound(res) })
/* Gửi email thử (mock: không gửi thật) */
cms.post('/api/Settings/email/test', requireCms('settings.manage'), (req, res) => {
  const to = String((req.body || {}).to || '').trim()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return res.status(422).json({ message: 'Email nhận không hợp lệ.' })
  const mail = getStore().settings.email || {}
  log(req, 'settings.email_test', 'settings', to)
  res.json({ ok: true, message: 'Đã gửi email thử tới ' + to + ' (mock: qua ' + (mail.smtpHost || 'SMTP') + ').' })
})

cms.put('/api/Settings/:group', requireCms('settings.manage'), (req, res) => {
  const s = getStore(); s.settings[req.params.group] = { ...(s.settings[req.params.group] || {}), ...(req.body || {}) }; persist()
  log(req, 'settings.update', 'settings', req.params.group); res.json(s.settings[req.params.group])
})

cms.get('/api/ActivityLogs', requireCms('log.view'), (req, res) => {
  let l = [...rows('activityLogs')].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (req.query.action) l = l.filter((x) => x.action === req.query.action)
  if (req.query.userId) l = l.filter((x) => x.userId === Number(req.query.userId))
  if (req.query.keyword) l = l.filter((x) => matchKeyword(x, req.query, ['userName', 'targetLabel']))
  res.json(paged(l, req.query))
})
/* Sao lưu: chụp toàn bộ dữ liệu CMS (trừ nhật ký/sao lưu) để tải về hoặc phục hồi */
const SNAP_SKIP = new Set(['backups', 'activityLogs'])
const takeSnapshot = () => {
  const s = getStore()
  const { snapshots, ...rest } = s
  const collections = Object.fromEntries(Object.entries(rest.collections).filter(([k]) => !SNAP_SKIP.has(k)))
  return JSON.stringify({ app: 'humg-cms-mock', version: 1, takenAt: now(), data: { ...rest, collections } })
}
const applySnapshot = (json) => {
  let snap
  try { snap = JSON.parse(json) } catch { return 'Tệp sao lưu không phải JSON hợp lệ.' }
  if (snap?.app !== 'humg-cms-mock' || !snap.data?.collections) return 'Tệp sao lưu không đúng định dạng.'
  const s = getStore()
  const keep = { backups: s.collections.backups, activityLogs: s.collections.activityLogs }
  const seq = { ...snap.data.seq, backups: s.seq.backups, activityLogs: s.seq.activityLogs }
  Object.keys(s).forEach((k) => { if (!['snapshots'].includes(k)) delete s[k] })
  Object.assign(s, snap.data, { seq, snapshots: s.snapshots })
  s.collections = { ...snap.data.collections, ...keep }
  persist()
  return null
}
const backupOut = (b) => ({ ...b, hasData: Boolean(getStore().snapshots?.[b.id]) })

cms.get('/api/Backups', requireCms('backup.manage'), (req, res) => {
  const p = paged([...rows('backups')].sort((a, b) => ts(b.createdAt) - ts(a.createdAt) || b.id - a.id), req.query)
  res.json({ ...p, items: p.items.map(backupOut) })
})
cms.post('/api/Backups', requireCms('backup.manage'), (req, res) => {
  const snap = takeSnapshot()
  const row = insert('backups', { filePath: '/backup/cms_humg/cms_' + Date.now() + '.json', sizeBytes: Buffer.byteLength(snap), trigger: 'manual', createdByName: req.user.name, status: 'success', createdAt: now() })
  const s = getStore(); s.snapshots = s.snapshots || {}; s.snapshots[row.id] = snap
  // chỉ giữ dữ liệu của 8 bản mới nhất
  Object.keys(s.snapshots).map(Number).sort((a, b) => b - a).slice(8).forEach((id) => delete s.snapshots[id])
  persist(); log(req, 'backup.create', 'backup', row.filePath); res.status(201).json(backupOut(row))
})
cms.get('/api/Backups/:id/download', requireCms('backup.manage'), (req, res) => {
  const snap = getStore().snapshots?.[Number(req.params.id)]
  if (!snap) return res.status(404).json({ message: 'Bản sao lưu này không còn dữ liệu để tải.' })
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="cms-backup-' + req.params.id + '.json"')
  res.send(snap)
})
cms.post('/api/Backups/restore', requireCms('backup.manage'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(422).json({ message: 'Thiếu tệp sao lưu.' })
  const err = applySnapshot(readFileSync(req.file.path, 'utf8'))
  if (err) return res.status(422).json({ message: err })
  log(req, 'backup.restore', 'backup', req.file.originalname); res.json({ ok: true })
})
cms.post('/api/Backups/:id/restore', requireCms('backup.manage'), (req, res) => {
  const snap = getStore().snapshots?.[Number(req.params.id)]
  if (!snap) return res.status(404).json({ message: 'Bản sao lưu này không còn dữ liệu để phục hồi.' })
  const err = applySnapshot(snap)
  if (err) return res.status(422).json({ message: err })
  log(req, 'backup.restore', 'backup', 'Bản #' + req.params.id); res.json({ ok: true })
})
cms.delete('/api/Backups/:id', requireCms('backup.manage'), (req, res) => {
  const b = rows('backups').find((x) => x.id === Number(req.params.id)); if (!b) return notFound(res)
  remove('backups', b.id); if (getStore().snapshots) delete getStore().snapshots[b.id]; persist()
  log(req, 'backup.delete', 'backup', b.filePath); res.status(204).end()
})

cms.get('/api/Dashboard', requireCms(), (_req, res) => {
  const contents = rows('contents').filter((c) => !c.deleteAt)
  const by = (s) => contents.filter((c) => c.status === s).length
  const total = contents.length || 1
  const part = (label, value) => ({ label, value, pct: Math.round((value / total) * 1000) / 10 })
  res.json({
    stats: { posts: contents.length, pages: rows('pages').length, categories: rows('categories').length, users: rows('users').length },
    status: { total: contents.length, parts: [part('published', by(2)), part('draft', by(0)), part('pending', by(1)), part('archived', by(3))] },
    latestPosts: [...contents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3).map(contentOut),
    upcomingEvents: [...rows('events')].sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 3),
    latestMedia: [...rows('media')].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3),
    trend: getStore().trend,
    onlineUsers: 5,
  })
})

/* Đặt lại dữ liệu mock về trạng thái ban đầu (chỉ dùng khi phát triển) */
cms.post('/api/_dev/reset', (_req, res) => { resetStore(); res.json({ ok: true }) })
