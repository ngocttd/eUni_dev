// Nạp dữ liệu mẫu cho schema cms từ chính mock data hiện có của prototype
// (src/modules/cms/data.js + src/modules/public/content/data.js). Chạy lại sẽ XÓA và nạp lại dữ liệu CMS.
import { randomBytes, scryptSync } from 'node:crypto'
import { newClient } from './db.mjs'
import cms from '../mock-data/cms.json' with { type: 'json' }
import pub from '../mock-data/content.json' with { type: 'json' }
import home from '../mock-data/home.json' with { type: 'json' }

const DEV_PASSWORD = 'Humg@2025'

/* ---------- helpers ---------- */
const slugify = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const hash = (pw) => { const salt = randomBytes(16).toString('hex'); return `scrypt$${salt}$${scryptSync(pw, salt, 64).toString('hex')}` }
const dmy = (s, hm = '00:00') => { const [d, m, y] = s.split('/'); return `${y}-${m}-${d}T${hm}:00+07:00` }
const dmyShort = (s, year) => { const [d, m] = s.trim().split('/'); return `${year}-${m}-${d}` }
const bytes = (s) => { const [n, u] = s.split(' '); return Math.round(parseFloat(n) * ({ KB: 1024, MB: 1048576 }[u] || 1)) }

const POST_STATUS = { 'Đã xuất bản': 'published', 'Bản nháp': 'draft', 'Chờ duyệt': 'pending' }
const TR_STATUS = { 'Đã dịch': 'done', 'Đang dịch': 'in_progress', 'Chưa dịch': 'missing' }
const MEDIA_KIND = { 'Hình ảnh': 'image', 'Tài liệu': 'document', 'Video': 'video', 'Âm thanh': 'audio' }
const MIME = { png: 'image/png', jpg: 'image/jpeg', pdf: 'application/pdf', mp4: 'video/mp4' }
const BANNER_POS = { 'Trang chủ – Slider': 'home_slider', 'Trang chủ – Popup': 'home_popup', 'Cột phải': 'sidebar_right', 'Chân trang': 'footer' }
const ROLE_CODE = { 'Super Admin': 'super_admin', Editor: 'editor', Author: 'author', Viewer: 'viewer' }
const MENU_TYPE = { 'Trang': 'page', 'Liên kết': 'link', 'Chuyên mục': 'category' }
const ACTION = {
  'Đăng nhập': 'login', 'Đăng bài viết': 'post.publish', 'Cập nhật bài viết': 'post.update', 'Xóa bài viết': 'post.delete',
  'Tải lên file': 'media.upload', 'Xóa người dùng': 'user.delete', 'Đổi cấu hình': 'settings.update',
}
const PERM_CODES = {
  'Bài viết': ['post.view', 'post.create', 'post.update'],
  'Xuất bản bài viết': ['post.publish'],
  'Danh mục': ['category.manage'],
  'Media thư viện': ['media.manage'],
  'Trang & Menu': ['page.manage', 'menu.manage'],
  'Người dùng': ['user.manage'],
  'Cấu hình hệ thống': ['settings.manage'],
  'Nhật ký & Sao lưu': ['log.view', 'backup.manage'],
}

const db = newClient()
await db.connect()
const q = async (sql, params) => (await db.query(sql, params)).rows
const one = async (sql, params) => (await q(sql, params))[0]

try {
  await db.query('BEGIN')
  await db.query(`TRUNCATE cms.activity_logs, cms.backups, cms.settings, cms.banner_translations, cms.banners,
    cms.menu_item_translations, cms.menu_items, cms.menu_groups, cms.page_translations, cms.pages,
    cms.event_translations, cms.events, cms.post_attachments, cms.post_tags, cms.tags, cms.post_translations, cms.posts,
    cms.category_translations, cms.categories, cms.media, cms.users, cms.role_permissions, cms.permissions, cms.roles,
    cms.languages, cms.albums, cms.videos, cms.podcasts, cms.hero_slides, cms.quick_links, cms.audiences,
    cms.strengths, cms.partners, cms.site_stats RESTART IDENTITY CASCADE`)

  /* ---- languages ---- */
  for (const l of cms.cmsLanguages) {
    await q('INSERT INTO cms.languages (code,label,flag,is_source,is_enabled) VALUES ($1,$2,$3,$4,true)', [l.code, l.label, l.flag, l.isSource])
  }

  /* ---- roles / permissions ---- */
  const roleId = {}
  for (const r of cms.cmsRoles) {
    roleId[r.role] = (await one('INSERT INTO cms.roles (code,name,description,is_system) VALUES ($1,$2,$3,true) RETURNING id',
      [ROLE_CODE[r.role], r.role, r.desc])).id
  }
  const permId = {}
  let order = 0
  for (const [module, codes] of Object.entries(PERM_CODES)) {
    for (const code of codes) {
      permId[code] = (await one('INSERT INTO cms.permissions (code,module,name,sort_order) VALUES ($1,$2,$3,$4) RETURNING id',
        [code, module, `${module} · ${code}`, order++])).id
    }
  }
  const m = cms.cmsPermissionMatrix
  for (const row of m.rows) {
    for (let i = 0; i < m.roles.length; i++) {
      if (!row.perms[i]) continue
      for (const code of PERM_CODES[row.module]) {
        await q('INSERT INTO cms.role_permissions (role_id,permission_id) VALUES ($1,$2)', [roleId[m.roles[i]], permId[code]])
      }
    }
  }
  // quyền truy cập khu vực CMS: mọi vai trò trừ Viewer (khớp RoleRoute permission="cms.access")
  await q('INSERT INTO cms.permissions (code,module,name,sort_order) VALUES ($1,$2,$3,$4)', ['cms.access', 'Truy cập CMS', 'Truy cập CMS', order])
  await q('INSERT INTO cms.role_permissions SELECT r.id, p.id FROM cms.roles r, cms.permissions p WHERE p.code = $1 AND r.code <> $2', ['cms.access', 'viewer'])

  /* ---- users ---- */
  const userId = {}
  const pwHash = hash(DEV_PASSWORD)
  for (const u of cms.cmsUsers) {
    const [d, t] = u.last.split(' ')
    userId[u.name] = (await one(
      'INSERT INTO cms.users (full_name,email,username,password_hash,role_id,status,last_login_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [u.name, u.email, u.email.split('@')[0], pwHash, roleId[u.role], u.status === 'Hoạt động' ? 'active' : 'inactive', dmy(d, t)])).id
  }
  // tác giả xuất hiện trong bài viết nhưng chưa có trong danh sách người dùng
  for (const name of new Set(cms.cmsPosts.map((p) => p.author))) {
    if (userId[name]) continue
    const parts = slugify(name).split('-')
    const email = `${parts.slice(-1)[0]}${parts.slice(0, -1).map((w) => w[0]).join('')}@humg.edu.vn`
    userId[name] = (await one(
      'INSERT INTO cms.users (full_name,email,username,password_hash,role_id,status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [name, email, email.split('@')[0], pwHash, roleId.Author, 'active'])).id
  }

  /* ---- categories (cây) ---- */
  const catId = {}
  let catOrder = 0
  const addCat = async (name, parent = null, visible = true) => {
    if (catId[name]) return catId[name]
    const id = (await one('INSERT INTO cms.categories (parent_id,slug,is_visible,sort_order) VALUES ($1,$2,$3,$4) RETURNING id',
      [parent, slugify(name), visible, catOrder++])).id
    await q("INSERT INTO cms.category_translations (category_id,lang,name) VALUES ($1,'vi',$2)", [id, name])
    catId[name] = id
    return id
  }
  for (const c of cms.cmsCategories) {
    const id = await addCat(c.name, null, c.status === 'Hiển thị')
    for (const ch of c.children || []) await addCat(ch.name, id, ch.status === 'Hiển thị')
  }
  for (const n of [...cms.cmsPostCategories.slice(1), ...pub.newsCategories, ...pub.articles.map((a) => a.category)]) await addCat(n)

  /* ---- media ---- */
  for (const f of cms.cmsMedia) {
    await q(
      `INSERT INTO cms.media (file_name,kind,ext,mime_type,size_bytes,storage_url,uploaded_by,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [f.name, MEDIA_KIND[f.kind] || 'other', f.ext, MIME[f.ext] || null, bytes(f.size), `/uploads/${f.name}`, userId['Lê Thị Mai'], dmy(f.date)])
  }

  /* ---- posts: 12 bài quản trị + bài công khai ---- */
  const tagId = {}
  const addTag = async (name) => {
    const slug = slugify(name)
    tagId[slug] ||= (await one('INSERT INTO cms.tags (slug,name) VALUES ($1,$2) RETURNING id', [slug, name])).id
    return tagId[slug]
  }
  const linkExtras = async (postId, a) => {
    for (const t of a.tags || []) await q('INSERT INTO cms.post_tags (post_id,tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [postId, await addTag(t)])
    for (const [i, doc] of (a.docs || []).entries()) {
      await q('INSERT INTO cms.post_attachments (post_id,title,meta,sort_order) VALUES ($1,$2,$3,$4)', [postId, doc.name, doc.meta, i])
    }
  }
  const insertPost = async ({ slug, category, authorName, status, date, title, excerpt = null, body = [], unit = null, views = 0,
    showHome = false, featured = false, seo = {}, enStatus = 'missing', en = null }) => {
    const id = (await one(
      `INSERT INTO cms.posts (slug,category_id,author_id,status,show_on_home,is_featured,unit,view_count,publish_at,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [slug, catId[category] ?? null, userId[authorName] ?? userId['Trần Văn Minh'], status, showHome, featured, unit, views,
        status === 'published' ? dmy(date, '08:00') : null, dmy(date, '08:00')])).id
    await q(`INSERT INTO cms.post_translations (post_id,lang,title,excerpt,body,seo_title,seo_description,seo_keywords,translation_status)
             VALUES ($1,'vi',$2,$3,$4,$5,$6,$7,'done')`,
      [id, title, excerpt, JSON.stringify(body), seo.title ?? null, seo.desc ?? null, seo.keywords ?? null])
    if (en || enStatus !== 'Chưa dịch') {
      await q(`INSERT INTO cms.post_translations (post_id,lang,title,excerpt,body,seo_title,seo_description,seo_keywords,translation_status)
               VALUES ($1,'en',$2,$3,$4,$5,$6,$7,$8)`,
        [id, en?.title ?? title, en?.excerpt ?? null, JSON.stringify(en?.body ?? []), en?.seoTitle ?? null, en?.seoDesc ?? null, en?.seoKeywords ?? null, TR_STATUS[enStatus] ?? 'missing'])
    }
    return id
  }

  const richByTitle = new Map(pub.articles.map((a) => [a.title, a]))
  const usedSlugs = new Set()
  for (const p of cms.cmsPosts) {
    const rich = richByTitle.get(p.title)
    const first = p.id === 1
    const d = cms.cmsEditorDefaults
    const slug = first ? d.slug : rich?.slug || slugify(p.title)
    usedSlugs.add(slug)
    const id = await insertPost({
      slug, category: p.category, authorName: p.author, status: POST_STATUS[p.status], date: p.date,
      title: p.title, excerpt: first ? d.excerpt : rich?.excerpt,
      body: first ? [cms.cmsEditorDefaultContentVi] : rich?.body || [],
      unit: rich?.unit, views: rich?.views || 0,
      showHome: first && d.showHome, featured: first && d.featured,
      seo: first ? { title: d.seoTitle, desc: d.seoDesc, keywords: d.seoKeywords } : {},
      enStatus: cms.cmsPostI18n[p.id],
      en: first ? { ...cms.cmsEditorDefaultsEn, body: [cms.cmsEditorDefaultsEn.content] } : null,
    })
    if (rich) await linkExtras(id, rich)
  }
  for (const a of pub.articles) {
    if (usedSlugs.has(a.slug)) continue
    const id = await insertPost({
      slug: a.slug, category: a.category, authorName: 'Nguyễn Thị Hoa', status: 'published', date: a.date,
      title: a.title, excerpt: a.excerpt, body: a.body, unit: a.unit, views: a.views,
    })
    await linkExtras(id, a)
  }

  /* ---- events ---- */
  for (const e of pub.events) {
    const [start] = (e.time || '00:00').split('–').map((s) => s.trim())
    const id = (await one(
      `INSERT INTO cms.events (slug,starts_at,time_label,status,contact,created_by) VALUES ($1,$2,$3,'upcoming',$4,$5) RETURNING id`,
      [e.slug, dmy(e.date, start), e.time, e.contact ?? null, userId['Lê Thị Mai']])).id
    await q(`INSERT INTO cms.event_translations (event_id,lang,title,place,place_full,organizer,audience,description,agenda)
             VALUES ($1,'vi',$2,$3,$4,$5,$6,$7,$8)`,
      [id, e.title, e.place ?? null, e.placeFull ?? null, e.organizer ?? null, e.audience ?? null,
        JSON.stringify(e.desc || []), JSON.stringify(e.agenda || [])])
  }

  /* ---- pages (cây) + menu ---- */
  let pageOrder = 0
  const addPage = async (node, parent = null) => {
    const id = (await one('INSERT INTO cms.pages (parent_id,slug,sort_order) VALUES ($1,$2,$3) RETURNING id', [parent, node.slug, pageOrder++])).id
    await q("INSERT INTO cms.page_translations (page_id,lang,title) VALUES ($1,'vi',$2)", [id, node.name])
    for (const ch of node.children || []) await addPage(ch, id)
  }
  for (const n of cms.cmsPageTree) await addPage(n)

  const groupCodes = ['header', 'footer', 'utility']
  const groupId = []
  for (const [i, name] of cms.cmsMenuGroups.entries()) {
    groupId[i] = (await one('INSERT INTO cms.menu_groups (code,name) VALUES ($1,$2) RETURNING id', [groupCodes[i], name])).id
  }
  for (const it of cms.cmsMenus) {
    const id = (await one('INSERT INTO cms.menu_items (group_id,type,url,sort_order) VALUES ($1,$2,$3,$4) RETURNING id',
      [groupId[0], MENU_TYPE[it.type] || 'link', it.url, it.order])).id
    await q("INSERT INTO cms.menu_item_translations (menu_item_id,lang,label) VALUES ($1,'vi',$2)", [id, it.label])
  }

  /* ---- banners ---- */
  for (const b of cms.cmsBanners) {
    const [from, to] = b.period.split('–').map((s) => s.trim())
    const year = to.split('/')[2] || '2025'
    const id = (await one(
      'INSERT INTO cms.banners (position,is_visible,sort_order,starts_on,ends_on) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [BANNER_POS[b.position], b.status === 'Hiển thị', b.order, dmyShort(from, year), dmyShort(to.split('/').slice(0, 2).join('/'), year)])).id
    await q("INSERT INTO cms.banner_translations (banner_id,lang,title) VALUES ($1,'vi',$2)", [id, b.name])
  }

  /* ---- album / video / podcast ---- */
  const mmss = (s) => { const p = s.split(':').map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1] }
  const isoDate = (s) => { const [d, m, y] = s.split('/'); return `${y}-${m}-${d}` }
  for (const a of pub.albums) {
    const id = (await one('INSERT INTO cms.albums (slug,published_at) VALUES ($1,$2) RETURNING id', [a.slug, isoDate(a.date)])).id
    await q("INSERT INTO cms.album_translations (album_id,lang,title) VALUES ($1,'vi',$2)", [id, a.title])
    for (const [i, ph] of a.photos.entries()) await q('INSERT INTO cms.album_photos (album_id,caption,sort_order) VALUES ($1,$2,$3)', [id, ph.label, i])
  }
  for (const v of pub.videos) {
    const id = (await one('INSERT INTO cms.videos (slug,channel,duration_sec,view_count,published_at) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [v.slug, v.channel, mmss(v.duration), v.views, isoDate(v.date)])).id
    await q("INSERT INTO cms.video_translations (video_id,lang,title,description) VALUES ($1,'vi',$2,$3)", [id, v.title, v.desc])
  }
  for (const p of pub.podcasts) {
    const id = (await one('INSERT INTO cms.podcasts (slug,episode,host,duration_sec,play_count,published_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [p.slug, p.episode, p.host, mmss(p.duration), p.plays, isoDate(p.date)])).id
    await q("INSERT INTO cms.podcast_translations (podcast_id,lang,title,description,notes) VALUES ($1,'vi',$2,$3,$4)", [id, p.title, p.desc, JSON.stringify(p.notes || [])])
  }

  /* ---- trang chủ ---- */
  for (const [i, s] of home.heroSlides.entries()) {
    const id = (await one('INSERT INTO cms.hero_slides (code,primary_url,accent_url,sort_order) VALUES ($1,$2,$3,$4) RETURNING id',
      [s.id, s.primary.to, s.accent.to, i])).id
    await q(`INSERT INTO cms.hero_slide_translations (slide_id,lang,kicker,title,subtitle,motto,primary_label,accent_label)
             VALUES ($1,'vi',$2,$3,$4,$5,$6,$7)`, [id, s.kicker, s.title, s.years, s.motto, s.primary.label, s.accent.label])
  }
  for (const [i, l] of home.quickLinks.entries()) {
    const id = (await one('INSERT INTO cms.quick_links (icon,url,sort_order) VALUES ($1,$2,$3) RETURNING id', [l.icon, l.to, i])).id
    await q("INSERT INTO cms.quick_link_translations (quick_link_id,lang,label) VALUES ($1,'vi',$2)", [id, l.label])
  }
  for (const [i, a] of home.audiences.entries()) {
    const id = (await one('INSERT INTO cms.audiences (code,icon,color,url,sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING id', [a.id, a.icon, a.color, a.to, i])).id
    await q("INSERT INTO cms.audience_translations (audience_id,lang,title,description) VALUES ($1,'vi',$2,$3)", [id, a.title, a.desc])
  }
  for (const [i, s] of home.strengths.entries()) {
    const id = (await one('INSERT INTO cms.strengths (icon,sort_order) VALUES ($1,$2) RETURNING id', [s.icon, i])).id
    await q("INSERT INTO cms.strength_translations (strength_id,lang,title,text) VALUES ($1,'vi',$2,$3)", [id, s.title, s.text])
  }
  for (const [i, p] of home.partners.entries()) {
    const id = (await one('INSERT INTO cms.partners (short_name,color,sort_order) VALUES ($1,$2,$3) RETURNING id', [p.short, p.color, i])).id
    await q("INSERT INTO cms.partner_translations (partner_id,lang,name) VALUES ($1,'vi',$2)", [id, p.name])
  }
  const addStat = async (placement, i, s) => {
    const id = (await one('INSERT INTO cms.site_stats (placement,value,sort_order) VALUES ($1,$2,$3) RETURNING id', [placement, s.value, i])).id
    await q("INSERT INTO cms.site_stat_translations (stat_id,lang,label,sub) VALUES ($1,'vi',$2,$3)", [id, s.label, s.sub ?? null])
  }
  for (const [i, s] of home.heroStats.entries()) await addStat('hero', i, s)
  for (const [i, s] of home.universityStats.entries()) await addStat('about', i, s)
  await q("INSERT INTO cms.settings (group_key,key,value) VALUES ('home','heroChips',$1)", [JSON.stringify(home.heroChips)])

  /* ---- settings ---- */
  for (const [group, obj] of Object.entries(cms.cmsSettings)) {
    for (const [k, v] of Object.entries(obj)) {
      await q('INSERT INTO cms.settings (group_key,key,value) VALUES ($1,$2,$3)', [group, k, JSON.stringify(v)])
    }
  }
  const ls = cms.cmsLanguageSettings
  for (const k of ['defaultCode', 'enabledCodes', 'fallback', 'fallbackOptions']) {
    await q("INSERT INTO cms.settings (group_key,key,value) VALUES ('language',$1,$2)", [k, JSON.stringify(ls[k])])
  }
  for (const [k, v] of Object.entries({ cronSchedule: '0 3 * * *', retentionCount: 7, storagePath: '/backup/cms_humg' })) {
    await q("INSERT INTO cms.settings (group_key,key,value) VALUES ('backup',$1,$2)", [k, JSON.stringify(v)])
  }

  /* ---- activity logs ---- */
  for (const a of cms.cmsActivity) {
    const [d, t] = a.time.split(' ')
    await q(`INSERT INTO cms.activity_logs (user_id,user_name,action,target_label,ip_address,created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
      [userId[a.user] ?? null, a.user, ACTION[a.action] || a.action, a.target, a.ip, dmy(d, t)])
  }

  /* ---- backups ---- */
  for (const b of cms.cmsBackups) {
    const [d, t] = b.time.split(' ')
    const cron = b.by.includes('Cron')
    await q(`INSERT INTO cms.backups (file_path,size_bytes,trigger,created_by,status,created_at) VALUES ($1,$2,$3,$4,'success',$5)`,
      [`/backup/cms_humg/cms_${d.split('/').reverse().join('')}_${t.replace(':', '')}.sql.gz`, bytes(b.size), cron ? 'cron' : 'manual', cron ? null : userId[b.by], dmy(d, t)])
  }

  await db.query('COMMIT')

  const tables = ['users', 'roles', 'permissions', 'categories', 'posts', 'post_translations', 'tags', 'post_attachments', 'events',
    'media', 'pages', 'menu_items', 'banners', 'settings', 'activity_logs', 'backups',
    'albums', 'album_photos', 'videos', 'podcasts', 'hero_slides', 'quick_links', 'audiences', 'strengths', 'partners', 'site_stats']
  const counts = {}
  for (const t of tables) counts[t] = Number((await one(`SELECT count(*) FROM cms.${t}`)).count)
  console.log('✔ Đã nạp dữ liệu mẫu:')
  console.table(counts)
  console.log(`  Mật khẩu dev của mọi tài khoản mẫu: ${DEV_PASSWORD}`)
} catch (err) {
  await db.query('ROLLBACK').catch(() => {})
  console.error('✘ Seed lỗi:', err)
  process.exitCode = 1
} finally {
  await db.end()
}
