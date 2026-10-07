// Đối chiếu phản hồi giữa mock Node (euni-api-mock) và bản .NET trên cùng một dữ liệu mẫu mới nạp.
//   node tools/parity.mjs                tự khởi động hai server (cổng 3996/3997): Node dùng file tạm, .NET dùng PostgreSQL (PARITY_DB, mặc định euni_parity)
//   NODE_URL=… DOTNET_URL=… node tools/parity.mjs   so sánh hai server đang chạy (cần cùng trạng thái dữ liệu: POST /cms-api/api/v1/dev/reset)
// So sánh theo ngữ nghĩa JSON: null ≡ vắng mặt; thời điểm ISO lệch < 2 phút coi là bằng (dữ liệu mẫu tính theo "hôm nay").
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = mkdtempSync(join(tmpdir(), 'euni-parity-'))
const procs = []
const start = (cmd, args, cwd, port, tag) => new Promise((ok, fail) => {
  const db = process.env.PARITY_DB || 'euni_parity'
  const pg = (u, pw) => `Host=127.0.0.1;Port=5432;Database=${db};Username=${u};Password=${pw}`
  const p = spawn(cmd, args, { cwd, env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', STORE_FILE: join(dir, `${tag}.json`), UPLOAD_DIR: join(dir, `up-${tag}`), API_LOG: 'false', DATABASE_URL: pg('cms_app', 'cms_app_dev'), DATABASE_ADMIN_URL: pg('cms_admin', 'cms_admin_dev') }, stdio: ['ignore', 'pipe', 'inherit'] })
  procs.push(p); p.stdout.on('data', (d) => /gateway/.test(String(d)) && ok()); p.on('exit', () => fail(new Error(`${tag} exited`)))
})
let NODE = process.env.NODE_URL, NET = process.env.DOTNET_URL
if (!NODE) { await start(process.execPath, ['src/server.js'], join(root, '..', 'euni-api-mock'), 3997, 'node'); NODE = 'http://127.0.0.1:3997' }
if (!NET) { await start('dotnet', [join(root, 'src/HUMG.CMS.Api/bin/Debug/net8.0/HUMG.CMS.Api.dll')], root, 3996, 'net'); NET = 'http://127.0.0.1:3996' }

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
const diffs = []
let currentUrl = ''
// Bảng dùng chung nhiều collection (home_blocks, media_items) cấp id từ một dãy số nên id khác mock Node (mỗi collection một dãy)
const SHARED_ID = /hero-slides|quick-links|audiences|strengths|partners|site-stats|\/albums|\/videos|\/podcasts|\/public\/home|site-content|\/dashboard/
function same(a, b, path) {
  // lược đồ quan hệ có thêm cột thời gian tạo/sửa (NOT NULL) và translations rỗng mà mock không ghi
  if (a == null && b != null && /\.(createdAt|updatedAt)$/.test(path) && typeof b === 'string') return
  if (a == null && b != null && typeof b === 'object' && !Array.isArray(b) && !Object.keys(b).length && /\.translations$/.test(path)) return
  if (SHARED_ID.test(currentUrl) && /\.id$/.test(path) && typeof a === 'number' && typeof b === 'number') return
  if (a == null && b == null) return
  if (a == null || b == null) { if ((a ?? b) === '' || (Array.isArray(a ?? b) && !(a ?? b).length)) return; return diffs.push(`${path}: ${JSON.stringify(a)?.slice(0, 80)} ≠ ${JSON.stringify(b)?.slice(0, 80)}`) }
  if (typeof a === 'string' && typeof b === 'string' && ISO.test(a) && ISO.test(b)) { if (Math.abs(Date.parse(a) - Date.parse(b)) < 120000) return }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return diffs.push(`${path}: kiểu mảng khác`)
    if (a.length !== b.length) diffs.push(`${path}: độ dài ${a.length} ≠ ${b.length}`)
    for (let i = 0; i < Math.min(a.length, b.length); i++) same(a[i], b[i], `${path}[${i}]`)
    return
  }
  if (typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (!['accessToken', 'filePath', 'sizeBytes'].includes(k)) same(a[k], b[k], `${path}.${k}`)
    return
  }
  if (a !== b) diffs.push(`${path}: ${JSON.stringify(a)?.slice(0, 80)} ≠ ${JSON.stringify(b)?.slice(0, 80)}`)
}

async function call(base, method, path, { token, tenant = 'humg', body } = {}) {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'X-Tenant': tenant, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text(); let data = text; try { data = text ? JSON.parse(text) : null } catch { /* text */ }
  return { status: res.status, data, etag: res.headers.get('etag') }
}
const login = async (base, body) => (await call(base, 'POST', '/auth-api/api/v1/auth/login', { body })).data?.accessToken
const tokens = {}
for (const [name, body] of Object.entries({ admin: { username: 'tvanminh', password: 'Humg@2025' }, editor: { username: 'nthoa', password: 'Humg@2025' }, khoa: { username: 'pvloc', password: 'Humg@2025' },
  author: { username: 'ltmai', password: 'Humg@2025' }, reviewer: { username: 'vthuong', password: 'Humg@2025' }, ctv: { username: 'dvtung', password: 'Humg@2025' },
  sv: { role: 'student' }, gv: { role: 'lecturer' }, cb: { role: 'staff' }, ph: { role: 'parent' }, ld: { role: 'manager' } })) tokens[name] = { node: await login(NODE, body), net: await login(NET, body) }

// Khác biệt CHỦ Ý của bản .NET so với mock Node (không tính là lỗi):
//  1. mock Node làm rò trường `en` (nhãn tiếng Anh) vào bản ghi menu của Khoa CNTT do spread nhầm khi seed;
//  2. GET announcements/{id}/stats: Node không kiểm tra quyền bản ghi (lộ danh sách người nhận), .NET trả 403 khi không có quyền "view" trên thông báo đó.
const KNOWN = [(m, p, d) => /\/menus\/|\/admin\/menu-items/.test(p) && d.every((x) => /\.en: /.test(x)),
  (m, p, d) => /\/announcements\/\d+\/stats$/.test(p) && d.length === 1 && /status 200 ≠ 403/.test(d[0])]
let n = 0, bad = 0, known = 0
async function cmp(method, path, opts = {}) {
  const who = opts.as ? tokens[opts.as] : null
  const [a, b] = await Promise.all([call(NODE, method, path, { ...opts, token: who?.node }), call(NET, method, path, { ...opts, token: who?.net })])
  n++; diffs.length = 0; currentUrl = path
  if (a.status !== b.status) diffs.push(`status ${a.status} ≠ ${b.status}`)
  else same(a.data, b.data, '$')
  if (!(a.etag ?? '').startsWith('W/') && a.etag !== b.etag) diffs.push(`ETag ${a.etag} ≠ ${b.etag}`)
  if (diffs.length && KNOWN.some((k) => k(method, path, diffs))) { known++; diffs.length = 0 }
  if (diffs.length) { bad++; console.log(`✗ ${method} ${path} [${opts.as ?? 'anon'}${opts.tenant ? '/' + opts.tenant : ''}] — ${diffs.length} khác biệt`); diffs.slice(0, 6).forEach((d) => console.log('    ' + d)) }
  return a
}

const C = '/cms-api/api/v1'
try {
  await Promise.all([call(NODE, 'POST', `${C}/dev/reset`), call(NET, 'POST', `${C}/dev/reset`)])
  for (const tenant of ['humg', 'cntt']) {
    for (const p of ['site-content', 'site-content?lang=en', 'home', 'home?lang=en', 'menus/header', 'menus/footer', 'menus/utility', 'banners', 'banners?position=home_slider', 'settings', 'tenant', 'languages', 'categories',
      'contents', 'contents?pageSize=3&pageIndex=2', 'contents?keyword=hoi%20thao', 'contents?categoryId=1', 'search?q=dia%20chat', 'search?q=khoa', 'search?q=', 'pages/slug/chinh-sach-bao-mat', 'pages/slug/chinh-sach-bao-mat?lang=en',
      'pages/slug/gioi-thieu-khoa', 'pages/slug/khong-co', 'contents/slug/khong-co', 'media/1/url'])
      await cmp('GET', `${C}/public/${p}`, { tenant })
  }
  const arts = (await call(NODE, 'GET', `${C}/public/contents?pageSize=100`)).data.items
  for (const a of arts.slice(0, 4)) { await cmp('GET', `${C}/public/contents/slug/${a.slug}`); await cmp('GET', `${C}/public/contents/slug/${a.slug}?lang=en`) }
  await cmp('GET', `${C}/public/tenants/resolve?host=cntt.localhost:3002`); await cmp('GET', `${C}/public/tenants/resolve?host=x.y`)
  await cmp('GET', `${C}/public/site-content`, { tenant: 'khong-co' })
  // dataset các service ngoài
  const mods = { 'cms-api': ['cooperation', 'life', 'utilities'], 'qlns-api': ['about', 'staff-hub'], 'qlkhcn-api': ['research'], 'edusoft-api': ['admissions', 'education', 'student-hub'], 'esb-api': ['library'] }
  for (const [svc, ms] of Object.entries(mods)) for (const m of ms) await cmp('GET', `/${svc}/api/v1/public/datasets/${m}`)
  for (const [svc, m] of [['qlns-api', 'portal-staff'], ['qlns-api', 'portal-leader'], ['qlns-api', 'portal-staff-tools'], ['edusoft-api', 'portal-student'], ['edusoft-api', 'portal-parent']]) await cmp('GET', `/${svc}/api/v1/me/datasets/${m}`)
  await cmp('GET', '/qlns-api/api/v1/public/employees'); await cmp('GET', '/qlns-api/api/v1/public/employees?keyword=khoa&pageSize=5'); await cmp('GET', '/qlkhcn-api/api/v1/public/research-topic-categories')
  const about = (await call(NODE, 'GET', '/qlns-api/api/v1/public/datasets/about')).data
  for (const k of Object.keys(about).slice(0, 12)) await cmp('GET', `/qlns-api/api/v1/public/about/${k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}?pageSize=5`)
  await cmp('GET', '/qlns-api/api/v1/public/datasets/khong-co')
  await cmp('GET', '/cms-api/api/v1/me/datasets/cooperation')
  // auth
  for (const who of ['admin', 'sv', 'ld']) { await cmp('GET', '/auth-api/api/v1/auth/me', { as: who }); await cmp('POST', '/auth-api/api/v1/auth/refresh', { as: who }) }
  await cmp('GET', '/auth-api/api/v1/auth/me'); await cmp('POST', '/auth-api/api/v1/auth/login', { body: { username: 'canbo', password: 'x' } })
  await cmp('POST', '/auth-api/api/v1/auth/login', { body: { username: 'lanhdao-xyz' } }); await cmp('POST', '/auth-api/api/v1/auth/login', { body: {} }); await cmp('POST', '/auth-api/api/v1/auth/login', { body: { username: 'nthoa', password: 'sai' } })
  // quản trị
  for (const who of ['admin', 'editor', 'khoa', 'author', 'reviewer', 'ctv']) {
    await cmp('GET', `${C}/me/context`, { as: who })
    for (const p of ['contents', 'contents?status=draft', 'contents?mine=true', 'contents?keyword=hoi', 'contents/trash', 'announcements', 'announcements?status=published', 'announcements/trash', 'announcements/meta/options', 'dashboard', 'org-units']) await cmp('GET', `${C}/admin/${p}`, { as: who })
  }
  for (const who of ['admin', 'khoa']) for (const t of ['humg', 'cntt']) {
    for (const p of ['contents', 'announcements', 'dashboard', 'grants', 'audit-logs', 'activity-logs', 'tenants', 'settings', 'settings/general', 'settings/seo', 'settings/khong-co', 'media', 'backups', 'menu-groups', 'languages',
      'categories', 'events', 'albums', 'videos', 'podcasts', 'pages', 'menu-items', 'menu-items?groupCode=footer', 'banners', 'hero-slides', 'quick-links', 'audiences', 'strengths', 'partners', 'site-stats', 'categories/trash',
      'directory/users', 'directory/users?keyword=minh', 'directory/users?role=student', 'directory/roles', 'directory/users/u-nthoa', 'directory/users/khong-co', 'grants/effective/u-nthoa', 'grants/effective/u-pvloc']) await cmp('GET', `${C}/admin/${p}`, { as: who, tenant: t })
  }
  const contents = (await call(NODE, 'GET', `${C}/admin/contents?pageSize=100`, { token: tokens.admin.node })).data.items
  for (const c of contents.slice(0, 6)) for (const who of ['admin', 'editor', 'ctv']) for (const sub of ['', '/revisions', '/revisions/1', '/history']) await cmp('GET', `${C}/admin/contents/${c.id}${sub}`, { as: who })
  const anns = (await call(NODE, 'GET', `${C}/admin/announcements`, { token: tokens.admin.node })).data.items
  for (const a of anns) for (const who of ['admin', 'reviewer', 'cb']) for (const sub of ['', '/stats', '/revisions', '/history']) await cmp('GET', `${C}/admin/announcements/${a.id}${sub}`, { as: who })
  // hộp thư portal (mọi vai trò, mọi tenant)
  for (const who of ['sv', 'gv', 'cb', 'ph', 'ld', 'admin']) {
    for (const p of ['announcements', 'announcements?unread=true', 'announcements?category=exam', 'announcements?lang=en', 'announcements/unread-count', 'announcements/1', 'announcements/1?lang=en', 'announcements/999'])
      for (const t of ['humg', 'cntt', '*']) await cmp('GET', `${C}/me/${p}`, { as: who, tenant: t })
  }
  // 401/403/404
  await cmp('GET', `${C}/admin/contents`); await cmp('GET', `${C}/admin/contents`, { as: 'sv' }); await cmp('GET', `${C}/admin/contents`, { as: 'editor', tenant: 'cntt' }); await cmp('GET', `${C}/admin/grants`, { as: 'author' })
  await cmp('GET', `${C}/admin/contents/9999`, { as: 'admin' }); await cmp('GET', `${C}/admin/nope`, { as: 'admin' }); await cmp('GET', `${C}/admin/tenants`, { as: 'editor' }); await cmp('GET', '/khong-co')
  await cmp('GET', `${C}/admin/backups`, { as: 'editor' }); await cmp('GET', `${C}/admin/audit-logs?action=login`, { as: 'admin' }); await cmp('GET', `${C}/admin/audit-logs?keyword=minh&pageSize=3`, { as: 'admin' })
  // vài thao tác ghi giống nhau trên cả hai rồi so sánh kết quả (id, version, allowedActions, revision, lịch sử)
  const w = async (m, p, o) => cmp(m, p, o)
  const created = await w('POST', `${C}/admin/contents`, { as: 'editor', body: { title: 'Bài so sánh Node vs .NET', excerpt: 'x', contentBody: '<p>nội dung</p>', categoryId: 1, slug: 'bai-so-sanh-parity' } })
  const id = created.data.id
  await w('PUT', `${C}/admin/contents/${id}`, { as: 'editor', body: { title: 'Bài so sánh Node vs .NET (sửa)', version: 1 } })
  await w('PUT', `${C}/admin/contents/${id}`, { as: 'editor', body: { title: 'xung đột', version: 1 } })
  for (const act of ['submit', 'approve']) await w('POST', `${C}/admin/contents/${id}/workflow/${act}`, { as: 'editor', body: {} })
  await w('PUT', `${C}/admin/contents/${id}`, { as: 'ctv', body: { excerpt: 'đề xuất' } })
  await w('PUT', `${C}/admin/contents/${id}`, { as: 'author', body: { excerpt: 'đề xuất tác giả' } })
  await w('POST', `${C}/admin/contents/${id}/workflow/approve-revision`, { as: 'editor', body: {} })
  await w('POST', `${C}/admin/contents/${id}/workflow/khong-co`, { as: 'editor', body: {} })
  await w('GET', `${C}/admin/contents/${id}`, { as: 'editor' }); await w('GET', `${C}/admin/contents/${id}/revisions`, { as: 'editor' }); await w('GET', `${C}/admin/contents/${id}/history`, { as: 'editor' })
  await w('POST', `${C}/admin/contents/${id}/revisions/1/restore`, { as: 'editor' })
  await w('GET', `${C}/public/contents/slug/bai-so-sanh-parity`)
  await w('DELETE', `${C}/admin/contents/${id}`, { as: 'editor' }); await w('GET', `${C}/admin/contents/trash`, { as: 'editor' }); await w('POST', `${C}/admin/contents/${id}/restore`, { as: 'editor' })
  await w('POST', `${C}/admin/contents`, { as: 'editor', body: { title: '' } }); await w('POST', `${C}/admin/contents`, { as: 'editor', body: { title: 'a', categoryId: 99999 } })
  const ann = await w('POST', `${C}/admin/announcements`, { as: 'admin', body: { title: 'TB so sánh', bodyHtml: '<p>x</p>', ownerUnitCode: 'P-DT', category: 'exam', priority: 1, requireAck: true, targets: [{ audience: 'student' }, { userKey: 'GV0123' }, { unitCode: 'DCKTM66', isExclude: true }] } })
  await w('POST', `${C}/admin/announcements/${ann.data.id}/workflow/publish`, { as: 'admin', body: {} })
  await w('GET', `${C}/admin/announcements/${ann.data.id}/stats`, { as: 'admin' }); await w('GET', `${C}/me/announcements`, { as: 'sv' })
  await w('POST', `${C}/me/announcements/${ann.data.id}/ack`, { as: 'sv' }); await w('POST', `${C}/me/announcements/read-all`, { as: 'sv' }); await w('GET', `${C}/admin/announcements/${ann.data.id}/stats`, { as: 'admin' })
  await w('POST', `${C}/admin/announcements/${ann.data.id}/workflow/archive`, { as: 'admin', body: { note: 'thu hồi' } }); await w('GET', `${C}/admin/announcements/${ann.data.id}`, { as: 'admin' })
  await w('POST', `${C}/admin/announcements`, { as: 'admin', body: { title: 'x', targets: [{ audience: 'khong-co' }] } }); await w('POST', `${C}/admin/announcements`, { as: 'admin', body: { title: 'x', priority: 9 } })
  // grants, tenants, resources, settings
  const g = await w('POST', `${C}/admin/grants`, { as: 'admin', body: { principalType: 'user', principalId: 'u-ltmai', scopeType: 'category', scopeId: '2', permissions: ['edit'] } })
  await w('PUT', `${C}/admin/grants/${g.data.id}`, { as: 'admin', body: { permissions: ['view', 'edit'] } }); await w('DELETE', `${C}/admin/grants/${g.data.id}`, { as: 'admin' }); await w('GET', `${C}/admin/grants`, { as: 'admin' })
  await w('POST', `${C}/admin/grants`, { as: 'admin', body: { principalType: 'x' } }); await w('POST', `${C}/admin/grants`, { as: 'admin', body: { principalType: 'user', principalId: 'u-nope', scopeType: 'tenant', permissions: ['view'] } })
  await w('POST', `${C}/admin/tenants`, { as: 'admin', body: { id: 'dia-chat', name: 'Khoa Địa chất', rootUnit: 'MO', domains: ['diachat.localhost:3002'], ownerSub: 'u-ltmai' } })
  await w('POST', `${C}/admin/tenants`, { as: 'admin', body: { id: 'dia-chat', name: 'x' } }); await w('POST', `${C}/admin/tenants`, { as: 'admin', body: { id: 'X!', name: 'x' } })
  for (const p of ['menus/header', 'menus/footer', 'settings', 'site-content', 'home', 'pages/slug/gioi-thieu', 'banners', 'tenant']) await w('GET', `${C}/public/${p}`, { tenant: 'dia-chat' })
  await w('GET', `${C}/admin/tenants`, { as: 'admin' }); await w('PUT', `${C}/admin/tenants/dia-chat`, { as: 'admin', body: { isActive: false } }); await w('GET', `${C}/public/settings`, { tenant: 'dia-chat' })
  await w('PUT', `${C}/admin/tenants/humg`, { as: 'admin', body: { isActive: false } })
  const ev = await w('POST', `${C}/admin/events`, { as: 'admin', body: { title: 'Sự kiện so sánh', startsAt: '2026-12-01T08:00:00+07:00', place: 'A1' } })
  await w('PUT', `${C}/admin/events/${ev.data.id}`, { as: 'admin', body: { place: 'B2' } }); await w('GET', `${C}/public/site-content`); await w('DELETE', `${C}/admin/events/${ev.data.id}`, { as: 'admin' }); await w('GET', `${C}/admin/events/trash`, { as: 'admin' })
  await w('POST', `${C}/admin/events/${ev.data.id}/restore`, { as: 'admin' }); await w('GET', `${C}/admin/events/${ev.data.slug}`, { as: 'admin' })
  await w('PUT', `${C}/admin/settings/general`, { as: 'admin', body: { phone: '0123' } }); await w('GET', `${C}/public/settings`); await w('POST', `${C}/admin/settings/email/test`, { as: 'admin', body: { to: 'a@b.vn' } }); await w('POST', `${C}/admin/settings/email/test`, { as: 'admin', body: { to: 'sai' } })
  await w('GET', `${C}/admin/audit-logs?pageSize=12`, { as: 'admin' })
  const bk = await w('POST', `${C}/admin/backups`, { as: 'admin' }); await w('GET', `${C}/admin/backups`, { as: 'admin' }); await w('DELETE', `${C}/admin/backups/${bk.data.id}`, { as: 'admin' }); await w('GET', `${C}/admin/backups/999/download`, { as: 'admin' })
  // token chéo: token phát hành bởi bản này dùng được ở bản kia (cùng JWT_SECRET)
  const cross = await Promise.all([call(NODE, 'GET', `${C}/me/context`, { token: tokens.admin.net }), call(NET, 'GET', `${C}/me/context`, { token: tokens.admin.node })])
  n++; if (cross[0].status !== 200 || cross[1].status !== 200) { bad++; console.log(`✗ token chéo: node nhận token .NET → ${cross[0].status}, .NET nhận token node → ${cross[1].status}`) }
} finally {
  procs.forEach((p) => p.kill()); rmSync(dir, { recursive: true, force: true })
}
console.log(`\n${n} yêu cầu đối chiếu, ${bad} khác biệt không chủ ý, ${known} khác biệt chủ ý`)
process.exit(bad ? 1 : 0)
