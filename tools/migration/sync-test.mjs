// Kiểm tra đồng bộ CMS admin → website public: sửa qua cms-api (như CMS admin làm) rồi đọc HTML từ euni-public.
import assert from 'node:assert/strict'

const API = 'http://127.0.0.1:3000'
const PUBLIC = 'http://localhost:3002'
const j = async (method, path, body, token) => {
  const res = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text}`)
  return text ? JSON.parse(text) : null
}
const page = async (path) => (await fetch(PUBLIC + path)).text()
const step = async (name, fn) => { try { await fn(); console.log('✔', name) } catch (e) { console.log('✘', name, '\n   ', e.message); process.exitCode = 1 } }

await j('POST', '/cms-api/api/_dev/reset')
const { accessToken: t } = await j('POST', '/auth-api/api/auth/login', { username: 'tvanminh', password: 'Humg@2025' })

const stamp = Date.now().toString(36)
let created

await step('Không đăng nhập thì API quản trị trả 401', async () => {
  const res = await fetch(`${API}/cms-api/api/Contents`)
  assert.equal(res.status, 401)
})

await step('Tạo bài viết mới (xuất bản) → xuất hiện ở /tin-tuc và trang chi tiết', async () => {
  created = await j('POST', '/cms-api/api/Contents', { title: `Bài kiểm thử đồng bộ ${stamp}`, excerpt: 'Tóm tắt kiểm thử', status: 2, categoryId: 1, contentBody: JSON.stringify(['Đoạn nội dung kiểm thử']) }, t)
  assert.ok(created.id)
  assert.match(await page('/tin-tuc'), new RegExp(`Bài kiểm thử đồng bộ ${stamp}`))
  const detail = await page(`/tin-tuc/${created.slug}`)
  assert.match(detail, /Đoạn nội dung kiểm thử/)
})

await step('Sửa tiêu đề bài viết → public đổi theo', async () => {
  await j('PUT', `/cms-api/api/Contents/${created.id}`, { title: `Đã sửa tiêu đề ${stamp}` }, t)
  assert.match(await page('/tin-tuc'), new RegExp(`Đã sửa tiêu đề ${stamp}`))
})

await step('Gỡ bài (workflow unpublish → Bản nháp) → biến mất khỏi public', async () => {
  await j('POST', `/cms-api/api/Contents/${created.id}/workflow/unpublish`, {}, t)
  assert.doesNotMatch(await page('/tin-tuc'), new RegExp(`Đã sửa tiêu đề ${stamp}`))
})

await step('Bài nổi bật trang chủ: bật showOnHome + isFeatured → hiện ở trang chủ', async () => {
  await j('PUT', `/cms-api/api/Contents/${created.id}`, { showOnHome: true, isFeatured: true }, t)
  await j('POST', `/cms-api/api/Contents/${created.id}/workflow/publish`, { publishAt: new Date(Date.now() - 1000).toISOString() }, t)
  const all = await j('GET', '/cms-api/api/Contents?pageSize=100', null, t)
  for (const c of all.items) if (c.id !== created.id && c.isFeatured) await j('PUT', `/cms-api/api/Contents/${c.id}`, { isFeatured: false }, t)
  assert.match(await page('/'), new RegExp(`Đã sửa tiêu đề ${stamp}`))
})

await step('Xóa bài viết → mất ở public (404 trang chi tiết)', async () => {
  const res = await fetch(`${API}/cms-api/api/Contents/${created.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } })
  assert.equal(res.status, 204)
  assert.doesNotMatch(await page('/tin-tuc'), new RegExp(`Đã sửa tiêu đề ${stamp}`))
  assert.doesNotMatch(await page('/'), new RegExp(`Đã sửa tiêu đề ${stamp}`))
})

await step('Sửa hero slide trang chủ → đổi trên public', async () => {
  const slides = await j('GET', '/cms-api/api/HeroSlides', null, t)
  await j('PUT', `/cms-api/api/HeroSlides/${slides.items[0].id}`, { kicker: `KICKER ${stamp}` }, t)
  assert.match(await page('/'), new RegExp(`KICKER ${stamp}`))
})

await step('Thêm đối tác + chỉ số → hiện ở trang chủ', async () => {
  await j('POST', '/cms-api/api/Partners', { name: `Đối tác ${stamp}`, shortName: 'TST', color: '#123456' }, t)
  assert.match(await page('/'), new RegExp(`Đối tác ${stamp}`))
})

await step('Thêm sự kiện → hiện ở /su-kien', async () => {
  const ev = await j('POST', '/cms-api/api/Events', { title: `Sự kiện kiểm thử ${stamp}`, startsAt: '2027-01-15T08:00:00+07:00', endsAt: '2027-01-15T11:00:00+07:00', place: 'Hội trường Z', organizer: 'Test' }, t)
  assert.match(await page('/su-kien'), new RegExp(`Sự kiện kiểm thử ${stamp}`))
  assert.match(await page(`/su-kien/${ev.slug}`), /Hội trường Z/)
})

await step('Ẩn video → mất ở /media', async () => {
  const vids = await j('GET', '/cms-api/api/Videos', null, t)
  const v = vids.items[0]
  assert.match(await page('/media'), new RegExp(v.title.slice(0, 20)))
  await j('PUT', `/cms-api/api/Videos/${v.id}`, { isVisible: false }, t)
  assert.doesNotMatch(await page('/media'), new RegExp(v.title.slice(0, 20)))
})

await j('POST', '/cms-api/api/_dev/reset')
console.log(process.exitCode ? '\nCÓ LỖI' : '\nĐồng bộ admin → public: OK')
