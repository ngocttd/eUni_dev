// Rà giao diện CMS admin: đăng nhập, mở từng màn hình, chụp ảnh toàn trang và liệt kê nút/ô nhập/bảng thiếu nhãn.
//   node ui-audit.mjs <thư-mục-ảnh>      (cần mock :3000 và euni-admin :3001; CHROME=<đường dẫn> nếu không dùng Chromium của Playwright)
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const OUT = process.argv[2]
const ROUTES = ['', 'bai-viet', 'bai-viet/moi', 'thong-bao', 'thong-bao/moi', 'danh-muc', 'media', 'trang-chu', 'trang-menu', 'banner', 'su-kien', 'album', 'video', 'podcast', 'tuyen-sinh', 'hoc-tap', 'nghien-cuu', 'phan-quyen', 'nhat-ky', 'sao-luu', 'cau-hinh']
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined })
const page = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
page.on('pageerror', (e) => errs.push(e.message))
await page.goto('http://localhost:3001/dang-nhap')
await page.fill('input[autocomplete="username"]', 'tvanminh')
await page.fill('input[type="password"]', 'Humg@2025')
await page.click('form button[type="submit"]')
await page.waitForURL(/\/cms$/, { timeout: 60000 })
const report = {}
for (const r of ROUTES) {
  await page.goto('http://localhost:3001/cms/' + r, { waitUntil: 'networkidle' }).catch(() => {})
  await page.waitForTimeout(1200)
  const name = r.replace(/\//g, '_') || 'dashboard'
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  report[r || 'dashboard'] = await page.evaluate(() => {
    const vis = (e) => { const s = getComputedStyle(e); const rc = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && rc.width > 0 && rc.height > 0 }
    const desc = (e) => `${e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : ''} «${(e.innerText || e.value || '').trim().slice(0, 40)}» in ${e.closest('[class]')?.parentElement?.className?.toString().slice(0, 40)}`
    const accName = (e) => (e.getAttribute('aria-label') || e.getAttribute('title') || e.innerText || e.getAttribute('aria-labelledby') || '').trim()
    const labelOf = (e) => e.closest('label') || (e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`)) || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.getAttribute('title')
    const main = document.querySelector('main') || document.body
    const out = { iconBtn: [], unlabeledInput: [], placeholderOnly: [], tableNoHead: [], emptyTh: [] }
    main.querySelectorAll('button, a[role=button], [role=button]').forEach((e) => { if (vis(e) && !accName(e)) out.iconBtn.push(desc(e) + ' html=' + e.innerHTML.slice(0, 60)) ; else if (vis(e) && !e.getAttribute('title') && !e.getAttribute('aria-label') && (e.innerText || '').trim().length <= 2) out.iconBtn.push('SHORT ' + desc(e)) })
    main.querySelectorAll('input:not([type=hidden]), select, textarea').forEach((e) => {
      if (!vis(e) && e.type !== 'checkbox') return
      const l = labelOf(e)
      if (!l) (e.placeholder ? out.placeholderOnly : out.unlabeledInput).push(`${e.tagName.toLowerCase()}[${e.type || ''}] ph="${e.placeholder || ''}" ${desc(e.parentElement)}`)
      else if (l.tagName === 'LABEL' && !l.innerText.trim() ) out.unlabeledInput.push(`EMPTY-LABEL ${e.tagName.toLowerCase()}[${e.type}] ${desc(e.parentElement)}`)
    })
    main.querySelectorAll('table').forEach((t) => { if (!t.querySelector('th')) out.tableNoHead.push(desc(t)); t.querySelectorAll('th').forEach((th) => { if (!th.innerText.trim() && !th.getAttribute('aria-label')) out.emptyTh.push(desc(t)) }) })
    for (const k of Object.keys(out)) out[k] = [...new Set(out[k])]
    return out
  })
}
console.log(JSON.stringify(report, null, 1))
console.log('errors', errs)
await b.close()
