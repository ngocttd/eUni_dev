// So sánh hình ảnh (pixel) giữa bản Vite cũ (:4173) và bản Next mới (:3002).  node visual.mjs
import { chromium } from 'playwright-core'
import { PNG } from 'pngjs'
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const OLD = 'http://localhost:4173'
const NEW = 'http://localhost:3002'
const API = 'http://127.0.0.1:3000'

const routes = []
const walk = (d, segs = []) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) walk(p, /^\(.*\)$/.test(f) ? segs : [...segs, f])
    else if (f === 'page.jsx') routes.push('/' + segs.join('/'))
  }
}
walk(join(resolve('../../euni-public'), 'src', 'app'))
const samples = {
  '/tin-tuc/[slug]': 'le-ky-niem-60-nam-thanh-lap', '/su-kien/[slug]': 'hoi-thao-khoa-hoc-quoc-te-dia-chat-khoang-san',
  '/media/anh/[slug]': 'le-ky-niem-60-nam', '/media/video/[slug]': 'humg-60-nam-mot-chang-duong', '/media/podcast/[slug]': 'chuyen-nghe-dia-chat',
}
const list = routes.filter((r) => !r.startsWith('/euni') && !/^\/(dang-nhap|doi-mat-khau|quen-mat-khau)/.test(r)).flatMap((r) => (r.includes('[') ? (samples[r] ? [r.replace(/\[\w+\]/, samples[r])] : []) : [r]))
const portal = routes.filter((r) => r.startsWith('/euni') && !r.includes('['))

const diff = (a, b) => {
  const A = PNG.sync.read(a); const B = PNG.sync.read(b)
  if (A.width !== B.width || A.height !== B.height) return 1
  let n = 0
  for (let i = 0; i < A.data.length; i += 4) {
    if (Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2]) > 48) n++
  }
  return n / (A.width * A.height)
}

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const shot = async (page, url) => {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(400)
  return page.screenshot({ clip: { x: 0, y: 0, width: 1280, height: 1400 } })
}
const worst = []
async function compare(label, paths, setupOld, setupNew) {
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 1400 } }); const ctxB = await browser.newContext({ viewport: { width: 1280, height: 1400 } })
  if (setupOld) await ctxA.addInitScript(setupOld.fn, setupOld.arg)
  if (setupNew) await ctxB.addInitScript(setupNew.fn, setupNew.arg)
  const a = await ctxA.newPage(); const b = await ctxB.newPage()
  let bad = 0
  for (const r of paths) {
    try {
      const d = diff(await shot(a, OLD + r), await shot(b, NEW + r))
      worst.push([d, `${label} ${r}`])
      if (d > 0.02) bad++
    } catch (e) { worst.push([1, `${label} ${r} (${e.message.slice(0, 60)})`]); bad++ }
  }
  console.log(`${label}: ${paths.length - bad}/${paths.length} gần như giống hệt (<2% pixel khác)`)
  await ctxA.close(); await ctxB.close()
}

await compare('public', list)
const login = async (role) => (await fetch(`${API}/auth-api/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) })).json()
const MOCK = { student: ['sinh-vien', 'student'], lecturer: ['giang-vien', 'lecturer'], parent: ['phu-huynh', 'parent'], manager: ['lanh-dao', 'manager'] }
for (const [role, [seg]] of Object.entries(MOCK)) {
  const s = await login(role)
  const set = (user) => { window.localStorage.setItem('humg-mock-user', JSON.stringify(user)) }
  await compare(`portal/${role}`, portal.filter((r) => r.startsWith(`/euni/${seg}`)),
    { fn: (u) => window.localStorage.setItem('humg-mock-user', JSON.stringify(u)), arg: s.user },
    { fn: (x) => window.sessionStorage.setItem('humg-session', JSON.stringify(x)), arg: { accessToken: s.accessToken, user: s.user } })
}
await browser.close()
worst.sort((x, y) => y[0] - x[0])
console.log('\nKhác biệt lớn nhất:')
worst.slice(0, 25).forEach(([d, p]) => console.log(` ${(d * 100).toFixed(1).padStart(5)}%  ${p}`))
