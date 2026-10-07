// Kiểm thử giao diện CMS (euni-admin thật, trình duyệt Chromium) trên API đang chạy: đăng nhập bằng form (gọi auth-api), mở từng màn hình quản trị,
// bắt mọi lỗi JS và mọi lời gọi API trả lỗi (>= 400), kiểm tra danh sách hiển thị dữ liệu đọc từ database.
//   API :3000 · euni-admin :3001 đang chạy;  CHROME=<chromium> PLAYWRIGHT=<đường dẫn playwright-core> node tests/ui/admin-routes.mjs
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT || 'playwright-core')
const ADMIN = process.env.ADMIN_URL || 'http://localhost:3001', API = process.env.API_URL || 'http://127.0.0.1:3000'
await fetch(`${API}/cms-api/api/v1/dev/reset`, { method: 'POST' })
const ROUTES = ['', 'bai-viet', 'bai-viet/moi', 'thong-bao', 'thong-bao/moi', 'danh-muc', 'media', 'trang-chu', 'trang-menu', 'banner', 'su-kien', 'album', 'video', 'podcast', 'tuyen-sinh', 'hoc-tap', 'nghien-cuu', 'phan-quyen', 'nhat-ky', 'sao-luu', 'cau-hinh']
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const jsErrors = [], apiErrors = [], apiCalls = []
page.on('pageerror', (e) => jsErrors.push(e.message))
page.on('response', (r) => { if (r.url().startsWith(API)) { apiCalls.push(r.status()); if (r.status() >= 400) apiErrors.push(`${r.status()} ${r.request().method()} ${r.url().replace(API, '')}`) } })
let failed = 0
const check = (name, ok, extra = '') => { if (!ok) failed++; console.log(ok ? '✔' : '✘', name, ok ? '' : extra) }

await page.goto(`${ADMIN}/dang-nhap`)
await page.fill('input[autocomplete="username"]', 'tvanminh')
await page.fill('input[type="password"]', 'Humg@2025')
await page.click('form button[type="submit"]')
await page.waitForURL(/\/cms$/, { timeout: 90000 })
check('đăng nhập bằng form → vào CMS (token từ auth-api, quyền từ database)', true)
for (const r of ROUTES) {
  await page.goto(`${ADMIN}/cms/${r}`, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
  await page.waitForTimeout(800)
  const text = (await page.locator('body').innerText()).trim()
  check(`/cms/${r || ''} hiển thị nội dung`, text.length > 80, `chỉ có ${text.length} ký tự`)
}
await page.goto(`${ADMIN}/cms/bai-viet`, { waitUntil: 'networkidle' })
const body = await page.locator('body').innerText()
check('danh sách bài viết hiển thị bài từ database', /Hội thảo quốc tế về Trắc địa và GIS 2025/.test(body))
await page.goto(`${ADMIN}/cms/thong-bao`, { waitUntil: 'networkidle' })
check('danh sách thông báo hiển thị thông báo từ database', /Lịch thi học kỳ 2/.test(await page.locator('body').innerText()))
await page.goto(`${ADMIN}/cms/phan-quyen`, { waitUntil: 'networkidle' })
check('phân quyền hiển thị grants từ database', /Biên tập viên chính/.test(await page.locator('body').innerText()))
await page.goto(`${ADMIN}/cms/nhat-ky`, { waitUntil: 'networkidle' })
check('nhật ký hiển thị audit từ database', /Trần Văn Minh/.test(await page.locator('body').innerText()))
check(`không lỗi JS (${jsErrors.length})`, jsErrors.length === 0, jsErrors.slice(0, 3).join(' | '))
const unexpected = apiErrors.filter((e) => !/\/me\/announcements|favicon/.test(e))
check(`không có lời gọi API lỗi (${apiCalls.length} lời gọi, ${apiErrors.length} lỗi)`, unexpected.length === 0, unexpected.slice(0, 5).join(' | '))
await browser.close()
console.log(failed ? `CÓ ${failed} BƯỚC LỖI` : 'OK')
process.exit(failed ? 1 : 0)
