// Kiểm thử hành vi mock theo thiết kế (docs/design/CMS_DESIGN.md): tenant, workflow, ACL mức bản ghi, revision,
// bản sửa đổi chờ duyệt, concurrency, thùng rác, audit, announcements + hộp thư.
//   npm test        (tự chạy server tạm ở cổng 3999 với kho dữ liệu riêng, không đụng data/store.json)
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.SMOKE_PORT || 3999)
const API = `http://127.0.0.1:${PORT}`
const dir = mkdtempSync(join(tmpdir(), 'euni-smoke-'))
const server = spawn(process.execPath, ['src/server.js'], { cwd: root, env: { ...process.env, PORT: String(PORT), STORE_FILE: join(dir, 'store.json'), API_LOG: 'false' }, stdio: ['ignore', 'pipe', 'inherit'] })
await new Promise((ok, fail) => { server.stdout.on('data', (d) => String(d).includes('mock gateway') && ok()); server.on('exit', () => fail(new Error('server exited'))) })

let passed = 0
const failures = []
const check = (name, cond, extra) => { if (cond) passed++; else failures.push(`✗ ${name}${extra !== undefined ? ` — ${JSON.stringify(extra).slice(0, 300)}` : ''}`) }

async function call(method, path, { token, tenant = 'humg', body, headers } = {}) {
  const res = await fetch(API + path, {
    method, headers: { 'Content-Type': 'application/json', 'X-Tenant': tenant, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(headers || {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let data = text; try { data = text ? JSON.parse(text) : null } catch { /* text */ }
  return { status: res.status, data }
}
const login = async (username, password = 'Humg@2025') => (await call('POST', '/auth-api/api/v1/auth/login', { body: { username, password } })).data.accessToken
const demo = async (role) => (await call('POST', '/auth-api/api/v1/auth/login', { body: { role } })).data.accessToken
const C = '/cms-api/api'
const publicTitles = async (tenant = 'humg') => (await call('GET', `${C}/v1/public/site-content`, { tenant })).data.articles.map((a) => a.title)

try {
  await call('POST', `${C}/v1/dev/reset`)
  const [admin, editor, author, pvloc, dvtung, reviewer] = await Promise.all(['tvanminh', 'nthoa', 'ltmai', 'pvloc', 'dvtung', 'vthuong'].map((u) => login(u)))

  /* ---------- đăng nhập / ngữ cảnh / tenant ---------- */
  check('sai mật khẩu tài khoản CMS → 401', (await call('POST', '/auth-api/api/v1/auth/login', { body: { username: 'nthoa', password: 'x' } })).status === 401)
  const ctx = await call('GET', `${C}/v1/me/context`, { token: pvloc })
  check('Me/context liệt kê tenant được quản trị', ctx.data.tenants.map((t) => t.id).join() === 'humg,cntt', ctx.data)
  check('editor humg vào tenant cntt → 403', (await call('GET', `${C}/v1/admin/contents`, { token: editor, tenant: 'cntt' })).status === 403)
  check('tenant không tồn tại → 400', (await call('GET', `${C}/v1/public/home`, { tenant: 'khong-co' })).status === 400)
  const cnttTitles = await publicTitles('cntt')
  check('website tenant cntt chỉ có bài của cntt', cnttTitles.length === 2 && !cnttTitles.some((t) => (/* bài humg */ t.includes('Trắc địa'))), cnttTitles)
  check('Users/Roles đã bỏ (quản lý ở IdS)', (await call('GET', `${C}/v1/admin/users`, { token: admin })).status === 404)

  /* ---------- workflow: tác giả soạn → gửi duyệt → biên tập duyệt ---------- */
  const created = await call('POST', `${C}/v1/admin/contents`, { token: author, body: { title: 'Bài thử nghiệm workflow', categoryId: 1, excerpt: 'Tóm tắt', contentBody: '<p>v1</p>' } })
  const id = created.data.id
  check('tác giả tạo bản nháp', created.status === 201 && created.data.status === 'draft' && created.data.ownerUnitCode === 'P-TT', created.data)
  check('tác giả: allowedActions có submit, không có publish', created.data.allowedActions.includes('submit') && !created.data.allowedActions.includes('publish'), created.data.allowedActions)
  check('tác giả không tự xuất bản được', (await call('POST', `${C}/v1/admin/contents/${id}/workflow/publish`, { token: author })).status === 403)
  check('gửi duyệt', (await call('POST', `${C}/v1/admin/contents/${id}/workflow/submit`, { token: author })).data.status === 'pending_review')
  check('tác giả không duyệt được', (await call('POST', `${C}/v1/admin/contents/${id}/workflow/approve`, { token: author })).status === 403)
  check('trả lại bắt buộc có lý do', (await call('POST', `${C}/v1/admin/contents/${id}/workflow/reject`, { token: editor, body: {} })).status === 422)
  const rej = await call('POST', `${C}/v1/admin/contents/${id}/workflow/reject`, { token: editor, body: { note: 'Bổ sung ảnh' } })
  check('trả lại → draft + reviewNote', rej.data.status === 'draft' && rej.data.reviewNote === 'Bổ sung ảnh', rej.data)
  await call('POST', `${C}/v1/admin/contents/${id}/workflow/submit`, { token: author })
  const future = new Date(Date.now() + 86400000).toISOString()
  const appr = await call('POST', `${C}/v1/admin/contents/${id}/workflow/approve`, { token: editor, body: { publishAt: future } })
  check('duyệt với giờ hẹn → published + isScheduled', appr.data.status === 'published' && appr.data.isScheduled === true, appr.data)
  check('bài hẹn giờ chưa lên website', !(await publicTitles()).includes('Bài thử nghiệm workflow'))
  await call('POST', `${C}/v1/admin/contents/${id}/workflow/unpublish`, { token: editor })
  await call('POST', `${C}/v1/admin/contents/${id}/workflow/publish`, { token: editor, body: { publishAt: new Date(Date.now() - 1000).toISOString() } })
  check('xuất bản ngay → lên website', (await publicTitles()).includes('Bài thử nghiệm workflow'))

  /* ---------- sửa bài đang xuất bản: bản sửa đổi chờ duyệt ---------- */
  const cur = (await call('GET', `${C}/v1/admin/contents/${id}`, { token: author })).data
  const prop = await call('PUT', `${C}/v1/admin/contents/${id}`, { token: author, body: { title: 'Bài thử nghiệm (đã sửa)', version: cur.version } })
  // ltmai thuộc P-TT có grant edit trên đơn vị P-TT nhưng không có publish → thành bản đề xuất
  check('tác giả sửa bài đã đăng → 202 bản sửa đổi chờ duyệt', prop.status === 202 && prop.data.pendingRevision, prop.data)
  check('website vẫn hiển thị nội dung cũ', (await publicTitles()).includes('Bài thử nghiệm workflow'))
  check('không gửi được bản đề xuất thứ hai', (await call('PUT', `${C}/v1/admin/contents/${id}`, { token: author, body: { title: 'x' } })).status === 409)
  const ar = await call('POST', `${C}/v1/admin/contents/${id}/workflow/approve-revision`, { token: editor })
  check('duyệt bản sửa đổi → nội dung mới lên website', ar.data.title === 'Bài thử nghiệm (đã sửa)' && (await publicTitles()).includes('Bài thử nghiệm (đã sửa)'), ar.data)

  /* ---------- concurrency + revision ---------- */
  const v = (await call('GET', `${C}/v1/admin/contents/${id}`, { token: editor })).data.version
  const ok1 = await call('PUT', `${C}/v1/admin/contents/${id}`, { token: editor, body: { excerpt: 'Sửa lần A', version: v } })
  const stale = await call('PUT', `${C}/v1/admin/contents/${id}`, { token: editor, body: { excerpt: 'Sửa lần B', version: v } })
  check('lưu với version đúng → 200, version tăng', ok1.status === 200 && ok1.data.version === v + 1, ok1.data)
  check('lưu với version cũ → 409', stale.status === 409 && stale.data.currentVersion === v + 1, stale.data)
  check('If-Match cũ → 409', (await call('PUT', `${C}/v1/admin/contents/${id}`, { token: editor, headers: { 'If-Match': `"${v}"` }, body: { excerpt: 'C' } })).status === 409)
  const revs = (await call('GET', `${C}/v1/admin/contents/${id}/revisions`, { token: editor })).data
  check('có lịch sử phiên bản', revs.length >= 3 && revs[0].state === 'current', revs.map((r) => [r.version, r.state]))
  const r1 = await call('POST', `${C}/v1/admin/contents/${id}/revisions/1/restore`, { token: editor })
  check('khôi phục v1 → tạo phiên bản mới với nội dung v1', r1.data.title === 'Bài thử nghiệm workflow' && r1.data.version > v + 1, r1.data)
  const hist = (await call('GET', `${C}/v1/admin/contents/${id}/history`, { token: editor })).data
  check('lịch sử workflow ghi đủ', ['create', 'submit', 'reject', 'approve', 'unpublish', 'publish', 'approve-revision'].every((a) => hist.workflow.some((h) => h.action === a)), hist.workflow.map((h) => h.action))
  check('audit có diff trường', hist.audit.some((a) => a.action === 'news.update' && a.changes?.excerpt), hist.audit.slice(0, 3))

  /* ---------- soft delete ---------- */
  check('tác giả không xóa được bài đã đăng', (await call('DELETE', `${C}/v1/admin/contents/${id}`, { token: author })).status === 403)
  check('biên tập xóa mềm', (await call('DELETE', `${C}/v1/admin/contents/${id}`, { token: editor })).status === 204)
  check('bài đã xóa rời website', !(await publicTitles()).some((t) => t.startsWith('Bài thử nghiệm')))
  check('nằm trong thùng rác', (await call('GET', `${C}/v1/admin/contents/trash`, { token: editor })).data.items.some((x) => x.id === id))
  check('khôi phục từ thùng rác', (await call('POST', `${C}/v1/admin/contents/${id}/restore`, { token: editor })).status === 200 && (await publicTitles()).includes('Bài thử nghiệm workflow'))
  const tmp = (await call('POST', `${C}/v1/admin/contents`, { token: editor, body: { title: 'Bài nháp sẽ xóa vĩnh viễn', categoryId: 1 } })).data
  await call('DELETE', `${C}/v1/admin/contents/${tmp.id}`, { token: editor })
  check('biên tập không xóa vĩnh viễn được (403)', (await call('DELETE', `${C}/v1/admin/contents/${tmp.id}/purge`, { token: editor })).status === 403)
  check('quản trị xóa vĩnh viễn bài trong thùng rác', (await call('DELETE', `${C}/v1/admin/contents/${tmp.id}/purge`, { token: admin })).status === 204
    && !(await call('GET', `${C}/v1/admin/contents/trash`, { token: admin })).data.items.some((x) => x.id === tmp.id))
  check('không xóa vĩnh viễn bài chưa vào thùng rác (404)', (await call('DELETE', `${C}/v1/admin/contents/${id}/purge`, { token: admin })).status === 404)

  /* ---------- ACL mức bản ghi ---------- */
  const pvList = (await call('GET', `${C}/v1/admin/contents?pageSize=500`, { token: pvloc })).data.items
  check('pvloc (grant đơn vị CNTT) chỉ thấy bài thuộc CNTT', pvList.length > 0 && pvList.every((c) => ['CNTT', 'BM-KHMT', 'BM-CNPM'].includes(c.ownerUnitCode)), pvList.map((c) => c.ownerUnitCode))
  check('pvloc không mở được bài của P-TT', (await call('GET', `${C}/v1/admin/contents/${id}`, { token: pvloc })).status === 403)
  const research = (await call('GET', `${C}/v1/public/categories`, { tenant: 'humg' })).data.items.find((c) => c.name === 'Nghiên cứu')
  check('dvtung tạo bài ở chuyên mục được cấp', (await call('POST', `${C}/v1/admin/contents`, { token: dvtung, body: { title: 'Bài NC của CTV', categoryId: research.id, ownerUnitCode: 'BM-KHMT' } })).status === 201)
  check('dvtung tạo bài ngoài chuyên mục được cấp → 403', (await call('POST', `${C}/v1/admin/contents`, { token: dvtung, body: { title: 'Bài tin tức', categoryId: 1, ownerUnitCode: 'BM-KHMT' } })).status === 403)
  const g = await call('POST', `${C}/v1/admin/grants`, { token: admin, body: { principalType: 'user', principalId: 'u-pvloc', resourceType: 'news', scopeType: 'record', scopeId: id, permissions: ['edit'] } })
  check('admin cấp quyền mức bản ghi', g.status === 201 && g.data.scopeLabel === `Bản ghi #${id}`, g.data)
  check('pvloc mở được bài sau khi được cấp', (await call('GET', `${C}/v1/admin/contents/${id}`, { token: pvloc })).status === 200)
  check('editor không quản lý được grants', (await call('GET', `${C}/v1/admin/grants`, { token: editor })).status === 403)
  const eff = (await call('GET', `${C}/v1/admin/grants/effective/u-pvloc`, { token: admin })).data
  check('quyền hiệu lực liệt kê grant', eff.grants.some((x) => x.scopeType === 'record'), eff.grants.length)
  check('POST status số (v1) vẫn được chấp nhận', (await call('POST', `${C}/v1/admin/contents`, { token: editor, body: { title: 'Bài v1 compat', categoryId: 1, status: 2 } })).data.status === 'published')

  /* ---------- announcements ---------- */
  const sv = await demo('student'); const gv = await demo('lecturer')
  const svInbox = (await call('GET', `${C}/v1/me/announcements`, { token: sv })).data
  const svTitles = svInbox.items.map((a) => a.title)
  check('SV thấy thông báo toàn SV + lớp + cá nhân', ['Lịch thi học kỳ 2 năm học 2024–2025', 'Lớp DCCTKT66A: đổi phòng học môn Cơ sở dữ liệu', 'Xác nhận hướng dẫn đồ án tốt nghiệp'].every((t) => svTitles.includes(t)), svTitles)
  check('SV không thấy thông báo cho GV', !svTitles.includes('Họp giao ban Khoa CNTT tháng 6'))
  check('thông báo hẹn giờ / chờ duyệt chưa hiện', !svTitles.some((t) => t.includes('hẹn giờ') || t.includes('chờ duyệt')))
  check('thông báo ghim lên đầu', svInbox.items[0].pinned === true, svInbox.items[0])
  check('SV tenant humg không thấy thông báo tenant cntt', !svTitles.some((t) => t.includes('NCKH')))
  const allT = (await call('GET', `${C}/v1/me/announcements`, { token: sv, tenant: '*' })).data.items.map((a) => a.title)
  check('X-Tenant:* gom mọi tenant của user', allT.some((t) => t.includes('NCKH')), allT)
  const sv5 = await login('2151000301', 'x')
  check('loại trừ lớp DCKTM66 khỏi khảo sát', !(await call('GET', `${C}/v1/me/announcements`, { token: sv5 })).data.items.some((a) => a.title.startsWith('Khảo sát')))
  const gvTitles = (await call('GET', `${C}/v1/me/announcements`, { token: gv })).data.items.map((a) => a.title)
  check('GV BM-KHMT thấy họp giao ban Khoa CNTT (đơn vị cha)', gvTitles.includes('Họp giao ban Khoa CNTT tháng 6'), gvTitles)
  const before = svInbox.unreadCount
  const first = svInbox.items[0]
  const acked = await call('POST', `${C}/v1/me/announcements/${first.id}/ack`, { token: sv })
  check('xác nhận đã đọc', acked.data.ackedAt && acked.data.readAt, acked.data)
  check('số chưa đọc giảm', (await call('GET', `${C}/v1/me/announcements/unread-count`, { token: sv })).data.unread === before - 1)
  check('không đọc được thông báo không gửi cho mình', (await call('POST', `${C}/v1/me/announcements/3/read`, { token: sv })).status === 404)
  const enInbox = (await call('GET', `${C}/v1/me/announcements?lang=en`, { token: sv })).data.items
  check('bản EN đã dịch được trả về khi lang=en', enInbox.some((a) => a.language === 'en' && a.title.startsWith('Semester 2')), enInbox.map((a) => a.language))

  // cán bộ P-DT soạn (grant unit P-DT edit) → người duyệt P-DT duyệt → SV nhận
  const pdt = await login('bmduc', 'x').catch(() => null)
  void pdt
  const annList = (await call('GET', `${C}/v1/admin/announcements`, { token: reviewer })).data.items
  const pending = annList.find((a) => a.status === 'pending_review')
  check('người duyệt P-DT thấy thông báo chờ duyệt', !!pending && pending.allowedActions.includes('approve'), annList.map((a) => [a.title, a.allowedActions]))
  check('người duyệt không sửa được', !pending.allowedActions.includes('edit'))
  await call('POST', `${C}/v1/admin/announcements/${pending.id}/workflow/approve`, { token: reviewer })
  check('sau khi duyệt, SV nhận được', (await call('GET', `${C}/v1/me/announcements`, { token: sv })).data.items.some((a) => a.id === pending.id))

  const na = await call('POST', `${C}/v1/admin/announcements`, { token: pvloc, body: { title: 'Thông báo cho cá nhân', ownerUnitCode: 'CNTT', bodyHtml: '<p>Hi</p>', targets: [{ userKey: '2151000124' }, { audience: 'lecturer', unitCode: 'BM-CNPM' }] } })
  check('tạo thông báo nhắm theo mã SV (đổi ra sub)', na.status === 201 && na.data.targets[0].userSub === 'SV002', na.data)
  check('mã không tồn tại → 422', (await call('POST', `${C}/v1/admin/announcements`, { token: pvloc, body: { title: 'x', ownerUnitCode: 'CNTT', targets: [{ userKey: 'khong-co' }] } })).status === 422)
  check('không có đối tượng → không gửi duyệt được', (await call('POST', `${C}/v1/admin/announcements/${(await call('POST', `${C}/v1/admin/announcements`, { token: pvloc, body: { title: 'rỗng', ownerUnitCode: 'CNTT' } })).data.id}/workflow/submit`, { token: pvloc })).status === 422)
  await call('POST', `${C}/v1/admin/announcements/${na.data.id}/workflow/publish`, { token: pvloc })
  const st = (await call('GET', `${C}/v1/admin/announcements/${na.data.id}/stats`, { token: pvloc })).data
  check('thống kê người nhận (SV002 + GV BM-CNPM)', st.recipients === 2 && st.people.some((p) => p.sub === 'SV002') && st.people.some((p) => p.sub === 'GV002'), st)
  const recall = await call('POST', `${C}/v1/admin/announcements/${na.data.id}/workflow/archive`, { token: pvloc, body: { note: 'Gửi nhầm' } })
  check('thu hồi = archived + lý do', recall.data.status === 'archived' && recall.data.recallReason === 'Gửi nhầm', recall.data)
  check('pvloc không sửa được thông báo của P-DT', (await call('PUT', `${C}/v1/admin/announcements/${pending.id}`, { token: pvloc, body: { title: 'x' } })).status === 403)

  /* ---------- audit ---------- */
  const audit = (await call('GET', `${C}/v1/admin/audit-logs?entityType=grant`, { token: admin })).data.items
  check('audit ghi cấp quyền', audit.some((a) => a.action === 'grant.create'), audit)
  const dash = (await call('GET', `${C}/v1/admin/dashboard`, { token: reviewer })).data
  check('dashboard liệt kê việc chờ duyệt theo quyền', Array.isArray(dash.awaitingReview), dash.awaitingReview)

  /* ---------- quy ước endpoint · gateway · service ---------- */
  check('chạy sau gateway: /euni-mock-api/cms-api/... trả như không có tiền tố', (await call('GET', `/euni-mock-api${C}/v1/public/settings`)).status === 200)
  check('chạy sau gateway: auth-api có tiền tố', !!(await call('POST', '/euni-mock-api/auth-api/api/v1/auth/login', { body: { role: 'student' } })).data.accessToken)
  check('endpoint kiểu cũ không còn (/api/Public/home → 404)', (await call('GET', `${C}/Public/home`)).status === 404)
  check('/admin/ bắt buộc đăng nhập', (await call('GET', `${C}/v1/admin/contents`)).status === 401)
  const media = (await call('GET', `${C}/v1/admin/media?pageSize=5`, { token: admin })).data.items
  check('URL media là đường dẫn tương đối (không bắt đầu bằng /)', media.length > 0 && media.every((m) => !m.url || !m.url.startsWith('/')), media.map((m) => m.url))
  check('edusoft-api phục vụ dataset đào tạo', (await call('GET', '/edusoft-api/api/v1/public/datasets/education')).status === 200)
  check('qldt-api, portal-api đã bỏ', (await call('GET', '/qldt-api/api/v1/public/datasets/education')).status === 404 && (await call('GET', '/portal-api/api/v1/public/datasets/life')).status === 404)
  check('esb-api: thư viện · cms-api: đời sống', (await call('GET', '/esb-api/api/v1/public/datasets/library')).status === 200 && (await call('GET', `${C}/v1/public/datasets/life`)).status === 200)
  check('dữ liệu portal ở nhóm /me/', (await call('GET', '/edusoft-api/api/v1/me/datasets/portal-student')).status === 200 && (await call('GET', '/edusoft-api/api/v1/public/datasets/portal-student')).status === 404)

  /* ---------- role 2 tầng trên SSO · tầng 3 do CMS tự phân ---------- */
  const who = async (role) => (await call('POST', '/auth-api/api/v1/auth/login', { body: { role } })).data.user
  const [gvU, cbU, ldU, legacy] = await Promise.all(['lecturer', 'staff', 'manager', 'leader'].map(who))
  check('realm role lecturer → cổng giảng viên', gvU.roles.includes('lecturer') && gvU.portal === '/euni/giang-vien', gvU)
  check('realm role staff (cán bộ) → cổng giảng viên/cán bộ', cbU.roles.includes('staff') && cbU.portal === '/euni/giang-vien', cbU)
  check('realm role manager → cổng lãnh đạo; tên cũ leader vẫn đăng nhập demo được', ldU.portal === '/euni/lanh-dao' && legacy.sub === ldU.sub, ldU)
  const roleList = (await call('GET', `${C}/v1/admin/directory/roles`, { token: admin })).data
  check('danh mục role gồm realm + client role có tiền tố', ['student', 'lecturer', 'staff', 'manager', 'parent', 'applicant', 'alumni'].every((r) => roleList.some((x) => x.code === r && x.kind === 'realm'))
    && roleList.filter((x) => x.kind === 'client').every((x) => /^(cms|euni|edusoft|qlns|qlkhcn)\./.test(x.code)), roleList)
  const canbo = await demo('staff')
  check('cán bộ không có role cms.* → không vào CMS', (await call('GET', `${C}/v1/admin/contents`, { token: canbo })).status === 403)
  const dvCtx = (await call('GET', `${C}/v1/me/context`, { token: dvtung })).data
  check('tenant được quản trị suy ra từ grants (dvtung: humg theo chuyên mục, cntt theo đơn vị BM-KHMT)', dvCtx.tenants.map((t) => t.id).join() === 'humg,cntt', dvCtx.tenants)
  const tmpGrant = (await call('POST', `${C}/v1/admin/grants`, { token: admin, tenant: 'cntt', body: { principalType: 'user', principalId: 'u-nthoa', scopeType: 'tenant', permissions: ['view'] } })).data
  check('cấp grant ở cntt → nthoa vào được cntt (không cần sửa SSO)', (await call('GET', `${C}/v1/admin/contents`, { token: editor, tenant: 'cntt' })).status === 200)
  await call('DELETE', `${C}/v1/admin/grants/${tmpGrant.id}`, { token: admin, tenant: 'cntt' })
  check('thu hồi grant → nthoa hết vào cntt', (await call('GET', `${C}/v1/admin/contents`, { token: editor, tenant: 'cntt' })).status === 403)
} catch (e) {
  failures.push(`✗ lỗi không mong đợi: ${e.stack}`)
} finally {
  server.kill()
  rmSync(dir, { recursive: true, force: true })
}

console.log(`\n${passed} kiểm tra đạt, ${failures.length} lỗi`)
failures.forEach((f) => console.log(f))
process.exit(failures.length ? 1 : 0)
