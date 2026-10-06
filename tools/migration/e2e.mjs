// E2E nhẹ bằng trình duyệt thật (Edge): đăng nhập qua auth-api, mở mọi trang của portal & CMS admin,
// bắt lỗi JS (pageerror / console.error) và màn hình lỗi dữ liệu.   node e2e.mjs
import { chromium } from 'playwright-core'
import { readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const API = 'http://127.0.0.1:3000'
const login = async (body) => (await fetch(`${API}/auth-api/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json()

const routesOf = (repo, prefix) => {
  const out = []
  const root = join(resolve(repo), 'src', 'app')
  const walk = (d, segs = []) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f)
      if (statSync(p).isDirectory()) walk(p, /^\(.*\)$/.test(f) ? segs : [...segs, f])
      else if (f === 'page.jsx') out.push('/' + segs.join('/'))
    }
  }
  walk(root)
  return out.filter((r) => r.startsWith(prefix))
}

const browser = await chromium.launch({ channel: 'msedge', headless: true })
let failures = 0

async function run(label, base, session, routes, fill = (r) => r) {
  const ctx = await browser.newContext()
  await ctx.addInitScript((s) => { try { window.sessionStorage.setItem('humg-session', JSON.stringify(s)) } catch {} }, session)
  const page = await ctx.newPage()
  let errs = []
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errs.push(`console: ${m.text().slice(0, 200)}`) })
  let ok = 0
  for (const r of routes) {
    errs = []
    const url = base + fill(r)
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(250)
      const text = await page.evaluate(() => document.body.innerText)
      const url2 = page.url()
      if (/Không tải được dữ liệu|Application error|Đang tải dữ liệu/.test(text)) errs.push(`màn hình lỗi/đang tải: ${text.slice(0, 80).replace(/\n/g, ' ')}`)
      if (!url2.startsWith(base + fill(r).split('?')[0])) errs.push(`bị chuyển hướng → ${url2}`)
    } catch (e) { errs.push(`goto: ${e.message.slice(0, 120)}`) }
    if (errs.length) { failures++; console.log(` ✘ ${label} ${fill(r)}\n     ${[...new Set(errs)].join('\n     ')}`) } else ok++
  }
  console.log(`${label}: ${ok}/${routes.length} trang OK`)
  await ctx.close()
}

const portalRoutes = routesOf('../../euni-public', '/euni')
for (const [role, prefix] of [['student', '/euni/sinh-vien'], ['lecturer', '/euni/giang-vien'], ['staff', '/euni/giang-vien'], ['parent', '/euni/phu-huynh'], ['manager', '/euni/lanh-dao']]) {
  const s = await login({ role })
  await run(`portal/${role}`, 'http://localhost:3002', { accessToken: s.accessToken, user: s.user }, portalRoutes.filter((r) => r.startsWith(prefix)))
}

const a = await login({ username: 'tvanminh', password: 'Humg@2025' })
await run('admin', 'http://localhost:3001', { accessToken: a.accessToken, user: a.user }, routesOf('../../euni-admin', '/cms'), (r) => r.replace('[id]', '1'))

// phân quyền: sinh viên không vào được CMS portal khác, chưa đăng nhập bị chuyển tới /dang-nhap
{
  const ctx = await browser.newContext(); const page = await ctx.newPage()
  await page.goto('http://localhost:3002/euni/sinh-vien', { waitUntil: 'networkidle' })
  const u = page.url()
  if (!/\/dang-nhap\?next=/.test(u)) { failures++; console.log(' ✘ chưa đăng nhập phải chuyển tới /dang-nhap, thực tế:', u) } else console.log('guard portal: OK (→ ' + u + ')')
  await ctx.close()
}
await browser.close()
console.log(failures ? `\nCÓ ${failures} TRANG LỖI` : '\nE2E: tất cả OK')
process.exitCode = failures ? 1 : 0
