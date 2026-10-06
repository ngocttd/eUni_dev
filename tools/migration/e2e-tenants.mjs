// Kiểm thử màn "Trang đơn vị" trên trình duyệt thật: tạo trang Khoa/Phòng mới trong CMS → website nhận tên miền mới
// (không build lại) → chuyển CMS sang quản trị trang mới → tắt trang → tên miền về website Trường.
// Cần đang chạy: euni-api-mock :3000, euni-public :3002, euni-admin :3001.   node e2e-tenants.mjs
// Tên miền thử dùng *.localhost (trình duyệt tự trỏ về 127.0.0.1).
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright')

const API = process.env.API_URL || 'http://127.0.0.1:3000'
const ADMIN = process.env.ADMIN_URL || 'http://localhost:3001'
const HOST = `pdt${Date.now().toString(36)}.localhost:3002`
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined })
let failed = 0
const ok = (name, cond, extra = '') => { console.log(`${cond ? '✓' : '✗'} ${name}${cond ? '' : ` — ${extra}`}`); if (!cond) failed++ }

await fetch(`${API}/cms-api/api/v1/dev/reset`, { method: 'POST' })
const p = await (await browser.newContext({ viewport: { width: 1360, height: 900 } })).newPage()
try {
  await p.goto(`${ADMIN}/dang-nhap`)
  await p.fill('input[autocomplete="username"]', 'tvanminh')
  await p.fill('input[type="password"]', 'Humg@2025')
  await p.click('form button[type="submit"]')
  await p.waitForURL(/\/cms$/, { timeout: 30000 })
  ok('Menu trái có "Trang đơn vị" (cms.admin)', await p.isVisible('a[href="/cms/trang-don-vi"]'))
  await p.click('a[href="/cms/trang-don-vi"]')
  await p.waitForSelector('tr:has-text("Mã: cntt")', { timeout: 20000 }).catch(() => {})
  const rows = await p.locator('table tbody tr').count()
  ok('Bảng liệt kê các trang hiện có (Trường + Khoa CNTT)', rows >= 2, rows)
  ok('Trang Trường không tắt được', await p.locator('tr', { hasText: 'Mã: humg' }).locator('.cms-vistoggle').isDisabled())

  /* tạo trang mới */
  await p.fill('label:has-text("Tên trang") input', 'Phòng Đào tạo')
  ok('Mã trang tự sinh từ tên (bỏ tiền tố "phong-")', (await p.inputValue('label:has-text("Mã trang") input')) === 'dao-tao')
  await p.selectOption('label:has-text("Đơn vị gốc") select', 'P-DT')
  await p.fill('label:has-text("Tên miền") textarea', HOST)
  await p.fill('label:has-text("Người phụ trách") input[type="search"]', 'Hoa')
  await p.locator('.cms-suggest button', { hasText: 'Nguyễn Thị Hoa' }).first().click({ timeout: 10000 })
  ok('Chọn được người phụ trách', await p.locator('.cms-chip', { hasText: 'Nguyễn Thị Hoa' }).isVisible(), await p.locator('label:has-text("Người phụ trách")').innerHTML())
  await p.click('button[type="submit"]:has-text("Tạo trang")')
  await p.waitForSelector('[role=status]:has-text("Đã tạo trang")', { timeout: 15000 }).catch(() => {})
  const row = p.locator('tr', { hasText: 'Mã: dao-tao' })
  ok('Trang mới có trong bảng kèm tên miền và số trang mẫu', await row.isVisible() && /trang/.test(await row.textContent()) && (await row.textContent()).includes(HOST))

  /* website nhận tên miền mới ngay */
  const w = await p.context().newPage()
  await w.goto(`http://${HOST}/`)
  const brand = await w.textContent('.site-header .brand__text strong', { timeout: 20000 })
  const title = await w.title()
  ok('Website tên miền mới: tiêu đề + thương hiệu của trang', /Phòng Đào tạo/.test(title) && /PHÒNG ĐÀO TẠO/.test(brand), `${title} | ${brand}`)
  const nav = await w.textContent('.site-header__nav')
  ok('Website tên miền mới: menu mẫu', /Tin tức – Sự kiện/.test(nav) && /Liên hệ/.test(nav), nav)

  /* chuyển CMS sang quản trị trang mới */
  await row.locator('button:has-text("Quản trị")').click()
  await p.waitForURL(/\/cms$/, { timeout: 20000 })
  await p.waitForTimeout(1000)
  const site = await p.getAttribute('.portal-shell__site', 'href')
  ok('Bấm "Quản trị" → CMS chuyển sang trang mới, "Xem website" mở đúng tên miền', String(site).includes(HOST), site)

  /* tắt trang */
  await p.goto(`${ADMIN}/cms/trang-don-vi`)
  await p.locator('tr', { hasText: 'Mã: dao-tao' }).locator('.cms-vistoggle').click()
  await p.waitForSelector('[role=status]:has-text("Đã tắt trang")', { timeout: 15000 }).catch(() => {})
  ok('Tắt trang → trạng thái "Đã tắt", ẩn nút Quản trị', (await p.locator('tr', { hasText: 'Mã: dao-tao' }).textContent()).includes('Đã tắt')
    && !(await p.locator('tr', { hasText: 'Mã: dao-tao' }).locator('button:has-text("Quản trị")').count()))
  const res = await w.goto(`http://${HOST}/`)
  const brand2 = await w.textContent('.site-header .brand__text strong', { timeout: 20000 }).catch((e) => e.message)
  ok('Tắt trang → tên miền về website Trường, không lỗi', res.status() === 200 && !/PHÒNG ĐÀO TẠO/.test(brand2), `${res.status()} ${brand2}`)
} catch (e) {
  ok('không có lỗi bất ngờ', false, e.message)
} finally {
  await browser.close()
  await fetch(`${API}/cms-api/api/v1/dev/reset`, { method: 'POST' })
}
console.log(failed ? `\n${failed} bước lỗi` : '\nTrang đơn vị: tất cả OK')
process.exit(failed ? 1 : 0)
