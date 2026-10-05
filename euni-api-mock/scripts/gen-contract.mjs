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
const loginRes = await j('/auth-api/api/auth/login', null, 'POST', { username: 'tvanminh', password: 'Humg@2025' })
const T = loginRes.accessToken
const SV = (await j('/auth-api/api/auth/login', null, 'POST', { role: 'student' })).accessToken

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
  ['GET', '/api/Public/content', 'public', 'Toàn bộ nội dung công khai cho website: danh mục, bài viết đã xuất bản (kèm contentBody và translations.en — chỉ bản dịch ĐÃ HOÀN TẤT, thiếu thì website dùng tiếng Việt), sự kiện, album, video, podcast, trang tĩnh cho tìm kiếm. ?lang=vi|en (thiếu bản dịch → tự quay về vi).', [['lang', 'string', 'vi | en']], 'publicContent'],
  ['GET', '/api/Public/home', 'public', 'Dữ liệu trang chủ: heroSlides, quickLinks, audiences, strengths, partners, heroStats, universityStats, heroChips, featuredNews, newsList (3 bài), upcomingEvents (5), mediaTabs.', [['lang', 'string', 'vi | en']], 'publicHome'],
  ['GET', '/api/Public/menus/{code}', 'public', 'Menu hiển thị theo nhóm: header | footer | utility.', [], 'menu'],
  ['GET', '/api/Public/banners', 'public', 'Banner đang hiệu lực (đúng khoảng ngày, isVisible) theo vị trí.', [['position', 'string', 'home_slider | home_popup | sidebar_right | footer']], 'banners'],
  ['GET', '/api/Public/settings', 'public', 'Cấu hình công khai (general, seo, language).', [], 'settings'],
  ['GET', '/api/Public/search', 'public', 'Tìm kiếm toàn site (bài viết, sự kiện, media, trang).', [['q', 'string', 'Từ khóa'], ...PAGED.slice(0, 2)], 'search'],
  ['GET', '/api/Contents/view/list', 'public', 'Danh sách bài viết đã xuất bản (không có contentBody), phân trang.', [['categoryId', 'integer', ''], ['lang', 'string', 'vi | en'], ...PAGED], 'contentList'],
  ['GET', '/api/Contents/slug/{slug}', 'public', 'Chi tiết bài viết đã xuất bản theo slug.', [['lang', 'string', 'vi | en']], 'contentDetail'],
  ['GET', '/api/Contents/function/{id}', 'public', 'Ghi nhận +1 lượt xem cho bài viết.', [], null],
  ['GET', '/api/Categories', 'public', 'Danh mục (cây qua parentId).', PAGED, 'categories'],
  ['GET', '/api/Languages', 'public', 'Ngôn ngữ hỗ trợ.', [], null],
  ['GET', '/api/Media/{id}/url', 'public', 'URL tải file media.', [], null],

  ['GET', '/api/Public/tenant', 'public', 'Tenant đang phục vụ (theo X-Tenant / host).', [], null],

  ['GET', '/api/Me/context', 'đăng nhập', 'Ngữ cảnh người dùng: tenants được quản trị, permissions (từ role trong token), đơn vị (kèm đơn vị cha), can.{news|announcement}.{view|edit|review|publish}.', [], 'context'],
  ['GET', '/api/Contents', 'news.view + ACL', 'Quản trị: danh sách bài viết user được xem (lọc theo grant). Mỗi dòng có allowedActions[], isScheduled, pendingRevision, version.', [['status', 'string', 'draft | pending_review | published | archived'], ['scheduled', 'boolean', 'chỉ bài hẹn giờ'], ['mine', 'boolean', 'chỉ bài tôi tạo'], ['categoryId', 'integer', ''], ['ownerUnitCode', 'string', ''], ['translation', 'string', 'done | in_progress | missing (bản EN)'], ...PAGED], 'content'],
  ['GET', '/api/Contents/trash', 'news.edit|publish + ACL', 'Thùng rác (bài đã xóa mềm).', PAGED, null],
  ['GET', '/api/Contents/{id}', 'news.view + ACL', 'Chi tiết bài viết (kèm bản dịch). Header ETag = version.', [], 'content'],
  ['POST', '/api/Contents', 'news.edit + ACL (phạm vi chuyên mục/đơn vị)', 'Tạo bản nháp. ownerUnitCode mặc định = đơn vị đầu tiên của user. Có thể gửi status=pending_review|published để chuyển trạng thái ngay (cần quyền tương ứng).', [], 'content'],
  ['PUT', '/api/Contents/{id}', 'news.edit + ACL', 'Sửa nội dung (status KHÔNG đổi qua PUT). Gửi version (hoặc If-Match) → 409 nếu đã có người sửa. Bài đang published mà user không có publish → 202, lưu thành bản sửa đổi chờ duyệt (pendingRevision).', [], 'content'],
  ['DELETE', '/api/Contents/{id}', 'allowedActions có delete', 'Xóa mềm (deletedAt, deletedBy).', [], null],
  ['POST', '/api/Contents/{id}/restore', 'allowedActions có restore', 'Khôi phục từ thùng rác.', [], null],
  ['DELETE', '/api/Contents/{id}/purge', 'cms.*', 'Xóa vĩnh viễn bài trong thùng rác.', [], null],
  ['POST', '/api/Contents/{id}/workflow/{action}', 'theo action', 'action: submit (edit) · reject (review, body.note bắt buộc) · approve (review) · publish (publish) · unpublish · archive (publish) · approve-revision / reject-revision (review). Body: { note?, publishAt?, version? }. publishAt tương lai = hẹn giờ.', [], 'content'],
  ['GET', '/api/Contents/{id}/revisions', 'news.view + ACL', 'Danh sách phiên bản (state current | superseded | proposed | rejected).', [], 'revisions'],
  ['GET', '/api/Contents/{id}/revisions/{version}', 'news.view + ACL', 'Một phiên bản: snapshot + changesFromCurrent.', [], null],
  ['POST', '/api/Contents/{id}/revisions/{version}/restore', 'news.edit/publish + ACL', 'Khôi phục nội dung phiên bản cũ → tạo phiên bản mới (không ghi đè lịch sử).', [], null],
  ['GET', '/api/Contents/{id}/history', 'news.view + ACL', 'Lịch sử workflow + audit của bản ghi.', [], 'history'],

  ['GET/POST/PUT/DELETE', '/api/Announcements …', 'announcement.* + ACL', 'Thông báo: cùng bộ endpoint vòng đời như /api/Contents (trash, restore, workflow, revisions, history). Body có targets[] = [{ audience?, unitCode?, userSub? | userKey? (mã CB/mã SV/email), isExclude? }], priority 0|1|2, category, requireAck, channels[], pinnedUntil, expireAt. archive kèm note = thu hồi (recallReason).', [['status', 'string', ''], ['category', 'string', ''], ['ownerUnitCode', 'string', ''], ...PAGED], 'announcement'],
  ['GET', '/api/Announcements/{id}/stats', 'announcement.view + ACL', 'Người nhận (ước tính từ danh bạ/Membership API), đã đọc, đã xác nhận.', [], null],
  ['GET', '/api/Announcements/meta/options', 'announcement.view', 'Danh mục audiences, categories, priorities, channels.', [], null],
  ['GET', '/api/Me/announcements', 'đăng nhập (mọi vai trò)', 'Hộp thư thông báo của tôi: so khớp targets với role (audience) + đơn vị (kèm đơn vị cha) + sub. Ghim → ưu tiên → mới nhất. X-Tenant: * = mọi tenant của user.', [['unread', 'boolean', ''], ['category', 'string', ''], ['lang', 'string', 'vi | en'], ...PAGED], 'inbox'],
  ['GET', '/api/Me/announcements/unread-count', 'đăng nhập', 'Số thông báo chưa đọc.', [], null],
  ['POST', '/api/Me/announcements/{id}/read · /api/Me/announcements/{id}/ack · /api/Me/announcements/read-all', 'đăng nhập', 'Đánh dấu đã đọc / xác nhận đã đọc (requireAck) / đọc tất cả.', [], null],

  ['GET/POST/PUT/DELETE', '/api/Grants', 'grant.manage', 'Phân quyền mức bản ghi: { principalType user|unit|role, principalId, resourceType *|news|announcement|page|media, scopeType tenant|category|unit|record, scopeId, permissions[view|edit|review|publish|manage], expiresAt?, note? }. Grant theo đơn vị áp dụng cả đơn vị con.', PAGED, 'grant'],
  ['GET', '/api/Grants/effective/{sub}', 'grant.manage', 'Quyền chức năng + các grant đang áp dụng cho một người.', [], null],
  ['GET', '/api/Directory/users', 'cms.access', 'Danh bạ (IdS) — tìm theo tên, email, mã CB, mã SV. Chỉ đọc; user/role quản lý ở Identity Server.', [['keyword', 'string', ''], ['role', 'string', '']], 'directory'],
  ['GET', '/api/Directory/roles', 'cms.access', 'Bảng role (IdS) → quyền chức năng CMS (cấu hình tĩnh).', [], null],
  ['GET', '/api/OrgUnits', 'cms.access', 'Cây đơn vị (bản sao QLNS/QLĐT): code, name, kind, parentCode, path, depth.', [], 'orgUnits'],

  ['POST', '/api/Categories · PUT/DELETE /api/Categories/{id}', 'category.manage', 'CRUD danh mục (theo tenant, xóa mềm, POST /{id}/restore).', [], 'category'],
  ['GET', '/api/Media', 'media.manage', 'Thư viện media của tenant.', [['kind', 'string', 'image | document | video | audio | other'], ['folder', 'string', ''], ...PAGED], 'media'],
  ['POST', '/api/Media/upload', 'media.manage', 'multipart/form-data: file, altText, caption, folder.', [], 'media'],
  ['DELETE', '/api/Media/{id}', 'media.manage', 'Xóa mềm media.', [], null],
  ['CRUD', '/api/Events · /api/Albums · /api/Videos · /api/Podcasts', 'site.manage', 'Sự kiện, album ảnh, video, podcast (theo tenant, xóa mềm + /{id}/restore, /trash).', PAGED, 'event'],
  ['CRUD', '/api/Pages · /api/MenuItems', 'page.manage / menu.manage', 'Trang tĩnh (cây) và mục menu.', PAGED, null],
  ['CRUD', '/api/Banners', 'site.manage', 'Banner/slider theo vị trí & khoảng ngày.', PAGED, 'banner'],
  ['CRUD', '/api/HeroSlides · /api/QuickLinks · /api/Audiences · /api/Strengths · /api/Partners · /api/SiteStats', 'site.manage', 'Các khối trang chủ.', PAGED, null],
  ['GET/PUT', '/api/Settings · /api/Settings/{group}', 'settings.manage', 'Cấu hình theo tenant, theo nhóm: general, seo, email, language, backup, home.', [], null],
  ['GET', '/api/AuditLogs', 'log.view', 'Audit log chỉ ghi thêm: actorSub, action, entityType, entityId, changes {field:[cũ,mới]}, ip. (/api/ActivityLogs = tên cũ.)', [['action', 'string', ''], ['actor', 'string', 'sub'], ['entityType', 'string', ''], ['entityId', 'string', ''], ['from', 'string', 'ISO'], ['to', 'string', 'ISO'], ...PAGED], 'log'],
  ['GET/POST', '/api/Backups', 'backup.manage', 'Lịch sử sao lưu / tạo sao lưu thủ công.', PAGED, null],
  ['DELETE', '/api/Backups/{id}', 'backup.manage', 'Xóa bản sao lưu.', [], null],
  ['GET', '/api/Backups/{id}/download', 'backup.manage', 'Tải tệp sao lưu (JSON).', [], null],
  ['POST', '/api/Backups/{id}/restore', 'backup.manage', 'Phục hồi dữ liệu CMS từ một bản sao lưu.', [], null],
  ['POST', '/api/Backups/restore', 'backup.manage', 'multipart/form-data: file — phục hồi từ tệp sao lưu tải lên.', [], null],
  ['POST', '/api/Settings/email/test', 'settings.manage', 'Gửi email thử: { to } → { ok, message }.', [], null],
  ['GET', '/api/Dashboard', 'cms.access', 'Số liệu tổng quan theo quyền của user, kèm awaitingReview[].', [], 'dashboard'],
]

/* ---------- mẫu response từ mock đang chạy ---------- */
const first = async (p, t = T) => { const r = await j(p, t); return r.items ? r.items[0] : r }
const samples = {
  publicContent: await j('/cms-api/api/Public/content'),
  publicHome: await j('/cms-api/api/Public/home'),
  menu: await j('/cms-api/api/Public/menus/header'),
  banners: await j('/cms-api/api/Public/banners'),
  settings: await j('/cms-api/api/Public/settings'),
  search: await j('/cms-api/api/Public/search?q=tuyen&pageSize=2'),
  contentList: await j('/cms-api/api/Contents/view/list?pageSize=2'),
  contentDetail: await j('/cms-api/api/Contents/slug/le-ky-niem-60-nam-thanh-lap'),
  categories: await j('/cms-api/api/Categories?pageSize=2'),
  content: await first('/cms-api/api/Contents?pageSize=1'),
  category: await first('/cms-api/api/Categories?pageSize=1'),
  media: await first('/cms-api/api/Media?pageSize=1'),
  context: await j('/cms-api/api/Me/context', T),
  revisions: await j('/cms-api/api/Contents/1/revisions', T),
  history: await j('/cms-api/api/Contents/1/history', T),
  announcement: await first('/cms-api/api/Announcements?pageSize=1'),
  inbox: await j('/cms-api/api/Me/announcements?pageSize=2', SV),
  grant: await first('/cms-api/api/Grants?pageSize=1'),
  directory: await j('/cms-api/api/Directory/users?keyword=nguyen&pageSize=2', T),
  orgUnits: (await j('/cms-api/api/OrgUnits', T)).slice(0, 3),
  event: await first('/cms-api/api/Events?pageSize=1'),
  banner: await first('/cms-api/api/Banners?pageSize=1'),
  log: await first('/cms-api/api/ActivityLogs?pageSize=1'),
  dashboard: await j('/cms-api/api/Dashboard', T),
}

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

add('/auth-api/api/auth/login', 'post', { tags: ['auth-api'], summary: 'Đăng nhập', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, password: { type: 'string' }, role: { type: 'string', description: 'Chỉ dùng cho "vào cổng demo": student|staff|parent|leader' } } } } } }, responses: ok({ type: 'object', properties: { accessToken: { type: 'string' }, user: { type: 'object', properties: { id: {}, username: {}, name: {}, role: { type: 'string' }, permissions: { type: 'array', items: { type: 'string' } }, portal: { type: 'string' } } } } }) })
add('/auth-api/api/auth/me', 'get', { tags: ['auth-api'], summary: 'Người dùng hiện tại', security: [{ bearer: [] }], responses: ok({ type: 'object' }) })
add('/auth-api/api/auth/refresh', 'post', { tags: ['auth-api'], summary: 'Cấp lại access token', security: [{ bearer: [] }], responses: ok({ type: 'object' }) })
add('/auth-api/api/auth/logout', 'post', { tags: ['auth-api'], summary: 'Đăng xuất', responses: { 204: { description: 'No content' } } })

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
const svcOf = (s) => s
for (const [module, data] of Object.entries(datasets)) {
  const service = MODULE_SERVICE[module]
  add(`/${service}/api/v1/datasets/${module}`, 'get', { tags: [service], summary: `Toàn bộ dataset "${module}"`, responses: ok(infer(data, 1)) })
  for (const [key, value] of Object.entries(data)) {
    add(`/${service}/api/v1/${module}/${kebab(key)}`, 'get', { tags: [service], summary: `${module}.${key}`, parameters: Array.isArray(value) ? pq(PAGED) : [], responses: ok(Array.isArray(value) ? { type: 'object', properties: { items: infer(value, 2), pageIndex: { type: 'integer' }, pageSize: { type: 'integer' }, totalItems: { type: 'integer' }, totalPages: { type: 'integer' } } } : infer(value, 2)) })
  }
}
add('/qlkhcn-api/api/v1/research-topic-categories', 'get', { tags: ['qlkhcn-api'], summary: 'Danh mục lĩnh vực đề tài (có trong Swagger gateway demo)', parameters: pq(PAGED), responses: ok({ type: 'object' }) })
add('/qlns-api/api/v1/employees', 'get', { tags: ['qlns-api'], summary: 'Cán bộ, giảng viên (có trong Swagger gateway demo)', parameters: [...pq(PAGED), { name: 'isCurrentOnly', in: 'query', schema: { type: 'boolean' } }], responses: ok({ type: 'object' }) })

writeFileSync(join(out, 'openapi.json'), JSON.stringify({
  openapi: '3.0.3',
  info: { title: 'HUMG eUni — API gateway (hợp đồng FE ↔ BE)', version: '1.0.0', description: 'Hợp đồng do FE định nghĩa để backend triển khai. Sinh từ euni-api-mock. Mọi service nằm dưới cùng gateway: {gateway}/{service}/...' },
  servers: [{ url: 'http://127.0.0.1:3000', description: 'mock' }, { url: 'https://api-gateway-demo.humg.edu.vn', description: 'demo' }],
  components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  paths,
}, null, 1))

/* ================= Markdown ================= */
const md = []
const p = (...x) => md.push(x.join(''))
p('# HUMG eUni — Hợp đồng API (FE ↔ BE)\n')
p('> **Tài liệu do FE định nghĩa để backend triển khai.** Sinh tự động từ `euni-api-mock` (`npm run contract`), đi kèm `openapi.json`. FE chạy được ngay với mock; khi backend làm đúng hợp đồng này chỉ cần đổi `NEXT_PUBLIC_API_GATEWAY_URL`.\n')
p('## 1. Quy ước chung\n')
p('- **Gateway**: `{gateway}/{service}/...` — mock `http://127.0.0.1:3000`, demo `https://api-gateway-demo.humg.edu.vn`.')
p('- **Service**: `cms-api` (nội dung CMS), `auth-api`, `qlns-api` (nhân sự), `qlkhcn-api` (khoa học công nghệ), `qldt-api` (đào tạo), `portal-api` (cổng dịch vụ chung).')
p('- **JSON camelCase**, thời gian ISO-8601 có múi giờ (`2025-05-15T08:00:00+07:00`), ngày `yyyy-MM-dd`. Giao diện tự định dạng hiển thị (dd/MM/yyyy…), API **không** trả chuỗi đã format.')
p('- **Phân trang** (mọi danh sách): query `pageIndex` (≥1), `pageSize`, `keyword`; response `{ items, pageIndex, pageSize, totalItems, totalPages }`.')
p('- **Envelope**: FE chấp nhận cả response thô (như mock) lẫn envelope của backend — cms-api `{ "success": true, "message": "...", "data": ... }`, qlns/qlkhcn `{ "code": 200, "message": "...", "data": ... }`. FE tự bóc `data`; `success:false` hoặc `code` ngoài 2xx được coi là lỗi. Danh sách có thể là **mảng thuần** hoặc đối tượng phân trang — FE chuẩn hóa (`asPage`). Các ví dụ dưới đây là dạng đã bóc `data`.')
p('- **Xác thực**: `Authorization: Bearer <accessToken>`. 401 chưa đăng nhập / hết hạn · 403 thiếu quyền · 404 · 409 trùng · 422 sai dữ liệu `{ message, errors? }`.')
p('- **Id** là số nguyên (int64). Bài viết **xóa mềm**. `contentBody` là **chuỗi HTML** do trình soạn thảo WYSIWYG của CMS tạo (p, h2–h4, ul/ol, blockquote, a, img, table…; **backend nên làm sạch HTML khi lưu**, website cũng làm sạch khi hiển thị), hoặc — với dữ liệu cũ — chuỗi JSON mảng khối (`"Đoạn văn"` | `{type:"h2"|"quote"|"img"|"list", ...}`).')
p('- **Tenant**: mọi request gửi header `X-Tenant: <tenant>` (vd. `humg`, `cntt`). Thiếu header → backend suy ra từ host, cuối cùng là tenant mặc định. API quản trị: tenant phải có trong claim `tenants` của token (trừ `cms.*`), sai → 403. Hộp thư `/api/Me/announcements` nhận `X-Tenant: *` = mọi tenant của user. Thiết kế: `docs/design/CMS_DESIGN.md` §2.')
p('- **Workflow**: `status` là chuỗi `draft | pending_review | published | archived` (mã số cũ 0..3 vẫn nhận khi ghi). Bài công khai = `published` và `publishAt <= now` và (`expireAt` trống hoặc > now). Đổi trạng thái chỉ qua `POST …/workflow/{action}`.')
p('- **Concurrency**: bản ghi có `version`; gửi `version` trong body hoặc header `If-Match: "<version>"` khi sửa → 409 `{ message, currentVersion }` nếu đã có người khác sửa.')
p('- **Quyền**: quyền chức năng lấy từ role trong token (bảng `GET /api/Directory/roles`), cộng phân quyền mức bản ghi `/api/Grants`. Mỗi bản ghi trả `allowedActions[]` để UI chỉ hiện nút hợp lệ; backend vẫn kiểm tra lại.')
p('- Tên endpoint nhóm CMS theo mẫu Swagger gateway demo (`/api/Categories`, `/api/Contents`, `/api/Media`); phần mở rộng cùng phong cách. `/api/Users`, `/api/Roles` **đã bỏ** — user/role quản lý ở Identity Server.')
p('- **Đồng bộ CMS → website**: website **không cache** dữ liệu CMS (fetch `no-store`). Khi admin ghi (POST/PUT/DELETE) thì lần đọc `/api/Public/*` kế tiếp phải thấy thay đổi.\n')

p('## 2. auth-api\n')
p('> **Identity Server**: người dùng thật đăng nhập qua IdS (OIDC + PKCE) bằng **tài khoản trường** hoặc **Microsoft 365** (IdS federate, cùng một `sub`). FE gửi `Authorization: Bearer <access_token của IdS>` (aud = cms-api); backend xác thực JWT bằng JWKS của IdS. Claim cần có: `sub, name, email, role[], tenant[], unit[], staff_code, student_code` (xem docs/design/CMS_DESIGN.md §3). `auth-api` bên dưới **chỉ là mock của IdS** khi phát triển.\n')
p('| Method | Path | Mô tả |\n|---|---|---|')
p('| POST | `/api/auth/login` | `{ username, password }` → `{ accessToken, user }`. Mock cho phép `{ role: "student|staff|parent|leader" }` để vào cổng demo. |')
p('| GET | `/api/auth/me` | → `{ user }` |\n| POST | `/api/auth/refresh` | → `{ accessToken, user }` |\n| POST | `/api/auth/logout` | 204 |\n')
p('`user`: `{ sub, username, name, email, role, roles[], permissions[], tenants[], units[], staffCode, studentCode, portal }`. `roles` là role trên IdS (`cms.admin` `cms.editor` `cms.reviewer` `cms.author` `student` `staff` `parent` `leader`); `role` là vai trò chính để FE điều hướng. `permissions` = quyền chức năng suy ra từ roles (wildcard `cms.*`).\n')
p('```json\n' + short({ ...loginRes, accessToken: '<jwt>' }) + '\n```\n')

p('## 3. cms-api — các endpoint\n')
p('Quyền: *public* = không cần đăng nhập; còn lại cần Bearer + quyền ghi trong cột.\n')
p('| Method | Path | Quyền | Mô tả |\n|---|---|---|---|')
for (const [m, path, perm, desc] of CMS) p(`| ${m} | \`${path}\` | ${perm} | ${desc} |`)
p('\n### Ví dụ response\n')
const ex = [['publicContent', 'GET /api/Public/content'], ['publicHome', 'GET /api/Public/home'], ['contentDetail', 'GET /api/Contents/slug/{slug}'], ['context', 'GET /api/Me/context'], ['content', 'GET /api/Contents/{id} (quản trị)'], ['revisions', 'GET /api/Contents/{id}/revisions'], ['history', 'GET /api/Contents/{id}/history'], ['announcement', 'GET /api/Announcements/{id}'], ['inbox', 'GET /api/Me/announcements'], ['grant', 'Grant'], ['directory', 'GET /api/Directory/users'], ['orgUnits', 'GET /api/OrgUnits'], ['media', 'Media'], ['banner', 'Banner'], ['event', 'Event'], ['log', 'AuditLog'], ['dashboard', 'GET /api/Dashboard']]
for (const [k, title] of ex) {
  const big = JSON.stringify(samples[k]).length > 6000
  p(`#### ${title}\n`, '```json\n', big ? short(Object.fromEntries(Object.entries(samples[k]).map(([a, b]) => [a, Array.isArray(b) ? b.slice(0, 1) : b])), 1) : short(samples[k]), '\n```\n')
}

p('## 4. Các service ngoài (qlns / qlkhcn / qldt / portal)\n')
p('Mỗi **module giao diện** có một dataset: `GET /{service}/api/v1/datasets/{module}` → object gồm các khóa dưới đây; mỗi khóa cũng có endpoint riêng `GET /{service}/api/v1/{module}/{khoa-kebab-case}` (mảng → phân trang). Nội dung/kiểu dữ liệu từng khóa lấy theo đúng mock trong `mock-data/{module}.json` (cấu trúc đó **là hợp đồng**).\n')
p('Hai endpoint đã có thật ở gateway demo: `GET /qlkhcn-api/api/v1/research-topic-categories` và `GET /qlns-api/api/v1/employees` (`pageIndex,pageSize,keyword[,isCurrentOnly]`).\n')
const bySvc = {}
for (const [m, svc] of Object.entries(MODULE_SERVICE)) (bySvc[svc] ||= []).push(m)
for (const [svc, mods] of Object.entries(bySvc)) {
  p(`### ${svc}\n`)
  for (const m of mods) {
    p(`**\`${m}\`** — \`GET /${svc}/api/v1/datasets/${m}\`\n`)
    p('| Khóa | Kiểu | Endpoint riêng | Ví dụ trường |\n|---|---|---|---|')
    for (const [k, v] of Object.entries(datasets[m])) {
      const type = Array.isArray(v) ? `mảng[${v.length}]` : typeof v === 'object' ? 'object' : typeof v
      const fields = Array.isArray(v) ? (v[0] && typeof v[0] === 'object' ? Object.keys(v[0]).slice(0, 6).join(', ') : typeof v[0]) : v && typeof v === 'object' ? Object.keys(v).slice(0, 6).join(', ') : ''
      p(`| \`${k}\` | ${type} | \`/api/v1/${m}/${kebab(k)}\` | ${fields} |`)
    }
    p('')
  }
}
p('\n> Các khóa `*Nav`, `*QuickLinks`, `forms`, `staffToolList`, `studentNavGroups`, `libraryGuide`… là **cấu hình giao diện tĩnh** (đã nằm trong code FE `src/config/static`); backend có thể bỏ qua hoặc cung cấp tùy ý, FE không phụ thuộc vào chúng khi gọi API.\n')
p('## 5. Cơ sở dữ liệu CMS tham khảo\n')
p('**`database/v2/schema.sql`** — schema đích cho backend .NET (PostgreSQL 16): multi-tenant + Row-Level Security, workflow, revisions, audit (partition), access_grants, announcements/targets/receipts, tìm kiếm `unaccent` + `pg_trgm`. Kiểm thử: `database/v2/test.sql`. Thư mục `database/` gốc (`schema.sql`, `seed.sql`) là bản v1 — chỉ để tham khảo lịch sử.\n')
writeFileSync(join(out, 'API_CONTRACT.md'), md.join('\n'))
console.log('✔ contract/openapi.json,', Object.keys(paths).length, 'paths · contract/API_CONTRACT.md,', md.join('\n').length, 'ký tự')
