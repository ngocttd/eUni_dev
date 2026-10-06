// Kiểm thử đăng xuất trên trình duyệt thật (chế độ AUTH_MODE=mock):
//   CMS admin, cổng My eUni, header website công khai, phiên hết hạn (API trả 401).
// Cần đang chạy: euni-api-mock :3000, euni-public :3002, euni-admin :3001.   node e2e-logout.mjs
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright')

const ADMIN = process.env.ADMIN_URL || 'http://localhost:3001'
const PUBLIC = process.env.PUBLIC_URL || 'http://localhost:3002'
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined })
let failed = 0
const ok = (name, cond, extra = '') => { console.log(`${cond ? '✓' : '✗'} ${name}${cond ? '' : ` — ${extra}`}`); if (!cond) failed++ }
/* chờ thông báo trên trang đăng nhập (hiện sau khi trang hydrate) */
const seen = (p, text) => p.locator('[role=status]').filter({ hasText: text }).first().waitFor({ timeout: 8000 }).then(() => true, () => false)
const fresh = async () => (await browser.newContext({ viewport: { width: 1360, height: 860 } })).newPage()

/* ---------- CMS admin ---------- */
{
  const p = await fresh()
  await p.goto(`${ADMIN}/dang-nhap`)
  await p.fill('input[autocomplete="username"]', 'tvanminh')
  await p.fill('input[type="password"]', 'Humg@2025')
  await p.click('form button[type="submit"]')
  await p.waitForURL(/\/cms$/, { timeout: 30000 })
  ok('CMS: thanh trên cùng có nút Đăng xuất', await p.isVisible('.portal-shell__exit:has-text("Đăng xuất")'))
  const site = await p.getAttribute('.portal-shell__site', 'href')
  ok('CMS: nút "Xem website" mở website công khai ở tab mới', String(site).startsWith(PUBLIC) && (await p.getAttribute('.portal-shell__site', 'target')) === '_blank', site)
  await p.click('.portal-shell__exit')
  await p.waitForURL(/\/dang-nhap/, { timeout: 15000 })
  ok('CMS: đăng xuất → về trang đăng nhập của CMS (không về trang chủ website)', new URL(p.url()).origin === new URL(ADMIN).origin && /\/dang-nhap/.test(p.url()), p.url())
  ok('CMS: trang đăng nhập báo "Bạn đã đăng xuất"', await seen(p, 'đã đăng xuất'))
  ok('CMS: phiên đã xóa khỏi trình duyệt', await p.evaluate(() => !Object.keys(sessionStorage).some((k) => /token|session/i.test(k) && sessionStorage.getItem(k) && sessionStorage.getItem(k) !== 'null')))
  await p.goto(`${ADMIN}/cms/bai-viet`)
  await p.waitForURL(/\/dang-nhap/, { timeout: 15000 })
  ok('CMS: mở lại trang quản trị sau khi đăng xuất → bị đưa về đăng nhập', /\/dang-nhap/.test(p.url()), p.url())
  await p.reload()
  ok('CMS: thông báo đăng xuất chỉ hiện một lần', !(await p.locator('[role=status]').filter({ hasText: 'đã đăng xuất' }).count()))
}

/* ---------- Phiên hết hạn (token không còn hợp lệ → API 401) ---------- */
{
  const p = await fresh()
  await p.goto(`${ADMIN}/dang-nhap`)
  await p.fill('input[autocomplete="username"]', 'tvanminh')
  await p.fill('input[type="password"]', 'Humg@2025')
  await p.click('form button[type="submit"]')
  await p.waitForURL(/\/cms$/, { timeout: 30000 })
  // làm hỏng token đang lưu (giống token hết hạn / bị thu hồi)
  await p.evaluate(() => { for (const k of Object.keys(sessionStorage)) { const v = sessionStorage.getItem(k); if (v && v.includes('accessToken')) { const s = JSON.parse(v); s.accessToken = 'het-han'; sessionStorage.setItem(k, JSON.stringify(s)) } } })
  await p.goto(`${ADMIN}/cms/bai-viet`)
  await p.waitForURL(/\/dang-nhap/, { timeout: 20000 }).catch(() => {})
  ok('Hết phiên: API trả 401 → tự đăng xuất, về trang đăng nhập', /\/dang-nhap/.test(p.url()), p.url())
  ok('Hết phiên: báo "Phiên đăng nhập đã hết hạn"', await seen(p, 'hết hạn'))
}

/* ---------- Cổng My eUni + header website ---------- */
{
  const p = await fresh()
  await p.goto(`${PUBLIC}/dang-nhap`)
  await p.click('text=Sinh viên')
  await p.waitForURL(/\/euni\/sinh-vien/, { timeout: 30000 })
  ok('Portal: thanh trên cùng có Trang chủ + Đăng xuất', await p.isVisible('.portal-shell__site') && await p.isVisible('.portal-shell__exit:has-text("Đăng xuất")'))
  await p.click('.portal-shell__site')
  await p.waitForURL((u) => new URL(u).pathname === '/', { timeout: 15000 })
  ok('Website: đã đăng nhập thì header hiện "My eUni" và nút Đăng xuất', await p.isVisible('.site-header__login:has-text("My eUni")') && await p.isVisible('button[aria-label="Đăng xuất"]'))
  await p.click('button[aria-label="Đăng xuất"]')
  await p.waitForURL(/\/dang-nhap/, { timeout: 15000 })
  ok('Website: đăng xuất → trang đăng nhập + thông báo', await seen(p, 'đã đăng xuất'))
  await p.goto(`${PUBLIC}/`)
  ok('Website: sau khi đăng xuất header trở lại "Đăng nhập eUni"', await p.isVisible('.site-header__login:has-text("Đăng nhập eUni")'))
  await p.goto(`${PUBLIC}/euni/sinh-vien`)
  await p.waitForURL(/\/dang-nhap/, { timeout: 15000 })
  ok('Portal: mở lại cổng sau khi đăng xuất → về đăng nhập', /\/dang-nhap/.test(p.url()), p.url())
  // đăng xuất từ trong cổng
  await p.click('text=Giảng viên')
  await p.waitForURL(/\/euni\/giang-vien/, { timeout: 30000 })
  await p.click('.portal-shell__exit')
  await p.waitForURL(/\/dang-nhap/, { timeout: 15000 })
  ok('Portal: bấm Đăng xuất trong cổng → trang đăng nhập', /\/dang-nhap/.test(p.url()), p.url())
}

await browser.close()
console.log(failed ? `\n${failed} bước lỗi` : '\nĐăng xuất: tất cả OK')
process.exit(failed ? 1 : 0)
