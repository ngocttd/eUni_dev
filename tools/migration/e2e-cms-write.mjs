// E2E thao tác GHI trên giao diện CMS (Edge thật) → kiểm tra website public đổi theo.  node e2e-cms-write.mjs
import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'

const API = 'http://127.0.0.1:3000'
const ADMIN = 'http://localhost:3001'
const PUBLIC = 'http://localhost:3002'
const stamp = Date.now().toString(36)

await fetch(`${API}/cms-api/api/_dev/reset`, { method: 'POST' })
const login = await (await fetch(`${API}/auth-api/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'tvanminh', password: 'Humg@2025' }) })).json()

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME, headless: true } : { channel: 'msedge', headless: true })
const ctx = await browser.newContext()
await ctx.addInitScript((s) => window.sessionStorage.setItem('humg-session', JSON.stringify(s)), { accessToken: login.accessToken, user: login.user })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const pub = async (path) => (await fetch(PUBLIC + path)).text()

let failed = 0
const step = async (name, fn) => { try { await fn(); console.log('✔', name) } catch (e) { failed++; console.log('✘', name, '\n   ', e.message.split('\n')[0]) } }
const open = async (path) => { await page.goto(ADMIN + path, { waitUntil: 'networkidle' }); await page.waitForSelector('.cms-form') }
const fill = async (label, value) => { await page.locator('.cms-form label', { hasText: label }).locator('input, textarea, select').first().fill(value) }
const select = async (label, value) => { await page.locator('.cms-form label', { hasText: label }).locator('select').first().selectOption(value) }
const submit = async () => { await page.locator('.cms-form button[type=submit]').click(); await page.waitForSelector('[role=status]'); await page.waitForLoadState('networkidle') }

await step('Video: thêm trên CMS → hiện ở /media và trang chi tiết', async () => {
  await open('/cms/video')
  await fill('Tiêu đề video', `Video CMS ${stamp}`)
  await fill('Kênh', 'Kênh Test')
  await fill('Thời lượng', '12:34')
  await fill('Mô tả', 'Mô tả video kiểm thử')
  await submit()
  assert.match(await pub('/media'), new RegExp(`Video CMS ${stamp}`))
  const list = await (await fetch(`${API}/cms-api/api/Public/content`)).json()
  const v = list.videos.find((x) => x.title === `Video CMS ${stamp}`)
  assert.equal(v.durationSec, 12 * 60 + 34)
  assert.match(await pub(`/media/video/${v.slug}`), /12:34/)
})

await step('Video: bấm đổi trạng thái Ẩn → biến mất khỏi public', async () => {
  await page.locator('tr', { hasText: `Video CMS ${stamp}` }).locator('button[title*="đổi hiển thị"]').click()
  await page.waitForLoadState('networkidle')
  assert.doesNotMatch(await pub('/media'), new RegExp(`Video CMS ${stamp}`))
})

await step('Video: sửa rồi xóa', async () => {
  await page.locator('tr', { hasText: `Video CMS ${stamp}` }).getByRole('button', { name: /Sửa/ }).click()
  await fill('Tiêu đề video', `Video CMS ${stamp} (sửa)`)
  await select('Hiển thị', 'true')
  await submit()
  assert.match(await pub('/media'), new RegExp(`Video CMS ${stamp} \\(sửa\\)`))
  page.once('dialog', (d) => d.accept())
  await page.locator('tr', { hasText: `Video CMS ${stamp} (sửa)` }).getByRole('button', { name: /Xóa/ }).click()
  await page.waitForSelector('[role=status]')
  assert.doesNotMatch(await pub('/media'), new RegExp(`Video CMS ${stamp}`))
})

await step('Podcast: thêm → hiện ở /media', async () => {
  await open('/cms/podcast')
  await fill('Tiêu đề', `Podcast CMS ${stamp}`)
  await fill('Tập', 'Tập 99')
  await fill('Người dẫn', 'Người dẫn Test')
  await fill('Nội dung tập', 'Ý một\nÝ hai')
  await submit()
  assert.match(await pub('/media'), new RegExp(`Podcast CMS ${stamp}`))
})

await step('Album: thêm với 3 ảnh → /media ghi "3 ảnh"', async () => {
  await open('/cms/album')
  await fill('Tiêu đề album', `Album CMS ${stamp}`)
  await fill('Chú thích ảnh', 'Ảnh 1\nẢnh 2\nẢnh 3')
  await submit()
  const html = await pub('/media')
  assert.match(html, new RegExp(`Album CMS ${stamp}`))
  const content = await (await fetch(`${API}/cms-api/api/Public/content`)).json()
  assert.equal(content.albums.find((a) => a.title === `Album CMS ${stamp}`).photos.length, 3)
})

await step('Trang chủ → Đối tác: thêm → hiện ở trang chủ', async () => {
  await open('/cms/trang-chu')
  await page.getByRole('button', { name: 'Đối tác' }).click()
  await page.waitForSelector('.cms-form')
  await fill('Tên đối tác', `Đối tác CMS ${stamp}`)
  await fill('Tên viết tắt', 'CMS')
  await submit()
  assert.match(await pub('/'), new RegExp(`Đối tác CMS ${stamp}`))
})

await step('Trang chủ → Chỉ số: thêm chỉ số đầu trang → hiện ở trang chủ', async () => {
  await page.getByRole('button', { name: 'Chỉ số thống kê' }).click()
  await page.waitForSelector('.cms-form')
  await fill('Giá trị hiển thị', '777+')
  await fill('Nhãn', `Chỉ số ${stamp}`)
  await submit()
  assert.match(await pub('/'), new RegExp(`Chỉ số ${stamp}`))
})

await step('Trang chủ → Slide: sửa dòng nhấn slide đầu → đổi ở trang chủ', async () => {
  await page.getByRole('button', { name: 'Slide đầu trang' }).click()
  await page.waitForSelector('.cms-form')
  await page.locator('tbody tr').first().getByRole('button', { name: /Sửa/ }).click()
  await fill('Dòng nhấn', `NHẤN ${stamp}`)
  await submit()
  assert.match(await pub('/'), new RegExp(`NHẤN ${stamp}`))
})

await step('Trang chủ → Chip đặc điểm: lưu → đổi ở trang chủ', async () => {
  await page.getByRole('button', { name: 'Chip đặc điểm' }).click()
  await page.waitForSelector('.cms-form textarea:not([disabled])')
  await page.locator('.cms-form textarea').fill(`Chip ${stamp}\nChip hai`)
  await page.locator('.cms-form button[type=submit]').click()
  await page.waitForSelector('[role=status]')
  assert.match(await pub('/'), new RegExp(`Chip ${stamp}`))
})

await step('Banner: thêm bằng form mới → có trong API công khai', async () => {
  await open('/cms/banner')
  await fill('Tên banner', `Banner CMS ${stamp}`)
  await submit()
  const b = await (await fetch(`${API}/cms-api/api/Public/banners`)).json()
  assert.ok(b.some((x) => x.title === `Banner CMS ${stamp}`))
})

await step('Không có lỗi JS trong suốt phiên', async () => assert.deepEqual(errors, []))

await browser.close()
await fetch(`${API}/cms-api/api/_dev/reset`, { method: 'POST' })
console.log(failed ? `\nCÓ ${failed} BƯỚC LỖI` : '\nGhi từ giao diện CMS → public: OK')
process.exitCode = failed ? 1 : 0
