// Kiểm thử trình duyệt thật cho thiết kế CMS v2 (docs/design/CMS_DESIGN.md):
// workflow tác giả → biên tập, lịch sử phiên bản, chọn tenant, thông báo theo đối tượng → hộp thư SV, phân quyền.
// Cần đang chạy: euni-api-mock :3000 (dữ liệu gốc), euni-public :3002, euni-admin :3001.
//   PLAYWRIGHT=/đường/dẫn/playwright node tools/migration/e2e-v2.mjs
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright')
const ADMIN = process.env.ADMIN_URL || 'http://localhost:3001'
const PUBLIC = process.env.PUBLIC_URL || 'http://localhost:3002'
const API = process.env.API_URL || 'http://127.0.0.1:3000'

const results = []
const ok = (name, cond, extra = '') => { results.push([cond, name, extra]); console.log(`${cond ? '✓' : '✗'} ${name}${!cond && extra ? ` — ${extra}` : ''}`) }

await fetch(`${API}/cms-api/api/v1/dev/reset`, { method: 'POST' })
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined })
const errors = []
const newPage = async () => {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(`${page.url()} · ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|favicon/.test(m.text())) errors.push(`${page.url()} · ${m.text()}`) })
  return page
}
const adminLogin = async (page, user) => {
  await page.goto(`${ADMIN}/dang-nhap`)
  await page.fill('input[autocomplete="username"]', user)
  await page.fill('input[type="password"]', 'Humg@2025')
  await page.click('form button[type="submit"]')
  await page.waitForURL(/\/cms$/, { timeout: 20000 })
  await page.waitForSelector('.cms-stats', { timeout: 20000 })
}
const wf = (page, label) => page.locator('.cms-wfbar button', { hasText: label }).first()

const TITLE = `E2E bài viết ${Date.now().toString(36)}`
let postUrl = ''

try {
  /* 1. Tác giả soạn → lưu & gửi duyệt */
  const author = await newPage()
  await adminLogin(author, 'ltmai')
  ok('tác giả không thấy menu Phân quyền / Cấu hình', !(await author.locator('nav a[href="/cms/phan-quyen"]').count()) && !(await author.locator('nav a[href="/cms/cau-hinh"]').count()))
  await author.goto(`${ADMIN}/cms/bai-viet/moi`)
  await author.fill('.cms-form label:has-text("Tiêu đề") input', TITLE)
  await author.click('button:has-text("Lưu & gửi duyệt")')
  await author.waitForURL(/\/cms\/bai-viet\/moi\/\d+$/, { timeout: 20000 })
  postUrl = author.url()
  await author.waitForSelector('.cms-wfbar')
  ok('sau khi gửi: trạng thái Chờ duyệt', (await author.locator('.cms-wfbar__state').innerText()).includes('Chờ duyệt'))
  ok('tác giả không có nút Duyệt', !(await wf(author, 'Duyệt & xuất bản').count()))

  /* 2. Biên tập duyệt & xuất bản */
  const editor = await newPage()
  await adminLogin(editor, 'nthoa')
  ok('dashboard: bài nằm trong "Chờ tôi duyệt"', (await editor.locator('.cms-quad').innerText()).includes(TITLE))
  await editor.goto(postUrl)
  await wf(editor, 'Duyệt & xuất bản').click()
  await editor.click('button:has-text("Xác nhận: Duyệt & xuất bản")')
  await editor.waitForFunction(() => document.querySelector('.cms-wfbar__state')?.innerText.includes('Đã xuất bản'), null, { timeout: 15000 })
  ok('biên tập duyệt → Đã xuất bản', true)
  const pub = await newPage()
  await pub.goto(`${PUBLIC}/tin-tuc`)
  ok('bài lên website công khai', (await pub.content()).includes(TITLE))

  /* 3. Tác giả sửa bài đã đăng → bản sửa đổi chờ duyệt; biên tập duyệt bản sửa đổi */
  await author.goto(postUrl)
  await author.fill('.cms-form label:has-text("Tiêu đề") input', `${TITLE} (sửa)`)
  await author.click('button:has-text("Gửi bản sửa đổi")')
  await author.waitForSelector('.cms-banner:has-text("bản sửa đổi")', { timeout: 15000 })
  ok('tác giả sửa bài đã đăng → bản sửa đổi chờ duyệt', true)
  await pub.goto(`${PUBLIC}/tin-tuc`)
  ok('website vẫn giữ tiêu đề cũ', (await pub.content()).includes(TITLE) && !(await pub.content()).includes(`${TITLE} (sửa)`))
  await editor.goto(postUrl)
  await wf(editor, 'Duyệt bản sửa đổi').click()
  await editor.waitForFunction(() => !document.querySelector('.cms-banner')?.innerText.includes('chờ duyệt'), null, { timeout: 15000 })
  await pub.goto(`${PUBLIC}/tin-tuc`)
  ok('duyệt bản sửa đổi → website đổi tiêu đề', (await pub.content()).includes(`${TITLE} (sửa)`))

  /* 4. Lịch sử phiên bản */
  await editor.goto(postUrl)
  await editor.click('.ps-tabs button:has-text("Lịch sử")')
  await editor.waitForSelector('text=Phiên bản')
  const histText = await editor.locator('.cms-editor__main').innerText()
  ok('tab Lịch sử có phiên bản + workflow + audit', /v1/.test(histText) && histText.includes('Gửi duyệt') && histText.includes('Duyệt & xuất bản'), histText.slice(0, 300))

  /* 5. Chọn tenant: pvloc quản trị cả trang Trường và trang Khoa CNTT */
  const pv = await newPage()
  await adminLogin(pv, 'pvloc')
  ok('có bộ chọn trang quản trị', await pv.locator('.cms-tenant select').count() === 1)
  await pv.selectOption('.cms-tenant select', 'cntt')
  await pv.waitForSelector('.cms-stats')
  await pv.goto(`${ADMIN}/cms/bai-viet`)
  await pv.waitForSelector('table')
  const cnttList = await pv.locator('table').innerText()
  ok('trang Khoa CNTT chỉ có bài của Khoa', cnttList.includes('Khoa CNTT khai giảng') && !cnttList.includes('Hội thảo quốc tế về Trắc địa'), cnttList.slice(0, 200))
  await pv.selectOption('.cms-tenant select', 'humg')
  await pv.waitForFunction(() => document.querySelector('.cms-tenant select')?.value === 'humg' && document.querySelector('table'), null, { timeout: 20000 })

  /* 6. Thông báo cho lớp DCCTKT66A → sinh viên nhận trong My eUni */
  const ANN = `E2E thông báo lớp ${Date.now().toString(36)}`
  await pv.goto(`${ADMIN}/cms/thong-bao/moi`)
  await pv.fill('.cms-form label:has-text("Tiêu đề") input', ANN)
  await pv.click('.ps-tabs button:has-text("Đối tượng nhận")')
  await pv.selectOption('.cms-targetrow label:has-text("Đơn vị / lớp") select', 'DCCTKT66A')
  await pv.click('.cms-targetrow button:has-text("Thêm")')
  ok('chip đối tượng hiển thị', (await pv.locator('.cms-chip').first().innerText()).includes('DCCTKT66A'))
  await pv.click('.cms-side-actions button:has-text("Lưu bản nháp")')
  await pv.waitForURL(/\/cms\/thong-bao\/moi\/\d+$/, { timeout: 20000 })
  await pv.waitForSelector('.cms-wfbar')
  await wf(pv, 'Xuất bản').click()
  await pv.click('button:has-text("Xác nhận: Xuất bản")')
  await pv.waitForFunction(() => document.querySelector('.cms-wfbar__state')?.innerText.includes('Đã xuất bản'), null, { timeout: 15000 })
  ok('phát hành thông báo', true)

  const sv = await newPage()
  await sv.goto(`${PUBLIC}/dang-nhap`)
  await sv.click('.auth-demo button:has-text("Sinh viên")')
  await sv.waitForURL(/\/euni\/sinh-vien/, { timeout: 20000 })
  await sv.goto(`${PUBLIC}/euni/sinh-vien/thong-bao`)
  await sv.waitForSelector('.ps-noti li', { timeout: 20000 })
  const inbox = await sv.locator('.ps-noti').innerText()
  ok('SV lớp DCCTKT66A nhận thông báo mới', inbox.includes(ANN), inbox.slice(0, 300))
  ok('SV không thấy thông báo dành cho GV', !inbox.includes('Họp giao ban Khoa CNTT'))
  const ackBtn = sv.locator('.ps-noti li', { hasText: 'Lịch thi học kỳ 2' }).locator('button:has-text("Xác nhận đã đọc")')
  await ackBtn.click()
  await sv.waitForSelector('.ps-noti li:has-text("Lịch thi học kỳ 2") em:has-text("Đã xác nhận")', { timeout: 10000 })
  ok('SV xác nhận đã đọc', true)
  ok('chuông topbar lấy từ hộp thư', (await sv.locator('.portal-shell__bell-badge').count()) === 1)

  const gv = await newPage()
  await gv.goto(`${PUBLIC}/dang-nhap`)
  await gv.click('.auth-demo button:has-text("Giảng viên")')
  await gv.waitForURL(/\/euni\/giang-vien/, { timeout: 20000 })
  await gv.goto(`${PUBLIC}/euni/giang-vien/thong-bao`)
  await gv.waitForSelector('.ps-noti li', { timeout: 20000 })
  ok('GV BM-KHMT thấy họp giao ban Khoa CNTT', (await gv.locator('.ps-noti').innerText()).includes('Họp giao ban Khoa CNTT'))

  /* 7. Phân quyền nội dung (quản trị) */
  const admin = await newPage()
  await adminLogin(admin, 'tvanminh')
  await admin.goto(`${ADMIN}/cms/phan-quyen`)
  await admin.waitForSelector('table')
  ok('màn hình phân quyền liệt kê grants', (await admin.locator('table').innerText()).includes('Phòng Truyền thông'))
  await admin.goto(`${ADMIN}/cms/nhat-ky`)
  await admin.waitForSelector('table')
  ok('nhật ký audit có thao tác workflow', (await admin.locator('table').innerText()).includes('Duyệt bài viết'))

  /* 8. Trang đăng nhập có 2 lựa chọn */
  const login = await newPage()
  await login.goto(`${PUBLIC}/dang-nhap`)
  const loginText = await login.locator('.auth-form').innerText()
  ok('trang đăng nhập: tài khoản trường + Microsoft 365', loginText.includes('tài khoản trường') && loginText.includes('Microsoft 365'))

  /* 9. Website theo tenant (host) */
  const cnttSite = await newPage()
  await cnttSite.setExtraHTTPHeaders({ 'X-Forwarded-Host': 'cntt.localhost:3002' })
  await cnttSite.goto(`${PUBLIC}/tin-tuc`)
  ok('host cntt.* hiển thị tin của Khoa CNTT', (await cnttSite.content()).includes('Khoa CNTT khai giảng'))
} catch (e) {
  ok(`lỗi không mong đợi: ${e.message.split('\n')[0]}`, false)
} finally {
  await browser.close()
}

ok('không có lỗi JS trên các trang', errors.length === 0, errors.slice(0, 5).join(' | '))
const failed = results.filter(([c]) => !c).length
console.log(`\n${results.length - failed}/${results.length} bước đạt`)
process.exit(failed ? 1 : 0)
