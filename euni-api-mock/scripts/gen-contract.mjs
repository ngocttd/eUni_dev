// Sinh hợp đồng API cho đội backend từ chính mock server (đang chạy ở :3000):
//   node scripts/gen-contract.mjs   →  contract/openapi.json  +  contract/API_CONTRACT.md
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const API = process.env.API || 'http://127.0.0.1:3000'
const out = join(root, 'contract')
mkdirSync(out, { recursive: true })

const j = async (path, token, method = 'GET', body) => {
  const res = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  return res.json()
}
const loginRes = await j('/auth-api/api/v1/auth/login', null, 'POST', { username: 'tvanminh', password: 'Humg@2025' })
const T = loginRes.accessToken
const SV = (await j('/auth-api/api/v1/auth/login', null, 'POST', { role: 'student' })).accessToken

/* ---------- suy luận schema từ dữ liệu mẫu ---------- */
function infer(v, depth = 0) {
  if (v === null) return { nullable: true }
  if (Array.isArray(v)) return { type: 'array', items: v.length && depth < 4 ? infer(v[0], depth + 1) : {} }
  if (typeof v === 'object') {
    if (depth >= 4) return { type: 'object' }
    return { type: 'object', properties: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, infer(x, depth + 1)])) }
  }
  return { type: typeof v === 'number' ? (Number.isInteger(v) ? 'integer' : 'number') : typeof v }
}
const short = (v, n = 1) => JSON.stringify(Array.isArray(v) ? v.slice(0, n) : v, (k, x) => (Array.isArray(x) && x.length > n ? x.slice(0, n) : x), 2)

/* ---------- mô tả endpoint CMS (service cms-api) ---------- */
const PAGED = [['pageIndex', 'integer', 'Trang (mặc định 1)'], ['pageSize', 'integer', 'Số dòng/trang (mặc định 20, tối đa 500)'], ['keyword', 'string', 'Từ khóa tìm kiếm']]
const CMS = [
  // [method, path, auth/permission, mô tả, query[], mẫu response key]
  ['GET', '/api/v1/public/site-content', 'public', 'Toàn bộ nội dung công khai cho website: danh mục, bài viết đã xuất bản (kèm contentBody và translations.en — chỉ bản dịch ĐÃ HOÀN TẤT, thiếu thì website dùng tiếng Việt), sự kiện, album, video, podcast, trang tĩnh cho tìm kiếm. ?lang=vi|en (thiếu bản dịch → tự quay về vi).', [['lang', 'string', 'vi | en']], 'publicContent'],
  ['GET', '/api/v1/public/home', 'public', 'Dữ liệu trang chủ: heroSlides, quickLinks, audiences, strengths, partners, heroStats, universityStats, heroChips, featuredNews, newsList (3 bài), upcomingEvents (5), mediaTabs.', [['lang', 'string', 'vi | en']], 'publicHome'],
  ['GET', '/api/v1/public/menus/{code}', 'public', 'Mục menu đang hiển thị của nhóm (header = menu đầu trang, footer = các cột chân trang, utility = liên kết dòng cuối chân trang), danh sách phẳng có parentId để dựng cây: { id, parentId, label, url, icon, type page|link|category|heading, sortOrder, openInNewTab, translations.en.label }. Website lấy làm menu, không cache.', [], 'menu'],
  ['GET', '/api/v1/public/banners', 'public', 'Banner đang hiệu lực (isVisible và hôm nay nằm trong startsOn..endsOn): { id, position, title, subtitle, linkUrl, imageUrl (tương đối với gateway), sortOrder }. Vị trí: home_slider (dải dưới slide trang chủ), home_popup (cửa sổ nổi trang chủ), sidebar_right (cột phải trang tin), footer (dải trên chân trang).', [['position', 'string', 'home_slider | home_popup | sidebar_right | footer']], 'banners'],
  ['GET', '/api/v1/public/pages/slug/{slug}', 'public', 'Trang tĩnh soạn ở CMS (template khác system, status published): { id, slug, title, bodyHtml, language, parents[{title,url}], updatedAt }. 404 nếu nháp/không có. Website hiển thị ở /trang/{slug}. Trang template=system là trang có sẵn trong code website, không trả ở đây.', [['lang', 'string', 'vi | en']], 'cmsPage'],
  ['GET', '/api/v1/public/settings', 'public', 'Cấu hình công khai (general, seo, language).', [], 'settings'],
  ['GET', '/api/v1/public/search', 'public', 'Tìm kiếm toàn site (bài viết, sự kiện, media, trang).', [['q', 'string', 'Từ khóa'], ...PAGED.slice(0, 2)], 'search'],
  ['GET', '/api/v1/public/contents', 'public', 'Danh sách bài viết đã xuất bản (không có contentBody), phân trang.', [['categoryId', 'integer', ''], ['lang', 'string', 'vi | en'], ...PAGED], 'contentList'],
  ['GET', '/api/v1/public/contents/slug/{slug}', 'public', 'Chi tiết bài viết đã xuất bản theo slug.', [['lang', 'string', 'vi | en']], 'contentDetail'],
  ['POST', '/api/v1/public/contents/{id}/views', 'public', 'Ghi nhận +1 lượt xem cho bài viết.', [], null],
  ['GET', '/api/v1/public/categories', 'public', 'Danh mục (cây qua parentId).', PAGED, 'categories'],
  ['GET', '/api/v1/public/datasets/{module}', 'public', 'Nội dung tĩnh của website do CMS quản lý: cooperation, life, utilities (xem §4).', [], null],
  ['GET', '/api/v1/public/languages', 'public', 'Ngôn ngữ hỗ trợ.', [], null],
  ['GET', '/api/v1/public/media/{id}/url', 'public', 'URL tải file media.', [], null],

  ['GET', '/api/v1/public/tenants/resolve', 'public', 'Tên miền → trang đơn vị: { id, name } nếu tên miền gắn với một trang đang bật, ngược lại 404. Website gọi phía server (nhớ tạm ~15 giây) để nhận tên miền của Khoa/Phòng mới tạo mà không phải build lại; 404 → phục vụ trang Trường.', [['host', 'string', 'Tên miền (kèm cổng nếu có), vd. cntt.humg.edu.vn']], 'tenantResolve'],
  ['GET', '/api/v1/public/tenant', 'public', 'Tenant đang phục vụ (theo X-Tenant / host).', [], null],

  ['GET', '/api/v1/me/context', 'đăng nhập', 'Ngữ cảnh người dùng: tenants được quản trị ({ id, name, rootUnit, domains[] } — domains để CMS mở đúng website của trang), permissions (từ role trong token), đơn vị (kèm đơn vị cha), can.{news|announcement}.{view|edit|review|publish}.', [], 'context'],
  ['GET', '/api/v1/admin/contents', 'news.view + ACL', 'Quản trị: danh sách bài viết user được xem (lọc theo grant). Mỗi dòng có allowedActions[], isScheduled, pendingRevision, version.', [['status', 'string', 'draft | pending_review | published | archived'], ['scheduled', 'boolean', 'chỉ bài hẹn giờ'], ['mine', 'boolean', 'chỉ bài tôi tạo'], ['categoryId', 'integer', ''], ['ownerUnitCode', 'string', ''], ['translation', 'string', 'done | in_progress | missing (bản EN)'], ...PAGED], 'content'],
  ['GET', '/api/v1/admin/contents/trash', 'news.edit|publish + ACL', 'Thùng rác (bài đã xóa mềm).', PAGED, null],
  ['GET', '/api/v1/admin/contents/{id}', 'news.view + ACL', 'Chi tiết bài viết (kèm bản dịch). Header ETag = version.', [], 'content'],
  ['POST', '/api/v1/admin/contents', 'news.edit + ACL (phạm vi chuyên mục/đơn vị)', 'Tạo bản nháp. ownerUnitCode mặc định = đơn vị đầu tiên của user. Có thể gửi status=pending_review|published để chuyển trạng thái ngay (cần quyền tương ứng).', [], 'content'],
  ['PUT', '/api/v1/admin/contents/{id}', 'news.edit + ACL', 'Sửa nội dung (status KHÔNG đổi qua PUT). Gửi version (hoặc If-Match) → 409 nếu đã có người sửa. Bài đang published mà user không có publish → 202, lưu thành bản sửa đổi chờ duyệt (pendingRevision).', [], 'content'],
  ['DELETE', '/api/v1/admin/contents/{id}', 'allowedActions có delete', 'Xóa mềm (deletedAt, deletedBy).', [], null],
  ['POST', '/api/v1/admin/contents/{id}/restore', 'allowedActions có restore', 'Khôi phục từ thùng rác.', [], null],
  ['DELETE', '/api/v1/admin/contents/{id}/purge', 'cms.*', 'Xóa vĩnh viễn bài trong thùng rác.', [], null],
  ['POST', '/api/v1/admin/contents/{id}/workflow/{action}', 'theo action', 'action: submit (edit) · reject (review, body.note bắt buộc) · approve (review) · publish (publish) · unpublish · archive (publish) · approve-revision / reject-revision (review). Body: { note?, publishAt?, version? }. publishAt tương lai = hẹn giờ.', [], 'content'],
  ['GET', '/api/v1/admin/contents/{id}/revisions', 'news.view + ACL', 'Danh sách phiên bản (state current | superseded | proposed | rejected).', [], 'revisions'],
  ['GET', '/api/v1/admin/contents/{id}/revisions/{version}', 'news.view + ACL', 'Một phiên bản: snapshot + changesFromCurrent.', [], null],
  ['POST', '/api/v1/admin/contents/{id}/revisions/{version}/restore', 'news.edit/publish + ACL', 'Khôi phục nội dung phiên bản cũ → tạo phiên bản mới (không ghi đè lịch sử).', [], null],
  ['GET', '/api/v1/admin/contents/{id}/history', 'news.view + ACL', 'Lịch sử workflow + audit của bản ghi.', [], 'history'],

  ['GET/POST/PUT/DELETE', '/api/v1/admin/announcements …', 'announcement.* + ACL', 'Thông báo: cùng bộ endpoint vòng đời như /api/v1/admin/contents (trash, restore, workflow, revisions, history). Body có targets[] = [{ audience?, unitCode?, userSub? | userKey? (mã CB/mã SV/email), isExclude? }], priority 0|1|2, category, requireAck, channels[], pinnedUntil, expireAt. archive kèm note = thu hồi (recallReason).', [['status', 'string', ''], ['category', 'string', ''], ['ownerUnitCode', 'string', ''], ...PAGED], 'announcement'],
  ['GET', '/api/v1/admin/announcements/{id}/stats', 'announcement.view + ACL', 'Người nhận (ước tính từ danh bạ/Membership API), đã đọc, đã xác nhận.', [], null],
  ['GET', '/api/v1/admin/announcements/meta/options', 'announcement.view', 'Danh mục audiences, categories, priorities, channels.', [], null],
  ['GET', '/api/v1/me/announcements', 'đăng nhập (mọi vai trò)', 'Hộp thư thông báo của tôi: so khớp targets với role (audience) + đơn vị (kèm đơn vị cha) + sub. Ghim → ưu tiên → mới nhất. X-Tenant: * = mọi tenant của user.', [['unread', 'boolean', ''], ['category', 'string', ''], ['lang', 'string', 'vi | en'], ...PAGED], 'inbox'],
  ['GET', '/api/v1/me/announcements/unread-count', 'đăng nhập', 'Số thông báo chưa đọc.', [], null],
  ['POST', '/api/v1/me/announcements/{id}/read · /api/v1/me/announcements/{id}/ack · /api/v1/me/announcements/read-all', 'đăng nhập', 'Đánh dấu đã đọc / xác nhận đã đọc (requireAck) / đọc tất cả.', [], null],

  ['GET/POST/PUT/DELETE', '/api/v1/admin/grants', 'grant.manage', 'Phân quyền mức bản ghi: { principalType user|unit|role, principalId, resourceType *|news|announcement|page|media, scopeType tenant|category|unit|record, scopeId, permissions[view|edit|review|publish|manage], expiresAt?, note? }. Grant theo đơn vị áp dụng cả đơn vị con.', PAGED, 'grant'],
  ['GET', '/api/v1/admin/grants/effective/{sub}', 'grant.manage', 'Quyền chức năng + các grant đang áp dụng cho một người.', [], null],
  ['GET', '/api/v1/admin/directory/users', 'cms.access', 'Danh bạ (IdS) — tìm theo tên, email, mã CB, mã SV. Chỉ đọc; user/role quản lý ở Identity Server.', [['keyword', 'string', ''], ['role', 'string', '']], 'directory'],
  ['GET', '/api/v1/admin/directory/roles', 'cms.access', 'Danh mục role trên SSO: realm role (tầng 1) và client role theo app (tầng 2), kèm quyền chức năng CMS tương ứng (cấu hình tĩnh).', [], null],
  ['GET', '/api/v1/admin/org-units', 'cms.access', 'Cây đơn vị (bản sao QLNS/QLĐT): code, name, kind, parentCode, path, depth.', [], 'orgUnits'],

  ['GET/POST', '/api/v1/admin/categories · PUT/DELETE /api/v1/admin/categories/{id}', 'category.manage', 'CRUD danh mục (theo tenant, xóa mềm, POST /{id}/restore).', [], 'category'],
  ['GET', '/api/v1/admin/media', 'media.manage', 'Thư viện media của tenant.', [['kind', 'string', 'image | document | video | audio | other'], ['folder', 'string', ''], ...PAGED], 'media'],
  ['POST', '/api/v1/admin/media/upload', 'media.manage', 'multipart/form-data: file, altText, caption, folder.', [], 'media'],
  ['DELETE', '/api/v1/admin/media/{id}', 'media.manage', 'Xóa mềm media.', [], null],
  ['CRUD', '/api/v1/admin/events · /api/v1/admin/albums · /api/v1/admin/videos · /api/v1/admin/podcasts', 'site.manage', 'Sự kiện, album ảnh, video, podcast (theo tenant, xóa mềm + /{id}/restore, /trash).', PAGED, 'event'],
  ['CRUD', '/api/v1/admin/pages · /api/v1/admin/menu-items', 'page.manage / menu.manage', 'Trang: { title, slug, parentId, template default|system, status published|draft, bodyHtml, sortOrder, translations.en{title,bodyHtml} }. Mục menu: { groupCode header|footer|utility, parentId, label, url, type, icon, isVisible, openInNewTab, sortOrder, translations.en.label }.', PAGED, null],
  ['CRUD', '/api/v1/admin/banners', 'site.manage', 'Banner: { title, subtitle, position, linkUrl, imageId, isVisible, startsOn, endsOn, sortOrder }.', PAGED, 'banner'],
  ['CRUD', '/api/v1/admin/hero-slides · /api/v1/admin/quick-links · /api/v1/admin/audiences · /api/v1/admin/strengths · /api/v1/admin/partners · /api/v1/admin/site-stats', 'site.manage', 'Các khối trang chủ.', PAGED, null],
  ['GET/PUT', '/api/v1/admin/settings · /api/v1/admin/settings/{group}', 'settings.manage', 'Cấu hình theo tenant, theo nhóm: general, seo, email, language, backup, home.', [], null],
  ['GET', '/api/v1/admin/audit-logs', 'log.view', 'Audit log chỉ ghi thêm: actorSub, action, entityType, entityId, changes {field:[cũ,mới]}, ip. (/api/v1/admin/activity-logs = tên cũ.)', [['action', 'string', ''], ['actor', 'string', 'sub'], ['entityType', 'string', ''], ['entityId', 'string', ''], ['from', 'string', 'ISO'], ['to', 'string', 'ISO'], ...PAGED], 'log'],
  ['GET/POST', '/api/v1/admin/backups', 'backup.manage', 'Lịch sử sao lưu / tạo sao lưu thủ công.', PAGED, null],
  ['DELETE', '/api/v1/admin/backups/{id}', 'backup.manage', 'Xóa bản sao lưu.', [], null],
  ['GET', '/api/v1/admin/backups/{id}/download', 'backup.manage', 'Tải tệp sao lưu (JSON).', [], null],
  ['POST', '/api/v1/admin/backups/{id}/restore', 'backup.manage', 'Phục hồi dữ liệu CMS từ một bản sao lưu.', [], null],
  ['POST', '/api/v1/admin/backups/restore', 'backup.manage', 'multipart/form-data: file — phục hồi từ tệp sao lưu tải lên.', [], null],
  ['POST', '/api/v1/admin/settings/email/test', 'settings.manage', 'Gửi email thử: { to } → { ok, message }.', [], null],
  ['GET', '/api/v1/admin/tenants', 'cms.admin', 'Danh sách trang đơn vị (Trường, Khoa, Phòng ban…): { id, name, rootUnit, rootUnitName, domains[], isActive, createdAt, stats { contents, pages, grants } }. Không phụ thuộc X-Tenant.', [], 'tenant'],
  ['POST', '/api/v1/admin/tenants', 'cms.admin', 'Tạo trang đơn vị: { id (a-z0-9-, 2–32 ký tự, bắt đầu bằng chữ; không đổi được), name, rootUnit? (mã đơn vị trong cây), domains[] (chuẩn hóa chữ thường, bỏ http(s):// và đường dẫn; không trùng trang khác), scaffold? (mặc định true: sinh cấu hình theo tên trang, menu header/footer/utility, trang Giới thiệu/Liên hệ/Chính sách/Điều khoản, chuyên mục Tin tức, slide + khối trang chủ), ownerSub? (cấp grant manage toàn trang cho người này) }. 201 → bản ghi như GET; 409 mã trùng; 422 dữ liệu sai.', [], 'tenant'],
  ['PUT', '/api/v1/admin/tenants/{id}', 'cms.admin', 'Sửa name, rootUnit, domains[], isActive. Không xóa cứng: isActive=false → tên miền không còn được tra ra, X-Tenant của trang trả 400, trang biến mất khỏi me/context; dữ liệu giữ nguyên, bật lại là dùng tiếp. Trang humg (mặc định) không tắt được (422).', [], 'tenant'],
  ['GET', '/api/v1/admin/dashboard', 'cms.access', 'Số liệu tổng quan theo quyền của user, kèm awaitingReview[].', [], 'dashboard'],
]

/* ---------- mẫu response từ mock đang chạy ---------- */
const first = async (p, t = T) => { const r = await j(p, t); return r.items ? r.items[0] : r }
const samples = {
  publicContent: await j('/cms-api/api/v1/public/site-content'),
  publicHome: await j('/cms-api/api/v1/public/home'),
  menu: (await j('/cms-api/api/v1/public/menus/header')).slice(0, 3),
  cmsPage: await j('/cms-api/api/v1/public/pages/slug/chinh-sach-bao-mat'),
  banners: await j('/cms-api/api/v1/public/banners'),
  settings: await j('/cms-api/api/v1/public/settings'),
  search: await j('/cms-api/api/v1/public/search?q=tuyen&pageSize=2'),
  contentList: await j('/cms-api/api/v1/public/contents?pageSize=2'),
  contentDetail: await j('/cms-api/api/v1/public/contents/slug/le-ky-niem-60-nam-thanh-lap'),
  categories: await j('/cms-api/api/v1/public/categories?pageSize=2'),
  content: await first('/cms-api/api/v1/admin/contents?pageSize=1'),
  category: await first('/cms-api/api/v1/admin/categories?pageSize=1', T),
  media: await first('/cms-api/api/v1/admin/media?pageSize=1'),
  context: await j('/cms-api/api/v1/me/context', T),
  revisions: await j('/cms-api/api/v1/admin/contents/1/revisions', T),
  history: await j('/cms-api/api/v1/admin/contents/1/history', T),
  announcement: await first('/cms-api/api/v1/admin/announcements?pageSize=1'),
  inbox: await j('/cms-api/api/v1/me/announcements?pageSize=2', SV),
  grant: await first('/cms-api/api/v1/admin/grants?pageSize=1'),
  directory: await j('/cms-api/api/v1/admin/directory/users?keyword=nguyen&pageSize=2', T),
  orgUnits: (await j('/cms-api/api/v1/admin/org-units', T)).slice(0, 3),
  event: await first('/cms-api/api/v1/admin/events?pageSize=1'),
  banner: await first('/cms-api/api/v1/admin/banners?pageSize=1'),
  log: await first('/cms-api/api/v1/admin/activity-logs?pageSize=1'),
  dashboard: await j('/cms-api/api/v1/admin/dashboard', T),
  tenant: (await j('/cms-api/api/v1/admin/tenants', T)).find((t) => t.id === 'cntt'),
}
samples.tenantResolve = await j(`/cms-api/api/v1/public/tenants/resolve?host=${encodeURIComponent(samples.tenant?.domains?.[0] || '')}`)

/* ---------- dataset của các service ngoài ---------- */
const MODULE_SERVICE = (await import(pathToFileURL(join(root, 'src', 'datasets.js')).href)).MODULE_SERVICE
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const datasets = {}
for (const f of readdirSync(join(root, 'mock-data'))) {
  const m = f.replace('.json', '')
  if (MODULE_SERVICE[m]) datasets[m] = JSON.parse(readFileSync(join(root, 'mock-data', f), 'utf8'))
}

/* ================= OpenAPI ================= */
const paths = {}
const add = (path, method, op) => { (paths[path] ||= {})[method] = op }
const pq = (list) => list.map(([name, type, description]) => ({ name, in: 'query', description, schema: { type } }))
const ok = (schema) => ({ 200: { description: 'OK', content: { 'application/json': { schema } } }, 401: { description: 'Chưa đăng nhập' }, 403: { description: 'Thiếu quyền' } })

add('/auth-api/api/v1/auth/login', 'post', { tags: ['auth-api'], summary: 'Đăng nhập', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, password: { type: 'string' }, role: { type: 'string', description: 'Chỉ dùng cho "vào cổng demo": student|lecturer|staff|manager|parent' } } } } } }, responses: ok({ type: 'object', properties: { accessToken: { type: 'string' }, user: { type: 'object', properties: { id: {}, username: {}, name: {}, role: { type: 'string' }, permissions: { type: 'array', items: { type: 'string' } }, portal: { type: 'string' } } } } }) })
add('/auth-api/api/v1/auth/me', 'get', { tags: ['auth-api'], summary: 'Người dùng hiện tại', security: [{ bearer: [] }], responses: ok({ type: 'object' }) })
add('/auth-api/api/v1/auth/refresh', 'post', { tags: ['auth-api'], summary: 'Cấp lại access token', security: [{ bearer: [] }], responses: ok({ type: 'object' }) })
add('/auth-api/api/v1/auth/logout', 'post', { tags: ['auth-api'], summary: 'Đăng xuất', responses: { 204: { description: 'No content' } } })

for (const [method, path, perm, desc, query, key] of CMS) {
  const methods = method.split('/').map((m) => m.toLowerCase()).filter((m) => m !== 'crud')
  const ps = path.split(' · ')
  for (const p0 of ps) {
    const p = p0.replace(/^(PUT\/DELETE|POST|PUT|GET|DELETE) /, '').replace(/ ·.*/, '')
    for (const m of methods.length ? methods : ['get', 'post']) {
      add(`/cms-api${p.replace(/^\/api\//, '/api/')}`, m === 'put/delete' ? 'put' : m, {
        tags: ['cms-api'], summary: desc, description: perm === 'public' ? 'Không cần đăng nhập.' : `Cần Bearer token + quyền: ${perm}`,
        ...(perm === 'public' ? {} : { security: [{ bearer: [] }] }), parameters: pq(query), responses: ok(key && samples[key] ? infer(samples[key]) : { type: 'object' }),
      })
    }
  }
}
const groupOf = (m) => (m.startsWith('portal-') ? 'me' : 'public')
for (const [module, data] of Object.entries(datasets)) {
  const service = MODULE_SERVICE[module]
  add(`/${service}/api/v1/${groupOf(module)}/datasets/${module}`, 'get', { tags: [service], summary: `Toàn bộ dataset "${module}"`, responses: ok(infer(data, 1)) })
  for (const [key, value] of Object.entries(data)) {
    add(`/${service}/api/v1/${groupOf(module)}/${module}/${kebab(key)}`, 'get', { tags: [service], summary: `${module}.${key}`, parameters: Array.isArray(value) ? pq(PAGED) : [], responses: ok(Array.isArray(value) ? { type: 'object', properties: { items: infer(value, 2), pageIndex: { type: 'integer' }, pageSize: { type: 'integer' }, totalItems: { type: 'integer' }, totalPages: { type: 'integer' } } } : infer(value, 2)) })
  }
}
add('/qlkhcn-api/api/v1/public/research-topic-categories', 'get', { tags: ['qlkhcn-api'], summary: 'Danh mục lĩnh vực đề tài (có trong Swagger gateway demo)', parameters: pq(PAGED), responses: ok({ type: 'object' }) })
add('/qlns-api/api/v1/public/employees', 'get', { tags: ['qlns-api'], summary: 'Cán bộ, giảng viên (có trong Swagger gateway demo)', parameters: [...pq(PAGED), { name: 'isCurrentOnly', in: 'query', schema: { type: 'boolean' } }], responses: ok({ type: 'object' }) })

writeFileSync(join(out, 'openapi.json'), JSON.stringify({
  openapi: '3.0.3',
  info: { title: 'HUMG eUni — API gateway (hợp đồng FE ↔ BE)', version: '1.0.0', description: 'Hợp đồng do FE định nghĩa để backend triển khai. Sinh từ euni-api-mock. Mọi service nằm dưới cùng gateway: {gateway}/{service}/...' },
  servers: [{ url: 'http://127.0.0.1:3000', description: 'mock (máy dev)' }, { url: 'https://api-gateway-demo.humg.edu.vn/euni-mock-api', description: 'mock trên server, qua gateway' }, { url: 'https://api-gateway-demo.humg.edu.vn', description: 'backend thật' }],
  components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  paths,
}, null, 1))

/* ================= Markdown ================= */
const md = []
const p = (...x) => md.push(x.join(''))
p('# HUMG eUni — Hợp đồng API (FE ↔ BE)\n')
p('> **Tài liệu do FE định nghĩa để backend triển khai.** Sinh tự động từ `euni-api-mock` (`npm run contract`), đi kèm `openapi.json`. FE chạy được ngay với mock; khi backend làm đúng hợp đồng này chỉ cần đổi `NEXT_PUBLIC_API_GATEWAY_URL`.\n')
p('## 1. Quy ước chung\n')
p('- **Gateway**: `{gateway}/{service}/...` — mock trên máy dev `http://127.0.0.1:3000`; mock trên server **tích hợp qua gateway** `https://api-gateway-demo.humg.edu.vn/euni-mock-api` (như qlns-api, qlkhcn-api, edusoft-api); backend thật `https://api-gateway-demo.humg.edu.vn`. Base URL có thể có tiền tố nên client **ghép chuỗi** `{gateway}/{service}{path}`; mọi URL API trả về (vd. media `cms-api/uploads/x.png`) là **tương đối** với gateway, không bắt đầu bằng `/`.')
p('- **Service**: `cms-api` (nội dung CMS + nội dung tĩnh của website), `auth-api` (mock IdS), `qlns-api` (nhân sự), `qlkhcn-api` (khoa học công nghệ), `edusoft-api` (đào tạo), `esb-api` (tích hợp hệ thống ngoài, vd. thư viện). Không có `portal-api`: web và mobile gọi thẳng các service qua API gateway.')
p('- **Tên endpoint**: chữ thường, ngăn cách bằng `-`, có version: `/api/v1/{nhóm}/{tài-nguyên}` (vd. `/api/v1/public/category-post`). Nhóm: `public` (không cần đăng nhập) · `me` (người dùng đã đăng nhập, dữ liệu của chính họ) · `admin` (quản trị, cần quyền). Gateway/backend có thể áp chính sách xác thực theo tiền tố nhóm.')
p('- **JSON camelCase**, thời gian ISO-8601 có múi giờ (`2025-05-15T08:00:00+07:00`), ngày `yyyy-MM-dd`. Giao diện tự định dạng hiển thị (dd/MM/yyyy…), API **không** trả chuỗi đã format.')
p('- **Phân trang** (mọi danh sách): query `pageIndex` (≥1), `pageSize`, `keyword`; response `{ items, pageIndex, pageSize, totalItems, totalPages }`.')
p('- **Envelope**: FE chấp nhận cả response thô (như mock) lẫn envelope của backend — cms-api `{ "success": true, "message": "...", "data": ... }`, qlns/qlkhcn `{ "code": 200, "message": "...", "data": ... }`. FE tự bóc `data`; `success:false` hoặc `code` ngoài 2xx được coi là lỗi. Danh sách có thể là **mảng thuần** hoặc đối tượng phân trang — FE chuẩn hóa (`asPage`). Các ví dụ dưới đây là dạng đã bóc `data`.')
p('- **Xác thực**: `Authorization: Bearer <accessToken>`. 401 chưa đăng nhập / hết hạn · 403 thiếu quyền · 404 · 409 trùng · 422 sai dữ liệu `{ message, errors? }`.')
p('- **Id** là số nguyên (int64). Bài viết **xóa mềm**. `contentBody` là **chuỗi HTML** do trình soạn thảo WYSIWYG của CMS tạo (p, h2–h4, ul/ol, blockquote, a, img, table…; **backend nên làm sạch HTML khi lưu**, website cũng làm sạch khi hiển thị), hoặc — với dữ liệu cũ — chuỗi JSON mảng khối (`"Đoạn văn"` | `{type:"h2"|"quote"|"img"|"list", ...}`).')
p('- **Tenant**: mọi request gửi header `X-Tenant: <tenant>` (vd. `humg`, `cntt`). Thiếu header → backend suy ra từ host, cuối cùng là tenant mặc định. API quản trị: user phải có ít nhất một grant trong tenant đó (trừ `cms.*`), sai → 403 — phạm vi tenant là tầng 3, do CMS tự phân, không lấy từ SSO. Hộp thư `/api/v1/me/announcements` nhận `X-Tenant: *` = mọi tenant của user. Thiết kế: `docs/design/CMS_DESIGN.md` §2.')
p('- **Workflow**: `status` là chuỗi `draft | pending_review | published | archived` (mã số cũ 0..3 vẫn nhận khi ghi). Bài công khai = `published` và `publishAt <= now` và (`expireAt` trống hoặc > now). Đổi trạng thái chỉ qua `POST …/workflow/{action}`.')
p('- **Concurrency**: bản ghi có `version`; gửi `version` trong body hoặc header `If-Match: "<version>"` khi sửa → 409 `{ message, currentVersion }` nếu đã có người khác sửa.')
p('- **Quyền** (2 tầng trên SSO + tầng 3 trong app): tầng 1 realm role `student lecturer staff manager parent applicant alumni`; tầng 2 client role có tiền tố theo app (`cms.viewer cms.author cms.reviewer cms.editor cms.admin`, `euni.*`, `edusoft.*`, `qlns.*`, `qlkhcn.*`) — bảng `GET /api/v1/admin/directory/roles`; tầng 3 phân quyền mức tenant/chuyên mục/đơn vị/bản ghi `/api/v1/admin/grants` do CMS tự quản lý. Mỗi bản ghi trả `allowedActions[]` để UI chỉ hiện nút hợp lệ; backend vẫn kiểm tra lại.')
p('- Không có endpoint quản lý user/role trong CMS — user và role (tầng 1, 2) quản lý trên SSO; CMS chỉ đọc danh bạ.')
p('- **Đồng bộ CMS → website**: website **không cache** dữ liệu CMS (fetch `no-store`). Khi admin ghi (POST/PUT/DELETE) thì lần đọc `/api/v1/public/*` kế tiếp phải thấy thay đổi.\n')

p('## 2. auth-api\n')
p('> **Identity Server**: người dùng thật đăng nhập qua IdS (OIDC + PKCE) bằng **tài khoản trường** hoặc **Microsoft 365** (IdS federate, cùng một `sub`). FE gửi `Authorization: Bearer <access_token của IdS>` (aud = cms-api); backend xác thực JWT bằng JWKS của IdS. Claim cần có: `sub, name, email`, realm role + client role (Keycloak: `realm_access.roles`, `resource_access.{client}.roles`; IdS: `role[]`), `unit[]`, `staff_code, student_code`. Không cần claim tenant (tầng 3 do app tự phân) (xem docs/design/CMS_DESIGN.md §3). `auth-api` bên dưới **chỉ là mock của IdS** khi phát triển.\n')
p('| Method | Path | Mô tả |\n|---|---|---|')
p('| POST | `/api/v1/auth/login` | `{ username, password }` → `{ accessToken, user }`. Mock cho phép `{ role: "student|lecturer|staff|manager|parent" }` để vào cổng demo. |')
p('| GET | `/api/v1/auth/me` | → `{ user }` |\n| POST | `/api/v1/auth/refresh` | → `{ accessToken, user }` |\n| POST | `/api/v1/auth/logout` | 204 |\n')
p('`user`: `{ sub, username, name, email, role, roles[], permissions[], tenants[], units[], staffCode, studentCode, portal }`. `roles` là role trên SSO (realm role + client role, vd. `lecturer`, `cms.editor`, `edusoft.academic-advisor`); `role` là vai trò chính để FE điều hướng; `tenants` chỉ là membership (trang user thuộc về, cho hộp thư thông báo), không phải quyền quản trị. `permissions` = quyền chức năng suy ra từ roles (wildcard `cms.*`).\n')
p('```json\n' + short({ ...loginRes, accessToken: '<jwt>' }) + '\n```\n')

p('## 3. cms-api — các endpoint\n')
p('Quyền: *public* = không cần đăng nhập; còn lại cần Bearer + quyền ghi trong cột.\n')
p('| Method | Path | Quyền | Mô tả |\n|---|---|---|---|')
for (const [m, path, perm, desc] of CMS) p(`| ${m} | \`${path}\` | ${perm} | ${desc} |`)
p('\n### Ví dụ response\n')
const ex = [['publicContent', 'GET /api/v1/public/site-content'], ['menu', 'GET /api/v1/public/menus/header (3 mục đầu)'], ['banners', 'GET /api/v1/public/banners'], ['cmsPage', 'GET /api/v1/public/pages/slug/{slug}'], ['publicHome', 'GET /api/v1/public/home'], ['contentDetail', 'GET /api/v1/public/contents/slug/{slug}'], ['context', 'GET /api/v1/me/context'], ['content', 'GET /api/v1/admin/contents/{id} (quản trị)'], ['revisions', 'GET /api/v1/admin/contents/{id}/revisions'], ['history', 'GET /api/v1/admin/contents/{id}/history'], ['announcement', 'GET /api/v1/admin/announcements/{id}'], ['inbox', 'GET /api/v1/me/announcements'], ['grant', 'Grant'], ['directory', 'GET /api/v1/admin/directory/users'], ['orgUnits', 'GET /api/v1/admin/org-units'], ['media', 'Media'], ['banner', 'Banner'], ['event', 'Event'], ['log', 'AuditLog'], ['dashboard', 'GET /api/v1/admin/dashboard']]
for (const [k, title] of ex) {
  const big = JSON.stringify(samples[k]).length > 6000
  p(`#### ${title}\n`, '```json\n', big ? short(Object.fromEntries(Object.entries(samples[k]).map(([a, b]) => [a, Array.isArray(b) ? b.slice(0, 1) : b])), 1) : short(samples[k]), '\n```\n')
}

p('## 4. Dataset theo module (qlns / qlkhcn / edusoft / esb / cms)\n')
p('Mỗi **module giao diện** có một dataset: `GET /{service}/api/v1/{nhóm}/datasets/{module}` (nhóm `me` cho dữ liệu cá nhân của portal `portal-*`, còn lại `public`) → object gồm các khóa dưới đây; mỗi khóa cũng có endpoint riêng `GET /{service}/api/v1/{nhóm}/{module}/{khoa-kebab-case}` (mảng → phân trang). Nội dung/kiểu dữ liệu từng khóa lấy theo đúng mock trong `mock-data/{module}.json` (cấu trúc đó **là hợp đồng**).\n')
p('Hai endpoint tương ứng với Swagger gateway demo (đưa về quy ước nhóm): `GET /qlkhcn-api/api/v1/public/research-topic-categories` và `GET /qlns-api/api/v1/public/employees` (`pageIndex,pageSize,keyword[,isCurrentOnly]`).\n')
const bySvc = {}
for (const [m, svc] of Object.entries(MODULE_SERVICE)) (bySvc[svc] ||= []).push(m)
for (const [svc, mods] of Object.entries(bySvc)) {
  p(`### ${svc}\n`)
  for (const m of mods) {
    p(`**\`${m}\`** — \`GET /${svc}/api/v1/${groupOf(m)}/datasets/${m}\`\n`)
    p('| Khóa | Kiểu | Endpoint riêng | Ví dụ trường |\n|---|---|---|---|')
    for (const [k, v] of Object.entries(datasets[m])) {
      const type = Array.isArray(v) ? `mảng[${v.length}]` : typeof v === 'object' ? 'object' : typeof v
      const fields = Array.isArray(v) ? (v[0] && typeof v[0] === 'object' ? Object.keys(v[0]).slice(0, 6).join(', ') : typeof v[0]) : v && typeof v === 'object' ? Object.keys(v).slice(0, 6).join(', ') : ''
      p(`| \`${k}\` | ${type} | \`/api/v1/${groupOf(m)}/${m}/${kebab(k)}\` | ${fields} |`)
    }
    p('')
  }
}
p('\n> Các khóa `*Nav`, `*QuickLinks`, `forms`, `staffToolList`, `studentNavGroups`, `libraryGuide`… là **cấu hình giao diện tĩnh** (đã nằm trong code FE `src/config/static`); backend có thể bỏ qua hoặc cung cấp tùy ý, FE không phụ thuộc vào chúng khi gọi API.\n')
p('## 5. Cơ sở dữ liệu CMS tham khảo\n')
p('**`database/v2/schema.sql`** — schema đích cho backend .NET (PostgreSQL 16): multi-tenant + Row-Level Security, workflow, revisions, audit (partition), access_grants, announcements/targets/receipts, tìm kiếm `unaccent` + `pg_trgm`. Kiểm thử: `database/v2/test.sql`. Thư mục `database/` gốc (`schema.sql`, `seed.sql`) là bản v1 — chỉ để tham khảo lịch sử.\n')
writeFileSync(join(out, 'API_CONTRACT.md'), md.join('\n'))
console.log('✔ contract/openapi.json,', Object.keys(paths).length, 'paths · contract/API_CONTRACT.md,', md.join('\n').length, 'ký tự')
