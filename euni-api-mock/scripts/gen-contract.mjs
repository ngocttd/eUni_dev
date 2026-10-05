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

  ['GET', '/api/Contents', 'post.view', 'Quản trị: danh sách bài viết mọi trạng thái.', [['status', 'integer', '0 nháp · 1 chờ duyệt · 2 xuất bản · 3 lưu trữ'], ['categoryId', 'integer', ''], ['translation', 'string', 'done | in_progress | missing (bản EN)'], ...PAGED], 'content'],
  ['GET', '/api/Contents/{id}', 'post.view', 'Chi tiết bài viết (kèm bản dịch).', [], 'content'],
  ['POST', '/api/Contents', 'post.create (+post.publish nếu status=2)', 'Tạo bài viết. Bắt buộc title; slug tự sinh nếu thiếu.', [], 'content'],
  ['PUT', '/api/Contents/{id}', 'post.update', 'Cập nhật (merge các trường gửi lên). Đổi status sang 2 cần post.publish.', [], 'content'],
  ['DELETE', '/api/Contents/{id}', 'post.update', 'Xóa mềm (deleteAt).', [], null],
  ['POST', '/api/Categories · PUT/DELETE /api/Categories/{id}', 'category.manage', 'CRUD danh mục.', [], 'category'],
  ['GET', '/api/Media', 'media.manage', 'Thư viện media.', [['kind', 'string', 'image | document | video | audio | other'], ['folder', 'string', ''], ...PAGED], 'media'],
  ['POST', '/api/Media/upload', 'media.manage', 'multipart/form-data: file, uploadedBy, altText, caption, folder.', [], 'media'],
  ['DELETE', '/api/Media/{id}', 'media.manage', 'Xóa media.', [], null],
  ['GET', '/api/Users', 'user.manage', 'Người dùng CMS.', [['roleCode', 'string', ''], ['status', 'integer', '1 hoạt động · 0 khóa'], ...PAGED], 'user'],
  ['POST', '/api/Users · PUT/DELETE /api/Users/{id}', 'user.manage', 'CRUD người dùng (không trả passwordHash). DELETE: 409 nếu xóa chính tài khoản đang đăng nhập.', [], 'user'],
  ['GET', '/api/Roles · POST · PUT /api/Roles/{id}', 'user.manage', 'Vai trò + danh sách permission; POST nhận copyFrom (mã vai trò) để sao chép quyền.', [], 'role'],
  ['DELETE', '/api/Roles/{id}', 'user.manage', 'Xóa vai trò không phải hệ thống và chưa gán cho người dùng (409 nếu vi phạm).', [], null],
  ['GET/PUT', '/api/Roles/permission-matrix', 'user.manage', 'Ma trận quyền (module × vai trò) { roles:[mã], rows:[{module, perms:[bool]}] }. PUT phải đồng bộ quyền thật của từng vai trò (Super Admin luôn toàn quyền). Lưu ý: route này phải đặt trước /api/Roles/{id}.', [], null],
  ['CRUD', '/api/Events · /api/Albums · /api/Videos · /api/Podcasts', 'post.update', 'Sự kiện, album ảnh, video, podcast hiển thị ở website.', PAGED, 'event'],
  ['CRUD', '/api/Pages · /api/MenuItems', 'page.manage / menu.manage', 'Trang tĩnh (cây) và mục menu.', PAGED, null],
  ['CRUD', '/api/Banners', 'post.update', 'Banner/slider theo vị trí & khoảng ngày.', PAGED, 'banner'],
  ['CRUD', '/api/HeroSlides · /api/QuickLinks · /api/Audiences · /api/Strengths · /api/Partners · /api/SiteStats', 'post.update', 'Các khối trang chủ.', PAGED, null],
  ['GET/PUT', '/api/Settings · /api/Settings/{group}', 'settings.manage', 'Cấu hình hệ thống theo nhóm: general, seo, email, language, backup, home.', [], null],
  ['GET', '/api/ActivityLogs', 'log.view', 'Nhật ký hoạt động.', [['action', 'string', ''], ['userId', 'integer', ''], ...PAGED], 'log'],
  ['GET/POST', '/api/Backups', 'backup.manage', 'Lịch sử sao lưu / tạo sao lưu thủ công.', PAGED, null],
  ['DELETE', '/api/Backups/{id}', 'backup.manage', 'Xóa bản sao lưu.', [], null],
  ['GET', '/api/Backups/{id}/download', 'backup.manage', 'Tải tệp sao lưu (JSON). 404 nếu bản sao lưu không còn dữ liệu. Danh sách Backups trả thêm hasData.', [], null],
  ['POST', '/api/Backups/{id}/restore', 'backup.manage', 'Phục hồi dữ liệu CMS từ một bản sao lưu (ghi đè dữ liệu hiện tại).', [], null],
  ['POST', '/api/Backups/restore', 'backup.manage', 'multipart/form-data: file — phục hồi từ tệp sao lưu tải lên (422 nếu sai định dạng).', [], null],
  ['POST', '/api/Settings/email/test', 'settings.manage', 'Gửi email thử bằng cấu hình SMTP hiện tại: { to } → { ok, message }.', [], null],
  ['GET', '/api/Dashboard', 'cms.access', 'Số liệu trang tổng quan CMS.', [], 'dashboard'],
]

/* ---------- mẫu response từ mock đang chạy ---------- */
const first = async (p) => { const r = await j(p, T); return r.items ? r.items[0] : r }
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
  user: await first('/cms-api/api/Users?pageSize=1'),
  role: (await j('/cms-api/api/Roles', T))[0],
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
p('- Tên endpoint nhóm CMS theo mẫu Swagger gateway demo (`/api/Categories`, `/api/Contents`, `/api/Media`, `/api/Users`); phần mở rộng cùng phong cách.')
p('- **Đồng bộ CMS → website**: website **không cache** dữ liệu CMS (fetch `no-store`). Khi admin ghi (POST/PUT/DELETE) thì lần đọc `/api/Public/*` kế tiếp phải thấy thay đổi.\n')

p('## 2. auth-api\n')
p('> **SSO**: người dùng thật đăng nhập qua Keycloak (`https://sso-demo.humg.edu.vn/realms/humg-euni`, liên kết Microsoft 365). FE gửi `Authorization: Bearer <access_token của Keycloak>`; gateway/backend cần xác thực JWT bằng JWKS của realm và ánh xạ role → quyền. `auth-api` bên dưới là cho mock/dev và tài khoản nội bộ.\n')
p('| Method | Path | Mô tả |\n|---|---|---|')
p('| POST | `/api/auth/login` | `{ username, password }` → `{ accessToken, user }`. Mock cho phép `{ role: "student|staff|parent|leader" }` để vào cổng demo. |')
p('| GET | `/api/auth/me` | → `{ user }` |\n| POST | `/api/auth/refresh` | → `{ accessToken, user }` |\n| POST | `/api/auth/logout` | 204 |\n')
p('`user`: `{ id, username, name, role, permissions[], portal }`. `role`: `student` `staff` `parent` `leader` `cms-admin` `cms-editor`. `permissions` hỗ trợ wildcard (`cms.*`). Người dùng CMS cần quyền `cms.access`.\n')
p('```json\n' + short({ ...loginRes, accessToken: '<jwt>' }) + '\n```\n')

p('## 3. cms-api — các endpoint\n')
p('Quyền: *public* = không cần đăng nhập; còn lại cần Bearer + quyền ghi trong cột.\n')
p('| Method | Path | Quyền | Mô tả |\n|---|---|---|---|')
for (const [m, path, perm, desc] of CMS) p(`| ${m} | \`${path}\` | ${perm} | ${desc} |`)
p('\n### Ví dụ response\n')
const ex = [['publicContent', 'GET /api/Public/content'], ['publicHome', 'GET /api/Public/home'], ['contentDetail', 'GET /api/Contents/slug/{slug}'], ['content', 'GET /api/Contents/{id} (quản trị)'], ['media', 'Media'], ['user', 'User'], ['role', 'Role'], ['banner', 'Banner'], ['event', 'Event'], ['log', 'ActivityLog'], ['dashboard', 'GET /api/Dashboard']]
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
p('Thư mục `database/` có `schema.sql` (PostgreSQL, schema `cms`, 44 bảng) và `seed.sql` — mô hình dữ liệu gợi ý cho cms-api (bài viết đa ngôn ngữ, danh mục cây, media, trang/menu, banner, khối trang chủ, nhật ký, sao lưu…).\n')
writeFileSync(join(out, 'API_CONTRACT.md'), md.join('\n'))
console.log('✔ contract/openapi.json,', Object.keys(paths).length, 'paths · contract/API_CONTRACT.md,', md.join('\n').length, 'ký tự')
