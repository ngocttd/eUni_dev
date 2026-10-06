// Kho dữ liệu CMS trong bộ nhớ (có lưu ra data/store.json) dựng từ mock-data/*.json.
// Đây là bản MOCK của backend: mọi thay đổi từ CMS admin được phản ánh ngay ở các endpoint public.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const STORE_FILE = process.env.STORE_FILE || join(root, 'data', 'store.json')
const load = (name) => JSON.parse(readFileSync(join(root, 'mock-data', `${name}.json`), 'utf8'))

export const slugify = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const iso = (dmy, hm = '08:00') => { const [d, m, y] = dmy.split('/'); return `${y}-${m}-${d}T${hm}:00+07:00` }
const isoDate = (dmy) => { const [d, m, y] = dmy.split('/'); return `${y}-${m}-${d}` }
const bytes = (s) => { const [n, u] = s.split(' '); return Math.round(parseFloat(n) * ({ KB: 1024, MB: 1048576 }[u] || 1)) }
const secs = (s) => { const p = s.split(':').map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1] }

export const STATUSES = ['draft', 'pending_review', 'published', 'archived']
/** Mã số cũ (0..3) vẫn được chấp nhận ở API để tương thích */
export const LEGACY_STATUS = { 0: 'draft', 1: 'pending_review', 2: 'published', 3: 'archived', pending: 'pending_review' }
const STATUS_BY_LABEL = { 'Đã xuất bản': 'published', 'Bản nháp': 'draft', 'Chờ duyệt': 'pending_review' }
export const SCHEMA_VERSION = 5
export const DEFAULT_TENANT = 'humg'
const TR_BY_LABEL = { 'Đã dịch': 'done', 'Đang dịch': 'in_progress', 'Chưa dịch': 'missing' }
const BANNER_POS = { 'Trang chủ – Slider': 'home_slider', 'Trang chủ – Popup': 'home_popup', 'Cột phải': 'sidebar_right', 'Chân trang': 'footer' }
/** Vai trò trên Identity Server (mock) — CMS chỉ đọc từ token, không quản lý */
const IDS_ROLE = { 'Super Admin': ['cms.admin', 'staff'], Editor: ['cms.editor', 'staff'], Author: ['cms.author', 'staff'], Viewer: ['cms.viewer', 'staff'] }
const UNIT_BY_LABEL = { 'Khoa CNTT': 'CNTT', 'Khoa Mỏ': 'MO', 'Khoa Trắc địa – Bản đồ': 'TDBD', 'Phòng Đào tạo': 'P-DT', 'Phòng KHCN': 'P-KHCN', 'Phòng Hợp tác quốc tế': 'P-HTQT', 'Phòng CTSV': 'P-CTSV', 'Văn phòng': 'VP' }
const ACTION = { 'Đăng nhập': 'login', 'Đăng bài viết': 'post.publish', 'Cập nhật bài viết': 'post.update', 'Xóa bài viết': 'post.delete', 'Tải lên file': 'media.upload', 'Xóa người dùng': 'user.delete', 'Đổi cấu hình': 'settings.update' }
const MEDIA_KIND = { 'Hình ảnh': 'image', 'Tài liệu': 'document', 'Video': 'video', 'Âm thanh': 'audio' }
const PAGE_EN = { 'Trang chủ': 'Home', 'Giới thiệu': 'About', 'Media thư viện': 'Media library', 'Đơn vị': 'Units', 'Ban giám hiệu': 'Board of Rectors', 'Phòng ban chức năng': 'Offices',
  'Khoa chuyên môn': 'Faculties', 'Đào tạo': 'Education', 'Nghiên cứu': 'Research', 'Sinh viên': 'Students', 'Tin tức – Sự kiện': 'News & Events', 'Thư viện số': 'Digital library', 'Liên hệ': 'Contact' }
const CMS_PAGES = [
  { slug: 'chinh-sach-bao-mat', title: 'Chính sách bảo mật', bodyHtml: '<p>Trường Đại học Mỏ – Địa chất cam kết bảo vệ thông tin cá nhân của người dùng Cổng thông tin điện tử.</p><h2>1. Thông tin thu thập</h2><p>Họ tên, email, số điện thoại khi người dùng gửi liên hệ hoặc đăng ký sự kiện; thông tin đăng nhập do hệ thống SSO của Trường quản lý.</p><h2>2. Mục đích sử dụng</h2><ul><li>Phản hồi yêu cầu, gửi thông báo liên quan.</li><li>Thống kê truy cập để cải thiện dịch vụ.</li></ul><h2>3. Liên hệ</h2><p>Mọi thắc mắc về dữ liệu cá nhân xin gửi về Phòng Truyền thông.</p>',
    translations: { en: { status: 'done', title: 'Privacy policy', bodyHtml: '<p>Hanoi University of Mining and Geology is committed to protecting the personal data of portal users.</p><h2>1. Data we collect</h2><p>Name, email and phone number when you contact us or register for events; sign-in data is managed by the University SSO.</p><h2>2. How we use it</h2><ul><li>To answer requests and send related notices.</li><li>Usage statistics to improve our services.</li></ul><h2>3. Contact</h2><p>Questions about personal data can be sent to the Communications Office.</p>' } } },
  { slug: 'dieu-khoan-su-dung', title: 'Điều khoản sử dụng', bodyHtml: '<p>Khi truy cập Cổng thông tin, người dùng đồng ý với các điều khoản dưới đây.</p><h2>Bản quyền nội dung</h2><p>Nội dung, hình ảnh thuộc quyền của Trường Đại học Mỏ – Địa chất. Trích dẫn cần ghi rõ nguồn.</p><h2>Trách nhiệm người dùng</h2><p>Không sử dụng Cổng thông tin cho mục đích trái pháp luật hoặc gây ảnh hưởng tới hệ thống.</p>',
    translations: { en: { status: 'done', title: 'Terms of use', bodyHtml: '<p>By using the portal you agree to the following terms.</p><h2>Copyright</h2><p>Content and images belong to Hanoi University of Mining and Geology. Please cite the source when quoting.</p><h2>User responsibilities</h2><p>Do not use the portal for unlawful purposes or in ways that harm the system.</p>' } } },
]
const MENU_TYPE = { 'Trang': 'page', 'Liên kết': 'link', 'Chuyên mục': 'category' }


/** Cây đơn vị (bản sao chỉ đọc của QLNS/QLĐT): [code, tên, loại, cha] */
export const ORG_UNITS = [
  ['HUMG', 'Trường Đại học Mỏ - Địa chất', 'school', null],
  ['VP', 'Văn phòng Trường', 'office', 'HUMG'],
  ['P-TT', 'Phòng Truyền thông', 'office', 'HUMG'],
  ['P-DT', 'Phòng Đào tạo', 'office', 'HUMG'],
  ['P-CTSV', 'Phòng Công tác sinh viên', 'office', 'HUMG'],
  ['P-KHCN', 'Phòng Khoa học công nghệ', 'office', 'HUMG'],
  ['P-HTQT', 'Phòng Hợp tác quốc tế', 'office', 'HUMG'],
  ['CNTT', 'Khoa Công nghệ thông tin', 'faculty', 'HUMG'],
  ['BM-KHMT', 'Bộ môn Khoa học máy tính', 'department', 'CNTT'],
  ['BM-CNPM', 'Bộ môn Công nghệ phần mềm', 'department', 'CNTT'],
  ['DCCTKT66A', 'Lớp DCCTKT66A', 'class', 'BM-KHMT'],
  ['DCCTKT66B', 'Lớp DCCTKT66B', 'class', 'BM-CNPM'],
  ['MO', 'Khoa Mỏ', 'faculty', 'HUMG'],
  ['BM-KTM', 'Bộ môn Khai thác mỏ', 'department', 'MO'],
  ['DCKTM66', 'Lớp DCKTM66', 'class', 'BM-KTM'],
  ['TDBD', 'Khoa Trắc địa – Bản đồ', 'faculty', 'HUMG'],
]

/** Danh bạ người dùng portal (IdS mock). 4 tài khoản demo dùng sub cố định SV001/GV001/PH001/LD001. */
const DIRECTORY = [
  { sub: 'SV001', username: '2151000123', email: '2151000123@student.humg.edu.vn', fullName: 'Nguyễn Văn Sinh', roles: ['student'], tenants: ['humg', 'cntt'], units: ['DCCTKT66A'], studentCode: '2151000123' },
  { sub: 'GV001', username: 'giangvien', email: 'giangvien@humg.edu.vn', fullName: 'Giảng viên HUMG', roles: ['lecturer'], tenants: ['humg', 'cntt'], units: ['BM-KHMT'], staffCode: 'GV0001' },
  { sub: 'PH001', username: 'phuhuynh', email: 'phuhuynh@gmail.com', fullName: 'Phụ huynh', roles: ['parent'], tenants: ['humg'], units: ['DCCTKT66A'] },
  { sub: 'LD001', username: 'lanhdao', email: 'lanhdao@humg.edu.vn', fullName: 'Lãnh đạo HUMG', roles: ['manager', 'lecturer', 'euni.dashboard-viewer', 'euni.report-viewer'], tenants: ['humg', 'cntt'], units: ['HUMG'], staffCode: 'CB0100' },
  { sub: 'CB001', username: 'canbo', email: 'canbo@humg.edu.vn', fullName: 'Chuyên viên Phòng Đào tạo', roles: ['staff', 'edusoft.training-officer'], tenants: ['humg'], units: ['P-DT'], staffCode: 'CB0001' },
  { sub: 'SV002', username: '2151000124', email: '2151000124@student.humg.edu.vn', fullName: 'Trần Thị Lan', roles: ['student'], units: ['DCCTKT66A'], studentCode: '2151000124' },
  { sub: 'SV003', username: '2151000125', email: '2151000125@student.humg.edu.vn', fullName: 'Lê Minh Quân', roles: ['student'], units: ['DCCTKT66A'], studentCode: '2151000125' },
  { sub: 'SV004', username: '2151000201', email: '2151000201@student.humg.edu.vn', fullName: 'Phạm Thu Hà', roles: ['student'], units: ['DCCTKT66B'], studentCode: '2151000201' },
  { sub: 'SV005', username: '2151000301', email: '2151000301@student.humg.edu.vn', fullName: 'Hoàng Văn Đức', roles: ['student'], units: ['DCKTM66'], studentCode: '2151000301' },
  { sub: 'GV002', username: 'ntbinh', email: 'ntbinh@humg.edu.vn', fullName: 'TS. Nguyễn Thanh Bình', roles: ['lecturer', 'edusoft.academic-advisor'], tenants: ['humg', 'cntt'], units: ['BM-CNPM'], staffCode: 'GV0123' },
  { sub: 'GV003', username: 'lvkhoa', email: 'lvkhoa@humg.edu.vn', fullName: 'PGS.TS. Lê Văn Khoa', roles: ['lecturer', 'qlkhcn.researcher'], units: ['BM-KTM'], staffCode: 'GV0456' },
]

function build() {
  const cms = load('cms'); const pub = load('content'); const home = load('home')
  const s = { seq: {}, collections: {} }
  const col = (n) => (s.collections[n] ||= [])
  const nextId = (n) => (s.seq[n] = (s.seq[n] || 0) + 1)
  const add = (n, row) => { const r = { id: nextId(n), ...row }; col(n).push(r); return r }

  /* languages & settings */
  s.collections.languages = cms.cmsLanguages.map((l) => ({ code: l.code, label: l.label, flag: l.flag, isSource: l.isSource, isEnabled: true }))
  const settings = {
    ...cms.cmsSettings,
    language: { ...cms.cmsLanguageSettings },
    backup: { cronSchedule: '0 3 * * *', retentionCount: 7, storagePath: '/backup/cms_humg' },
    home: { heroChips: home.heroChips },
  }
  s.settings = { humg: settings }
  s.i18nCoverage = cms.cmsI18nCoverage
  s.trend = cms.cmsDashboard.trend

  /* ---------- Identity Server (mock): danh bạ người dùng + vai trò. CMS KHÔNG quản lý user/role. ---------- */
  s.collections.orgUnits = ORG_UNITS.map(([code, name, kind, parentCode]) => ({ code, name, kind, parentCode }))
  s.collections.tenants = [
    { id: 'humg', name: 'Trường Đại học Mỏ - Địa chất', rootUnit: 'HUMG', domains: ['localhost:3002', '127.0.0.1:3002'], isActive: true },
    { id: 'cntt', name: 'Khoa Công nghệ thông tin', rootUnit: 'CNTT', domains: ['cntt.localhost:3002'], isActive: true },
  ]
  const CMS_SCOPE = {
    /* chỉ đơn vị (membership) + role trên SSO; trang được quản trị suy ra từ grants (tầng 3, acl.js tenantsOf) */
    'tvanminh@humg.edu.vn': { units: ['P-TT'] },
    'nthoa@humg.edu.vn': { units: ['P-TT'] },
    'pvloc@humg.edu.vn': { units: ['CNTT'], roles: ['cms.editor', 'lecturer'] },
    'ltmai@humg.edu.vn': { units: ['P-TT'] },
    'hdnam@humg.edu.vn': { units: ['P-DT'] },
    'dvtung@humg.edu.vn': { units: ['BM-KHMT'], roles: ['cms.author', 'lecturer'] },
    'vthuong@humg.edu.vn': { units: ['P-DT'], roles: ['cms.reviewer', 'staff'] },
    'bmduc@humg.edu.vn': { units: ['P-DT'] },
  }
  const addUser = (u) => add('users', { status: 1, tenants: ['humg'], units: [], roles: [], staffCode: null, studentCode: null, lastLoginAt: null, createdAt: '2025-01-10T08:00:00+07:00', ...u })
  cms.cmsUsers.forEach((u, i) => {
    const sc = CMS_SCOPE[u.email] || {}
    const username = u.email.split('@')[0]
    addUser({
      sub: `u-${username}`, username, email: u.email, fullName: u.name, roles: sc.roles || IDS_ROLE[u.role] || ['staff'], units: sc.units || [],
      staffCode: `CB${String(i + 1).padStart(4, '0')}`, status: u.status === 'Hoạt động' ? 1 : 0, lastLoginAt: iso(u.last.split(' ')[0], u.last.split(' ')[1]),
    })
  })
  DIRECTORY.forEach((u) => addUser(u))
  const userByName = (n) => col('users').find((u) => u.fullName === n)
  for (const name of new Set(cms.cmsPosts.map((p) => p.author))) {
    if (userByName(name)) continue
    const parts = slugify(name).split('-')
    const uname = `${parts.slice(-1)[0]}${parts.slice(0, -1).map((w) => w[0]).join('')}`
    addUser({ sub: `u-${uname}`, username: uname, email: `${uname}@humg.edu.vn`, fullName: name, roles: ['cms.author', 'staff'], units: ['P-TT'] })
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
    fileName: f.name, kind: MEDIA_KIND[f.kind] || 'other', ext: f.ext, mimeType: null, sizeBytes: bytes(f.size), url: `cms-api/uploads/${f.name}`,
    altText: null, caption: null, folder: null, uploadedBy: userByName('Lê Thị Mai').sub, createdAt: iso(f.date),
  }))

  /* contents (bài viết) = bài quản trị + bài công khai */
  const featuredSlug = home.featuredNews.slug
  const homeSlugs = new Set([featuredSlug, ...home.newsList.map((n) => n.slug)])
  const byTitle = new Map(pub.articles.map((a) => [a.title, a]))
  const used = new Set()
  const addContent = (o) => {
    const author = userByName(o.authorName) || col('users')[0]
    const publishAt = o.status === 'published' ? iso(o.date) : null
    return add('contents', {
      categoryId: catByName(o.category)?.id ?? null, ownerUnitCode: UNIT_BY_LABEL[o.unit] || (o.category === 'Nghiên cứu' ? 'CNTT' : 'P-TT'),
      title: o.title, slug: o.slug, excerpt: o.excerpt ?? null, status: o.status,
      isFeatured: o.slug === featuredSlug, showOnHome: homeSlugs.has(o.slug), contentBody: JSON.stringify(o.body ?? []),
      metaTitle: o.seo?.title ?? null, metaDescription: o.seo?.desc ?? null, metaKeywords: o.seo?.keywords ?? null,
      featuredImageId: null, attachmentId: null, authorSub: author.sub, authorName: author.fullName, source: null, unit: o.unit ?? null,
      viewCount: o.views ?? 0, tags: o.tags ?? [], attachments: (o.docs ?? []).map((d) => ({ title: d.name, meta: d.meta, url: null })),
      translations: o.en ? { en: o.en } : {}, publishAt, expireAt: null, firstPublishedAt: publishAt,
      submittedAt: null, submittedBy: null, reviewedAt: null, reviewedBy: null, reviewNote: null, pendingRevisionId: null, version: 1,
      createdAt: iso(o.date), createdBy: author.sub, updatedAt: iso(o.date), updatedBy: author.sub, deletedAt: null, deletedBy: null,
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
    addContent({ slug: a.slug, category: a.category, authorName: 'Nguyễn Thị Hoa', status: 'published', date: a.date, title: a.title, excerpt: a.excerpt, body: a.body, unit: a.unit, views: a.views, tags: a.tags, docs: a.docs })
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

  /* trang & menu
   * Trang "system": trang có sẵn trong code website (route riêng) — CMS quản lý tên, thứ tự, menu; nội dung do website.
   * Trang "default": nội dung soạn ở CMS (bodyHtml), website hiển thị ở /trang/{slug}. */
  let po = 0
  const addPage = (n, parentId = null) => { const r = add('pages', { parentId, slug: n.slug, title: n.name, template: 'system', path: `/${n.slug}`, status: 'published', sortOrder: po++, bodyHtml: '',
    translations: PAGE_EN[n.name] ? { en: { title: PAGE_EN[n.name], status: 'done' } } : {} }); (n.children || []).forEach((c) => addPage(c, r.id)) }
  cms.cmsPageTree.forEach((n) => addPage(n))
  for (const pg of CMS_PAGES) add('pages', { parentId: null, template: 'default', path: null, status: 'published', sortOrder: po++, translations: {}, updatedAt: '2025-05-10T09:00:00+07:00', ...pg })
  s.menuGroups = cms.cmsMenuGroups.map((name, i) => ({ code: ['header', 'footer', 'utility'][i], name }))
  /* menu nhiều tầng (parentId), sinh từ sitemap website: scripts/gen-site-menus.mjs */
  const menuIds = []
  load('site-menus').forEach((m) => {
    const r = add('menuItems', { groupCode: m.group, parentId: m.parent == null ? null : menuIds[m.parent], type: m.url ? 'page' : 'heading', url: m.url || null, label: m.label, icon: m.icon,
      sortOrder: m.order, isVisible: true, openInNewTab: false, translations: m.labelEn ? { en: { label: m.labelEn, status: 'done' } } : {} })
    menuIds.push(r.id)
  })

  /* banners — khoảng ngày tính theo hôm nay để bản demo luôn có banner đang hiệu lực */
  const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
  const BANNER_SEED = {
    'Banner tuyển sinh đại học 2025': { subtitle: 'Xét tuyển 15 ngành Kỹ thuật – Công nghệ, nhận hồ sơ trực tuyến', linkUrl: '/hoc-tap/tuyen-sinh', startsOn: day(-10), endsOn: day(60) },
    'Hội thảo quốc tế Trắc địa – GIS 2025': { subtitle: 'Đăng ký tham dự và gửi bài báo', linkUrl: '/su-kien', startsOn: day(-5), endsOn: day(30) },
    'Chào mừng 60 năm thành lập Trường': { subtitle: '1966 – 2026 · Chuỗi hoạt động kỷ niệm', linkUrl: '/gioi-thieu/lich-su', startsOn: day(-3), endsOn: day(40) },
    'Ngày hội việc làm HUMG 2025': { subtitle: 'Hơn 80 doanh nghiệp tuyển dụng', linkUrl: '/doi-song/viec-lam', startsOn: day(-7), endsOn: day(45) },
    'Thông báo học bổng khuyến khích học tập': { subtitle: 'Hạn nộp hồ sơ trong tháng này', linkUrl: '/hoc-tap/hoc-phi-hoc-bong', startsOn: day(-2), endsOn: day(25) },
  }
  cms.cmsBanners.forEach((b) => {
    add('banners', { position: BANNER_POS[b.position], title: b.name, imageId: null, isVisible: b.status === 'Hiển thị', sortOrder: b.order, linkUrl: null, subtitle: null, ...BANNER_SEED[b.name] })
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
  cms.cmsActivity.forEach((a) => add('activityLogs', { tenantId: 'humg', actorSub: userByName(a.user)?.sub ?? null, userName: a.user, entityType: null, entityId: null, changes: null, action: ACTION[a.action] || a.action, targetLabel: a.target, ipAddress: a.ip, createdAt: iso(a.time.split(' ')[0], a.time.split(' ')[1]) }))
  cms.cmsBackups.forEach((b) => add('backups', { filePath: `/backup/cms_humg/cms_${b.time.split(' ')[0].split('/').reverse().join('')}.sql.gz`, sizeBytes: bytes(b.size), trigger: b.by.includes('Cron') ? 'cron' : 'manual', createdByName: b.by, status: 'success', createdAt: iso(b.time.split(' ')[0], b.time.split(' ')[1]) }))
  /* ---------- tenant: toàn bộ dữ liệu trên thuộc tenant humg ---------- */
  const GLOBAL = new Set(['languages', 'users', 'orgUnits', 'tenants'])
  for (const [name, list] of Object.entries(s.collections)) if (!GLOBAL.has(name)) list.forEach((r) => { r.tenantId ??= 'humg' })
  seedTenantCntt(s, add, col, settings)

  /* ---------- phân quyền mức bản ghi (grants) ---------- */
  const grant = (g) => add('grants', { tenantId: 'humg', resourceType: '*', scopeType: 'tenant', scopeId: null, note: null, expiresAt: null, createdBy: 'u-tvanminh', createdAt: '2025-01-10T08:00:00+07:00', deletedAt: null, ...g })
  grant({ principalType: 'user', principalId: 'u-nthoa', permissions: ['view', 'edit', 'review', 'publish'], note: 'Biên tập viên chính — toàn trang Trường' })
  grant({ principalType: 'role', principalId: 'cms.author', permissions: ['view'], note: 'Tác giả xem được mọi bài của Trường' })
  grant({ principalType: 'role', principalId: 'cms.viewer', permissions: ['view'], note: 'Người xem CMS xem được mọi bài của Trường' })
  grant({ principalType: 'unit', principalId: 'P-TT', resourceType: 'news', scopeType: 'unit', scopeId: 'P-TT', permissions: ['edit'], note: 'Thành viên Phòng Truyền thông sửa bài của phòng' })
  grant({ principalType: 'user', principalId: 'u-pvloc', scopeType: 'unit', scopeId: 'CNTT', permissions: ['view', 'edit', 'review', 'publish'], note: 'Phụ trách nội dung Khoa CNTT trên trang Trường' })
  grant({ principalType: 'user', principalId: 'u-vthuong', resourceType: 'announcement', scopeType: 'unit', scopeId: 'P-DT', permissions: ['review'], note: 'Duyệt thông báo của Phòng Đào tạo' })
  grant({ principalType: 'unit', principalId: 'P-DT', resourceType: 'announcement', scopeType: 'unit', scopeId: 'P-DT', permissions: ['edit'], note: 'Cán bộ Phòng Đào tạo soạn thông báo của phòng' })
  grant({ principalType: 'user', principalId: 'u-dvtung', resourceType: 'news', scopeType: 'category', scopeId: String(catByName('Nghiên cứu')?.id), permissions: ['edit'], note: 'Cộng tác viên chuyên mục Nghiên cứu' })
  grant({ tenantId: 'cntt', principalType: 'user', principalId: 'u-pvloc', permissions: ['manage'], note: 'Quản trị trang Khoa CNTT' })
  grant({ tenantId: 'cntt', principalType: 'unit', principalId: 'BM-KHMT', scopeType: 'unit', scopeId: 'BM-KHMT', permissions: ['edit'], note: 'Bộ môn KHMT tự soạn bài/thông báo của bộ môn' })

  seedAnnouncements(add, col)

  /* ---------- revision v1 cho mọi bản ghi có workflow ---------- */
  for (const [name, type] of [['contents', 'news'], ['announcements', 'announcement']]) {
    col(name).forEach((r) => add('revisions', { tenantId: r.tenantId, entityType: type, entityId: r.id, version: 1, state: 'current', snapshot: revisionSnapshot(r), reason: 'Khởi tạo', createdBy: r.createdBy, createdAt: r.createdAt }))
  }
  col('workflowHistory')
  col('receipts')
  s.schemaVersion = SCHEMA_VERSION
  return s
}

/** Trường không đưa vào snapshot revision (thay đổi liên tục / do hệ thống quản lý) */
const VOLATILE = new Set(['id', 'tenantId', 'viewCount', 'version', 'pendingRevisionId', 'deletedAt', 'deletedBy', 'updatedAt', 'updatedBy'])
export const revisionSnapshot = (r) => JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => !VOLATILE.has(k)))))

function seedTenantCntt(s, add, col, settings) {
  const T = 'cntt'
  s.settings[T] = JSON.parse(JSON.stringify(settings))
  s.settings[T].general = { ...s.settings[T].general, siteName: 'Khoa Công nghệ thông tin – HUMG' }
  const c1 = add('categories', { tenantId: T, parentId: null, name: 'Tin tức Khoa', slug: 'tin-tuc-khoa', description: null, sortOrder: 0, isActive: true, translations: {} })
  const c2 = add('categories', { tenantId: T, parentId: null, name: 'Nghiên cứu – Học thuật', slug: 'nghien-cuu-hoc-thuat', description: null, sortOrder: 1, isActive: true, translations: {} })
  const post = (o) => add('contents', {
    tenantId: T, categoryId: c1.id, ownerUnitCode: 'CNTT', excerpt: null, status: 'published', isFeatured: false, showOnHome: true, contentBody: '[]',
    metaTitle: null, metaDescription: null, metaKeywords: null, featuredImageId: null, attachmentId: null, authorSub: 'u-pvloc', authorName: 'Phạm Văn Lộc',
    source: null, unit: 'Khoa CNTT', viewCount: 0, tags: [], attachments: [], translations: {}, expireAt: null,
    submittedAt: null, submittedBy: null, reviewedAt: null, reviewedBy: null, reviewNote: null, pendingRevisionId: null, version: 1,
    createdBy: 'u-pvloc', updatedBy: 'u-pvloc', deletedAt: null, deletedBy: null, ...o,
    createdAt: o.publishAt || '2025-05-20T08:00:00+07:00', updatedAt: o.publishAt || '2025-05-20T08:00:00+07:00', firstPublishedAt: o.status === 'draft' ? null : o.publishAt,
  })
  post({ title: 'Khoa CNTT khai giảng lớp chuyên đề Trí tuệ nhân tạo ứng dụng', slug: 'khoa-cntt-khai-giang-chuyen-de-ai', excerpt: 'Lớp chuyên đề dành cho sinh viên năm 3, năm 4 các ngành CNTT, KHMT.', contentBody: JSON.stringify(['Khoa Công nghệ thông tin tổ chức lớp chuyên đề Trí tuệ nhân tạo ứng dụng trong khai thác mỏ và địa chất.']), publishAt: '2025-05-22T08:00:00+07:00', isFeatured: true, tags: ['AI', 'chuyên đề'] })
  post({ title: 'Seminar Bộ môn Khoa học máy tính tháng 6', slug: 'seminar-bm-khmt-thang-6', categoryId: c2.id, ownerUnitCode: 'BM-KHMT', excerpt: 'Chủ đề: Xử lý ảnh viễn thám bằng học sâu.', contentBody: JSON.stringify(['Seminar định kỳ của Bộ môn KHMT.']), publishAt: '2025-05-25T14:00:00+07:00', authorSub: 'u-dvtung', authorName: 'Đỗ Văn Tùng', createdBy: 'u-dvtung' })
  post({ title: 'Kế hoạch thực tập doanh nghiệp hè 2025 (bản nháp)', slug: 'ke-hoach-thuc-tap-he-2025', status: 'draft', publishAt: null, excerpt: 'Dự thảo kế hoạch thực tập.', showOnHome: false })
  const pick = (name, n) => col(name).filter((r) => r.tenantId === 'humg').slice(0, n).map(({ id, tenantId, ...r }) => add(name, { ...r, tenantId: T }))
  const [slide] = pick('heroSlides', 1)
  Object.assign(slide, { code: 'cntt-hero', kicker: 'KHOA CNTT', title: 'CÔNG NGHỆ THÔNG TIN\nCHO NGÀNH MỎ – ĐỊA CHẤT', subtitle: 'HUMG', primaryLabel: 'Giới thiệu Khoa', primaryUrl: '/gioi-thieu', accentLabel: 'Tuyển sinh', accentUrl: '/hoc-tap/tuyen-sinh' })
  pick('quickLinks', 4); pick('audiences', 6); pick('strengths', 3); pick('partners', 4)
  add('events', { tenantId: T, slug: 'ngay-hoi-viec-lam-cntt-2025', title: 'Ngày hội việc làm CNTT 2025', startsAt: '2025-06-14T08:00:00+07:00', endsAt: '2025-06-14T16:30:00+07:00',
    place: 'Sảnh nhà C', placeFull: 'Sảnh nhà C, Trường ĐH Mỏ - Địa chất', organizer: 'Khoa Công nghệ thông tin', audience: 'Sinh viên Khoa CNTT', contact: null,
    status: 'upcoming', description: ['Gặp gỡ hơn 20 doanh nghiệp công nghệ.'], agenda: [], isVisible: true })
  add('videos', { tenantId: T, slug: 'gioi-thieu-khoa-cntt', title: 'Giới thiệu Khoa Công nghệ thông tin', channel: 'Khoa CNTT', durationSec: 185, videoUrl: null, viewCount: 820,
    publishedAt: '2025-04-02', description: 'Video giới thiệu ngành học và cơ sở vật chất của Khoa.', isVisible: true })
  col('siteStats').filter((r) => r.tenantId === 'humg').forEach(({ id, tenantId, ...r }) => add('siteStats', { ...r, tenantId: T }))
}

function seedAnnouncements(add, col) {
  const d = (days, h = 8) => { const x = new Date(Date.now() + days * 86400000); if (h !== null) x.setHours(h, 0, 0, 0); return x.toISOString() }
  const ann = (o) => add('announcements', {
    tenantId: 'humg', category: 'general', priority: 0, status: 'published', expireAt: null, pinnedUntil: null, requireAck: false, channels: ['portal'],
    recallReason: null, bodyHtml: '', translations: {}, attachments: [], authorSub: 'u-nthoa', authorName: 'Nguyễn Thị Hoa',
    submittedAt: null, submittedBy: null, reviewedAt: null, reviewedBy: null, reviewNote: null, pendingRevisionId: null, version: 1,
    createdBy: o.authorSub || 'u-nthoa', updatedBy: o.authorSub || 'u-nthoa', deletedAt: null, deletedBy: null, ...o,
    createdAt: o.publishAt || d(-1), updatedAt: o.publishAt || d(-1), firstPublishedAt: o.status && o.status !== 'published' ? null : o.publishAt,
  })
  ann({ title: 'Lịch thi học kỳ 2 năm học 2024–2025', ownerUnitCode: 'P-DT', category: 'exam', priority: 1, publishAt: d(-3), pinnedUntil: d(10), requireAck: true, channels: ['portal', 'email'],
    bodyHtml: '<p>Phòng Đào tạo thông báo lịch thi học kỳ 2. Sinh viên kiểm tra phòng thi trên My eUni và <strong>xác nhận đã đọc</strong>.</p>',
    translations: { en: { title: 'Semester 2 exam schedule 2024–2025', bodyHtml: '<p>The Academic Affairs Office announces the semester 2 exam schedule.</p>', status: 'done' } },
    targets: [{ audience: 'student', unitCode: null, userSub: null, isExclude: false, label: 'Toàn bộ sinh viên' }], attachments: [{ title: 'Lich-thi-HK2.pdf', meta: 'PDF · 420 KB' }] })
  ann({ title: 'Hạn nộp học phí học kỳ 2', ownerUnitCode: 'P-DT', category: 'tuition', priority: 2, publishAt: d(-2), expireAt: d(20), channels: ['portal', 'email', 'push'],
    bodyHtml: '<p>Hạn cuối nộp học phí học kỳ 2 là ngày 30/06. Sinh viên quá hạn sẽ bị khóa đăng ký học phần.</p>',
    targets: [{ audience: 'student', unitCode: null, userSub: null, isExclude: false, label: 'Toàn bộ sinh viên' }, { audience: 'parent', unitCode: null, userSub: null, isExclude: false, label: 'Phụ huynh' }] })
  ann({ title: 'Họp giao ban Khoa CNTT tháng 6', ownerUnitCode: 'CNTT', category: 'admin', publishAt: d(-1), authorSub: 'u-pvloc', authorName: 'Phạm Văn Lộc',
    bodyHtml: '<p>Kính mời toàn thể giảng viên Khoa CNTT dự họp giao ban lúc 14:00 thứ Sáu tại phòng 302-C.</p>',
    targets: [{ audience: 'lecturer', unitCode: 'CNTT', userSub: null, isExclude: false, label: 'Giảng viên Khoa CNTT' }] })
  ann({ title: 'Lớp DCCTKT66A: đổi phòng học môn Cơ sở dữ liệu', ownerUnitCode: 'BM-KHMT', category: 'academic', publishAt: d(-0.1, null), authorSub: 'u-dvtung', authorName: 'Đỗ Văn Tùng',
    bodyHtml: '<p>Từ tuần 12, môn Cơ sở dữ liệu của lớp DCCTKT66A chuyển sang phòng 405-A.</p>',
    targets: [{ audience: null, unitCode: 'DCCTKT66A', userSub: null, isExclude: false, label: 'Lớp DCCTKT66A' }] })
  ann({ title: 'Xác nhận hướng dẫn đồ án tốt nghiệp', ownerUnitCode: 'BM-KHMT', category: 'academic', priority: 1, publishAt: d(-1), requireAck: true, authorSub: 'u-dvtung', authorName: 'Đỗ Văn Tùng',
    bodyHtml: '<p>Em Nguyễn Văn Sinh đã được phân công GV hướng dẫn đồ án: TS. Nguyễn Thanh Bình.</p>',
    targets: [{ audience: null, unitCode: null, userSub: 'SV001', isExclude: false, label: '2151000123 – Nguyễn Văn Sinh' }, { audience: null, unitCode: null, userSub: 'GV002', isExclude: false, label: 'GV0123 – TS. Nguyễn Thanh Bình' }] })
  ann({ title: 'Khảo sát chất lượng dịch vụ (trừ lớp đang thực tập)', ownerUnitCode: 'P-CTSV', category: 'general', publishAt: d(-4),
    bodyHtml: '<p>Mời sinh viên tham gia khảo sát chất lượng dịch vụ hỗ trợ người học.</p>',
    targets: [{ audience: 'student', unitCode: null, userSub: null, isExclude: false, label: 'Toàn bộ sinh viên' }, { audience: null, unitCode: 'DCKTM66', userSub: null, isExclude: true, label: 'Lớp DCKTM66' }] })
  ann({ title: 'Kế hoạch nghỉ hè 2025 (chờ duyệt)', ownerUnitCode: 'P-DT', status: 'pending_review', publishAt: null, submittedAt: d(-0.05, null), submittedBy: 'u-hdnam', authorSub: 'u-hdnam', authorName: 'Hoàng Đức Nam',
    bodyHtml: '<p>Dự thảo kế hoạch nghỉ hè cho cán bộ và sinh viên.</p>',
    targets: [{ audience: null, unitCode: null, userSub: null, isExclude: false, label: 'Mọi người' }] })
  ann({ title: 'Đăng ký học phần học kỳ hè (hẹn giờ)', ownerUnitCode: 'P-DT', category: 'academic', publishAt: d(3),
    bodyHtml: '<p>Cổng đăng ký học phần học kỳ hè mở từ ngày đăng thông báo này.</p>',
    targets: [{ audience: 'student', unitCode: null, userSub: null, isExclude: false, label: 'Toàn bộ sinh viên' }] })
  ann({ tenantId: 'cntt', title: 'Sinh viên Khoa CNTT đăng ký đề tài NCKH 2025', ownerUnitCode: 'CNTT', category: 'academic', publishAt: d(-2), authorSub: 'u-pvloc', authorName: 'Phạm Văn Lộc',
    bodyHtml: '<p>Khoa CNTT nhận đăng ký đề tài NCKH sinh viên đến hết 15/06.</p>',
    targets: [{ audience: 'student', unitCode: 'CNTT', userSub: null, isExclude: false, label: 'Sinh viên Khoa CNTT' }] })
  col('announcements')
}

let state
export function getStore() {
  if (state) return state
  if (existsSync(STORE_FILE)) {
    try { const saved = JSON.parse(readFileSync(STORE_FILE, 'utf8')); if (saved.schemaVersion === SCHEMA_VERSION) { state = saved; return state } } catch { /* dựng lại */ }
  }
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
