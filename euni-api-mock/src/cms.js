// CMS API mock — /cms-api/api/v1/...
// Quy ước endpoint (giống Swagger cms-api trên gateway demo): chữ thường, ngăn cách bằng '-', có version, tách nhóm:
//   /api/v1/public/...  website đọc, không cần đăng nhập
//   /api/v1/me/...      người dùng đã đăng nhập (portal): ngữ cảnh, hộp thư thông báo
//   /api/v1/admin/...   quản trị CMS (Bearer token + quyền)
// Danh sách đầy đủ: contract/API_CONTRACT.md · docs/design/CMS_DESIGN.md §11.
// Mọi request thuộc một tenant (header X-Tenant, xem tenant.js). Ghi ở CMS → các endpoint /Public/* đổi ngay.
import { Router } from 'express'
import multer from 'multer'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getStore, persist, rows, insert, update, remove, resetStore, slugify, SCHEMA_VERSION } from './store.js'
import { requireCms, requireUser, isSuper, hasPerm, ROLE_PERMISSIONS, REALM_ROLES, CLIENT_ROLES } from './auth.js'
import { tenants, tenantById } from './tenant.js'
import { can, grantsFor, withAncestors, tenantsOf } from './acl.js'
import { log, diff } from './audit.js'
import { workflowResource, paged, norm, now, isLive } from './lifecycle.js'
import { announcementRoutes } from './announcements.js'

export { paged }

const here = dirname(fileURLToPath(import.meta.url))
const uploadDir = join(here, '..', 'uploads')
mkdirSync(uploadDir, { recursive: true })
const upload = multer({ storage: multer.diskStorage({ destination: uploadDir, filename: (_r, f, cb) => cb(null, `${Date.now()}-${slugify(f.originalname.replace(/\.[^.]+$/, ''))}${f.originalname.match(/\.[^.]+$/)?.[0] || ''}`) }) })

export const cms = Router()

/* ---------- tiện ích ---------- */
const notFound = (res, what = 'Không tìm thấy dữ liệu.') => res.status(404).json({ message: what })
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const matchKeyword = (row, q, fields) => !q.keyword || norm(fields.map((f) => row[f]).join(' ')).includes(norm(q.keyword))
const ts = (v) => (v ? Date.parse(v) || 0 : 0)
/** Dòng của tenant hiện hành, chưa xóa mềm */
const trows = (req, name) => rows(name).filter((r) => r.tenantId === req.tenant && !r.deletedAt)
const settingsOf = (tenant) => { const s = getStore(); return (s.settings[tenant] ||= JSON.parse(JSON.stringify(s.settings.humg))) }
const unitName = (code) => rows('orgUnits').find((u) => u.code === code)?.name ?? code
const userName = (sub) => rows('users').find((u) => u.sub === sub)?.fullName ?? sub

const catName = (id) => rows('categories').find((c) => c.id === id)?.name ?? null

/** Chỉ các bản dịch ĐÃ HOÀN TẤT (status done) mới được công khai; bản đang dịch/chưa dịch → website dùng lại tiếng Việt */
const doneTranslations = (c, withBody) => Object.fromEntries(Object.entries(c.translations || {})
  .filter(([, t]) => t && t.status === 'done' && t.title)
  .map(([k, t]) => [k, { title: t.title, excerpt: t.excerpt ?? null, ...(withBody ? { contentBody: t.contentBody ?? null } : {}) }]))

/** Bản hiển thị công khai của bài viết — lang=en: dùng bản dịch đã hoàn tất, thiếu thì quay về tiếng Việt. */
function publicArticle(c, lang = 'vi', withBody = true) {
  const tr = lang !== 'vi' ? c.translations?.[lang] : null
  const ok = tr && tr.status === 'done' && tr.title
  const body = ok && tr.contentBody ? tr.contentBody : c.contentBody
  return {
    id: c.id, slug: c.slug, categoryId: c.categoryId, categoryName: catName(c.categoryId), unit: c.unit, tags: c.tags, authorName: c.authorName,
    title: ok ? tr.title : c.title, excerpt: ok && tr.excerpt ? tr.excerpt : c.excerpt, metaTitle: ok ? tr.metaTitle ?? c.metaTitle : c.metaTitle,
    metaDescription: ok ? tr.metaDescription ?? c.metaDescription : c.metaDescription, isFeatured: c.isFeatured, showOnHome: c.showOnHome,
    viewCount: c.viewCount, publishedAt: c.publishAt, attachments: c.attachments, language: ok ? lang : 'vi',
    translations: doneTranslations(c, withBody),
    ...(withBody ? { contentBody: body } : {}),
  }
}
const liveContents = (req) => trows(req, 'contents').filter(isLive).sort((a, b) => ts(b.publishAt) - ts(a.publishAt))
const visible = (list) => list.filter((x) => x.isVisible !== false)
const bySort = (list) => [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
const byDate = (list) => [...list].sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))

/* ============================================================
 * PUBLIC (không cần đăng nhập) — website người dùng đọc từ đây, theo tenant
 * ============================================================ */
cms.get('/api/v1/public/site-content', (req, res) => {
  const lang = req.query.lang || 'vi'
  res.json({
    categories: bySort(trows(req, 'categories')).filter((c) => c.isActive).map((c) => ({ id: c.id, parentId: c.parentId, name: c.name, slug: c.slug })),
    articles: liveContents(req).map((c) => publicArticle(c, lang)),
    events: visible(trows(req, 'events')).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    albums: byDate(visible(trows(req, 'albums'))),
    videos: byDate(visible(trows(req, 'videos'))),
    podcasts: byDate(visible(trows(req, 'podcasts'))),
    searchPages: getStore().searchPages,
  })
})

cms.get('/api/v1/public/home', (req, res) => {
  const lang = req.query.lang || 'vi'
  const live = liveContents(req)
  const homeItems = live.filter((c) => c.showOnHome)
  const featured = homeItems.find((c) => c.isFeatured) || homeItems[0] || live[0] || null
  const stats = visible(trows(req, 'siteStats'))
  res.json({
    heroSlides: bySort(visible(trows(req, 'heroSlides'))),
    quickLinks: bySort(visible(trows(req, 'quickLinks'))),
    audiences: bySort(visible(trows(req, 'audiences'))),
    strengths: bySort(visible(trows(req, 'strengths'))),
    partners: bySort(visible(trows(req, 'partners'))),
    heroStats: bySort(stats.filter((s) => s.placement === 'hero')),
    universityStats: bySort(stats.filter((s) => s.placement === 'about')),
    heroChips: settingsOf(req.tenant).home?.heroChips ?? [],
    featuredNews: featured ? publicArticle(featured, lang, false) : null,
    newsList: homeItems.filter((c) => c !== featured).slice(0, 3).map((c) => publicArticle(c, lang, false)),
    upcomingEvents: visible(trows(req, 'events')).sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 5),
    mediaTabs: {
      albums: byDate(visible(trows(req, 'albums'))).slice(0, 3),
      videos: byDate(visible(trows(req, 'videos'))).slice(0, 3),
      podcasts: byDate(visible(trows(req, 'podcasts'))).slice(0, 3),
    },
  })
})

cms.get('/api/v1/public/menus/:code', (req, res) => res.json(bySort(trows(req, 'menuItems').filter((m) => m.groupCode === req.params.code && m.isVisible))))
cms.get('/api/v1/public/banners', (req, res) => {
  const today = new Date().toISOString().slice(0, 10)
  const mediaUrl = (id) => (id ? trows(req, 'media').find((m) => m.id === Number(id))?.url ?? null : null)
  res.json(bySort(trows(req, 'banners').filter((b) => b.isVisible && (!req.query.position || b.position === req.query.position) && (!b.startsOn || b.startsOn <= today) && (!b.endsOn || b.endsOn >= today)))
    .map((b) => ({ id: b.id, position: b.position, title: b.title, subtitle: b.subtitle ?? null, linkUrl: b.linkUrl, imageUrl: mediaUrl(b.imageId), sortOrder: b.sortOrder, startsOn: b.startsOn, endsOn: b.endsOn })))
})
/* Trang tĩnh soạn ở CMS (template khác "system"), đã xuất bản. Website hiển thị ở /trang/{slug}. */
cms.get('/api/v1/public/pages/slug/:slug', (req, res) => {
  const lang = req.query.lang || 'vi'
  const all = trows(req, 'pages')
  const pg = all.find((x) => x.slug === req.params.slug && x.status === 'published' && x.template !== 'system')
  if (!pg) return notFound(res, 'Không tìm thấy trang.')
  const tr = lang !== 'vi' ? pg.translations?.[lang] : null
  const ok = tr && tr.status === 'done' && tr.title
  const parents = []
  for (let p = all.find((x) => x.id === pg.parentId), g = 0; p && g < 10; p = all.find((x) => x.id === p.parentId), g++) parents.unshift({ title: p.title, url: p.template === 'system' ? p.path : `/trang/${p.slug}` })
  res.json({ id: pg.id, slug: pg.slug, title: ok ? tr.title : pg.title, bodyHtml: ok && tr.bodyHtml ? tr.bodyHtml : pg.bodyHtml || '', language: ok ? lang : 'vi',
    template: pg.template, parents, updatedAt: pg.updatedAt ?? pg.createdAt ?? null })
})
cms.get('/api/v1/public/settings', (req, res) => { const { general, seo, language } = settingsOf(req.tenant); res.json({ tenant: req.tenant, general, seo, language }) })
cms.get('/api/v1/public/tenant', (req, res) => { const t = tenantById(req.tenant); res.json({ id: t.id, name: t.name, rootUnit: t.rootUnit }) })

/* Danh sách bài viết công khai (phân trang) */
cms.get('/api/v1/public/contents', (req, res) => {
  const lang = req.query.lang || 'vi'
  let list = liveContents(req)
  if (req.query.categoryId) list = list.filter((c) => c.categoryId === Number(req.query.categoryId))
  if (req.query.keyword) list = list.filter((c) => matchKeyword(c, req.query, ['title', 'excerpt']))
  const p = paged(list, req.query)
  res.json({ ...p, items: p.items.map((c) => publicArticle(c, lang, false)) })
})
cms.get('/api/v1/public/contents/slug/:slug', (req, res) => {
  const c = liveContents(req).find((x) => x.slug === req.params.slug)
  return c ? res.json(publicArticle(c, req.query.lang || 'vi')) : notFound(res, 'Không tìm thấy bài viết.')
})
/* Ghi nhận lượt xem bài viết công khai */
cms.post('/api/v1/public/contents/:id/views', (req, res) => {
  const c = liveContents(req).find((x) => x.id === Number(req.params.id))
  if (!c) return notFound(res, 'Không tìm thấy bài viết.')
  update('contents', c.id, { viewCount: (c.viewCount || 0) + 1 })
  res.json({ id: c.id, viewCount: c.viewCount })
})
/* Tìm kiếm không dấu (backend thật: unaccent + pg_trgm, xem database/v2/schema.sql) */
cms.get('/api/v1/public/search', (req, res) => {
  const q = norm(req.query.q || '')
  const hit = (...f) => !q || f.some((x) => norm(x).includes(q))
  const out = []
  liveContents(req).forEach((a) => hit(a.title, a.excerpt, a.contentBody) && out.push({ type: 'Bài viết', title: a.title, excerpt: a.excerpt, publishedAt: a.publishAt, category: catName(a.categoryId), to: `/tin-tuc/${a.slug}` }))
  trows(req, 'events').forEach((e) => hit(e.title) && out.push({ type: 'Sự kiện', title: e.title, excerpt: e.place, publishedAt: e.startsAt, to: `/su-kien/${e.slug}` }))
  trows(req, 'videos').forEach((v) => hit(v.title, v.description) && out.push({ type: 'Media', title: v.title, excerpt: v.description, publishedAt: v.publishedAt, to: `/media/video/${v.slug}` }))
  trows(req, 'podcasts').forEach((p) => hit(p.title, p.description) && out.push({ type: 'Media', title: p.title, excerpt: p.description, publishedAt: p.publishedAt, to: `/media/podcast/${p.slug}` }))
  trows(req, 'albums').forEach((a) => hit(a.title) && out.push({ type: 'Media', title: a.title, excerpt: `Album ảnh · ${a.photos.length} ảnh`, publishedAt: a.publishedAt, to: `/media/anh/${a.slug}` }))
  getStore().searchPages.forEach((p) => hit(p.title, p.excerpt) && out.push(p))
  trows(req, 'pages').filter((p) => p.status === 'published' && p.template !== 'system').forEach((p) => hit(p.title, String(p.bodyHtml || '').replace(/<[^>]+>/g, ' ')) && out.push({ type: 'Trang', title: p.title, excerpt: String(p.bodyHtml || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160), to: `/trang/${p.slug}` }))
  res.json(paged(out, req.query))
})

/* ============================================================
 * NGỮ CẢNH NGƯỜI DÙNG · TENANT · ĐƠN VỊ · DANH BẠ
 * ============================================================ */
cms.get('/api/v1/me/context', requireUser, (req, res) => {
  const t = req.user
  const mine = tenantsOf(t)
  const list = isSuper(t.perms) ? tenants() : hasPerm(t.perms, 'cms.access') ? tenants().filter((x) => mine.includes(x.id)) : []
  const tenant = list.find((x) => x.id === req.tenant) ? req.tenant : list[0]?.id ?? null
  res.json({
    user: { sub: t.sub, name: t.name, email: t.email, roles: t.roles, units: t.units },
    permissions: t.perms, tenants: list.map(({ id, name, rootUnit, domains }) => ({ id, name, rootUnit, domains: domains || [] })), currentTenant: tenant,
    units: withAncestors(t.units || []).map((code) => ({ code, name: unitName(code) })),
    can: Object.fromEntries(['news', 'announcement'].map((type) => [type, Object.fromEntries(['view', 'edit', 'review', 'publish'].map((a) => [a, can(t, tenant, type, a)]))])),
  })
})

cms.get('/api/v1/admin/org-units', requireCms(), (_req, res) => {
  const list = rows('orgUnits')
  const depth = (u) => withAncestors([u.code]).length - 1
  const path = (u) => withAncestors([u.code]).reverse().join('.')
  res.json(list.map((u) => ({ ...u, depth: depth(u), path: path(u) })).sort((a, b) => a.path.localeCompare(b.path)))
})

/* Danh bạ (IdS) — tìm người theo tên, email, mã cán bộ, mã sinh viên. Chỉ đọc. */
const directoryOut = (u) => ({ sub: u.sub, name: u.fullName, email: u.email, staffCode: u.staffCode, studentCode: u.studentCode, roles: u.roles, units: u.units, active: u.status === 1 })
cms.get('/api/v1/admin/directory/users', requireCms(), (req, res) => {
  const kw = norm(req.query.keyword || '')
  let list = rows('users')
  if (kw) list = list.filter((u) => norm([u.fullName, u.email, u.username, u.staffCode, u.studentCode].join(' ')).includes(kw))
  if (req.query.role) list = list.filter((u) => (u.roles || []).includes(req.query.role))
  res.json(paged(list.map(directoryOut), { pageSize: 20, ...req.query }))
})
cms.get('/api/v1/admin/directory/users/:sub', requireCms(), (req, res) => {
  const u = rows('users').find((x) => x.sub === req.params.sub)
  return u ? res.json(directoryOut(u)) : notFound(res)
})
/* Danh mục role trên SSO: realm role (tầng 1) + client role của các app (tầng 2); permissions = quyền chức năng trong CMS */
cms.get('/api/v1/admin/directory/roles', requireCms(), (_req, res) => res.json([
  ...Object.entries(REALM_ROLES).map(([code, label]) => ({ code, label, kind: 'realm', client: null, permissions: ROLE_PERMISSIONS[code] || [] })),
  ...Object.entries(CLIENT_ROLES).flatMap(([client, roles]) => Object.entries(roles).map(([code, label]) => ({ code, label, kind: 'client', client, permissions: ROLE_PERMISSIONS[code] || [] }))),
]))

/* ============================================================
 * PHÂN QUYỀN MỨC BẢN GHI (grants) — thay /api/v1/admin/users, /api/v1/admin/roles (user/role quản lý ở IdS)
 * ============================================================ */
const GRANT_PERMS = ['view', 'edit', 'review', 'publish', 'manage']
const grantOut = (g) => {
  const principalLabel = g.principalType === 'user' ? userName(g.principalId) : g.principalType === 'unit' ? unitName(g.principalId) : g.principalId
  const scopeLabel = g.scopeType === 'tenant' ? 'Toàn trang' : g.scopeType === 'category' ? `Chuyên mục: ${catName(Number(g.scopeId)) ?? g.scopeId}`
    : g.scopeType === 'unit' ? `Đơn vị: ${unitName(g.scopeId)} (gồm đơn vị con)` : `Bản ghi #${g.scopeId}`
  return { ...g, principalLabel, scopeLabel, createdByName: userName(g.createdBy) }
}
function grantFields(b, req) {
  const f = {}
  for (const k of ['principalType', 'principalId', 'resourceType', 'scopeType', 'scopeId', 'permissions', 'note', 'expiresAt']) if (b[k] !== undefined) f[k] = b[k]
  if (f.principalType && !['user', 'unit', 'role'].includes(f.principalType)) return 'principalType phải là user | unit | role.'
  if (f.resourceType && !['*', 'news', 'announcement', 'page', 'media'].includes(f.resourceType)) return 'resourceType không hợp lệ.'
  if (f.scopeType && !['tenant', 'category', 'unit', 'record'].includes(f.scopeType)) return 'scopeType không hợp lệ.'
  if (f.permissions && (!Array.isArray(f.permissions) || !f.permissions.length || f.permissions.some((p) => !GRANT_PERMS.includes(p)))) return 'permissions phải là mảng con của view/edit/review/publish/manage.'
  if (f.scopeType === 'tenant') f.scopeId = null
  else if (f.scopeId !== undefined && f.scopeId !== null) f.scopeId = String(f.scopeId)
  if (f.principalType === 'unit' && f.principalId && !rows('orgUnits').some((u) => u.code === f.principalId)) return 'Đơn vị không tồn tại.'
  if (f.principalType === 'user' && f.principalId && !rows('users').some((u) => u.sub === f.principalId)) return 'Người dùng không tồn tại trong danh bạ.'
  if (f.scopeType === 'unit' && f.scopeId && !rows('orgUnits').some((u) => u.code === f.scopeId)) return 'Đơn vị phạm vi không tồn tại.'
  if (f.scopeType === 'category' && f.scopeId && !trows(req, 'categories').some((c) => String(c.id) === f.scopeId)) return 'Chuyên mục không thuộc trang này.'
  return f
}
cms.get('/api/v1/admin/grants', requireCms('grant.manage'), (req, res) => {
  let list = trows(req, 'grants')
  for (const k of ['principalType', 'principalId', 'resourceType', 'scopeType', 'scopeId']) if (req.query[k]) list = list.filter((g) => String(g[k]) === String(req.query[k]))
  if (req.query.keyword) list = list.filter((g) => norm(Object.values(grantOut(g)).join(' ')).includes(norm(req.query.keyword)))
  res.json(paged(list.map(grantOut), { pageSize: 500, ...req.query }))
})
/* Quyền hiệu lực của một người — để kiểm tra "vì sao A sửa được bài này" */
cms.get('/api/v1/admin/grants/effective/:sub', requireCms('grant.manage'), (req, res) => {
  const u = rows('users').find((x) => x.sub === req.params.sub)
  if (!u) return notFound(res)
  const perms = [...new Set((u.roles || []).flatMap((r) => ROLE_PERMISSIONS[r] || []))]
  const principal = { sub: u.sub, roles: u.roles, units: u.units, perms }
  res.json({ user: directoryOut(u), permissions: perms, grants: ['news', 'announcement'].flatMap((t) => grantsFor(principal, req.tenant, t)).filter((g, i, a) => a.indexOf(g) === i).map(grantOut) })
})
cms.post('/api/v1/admin/grants', requireCms('grant.manage'), (req, res) => {
  const f = grantFields(req.body || {}, req)
  if (typeof f === 'string') return res.status(422).json({ message: f })
  for (const k of ['principalType', 'principalId', 'scopeType', 'permissions']) if (!f[k]) return res.status(422).json({ message: `Thiếu ${k}.` })
  if (f.scopeType !== 'tenant' && !f.scopeId) return res.status(422).json({ message: 'Thiếu scopeId cho phạm vi đã chọn.' })
  const row = insert('grants', { tenantId: req.tenant, resourceType: '*', scopeId: null, note: null, expiresAt: null, ...f, createdBy: req.user.sub, createdAt: now(), deletedAt: null })
  log(req, 'grant.create', 'grant', { id: row.id, title: `${grantOut(row).principalLabel} → ${grantOut(row).scopeLabel}` }, { permissions: [null, row.permissions] })
  res.status(201).json(grantOut(row))
})
cms.put('/api/v1/admin/grants/:id', requireCms('grant.manage'), (req, res) => {
  const g = trows(req, 'grants').find((x) => x.id === Number(req.params.id)); if (!g) return notFound(res)
  const f = grantFields(req.body || {}, req)
  if (typeof f === 'string') return res.status(422).json({ message: f })
  const before = { ...g }
  update('grants', g.id, f)
  log(req, 'grant.update', 'grant', { id: g.id, title: grantOut(g).principalLabel }, diff(before, g))
  res.json(grantOut(g))
})
cms.delete('/api/v1/admin/grants/:id', requireCms('grant.manage'), (req, res) => {
  const g = trows(req, 'grants').find((x) => x.id === Number(req.params.id)); if (!g) return notFound(res)
  update('grants', g.id, { deletedAt: now(), deletedBy: req.user.sub })
  log(req, 'grant.delete', 'grant', { id: g.id, title: grantOut(g).principalLabel })
  res.status(204).end()
})

/* ============================================================
 * CONTENTS (tin tức) — workflow, revision, thùng rác, ACL (lifecycle.js)
 * ============================================================ */
const CONTENT_FIELDS = ['title', 'excerpt', 'metaTitle', 'metaDescription', 'metaKeywords', 'source', 'unit', 'authorName', 'expireAt', 'publishAt', 'tags', 'attachments',
  'featuredImageId', 'attachmentId', 'translations', 'isFeatured', 'showOnHome', 'ownerUnitCode']
const bad = (status, message) => Object.assign(new Error(message), { status })
function contentFields(b, existing, req) {
  const f = {}
  for (const k of CONTENT_FIELDS) if (b[k] !== undefined) f[k] = b[k]
  // tên trường cũ (v1) vẫn nhận
  if (b.publishedAt !== undefined && b.publishAt === undefined) f.publishAt = b.publishedAt
  if (b.expiredAt !== undefined && b.expireAt === undefined) f.expireAt = b.expiredAt
  for (const k of ['publishAt', 'expireAt']) if (f[k] === '') f[k] = null
  if (f.title !== undefined && !String(f.title).trim()) throw bad(422, 'Tiêu đề không được để trống.')
  if (!existing && !b.title) throw bad(422, 'Thiếu tiêu đề.')
  if (b.categoryId !== undefined) {
    f.categoryId = b.categoryId === '' || b.categoryId === null ? null : Number(b.categoryId)
    if (f.categoryId !== null && !trows(req, 'categories').some((c) => c.id === f.categoryId)) throw bad(422, 'Chuyên mục không thuộc trang này.')
  }
  if (f.ownerUnitCode && !rows('orgUnits').some((u) => u.code === f.ownerUnitCode)) throw bad(422, 'Đơn vị sở hữu không tồn tại.')
  if (b.contentBody !== undefined) f.contentBody = typeof b.contentBody === 'string' ? b.contentBody : JSON.stringify(b.contentBody)
  if (b.slug !== undefined || (!existing && b.title)) {
    f.slug = slugify(b.slug || b.title)
    if (trows(req, 'contents').some((c) => c.slug === f.slug && c.id !== existing?.id)) {
      if (existing) throw bad(409, 'Slug đã tồn tại.')
      f.slug = `${f.slug}-${Date.now().toString(36)}`
    }
  }
  if (f.expireAt && f.publishAt && Date.parse(f.expireAt) <= Date.parse(f.publishAt)) throw bad(422, 'Thời gian hết hạn phải sau thời gian xuất bản.')
  return f
}
/* lỗi ném từ normalize → HTTP */
const wrapNormalize = (fn) => (b, existing, req) => {
  try { return fn(b, existing, req) } catch (e) { if (e.status) { const err = new Error(e.message); err.status = e.status; throw Object.assign(err, { http: true }) } throw e }
}
const tenantRoot = (req) => tenantById(req.tenant)?.rootUnit || 'HUMG'
workflowResource(cms, {
  path: 'contents', col: 'contents', type: 'news',
  normalize: wrapNormalize(contentFields),
  defaults: (req) => ({
    categoryId: null, ownerUnitCode: req.user.units?.[0] || tenantRoot(req), excerpt: null, isFeatured: false, showOnHome: false, contentBody: '[]',
    metaTitle: null, metaDescription: null, metaKeywords: null, featuredImageId: null, attachmentId: null, authorSub: req.user.sub, authorName: req.user.name,
    source: null, unit: null, viewCount: 0, tags: [], attachments: [], translations: {}, publishAt: null, expireAt: null,
  }),
  out: (c) => ({ categoryName: catName(c.categoryId), ownerUnitName: unitName(c.ownerUnitCode) }),
  validate: (c) => (!String(c.title || '').trim() ? 'Bài viết chưa có tiêu đề.' : null),
  filter: (list, q) => {
    if (q.categoryId) list = list.filter((c) => c.categoryId === Number(q.categoryId))
    if (q.translation) list = list.filter((c) => (c.translations?.en?.status || 'missing') === q.translation)
    return list
  },
})

announcementRoutes(cms)

/* ============================================================
 * CRUD chung cho các tài nguyên còn lại — theo tenant, xóa mềm, audit diff
 * ============================================================ */
function crud(name, { perm, fields = ['title'], defaults = {}, publicRead = false, slugFrom, label = (r) => r.title ?? r.name ?? r.label ?? r.id }) {
  const list = (req, res) => {
    let l = trows(req, name)
    if (req.query.keyword) l = l.filter((r) => matchKeyword(r, req.query, fields))
    for (const [k, v] of Object.entries(req.query)) if (!['keyword', 'pageIndex', 'pageSize', 'lang'].includes(k) && l.length && k in l[0]) l = l.filter((r) => String(r[k]) === String(v))
    res.json(paged(l, req.query))
  }
  const one = (req) => trows(req, name).find((x) => x.id === Number(req.params.id) || (x.slug && x.slug === req.params.id))
  const path = kebab(name)
  if (publicRead) cms.get(`/api/v1/public/${path}`, list)
  cms.get(`/api/v1/admin/${path}`, publicRead ? [requireCms(), list] : [requireCms(perm), list])
  cms.get(`/api/v1/admin/${path}/trash`, requireCms(perm), (req, res) => res.json(paged(rows(name).filter((r) => r.tenantId === req.tenant && r.deletedAt), req.query)))
  cms.get(`/api/v1/admin/${path}/:id`, requireCms(perm), (req, res) => { const r = one(req); return r ? res.json(r) : notFound(res) })
  cms.post(`/api/v1/admin/${path}`, requireCms(perm), (req, res) => {
    const b = { ...(req.body || {}) }; delete b.id; delete b.tenantId
    if (slugFrom && !b.slug && b[slugFrom]) b.slug = slugify(b[slugFrom])
    const row = insert(name, { ...defaults, ...b, tenantId: req.tenant, createdAt: now(), createdBy: req.user.sub, deletedAt: null })
    log(req, `${name}.create`, name, { id: row.id, title: label(row) }); res.status(201).json(row)
  })
  cms.put(`/api/v1/admin/${path}/:id`, requireCms(perm), (req, res) => {
    const r = one(req); if (!r) return notFound(res)
    const b = { ...(req.body || {}) }; delete b.id; delete b.tenantId
    const before = { ...r }
    update(name, r.id, { ...b, updatedAt: now(), updatedBy: req.user.sub })
    log(req, `${name}.update`, name, { id: r.id, title: label(r) }, diff(before, r)); res.json(r)
  })
  cms.delete(`/api/v1/admin/${path}/:id`, requireCms(perm), (req, res) => {
    const r = one(req); if (!r) return notFound(res)
    update(name, r.id, { deletedAt: now(), deletedBy: req.user.sub })
    log(req, `${name}.delete`, name, { id: r.id, title: label(r) }); res.status(204).end()
  })
  cms.post(`/api/v1/admin/${path}/:id/restore`, requireCms(perm), (req, res) => {
    const r = rows(name).find((x) => x.tenantId === req.tenant && x.deletedAt && x.id === Number(req.params.id)); if (!r) return notFound(res)
    update(name, r.id, { deletedAt: null, deletedBy: null })
    log(req, `${name}.restore`, name, { id: r.id, title: label(r) }); res.json(r)
  })
}

crud('categories', { perm: 'category.manage', fields: ['name', 'slug'], publicRead: true, slugFrom: 'name', defaults: { parentId: null, isActive: true, sortOrder: 99, description: null, translations: {} } })
crud('events', { perm: 'site.manage', fields: ['title', 'place'], slugFrom: 'title', defaults: { status: 'upcoming', isVisible: true, description: [], agenda: [], contact: null, endsAt: null } })
crud('albums', { perm: 'site.manage', fields: ['title'], slugFrom: 'title', defaults: { photos: [], isVisible: true, publishedAt: now().slice(0, 10) } })
crud('videos', { perm: 'site.manage', fields: ['title'], slugFrom: 'title', defaults: { viewCount: 0, isVisible: true, publishedAt: now().slice(0, 10) } })
crud('podcasts', { perm: 'site.manage', fields: ['title'], slugFrom: 'title', defaults: { playCount: 0, notes: [], isVisible: true, publishedAt: now().slice(0, 10) } })
crud('pages', { perm: 'page.manage', fields: ['title', 'slug'], slugFrom: 'title', defaults: { parentId: null, template: 'default', path: null, status: 'draft', sortOrder: 99, bodyHtml: '', translations: {} } })
crud('menuItems', { perm: 'menu.manage', fields: ['label', 'url'], label: (r) => r.label, defaults: { groupCode: 'header', parentId: null, type: 'page', icon: null, sortOrder: 99, isVisible: true, openInNewTab: false, translations: {} } })
crud('banners', { perm: 'site.manage', fields: ['title'], defaults: { isVisible: true, sortOrder: 99, imageId: null, linkUrl: null, subtitle: null, startsOn: null, endsOn: null } })
crud('heroSlides', { perm: 'site.manage', fields: ['title'], defaults: { isVisible: true, sortOrder: 99 } })
crud('quickLinks', { perm: 'site.manage', fields: ['label'], label: (r) => r.label, defaults: { isVisible: true, sortOrder: 99 } })
crud('audiences', { perm: 'site.manage', fields: ['title'], defaults: { isVisible: true, sortOrder: 99 } })
crud('strengths', { perm: 'site.manage', fields: ['title'], defaults: { isVisible: true, sortOrder: 99 } })
crud('partners', { perm: 'site.manage', fields: ['name', 'shortName'], defaults: { isVisible: true, sortOrder: 99, website: null } })
crud('siteStats', { perm: 'site.manage', fields: ['label', 'value'], label: (r) => `${r.label}: ${r.value}`, defaults: { placement: 'hero', isVisible: true, sortOrder: 99, sub: null } })

cms.get('/api/v1/admin/menu-groups', requireCms('menu.manage'), (_req, res) => res.json(getStore().menuGroups))
cms.get(['/api/v1/public/languages', '/api/v1/admin/languages'], (_req, res) => res.json(rows('languages')))

/* ============================================================
 * MEDIA (theo mẫu Swagger: POST /api/v1/admin/media/upload multipart) — theo tenant
 * Thật: MinIO bucket cms-public (tin tức) / cms-private (đính kèm thông báo, presigned URL)
 * ============================================================ */
const kindOf = (mime = '', ext = '') => mime.startsWith('image/') ? 'image' : mime.startsWith('video/') ? 'video' : mime.startsWith('audio/') ? 'audio' : /pdf|doc|xls|ppt|txt/i.test(ext + mime) ? 'document' : 'other'
cms.get('/api/v1/admin/media', requireCms('media.manage'), (req, res) => {
  let l = [...trows(req, 'media')].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (req.query.kind) l = l.filter((m) => m.kind === req.query.kind)
  if (req.query.folder) l = l.filter((m) => m.folder === req.query.folder)
  if (req.query.keyword) l = l.filter((m) => matchKeyword(m, req.query, ['fileName']))
  res.json(paged(l, req.query))
})
cms.get('/api/v1/admin/media/:id', requireCms('media.manage'), (req, res) => { const m = trows(req, 'media').find((x) => x.id === Number(req.params.id)); return m ? res.json(m) : notFound(res) })
cms.get('/api/v1/public/media/:id/url', (req, res) => { const m = trows(req, 'media').find((x) => x.id === Number(req.params.id)); return m ? res.json({ url: m.url }) : notFound(res) })
cms.post('/api/v1/admin/media/upload', requireCms('media.manage'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(422).json({ message: 'Thiếu file.' })
  const ext = (req.file.originalname.match(/\.([^.]+)$/)?.[1] || '').toLowerCase()
  const row = insert('media', {
    tenantId: req.tenant, fileName: req.file.originalname, kind: kindOf(req.file.mimetype, ext), ext, mimeType: req.file.mimetype, sizeBytes: req.file.size, url: `cms-api/uploads/${req.file.filename}`,
    altText: req.body.altText ?? null, caption: req.body.caption ?? null, folder: req.body.folder ?? null, uploadedBy: req.user.sub, createdAt: now(), deletedAt: null,
  })
  log(req, 'media.upload', 'media', row)
  res.status(201).json(row)
})
cms.delete('/api/v1/admin/media/:id', requireCms('media.manage'), (req, res) => {
  const m = trows(req, 'media').find((x) => x.id === Number(req.params.id)); if (!m) return notFound(res)
  update('media', m.id, { deletedAt: now(), deletedBy: req.user.sub }); log(req, 'media.delete', 'media', m); res.status(204).end()
})

/* ============================================================
 * SETTINGS (theo tenant) · AUDIT · BACKUPS · DASHBOARD
 * ============================================================ */
cms.get('/api/v1/admin/settings', requireCms('settings.manage'), (req, res) => res.json({ ...settingsOf(req.tenant), i18nCoverage: getStore().i18nCoverage }))
cms.get('/api/v1/admin/settings/:group', requireCms('settings.manage'), (req, res) => { const g = settingsOf(req.tenant)[req.params.group]; return g ? res.json(g) : notFound(res) })
/* Gửi email thử (mock: không gửi thật) */
cms.post('/api/v1/admin/settings/email/test', requireCms('settings.manage'), (req, res) => {
  const to = String((req.body || {}).to || '').trim()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return res.status(422).json({ message: 'Email nhận không hợp lệ.' })
  const mail = settingsOf(req.tenant).email || {}
  log(req, 'settings.email_test', 'settings', to)
  res.json({ ok: true, message: 'Đã gửi email thử tới ' + to + ' (mock: qua ' + (mail.smtpHost || 'SMTP') + ').' })
})
cms.put('/api/v1/admin/settings/:group', requireCms('settings.manage'), (req, res) => {
  const s = settingsOf(req.tenant); const before = { ...(s[req.params.group] || {}) }
  s[req.params.group] = { ...before, ...(req.body || {}) }; persist()
  log(req, 'settings.update', 'settings', req.params.group, diff(before, s[req.params.group])); res.json(s[req.params.group])
})

/* Audit log (chỉ ghi thêm). /api/v1/admin/activity-logs giữ làm tên cũ. */
const auditList = (req, res) => {
  const q = req.query
  let l = rows('activityLogs').filter((x) => x.tenantId === req.tenant).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (q.action) l = l.filter((x) => x.action === q.action)
  if (q.actor) l = l.filter((x) => x.actorSub === q.actor)
  if (q.entityType) l = l.filter((x) => x.entityType === q.entityType)
  if (q.entityId) l = l.filter((x) => x.entityId === String(q.entityId))
  if (q.from) l = l.filter((x) => x.createdAt >= q.from)
  if (q.to) l = l.filter((x) => x.createdAt <= q.to)
  if (q.keyword) l = l.filter((x) => matchKeyword(x, q, ['userName', 'targetLabel']))
  res.json(paged(l, q))
}
cms.get('/api/v1/admin/audit-logs', requireCms('log.view'), auditList)
cms.get('/api/v1/admin/activity-logs', requireCms('log.view'), auditList)

/* Sao lưu: chụp toàn bộ dữ liệu CMS (trừ nhật ký/sao lưu) để tải về hoặc phục hồi — chỉ quản trị hệ thống */
const SNAP_SKIP = new Set(['backups', 'activityLogs'])
const takeSnapshot = () => {
  const s = getStore()
  const { snapshots, ...rest } = s
  const collections = Object.fromEntries(Object.entries(rest.collections).filter(([k]) => !SNAP_SKIP.has(k)))
  return JSON.stringify({ app: 'humg-cms-mock', version: SCHEMA_VERSION, takenAt: now(), data: { ...rest, collections } })
}
const applySnapshot = (json) => {
  let snap
  try { snap = JSON.parse(json) } catch { return 'Tệp sao lưu không phải JSON hợp lệ.' }
  if (snap?.app !== 'humg-cms-mock' || !snap.data?.collections) return 'Tệp sao lưu không đúng định dạng.'
  if (snap.version !== SCHEMA_VERSION) return `Bản sao lưu thuộc phiên bản dữ liệu ${snap.version ?? 1}, không khớp phiên bản hiện tại ${SCHEMA_VERSION}.`
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
const backupRows = () => rows('backups')

cms.get('/api/v1/admin/backups', requireCms('backup.manage'), (req, res) => {
  const p = paged([...backupRows()].sort((a, b) => ts(b.createdAt) - ts(a.createdAt) || b.id - a.id), req.query)
  res.json({ ...p, items: p.items.map(backupOut) })
})
cms.post('/api/v1/admin/backups', requireCms('backup.manage'), (req, res) => {
  const snap = takeSnapshot()
  const row = insert('backups', { tenantId: req.tenant, filePath: '/backup/cms_humg/cms_' + Date.now() + '.json', sizeBytes: Buffer.byteLength(snap), trigger: 'manual', createdByName: req.user.name, status: 'success', createdAt: now() })
  const s = getStore(); s.snapshots = s.snapshots || {}; s.snapshots[row.id] = snap
  Object.keys(s.snapshots).map(Number).sort((a, b) => b - a).slice(8).forEach((id) => delete s.snapshots[id])
  persist(); log(req, 'backup.create', 'backup', row.filePath); res.status(201).json(backupOut(row))
})
cms.get('/api/v1/admin/backups/:id/download', requireCms('backup.manage'), (req, res) => {
  const snap = getStore().snapshots?.[Number(req.params.id)]
  if (!snap) return res.status(404).json({ message: 'Bản sao lưu này không còn dữ liệu để tải.' })
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="cms-backup-' + req.params.id + '.json"')
  res.send(snap)
})
cms.post('/api/v1/admin/backups/restore', requireCms('backup.manage'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(422).json({ message: 'Thiếu tệp sao lưu.' })
  const err = applySnapshot(readFileSync(req.file.path, 'utf8'))
  if (err) return res.status(422).json({ message: err })
  log(req, 'backup.restore', 'backup', req.file.originalname); res.json({ ok: true })
})
cms.post('/api/v1/admin/backups/:id/restore', requireCms('backup.manage'), (req, res) => {
  const snap = getStore().snapshots?.[Number(req.params.id)]
  if (!snap) return res.status(404).json({ message: 'Bản sao lưu này không còn dữ liệu để phục hồi.' })
  const err = applySnapshot(snap)
  if (err) return res.status(422).json({ message: err })
  log(req, 'backup.restore', 'backup', 'Bản #' + req.params.id); res.json({ ok: true })
})
cms.delete('/api/v1/admin/backups/:id', requireCms('backup.manage'), (req, res) => {
  const b = backupRows().find((x) => x.id === Number(req.params.id)); if (!b) return notFound(res)
  remove('backups', b.id); if (getStore().snapshots) delete getStore().snapshots[b.id]; persist()
  log(req, 'backup.delete', 'backup', b.filePath); res.status(204).end()
})

cms.get('/api/v1/admin/dashboard', requireCms(), (req, res) => {
  const contents = trows(req, 'contents').filter((c) => can(req.user, req.tenant, 'news', 'view', c))
  const anns = trows(req, 'announcements').filter((a) => can(req.user, req.tenant, 'announcement', 'view', a))
  const by = (s) => contents.filter((c) => c.status === s).length
  const total = contents.length || 1
  const part = (label, value) => ({ label, value, pct: Math.round((value / total) * 1000) / 10 })
  const awaiting = [...contents.map((c) => ({ ...c, type: 'news' })), ...anns.map((a) => ({ ...a, type: 'announcement' }))]
    .filter((x) => x.status === 'pending_review' || x.pendingRevisionId)
    .filter((x) => can(req.user, req.tenant, x.type, 'review', x))
  res.json({
    stats: { posts: contents.length, pages: trows(req, 'pages').length, categories: trows(req, 'categories').length, announcements: anns.length },
    status: { total: contents.length, parts: [part('published', by('published')), part('draft', by('draft')), part('pending_review', by('pending_review')), part('archived', by('archived'))] },
    awaitingReview: awaiting.map((x) => ({ id: x.id, type: x.type, title: x.title, status: x.status, hasPendingRevision: !!x.pendingRevisionId, updatedAt: x.updatedAt })),
    latestPosts: [...contents].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 3).map((c) => ({ ...c, categoryName: catName(c.categoryId) })),
    upcomingEvents: [...trows(req, 'events')].sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 3),
    latestMedia: [...trows(req, 'media')].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3),
    trend: getStore().trend,
    onlineUsers: 5,
  })
})

/* Đặt lại dữ liệu mock về trạng thái ban đầu (chỉ dùng khi phát triển) */
cms.post('/api/v1/dev/reset', (_req, res) => { resetStore(); res.json({ ok: true }) })

/* lỗi ném từ normalize() trong lifecycle → trả HTTP status tương ứng */
cms.use((err, req, res, next) => {
  if (err?.http || err?.status) return res.status(err.status).json({ message: err.message })
  return next(err)
})

