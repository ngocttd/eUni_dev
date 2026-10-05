// E2E LƯU / XÓA trên các màn hình CMS còn lại (Bài viết + workflow, Danh mục, Media, Phân quyền nội dung,
// Trang & Menu, Cấu hình, Sao lưu) bằng trình duyệt thật.   node e2e-cms-write2.mjs   (CHROME=/đường/dẫn/chrome để dùng Chromium thay Edge)
import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'

const API = 'http://127.0.0.1:3000/cms-api/api'
const ADMIN = 'http://localhost:3001'
const PUBLIC = 'http://localhost:3002'
const stamp = Date.now().toString(36)
const post = async (u, b, t) => (await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: JSON.stringify(b) })).json()
const get = async (p, t) => { const r = await fetch(`${API}${p}`, { headers: t ? { Authorization: `Bearer ${t}` } : {} }); return { status: r.status, body: await r.json().catch(() => null) } }
const wf = (label) => page.locator('.cms-wfbar button', { hasText: label }).first()

await post(`${API}/_dev/reset`)
const login = (u) => post('http://127.0.0.1:3000/auth-api/api/auth/login', { username: u, password: 'Humg@2025' })
const admin = await login('tvanminh')
const T = admin.accessToken

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME, headless: true } : { channel: 'msedge', headless: true })
const ctx = await browser.newContext()
await ctx.addInitScript((s) => window.sessionStorage.setItem('humg-session', JSON.stringify(s)), { accessToken: T, user: admin.user })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const pub = async (path) => (await fetch(PUBLIC + path)).text()

let failed = 0
const step = async (name, fn) => { try { await fn(); console.log('✔', name) } catch (e) { failed++; console.log('✘', name, '\n   ', String(e.message).split('\n')[0]) } }
const open = async (path, ready = '.cms-form') => { await page.goto(ADMIN + path, { waitUntil: 'networkidle' }); await page.waitForSelector(ready) }
const field = (label) => page.locator('.cms-form label', { hasText: label }).locator('input, textarea, select').first()
const fill = async (label, v) => field(label).fill(v)
const status = () => page.waitForSelector('.cms-empty[role=status]', { timeout: 15000 })
const submit = async (btn = 'button[type=submit]') => { await page.locator(`.cms-form ${btn}`).first().click(); await status(); await page.waitForLoadState('networkidle') }
const accept = () => page.once('dialog', (d) => d.accept())

/* ================= BÀI VIẾT ================= */
let postId, postSlug
await step('Bài viết: tạo bản nháp bằng trình soạn → Xuất bản (workflow) → public hiện, có tiêu đề mục + đoạn văn + danh sách', async () => {
  await open('/cms/bai-viet/moi')
  await fill('Tiêu đề (VI)', `Bài E2E ${stamp}`)
  await fill('Tóm tắt (VI)', 'Tóm tắt bài E2E')
  await page.getByRole('button', { name: 'Nội dung', exact: true }).click()
  await page.locator('.rte .ProseMirror').click()
  await page.keyboard.type('Đoạn mở đầu E2E')
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Tiêu đề 2' }).click()
  await page.keyboard.type('Mục một')
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Danh sách chấm' }).click()
  await page.keyboard.type('ý A')
  await page.keyboard.press('Enter')
  await page.keyboard.type('ý B')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Trích dẫn' }).click()
  await page.keyboard.type('Trích dẫn E2E')
  await page.getByRole('button', { name: 'Thông tin chung' }).click()
  await page.locator('.cms-side-actions .humg-btn--primary').click()
  await page.waitForURL(/\/cms\/bai-viet\/moi\/\d+$/, { timeout: 15000 })
  await wf('Xuất bản').click()
  await page.getByRole('button', { name: 'Xác nhận: Xuất bản' }).click()
  await page.waitForFunction(() => document.querySelector('.cms-wfbar__state')?.innerText.includes('Đã xuất bản'), null, { timeout: 15000 })
  const list = (await get('/Contents?pageSize=100', T)).body.items
  const c = list.find((x) => x.title === `Bài E2E ${stamp}`)
  assert.ok(c, 'bài chưa có trong API'); postId = c.id; postSlug = c.slug
  assert.equal(c.status, 'published')
  const html = await pub(`/tin-tuc/${postSlug}`)
  assert.match(html, /Đoạn mở đầu E2E/); assert.match(html, /Mục một/); assert.match(html, /ý B/); assert.match(html, /Trích dẫn E2E/)
  assert.match(await pub('/tin-tuc'), new RegExp(`Bài E2E ${stamp}`))
})

await step('Bài viết: sửa tiêu đề + bản dịch EN + SEO + thẻ → lưu đúng trong API và public đổi', async () => {
  await open(`/cms/bai-viet/moi/${postId}`)
  await fill('Tiêu đề (VI)', `Bài E2E ${stamp} (đã sửa)`)
  await page.getByRole('button', { name: 'SEO' }).click()
  await page.locator('.cms-form label', { hasText: 'Tiêu đề SEO' }).locator('input').fill('SEO E2E')
  await page.getByRole('button', { name: 'Khác' }).click()
  await page.locator('.cms-form label', { hasText: 'Thẻ (tags' }).locator('input').fill('alpha, beta')
  await page.locator('.cms-langtabs button', { hasText: 'English' }).click()
  await page.getByRole('button', { name: 'Thông tin chung' }).click()
  await page.locator('.cms-editor__main .cms-form label', { hasText: 'Tiêu đề (EN)' }).locator('input').fill(`E2E post ${stamp}`)
  await page.locator('.cms-side-card label', { hasText: 'Tiếng Anh' }).locator('select').selectOption('Đã dịch')
  await page.locator('.cms-side-actions .humg-btn--primary').click()
  await status()
  const c = (await get(`/Contents/${postId}`, T)).body
  assert.equal(c.title, `Bài E2E ${stamp} (đã sửa)`); assert.equal(c.metaTitle, 'SEO E2E'); assert.deepEqual(c.tags, ['alpha', 'beta'])
  assert.equal(c.translations.en.title, `E2E post ${stamp}`); assert.equal(c.translations.en.status, 'done')
  assert.match(await pub('/tin-tuc'), new RegExp(`Bài E2E ${stamp} \\(đã sửa\\)`))
  assert.match(await pub(`/tin-tuc/${postSlug}`), /alpha/)
})

await step('Bài viết: "Gỡ xuống" → biến mất khỏi public; xóa ở danh sách → vào thùng rác', async () => {
  await open(`/cms/bai-viet/moi/${postId}`)
  await wf('Gỡ xuống').click()
  await page.waitForFunction(() => document.querySelector('.cms-wfbar__state')?.innerText.includes('Bản nháp'), null, { timeout: 15000 })
  assert.doesNotMatch(await pub('/tin-tuc'), new RegExp(`Bài E2E ${stamp}`))
  await open('/cms/bai-viet', 'tbody tr')
  await page.locator('.ui-filterbar input').first().fill(`Bài E2E ${stamp}`)
  accept()
  await page.locator('tbody tr', { hasText: `Bài E2E ${stamp}` }).getByRole('button', { name: /Xóa/ }).click()
  await page.waitForSelector('.cms-empty[role=status]')
  assert.equal((await get(`/Contents/${postId}`, T)).status, 404)
  assert.ok((await get('/Contents/trash', T)).body.items.some((x) => x.id === postId), 'bài không nằm trong thùng rác')
})

/* ================= DANH MỤC ================= */
let catId
await step('Danh mục: tạo → sửa tên → xóa', async () => {
  await open('/cms/danh-muc')
  await fill('Tên danh mục', `Danh mục E2E ${stamp}`)
  await submit()
  let cats = (await get('/Categories?pageSize=100')).body.items
  const c = cats.find((x) => x.name === `Danh mục E2E ${stamp}`); assert.ok(c); catId = c.id
  assert.equal(c.slug, `danh-muc-e2e-${stamp}`)
  await page.locator('tr', { hasText: `Danh mục E2E ${stamp}` }).getByRole('button', { name: /Sửa/ }).click()
  await fill('Tên danh mục', `Danh mục E2E ${stamp} B`)
  await page.locator('.cms-form label', { hasText: 'Trạng thái' }).locator('select').selectOption('false')
  await submit()
  const c2 = (await get(`/Categories/${catId}`, T)).body
  assert.equal(c2.name, `Danh mục E2E ${stamp} B`); assert.equal(c2.isActive, false)
  accept()
  await page.locator('tr', { hasText: `Danh mục E2E ${stamp} B` }).getByRole('button', { name: /Xóa/ }).click()
  await status()
  assert.equal((await get(`/Categories/${catId}`, T)).status, 404)
})

/* ================= MEDIA ================= */
await step('Media: tải tệp lên → xuất hiện; xóa → mất', async () => {
  await open('/cms/media', '.cms-media, .cms-empty')
  await page.getByRole('button', { name: /Tải lên/ }).first().click()
  await page.locator('input[type=file]').setInputFiles({ name: `e2e-${stamp}.png`, mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a', 'hex') })
  await submit('button[type=submit]')
  const m = (await get('/Media?pageSize=100', T)).body.items.find((x) => x.fileName === `e2e-${stamp}.png`)
  assert.ok(m, 'media chưa có'); assert.equal(m.kind, 'image')
  accept()
  await page.locator('figure', { hasText: `e2e-${stamp}.png` }).getByRole('button', { name: /Xóa/ }).click()
  await page.waitForSelector('.cms-empty[role=status]')
  assert.equal((await get(`/Media/${m.id}`, T)).status, 404)
})

/* ================= PHÂN QUYỀN NỘI DUNG (user/role quản lý ở Identity Server) ================= */
await step('Phân quyền: cấp quyền sửa nội dung đơn vị P.Đào tạo cho một người (tra danh bạ) → thu hồi', async () => {
  await open('/cms/phan-quyen', 'table')
  await page.locator('.cms-form .cms-suggest input').first().fill('ltmai')
  await page.locator('.cms-suggest li button', { hasText: 'Lê Thị Mai' }).click()
  await page.locator('.cms-form label', { hasText: 'Đơn vị sở hữu nội dung' }).locator('select').selectOption('P-DT')
  await submit()
  const g = (await get('/Grants?pageSize=500', T)).body.items.find((x) => x.principalId === 'u-ltmai' && x.scopeId === 'P-DT')
  assert.ok(g, 'grant chưa có trong API'); assert.deepEqual(g.permissions, ['view', 'edit'])
  accept()
  await page.locator('tr', { hasText: 'Phòng Đào tạo' }).filter({ hasText: 'Lê Thị Mai' }).getByRole('button', { name: /Thu hồi/ }).click()
  await status()
  assert.ok(!(await get('/Grants?pageSize=500', T)).body.items.some((x) => x.id === g.id))
})

await step('Phân quyền: biên tập viên không quản lý được grants (403)', async () => {
  const editor = await login('nthoa')
  assert.equal((await get('/Grants', editor.accessToken)).status, 403)
  assert.equal((await get('/Users', T)).status, 404)
})

/* ================= TRANG & MENU ================= */
await step('Trang: tạo (+ tiêu đề EN) → xóa', async () => {
  await open('/cms/trang-menu', '.cms-split__form')
  await page.getByRole('button', { name: '+ Thêm trang' }).click()
  await fill('Tiêu đề (VI)', `Trang E2E ${stamp}`)
  await page.locator('.cms-langtabs button', { hasText: 'English' }).click()
  await page.locator('.cms-form label', { hasText: 'Tiêu đề (EN)' }).locator('input').fill(`E2E page ${stamp}`)
  await submit()
  const p = (await get('/Pages?pageSize=100', T)).body.items.find((x) => x.title === `Trang E2E ${stamp}`); assert.ok(p)
  assert.equal(p.translations.en.title, `E2E page ${stamp}`)
  await page.locator('.cms-pagetree button', { hasText: `Trang E2E ${stamp}` }).click()
  accept()
  await page.getByRole('button', { name: /Xóa trang/ }).click()
  await status()
  assert.equal((await get(`/Pages/${p.id}`, T)).status, 404)
})

await step('Menu: thêm mục → hiện ở API công khai; xóa → mất', async () => {
  await open('/cms/trang-menu', '.cms-split__form')
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: '+ Thêm mục menu' }).click()
  await fill('Nhãn hiển thị (VI)', `Menu E2E ${stamp}`)
  await fill('Liên kết (URL)', '/e2e')
  await submit()
  const has = async () => (await (await fetch(`${API}/Public/menus/header`)).json()).some((m) => m.label === `Menu E2E ${stamp}`)
  assert.ok(await has())
  accept()
  await page.locator('tr', { hasText: `Menu E2E ${stamp}` }).getByRole('button', { name: /Xóa/ }).click()
  await status()
  assert.ok(!(await has()))
})

/* ================= CẤU HÌNH ================= */
await step('Cấu hình: lưu "Thông tin chung" và "Bảo mật" → API công khai/quản trị phản ánh', async () => {
  await open('/cms/cau-hinh')
  const name = `HUMG E2E ${stamp}`
  await page.locator('.cms-form label', { hasText: 'Tên website' }).locator('input').fill(name)
  await page.getByRole('button', { name: 'Lưu cấu hình' }).click(); await status(); await page.waitForLoadState('networkidle')
  assert.equal((await (await fetch(`${API}/Public/settings`)).json()).general.siteName, name)
  await page.locator('.cms-settings__nav button', { hasText: 'Bảo mật' }).click()
  await page.locator('input[name=sessionMinutes]').fill('45')
  await page.locator('input[name=ipRestrict]').check()
  await page.getByRole('button', { name: 'Lưu cấu hình' }).click(); await page.waitForSelector('.cms-empty[role=status]'); await page.waitForLoadState('networkidle')
  const sec = (await get('/Settings/security', T)).body
  assert.equal(sec.sessionMinutes, 45); assert.equal(sec.ipRestrict, true)
})

await step('Cấu hình: bật/tắt tiếng Anh ở mục Ngôn ngữ → lưu danh sách ngôn ngữ', async () => {
  await open('/cms/cau-hinh')
  await page.locator('.cms-settings__nav button', { hasText: 'Ngôn ngữ' }).click()
  await page.locator('.cms-langlist .cms-switch').click()
  await page.getByRole('button', { name: 'Lưu cấu hình' }).click(); await status(); await page.waitForLoadState('networkidle')
  const l = (await get('/Settings/language', T)).body
  assert.ok(!l.enabledCodes.includes('en'), JSON.stringify(l.enabledCodes))
})

/* ================= SAO LƯU ================= */
await step('Sao lưu: tạo bản mới → xóa', async () => {
  await open('/cms/sao-luu', '.ps-grid2')
  const before = (await get('/Backups?pageSize=100', T)).body.totalItems
  await page.getByRole('button', { name: /Tạo sao lưu ngay/ }).click(); await status(); await page.waitForLoadState('networkidle')
  const list = (await get('/Backups?pageSize=100', T)).body
  assert.equal(list.totalItems, before + 1)
  accept()
  await page.locator('tbody tr').first().getByRole('button', { name: /Xóa/ }).click()
  await page.waitForSelector('.cms-empty[role=status]')
  assert.equal((await get('/Backups?pageSize=100', T)).body.totalItems, before)
})

await step('Không có lỗi JS trong suốt phiên', async () => assert.deepEqual(errors, []))

await browser.close()
await post(`${API}/_dev/reset`)
console.log(failed ? `\nCÓ ${failed} BƯỚC LỖI` : '\nLưu/xóa trên các màn hình CMS còn lại: OK')
process.exitCode = failed ? 1 : 0
