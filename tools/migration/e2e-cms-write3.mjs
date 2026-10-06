// E2E các phần bổ sung: trình soạn WYSIWYG (ảnh, bảng, làm sạch HTML), ảnh đại diện, logo, bản dịch EN trên website,
// sao lưu (tải về / phục hồi), email thử.   node e2e-cms-write3.mjs
import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const API = 'http://127.0.0.1:3000/cms-api/api'
const ADMIN = 'http://localhost:3001'
const PUBLIC = 'http://localhost:3002'
const stamp = Date.now().toString(36)
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

const jfetch = async (url, o = {}) => { const r = await fetch(url, o); const t = await r.text(); let b = null; try { b = JSON.parse(t) } catch { b = t } return { status: r.status, body: b } }
await jfetch(`${API}/v1/dev/reset`, { method: 'POST' })
const login = (await jfetch('http://127.0.0.1:3000/auth-api/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'tvanminh', password: 'Humg@2025' }) })).body
const T = login.accessToken
const A = { Authorization: `Bearer ${T}`, 'Content-Type': 'application/json' }
const get = (p) => jfetch(`${API}${p}`, { headers: { Authorization: `Bearer ${T}` } })
const send = (m, p, b) => jfetch(`${API}${p}`, { method: m, headers: A, body: b ? JSON.stringify(b) : undefined })

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME, headless: true } : { channel: 'msedge', headless: true })
const ctx = await browser.newContext({ acceptDownloads: true })
await ctx.addInitScript((s) => window.sessionStorage.setItem('humg-session', JSON.stringify(s)), { accessToken: T, user: login.user })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const pub = async (path) => (await fetch(PUBLIC + path)).text()

let failed = 0
const step = async (name, fn) => { try { await fn(); console.log('✔', name) } catch (e) { failed++; console.log('✘', name, '\n   ', String(e.message).split('\n')[0]) } }
const open = async (path, ready = '.cms-form') => { await page.goto(ADMIN + path, { waitUntil: 'networkidle' }); await page.waitForSelector(ready) }
const status = () => page.waitForSelector('.cms-empty[role=status]', { timeout: 15000 })
const accept = () => page.once('dialog', (d) => d.accept())

/* ================= TRÌNH SOẠN WYSIWYG ================= */
let postId, slug
await step('Soạn bài: định dạng đậm/nghiêng, liên kết, bảng, ảnh tải lên → lưu HTML, public hiển thị đúng', async () => {
  await open('/cms/bai-viet/moi')
  await page.locator('.cms-form label', { hasText: 'Tiêu đề (VI)' }).locator('input').fill(`Bài WYSIWYG ${stamp}`)
  await page.getByRole('button', { name: 'Nội dung', exact: true }).click()
  await page.locator('.rte .ProseMirror').click()
  await page.getByRole('button', { name: 'In đậm' }).click()
  await page.keyboard.type('Chữ đậm E2E')
  await page.getByRole('button', { name: 'In đậm' }).click()
  await page.keyboard.type(' và thường')
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Chèn bảng 3×3' }).click()
  await page.keyboard.type('Ô đầu')
  await page.locator('.rte input[type=file]').setInputFiles({ name: `anh-${stamp}.png`, mimeType: 'image/png', buffer: PNG })
  await page.waitForSelector('.rte .ProseMirror img', { timeout: 15000 })
  await page.getByRole('button', { name: 'Thông tin chung' }).click()
  await page.locator('.cms-side-actions .humg-btn--primary').click()
  await page.waitForURL(/\/cms\/bai-viet\/moi\/\d+$/, { timeout: 15000 })
  await page.locator('.cms-wfbar button', { hasText: 'Xuất bản' }).first().click()
  await page.getByRole('button', { name: 'Xác nhận: Xuất bản' }).click()
  await page.waitForFunction(() => document.querySelector('.cms-wfbar__state')?.innerText.includes('Đã xuất bản'), null, { timeout: 15000 })
  const c = (await get('/Contents?pageSize=100')).body.items.find((x) => x.title === `Bài WYSIWYG ${stamp}`)
  assert.ok(c); postId = c.id; slug = c.slug
  assert.match(c.contentBody, /^<p>/); assert.match(c.contentBody, /<strong>Chữ đậm E2E<\/strong>/); assert.match(c.contentBody, /<table/); assert.match(c.contentBody, /<img[^>]+uploads/)
  const html = await pub(`/tin-tuc/${slug}`)
  assert.match(html, /<strong>Chữ đậm E2E<\/strong>/); assert.match(html, /<table/); assert.match(html, /<img[^>]+uploads/)
  const media = (await get('/Media?pageSize=100')).body.items.find((m) => m.fileName === `anh-${stamp}.png`)
  assert.ok(media, 'ảnh chưa vào Media thư viện')
})

await step('Mở lại bài đã có (HTML) và bài cũ (dữ liệu khối JSON) trong trình soạn — nội dung được nạp', async () => {
  await open(`/cms/bai-viet/moi/${postId}`)
  await page.getByRole('button', { name: 'Nội dung', exact: true }).click()
  await page.waitForSelector('.rte .ProseMirror strong')
  assert.match(await page.locator('.rte .ProseMirror').innerText(), /Chữ đậm E2E/)
  const old = (await get('/Contents?pageSize=100')).body.items.find((x) => x.slug === 'le-ky-niem-60-nam-thanh-lap')
  await open(`/cms/bai-viet/moi/${old.id}`)
  await page.getByRole('button', { name: 'Nội dung', exact: true }).click()
  await page.waitForSelector('.rte .ProseMirror h2')
  assert.match(await page.locator('.rte .ProseMirror').innerText(), /Một chặng đường tự hào/)
})

await step('An toàn: HTML độc hại bị loại ở website (script, onerror, javascript:)', async () => {
  const bad = '<p>an toàn E2E</p><script>alert("XSS1")</script><img src="x" onerror="alert(\'XSS2\')"><a href="javascript:alert(\'XSS3\')">bấm</a>'
  const r = await send('POST', '/Contents', { title: `Bài XSS ${stamp}`, status: 2, categoryId: 1, contentBody: bad })
  assert.equal(r.status, 201)
  const html = await pub(`/tin-tuc/${r.body.slug}`)
  assert.match(html, /an toàn E2E/)
  assert.doesNotMatch(html, /XSS1|XSS2|XSS3/)
  assert.doesNotMatch(html, /onerror/)
})

await step('Ảnh đại diện: chọn từ Media thư viện → lưu featuredImageId; gỡ ảnh', async () => {
  await open(`/cms/bai-viet/moi/${postId}`)
  await page.getByRole('button', { name: 'Hình ảnh & File' }).click()
  await page.getByRole('button', { name: /Chọn ảnh/ }).click()
  await page.waitForSelector('.cms-modal__item')
  await page.locator('.cms-modal__item', { hasText: `anh-${stamp}.png` }).click()
  await page.waitForSelector('.cms-thumbpreview img')
  await page.locator('.cms-side-actions .humg-btn--primary').click()
  await status()
  const c = (await get(`/Contents/${postId}`)).body
  const m = (await get('/Media?pageSize=100')).body.items.find((x) => x.fileName === `anh-${stamp}.png`)
  assert.equal(c.featuredImageId, m.id)
  await open(`/cms/bai-viet/moi/${postId}`)
  await page.getByRole('button', { name: 'Hình ảnh & File' }).click()
  await page.getByRole('button', { name: /Gỡ ảnh/ }).click()
  await page.locator('.cms-side-actions .humg-btn--primary').click()
  await status()
  assert.equal((await get(`/Contents/${postId}`)).body.featuredImageId, null)
})

/* ================= BẢN DỊCH EN TRÊN WEBSITE ================= */
await step('Bản dịch EN "Đã dịch" → website hiển thị tiếng Anh khi chọn EN; "Đang dịch" → vẫn tiếng Việt', async () => {
  const c = (await get(`/Contents/${postId}`)).body
  await send('PUT', `/Contents/${postId}`, { translations: { en: { title: `English title ${stamp}`, excerpt: 'English excerpt', contentBody: '<p>English body E2E</p>', status: 'done' } } })
  const pg = await ctx.newPage()
  await pg.addInitScript(() => window.localStorage.setItem('humg-lang', 'en'))
  await pg.goto(`${PUBLIC}/tin-tuc/${slug}`, { waitUntil: 'networkidle' })
  await pg.waitForFunction((t) => document.body.innerText.includes(t), `English title ${stamp}`, { timeout: 15000 })
  assert.match(await pg.locator('body').innerText(), /English body E2E/)
  await pg.goto(`${PUBLIC}/tin-tuc`, { waitUntil: 'networkidle' })
  await pg.waitForFunction((t) => document.body.innerText.includes(t), `English title ${stamp}`, { timeout: 15000 })
  // đang dịch → fallback tiếng Việt
  await send('PUT', `/Contents/${postId}`, { translations: { en: { title: `English title ${stamp}`, status: 'in_progress' } } })
  await pg.goto(`${PUBLIC}/tin-tuc/${slug}`, { waitUntil: 'networkidle' })
  await pg.waitForTimeout(800)
  const txt = await pg.locator('body').innerText()
  assert.match(txt, new RegExp(`Bài WYSIWYG ${stamp}`)); assert.doesNotMatch(txt, /English title/)
  // tiếng Việt vẫn đúng khi chọn VI
  const vi = await pub(`/tin-tuc/${slug}`)
  assert.match(vi, new RegExp(`Bài WYSIWYG ${stamp}`))
  await pg.close()
})

/* ================= CẤU HÌNH: LOGO + EMAIL THỬ ================= */
await step('Cấu hình: chọn logo từ Media + lưu; gửi email thử (hợp lệ / sai định dạng)', async () => {
  await open('/cms/cau-hinh')
  await page.locator('.cms-uploadbox', { hasText: /Logo/ }).getByRole('button', { name: 'Chọn ảnh' }).click()
  await page.waitForSelector('.cms-modal__item')
  await page.locator('.cms-modal__item').first().click()
  await page.getByRole('button', { name: 'Lưu cấu hình' }).click(); await status(); await page.waitForLoadState('networkidle')
  const g = (await get('/Settings/general')).body
  assert.ok(Number.isInteger(g.logoMediaId), JSON.stringify(g))
  await page.locator('.cms-settings__nav button', { hasText: 'Email hệ thống' }).click()
  page.once('dialog', (d) => d.accept('kiemtra@humg.edu.vn'))
  await page.getByRole('button', { name: 'Gửi email kiểm tra' }).click(); await status()
  assert.match(await page.locator('.cms-empty[role=status]').innerText(), /kiemtra@humg\.edu\.vn/)
  assert.equal((await send('POST', '/Settings/email/test', { to: 'sai-dinh-dang' })).status, 422)
})

/* ================= SAO LƯU: TẢI VỀ + PHỤC HỒI ================= */
await step('Sao lưu: tạo → tải tệp JSON; đổi dữ liệu → phục hồi từ bản sao lưu → dữ liệu trở lại', async () => {
  await open('/cms/sao-luu', '.ps-grid2')
  await page.getByRole('button', { name: /Tạo sao lưu ngay/ }).click(); await status(); await page.waitForLoadState('networkidle')
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('tbody tr').first().getByRole('button', { name: /Tải/ }).click()])
  const path = await dl.path()
  const snap = JSON.parse(readFileSync(path, 'utf8'))
  assert.equal(snap.app, 'humg-cms-mock'); assert.ok(snap.data.collections.contents.length > 10)
  await send('POST', '/Categories', { name: `Danh mục sẽ mất ${stamp}` })
  assert.ok((await get('/Categories?pageSize=100')).body.items.some((c) => c.name === `Danh mục sẽ mất ${stamp}`))
  accept()
  await page.getByRole('button', { name: 'Phục hồi ngay' }).click(); await status(); await page.waitForLoadState('networkidle')
  assert.ok(!(await get('/Categories?pageSize=100')).body.items.some((c) => c.name === `Danh mục sẽ mất ${stamp}`), 'dữ liệu chưa được phục hồi')
  assert.ok((await get('/Contents?pageSize=100')).body.items.some((c) => c.title === `Bài WYSIWYG ${stamp}`))
})

await step('Phục hồi từ tệp tải lên; tệp sai định dạng bị từ chối', async () => {
  await open('/cms/sao-luu', '.ps-grid2')
  await send('POST', '/Categories', { name: `Mất lần hai ${stamp}` })
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('.ps-grid2')
  await page.getByRole('button', { name: /Tạo sao lưu ngay/ }).click(); await status(); await page.waitForLoadState('networkidle')
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('tbody tr').first().getByRole('button', { name: /Tải/ }).click()])
  const good = await dl.path()
  await send('POST', '/Categories', { name: `Chỉ có sau sao lưu ${stamp}` })
  await page.locator('input[type=file]').setInputFiles(good)
  accept()
  await page.getByRole('button', { name: 'Phục hồi ngay' }).click(); await status(); await page.waitForLoadState('networkidle')
  const names = (await get('/Categories?pageSize=100')).body.items.map((c) => c.name)
  assert.ok(names.includes(`Mất lần hai ${stamp}`)); assert.ok(!names.includes(`Chỉ có sau sao lưu ${stamp}`))
  const form = new FormData(); form.append('file', new Blob(['không phải JSON'], { type: 'application/json' }), 'x.json')
  const bad = await jfetch(`${API}/v1/admin/backups/restore`, { method: 'POST', headers: { Authorization: `Bearer ${T}` }, body: form })
  assert.equal(bad.status, 422)
})

await step('Không có lỗi JS trong suốt phiên', async () => assert.deepEqual(errors, []))

await browser.close()
await jfetch(`${API}/v1/dev/reset`, { method: 'POST' })
console.log(failed ? `\nCÓ ${failed} BƯỚC LỖI` : '\nTrình soạn WYSIWYG, ảnh, EN, sao lưu, email thử: OK')
process.exitCode = failed ? 1 : 0
