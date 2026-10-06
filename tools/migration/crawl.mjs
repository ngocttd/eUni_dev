// Duyệt toàn bộ route của một repo Next (đã chạy `next start`) và báo trang lỗi.
//   node crawl.mjs <thư-mục-repo> <base-url>
import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'

const repo = resolve(process.argv[2])
const base = process.argv[3]
const app = join(repo, 'src', 'app')
const mock = resolve('../../euni-api-mock/mock-data')

const routes = []
const walk = (d, segs = []) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) walk(p, /^\(.*\)$/.test(f) ? segs : [...segs, f])
    else if (/^page\.jsx?$/.test(f)) routes.push('/' + segs.join('/'))
  }
}
walk(app)

// ứng viên giá trị cho tham số động
const ids = new Set(); const slugs = new Set()
const collect = (v) => {
  if (Array.isArray(v)) v.forEach(collect)
  else if (v && typeof v === 'object') {
    if (typeof v.id === 'string') ids.add(v.id)
    if (typeof v.slug === 'string') slugs.add(v.slug)
    Object.entries(v).forEach(([k, x]) => { if (x && typeof x === 'object') { collect(x); if (!Array.isArray(x) && Object.keys(x).length && Object.values(x).every((y) => y && typeof y === 'object')) Object.keys(x).forEach((key) => ids.add(key)) } })
  }
}
for (const f of readdirSync(mock)) collect(JSON.parse(readFileSync(join(mock, f), 'utf8')))
const cms = await (await fetch('http://127.0.0.1:3000/cms-api/api/v1/public/site-content')).json()
cms.articles.forEach((a) => slugs.add(a.slug)); cms.events.forEach((a) => slugs.add(a.slug)); cms.albums.forEach((a) => slugs.add(a.slug)); cms.videos.forEach((a) => slugs.add(a.slug)); cms.podcasts.forEach((a) => slugs.add(a.slug))

const bad = []
let ok = 0
const hit = async (url) => {
  const res = await fetch(base + url, { redirect: 'manual' })
  const text = await res.text()
  return { status: res.status, text }
}
const isErr = (r) => r.status >= 500 || /Application error|digest="|Internal Server Error/.test(r.text)

for (const route of routes) {
  if (!route.includes('[')) {
    const r = await hit(route)
    if (isErr(r) || (r.status >= 400 && r.status !== 404)) bad.push(`${route} → ${r.status}`)
    else ok++
    continue
  }
  const cand = /\[slug\]/.test(route) ? [...slugs] : [...ids, ...slugs]
  let done = false
  for (const c of cand.slice(0, 400)) {
    const url = route.replace(/\[(\w+)\]/g, encodeURIComponent(c))
    const r = await hit(url)
    if (isErr(r)) { bad.push(`${url} → ${r.status}`); done = true; break }
    if (r.status === 200 && !/Không tìm thấy|Khong tim thay/.test(r.text)) { ok++; done = true; break }
  }
  if (!done) bad.push(`${route} → không tìm được tham số hợp lệ (có thể đúng là trang rỗng)`)
}
console.log(`${routes.length} route · ${ok} OK · ${bad.length} lỗi/không xác định`)
bad.forEach((b) => console.log(' ✘', b))
