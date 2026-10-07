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

await j('POST', '/cms-api/api/v1/dev/reset')
const { accessToken: t } = await j('POST', '/auth-api/api/v1/auth/login', { username: 'tvanminh', password: 'Humg@2025' })

const stamp = Date.now().toString(36)
let created

await step('Không đăng nhập thì API quản trị trả 401', async () => {
  const res = await fetch(`${API}/cms-api/api/v1/admin/contents`)
  assert.equal(res.status, 401)
})

await step('Tạo bài viết mới (xuất bản) → xuất hiện ở /tin-tuc và trang chi tiết', async () => {
  created = await j('POST', '/cms-api/api/v1/admin/contents', { title: `Bài kiểm thử đồng bộ ${stamp}`, excerpt: 'Tóm tắt kiểm thử', status: 2, categoryId: 1, contentBody: JSON.stringify(['Đoạn nội dung kiểm thử']) }, t)
  assert.ok(created.id)
  assert.match(await page('/tin-tuc'), new RegExp(`Bài kiểm thử đồng bộ ${stamp}`))
  const detail = await page(`/tin-tuc/${created.slug}`)
  assert.match(detail, /Đoạn nội dung kiểm thử/)
})

await step('Sửa tiêu đề bài viết → public đổi theo', async () => {
  await j('PUT', `/cms-api/api/v1/admin/contents/${created.id}`, { title: `Đã sửa tiêu đề ${stamp}` }, t)
  assert.match(await page('/tin-tuc'), new RegExp(`Đã sửa tiêu đề ${stamp}`))
})

await step('Gỡ bài (workflow unpublish → Bản nháp) → biến mất khỏi public', async () => {
  await j('POST', `/cms-api/api/v1/admin/contents/${created.id}/workflow/unpublish`, {}, t)
  assert.doesNotMatch(await page('/tin-tuc'), new RegExp(`Đã sửa tiêu đề ${stamp}`))
})

await step('Bài nổi bật trang chủ: bật showOnHome + isFeatured → hiện ở trang chủ', async () => {
  await j('PUT', `/cms-api/api/v1/admin/contents/${created.id}`, { showOnHome: true, isFeatured: true }, t)
  await j('POST', `/cms-api/api/v1/admin/contents/${created.id}/workflow/publish`, { publishAt: new Date(Date.now() - 1000).toISOString() }, t)
  const all = await j('GET', '/cms-api/api/v1/admin/contents?pageSize=100', null, t)
  for (const c of all.items) if (c.id !== created.id && c.isFeatured) await j('PUT', `/cms-api/api/v1/admin/contents/${c.id}`, { isFeatured: false }, t)
  assert.match(await page('/'), new RegExp(`Đã sửa tiêu đề ${stamp}`))
})

await step('Xóa bài viết → mất ở public (404 trang chi tiết)', async () => {
  const res = await fetch(`${API}/cms-api/api/v1/admin/contents/${created.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } })
  assert.equal(res.status, 204)
  assert.doesNotMatch(await page('/tin-tuc'), new RegExp(`Đã sửa tiêu đề ${stamp}`))
  assert.doesNotMatch(await page('/'), new RegExp(`Đã sửa tiêu đề ${stamp}`))
})

await step('Sửa hero slide trang chủ → đổi trên public', async () => {
  const slides = await j('GET', '/cms-api/api/v1/admin/hero-slides', null, t)
  await j('PUT', `/cms-api/api/v1/admin/hero-slides/${slides.items[0].id}`, { kicker: `KICKER ${stamp}` }, t)
  assert.match(await page('/'), new RegExp(`KICKER ${stamp}`))
})

await step('Thêm đối tác + chỉ số → hiện ở trang chủ', async () => {
  await j('POST', '/cms-api/api/v1/admin/partners', { name: `Đối tác ${stamp}`, shortName: 'TST', color: '#123456' }, t)
  assert.match(await page('/'), new RegExp(`Đối tác ${stamp}`))
})

await step('Thêm sự kiện → hiện ở /su-kien', async () => {
  const ev = await j('POST', '/cms-api/api/v1/admin/events', { title: `Sự kiện kiểm thử ${stamp}`, startsAt: '2027-01-15T08:00:00+07:00', endsAt: '2027-01-15T11:00:00+07:00', place: 'Hội trường Z', organizer: 'Test' }, t)
  assert.match(await page('/su-kien'), new RegExp(`Sự kiện kiểm thử ${stamp}`))
  assert.match(await page(`/su-kien/${ev.slug}`), /Hội trường Z/)
})

await step('Ẩn video → mất ở /media', async () => {
  const vids = await j('GET', '/cms-api/api/v1/admin/videos', null, t)
  const v = vids.items[0]
  assert.match(await page('/media'), new RegExp(v.title.slice(0, 20)))
  await j('PUT', `/cms-api/api/v1/admin/videos/${v.id}`, { isVisible: false }, t)
  assert.doesNotMatch(await page('/media'), new RegExp(v.title.slice(0, 20)))
})

/* ---------- Cấu hình chung, menu, banner, trang tĩnh ---------- */
const C = '/cms-api/api/v1/admin'

await step('Sửa Cấu hình → Thông tin chung (điện thoại, địa chỉ) → chân trang đổi theo', async () => {
  const general = await j('GET', `${C}/settings/general`, null, t)
  await j('PUT', `${C}/settings/general`, { ...general, phone: `024.9999.${stamp.slice(-4)}`, address: `Địa chỉ kiểm thử ${stamp}` }, t)
  const html = await page('/tin-tuc')
  assert.match(html, new RegExp(`024.9999.${stamp.slice(-4)}`))
  assert.match(html, new RegExp(`Địa chỉ kiểm thử ${stamp}`))
})

let menuItem
await step('Thêm mục con vào menu đầu trang → hiện trên header; ẩn → mất', async () => {
  const all = (await j('GET', `${C}/menu-items?pageSize=500`, null, t)).items
  const parent = all.find((m) => m.groupCode === 'header' && !m.parentId && m.label === 'Giới thiệu HUMG')
  menuItem = await j('POST', `${C}/menu-items`, { groupCode: 'header', parentId: parent.id, label: `Mục menu ${stamp}`, url: '/gioi-thieu/lich-su', type: 'page', sortOrder: 99, isVisible: true }, t)
  assert.match(await page('/'), new RegExp(`Mục menu ${stamp}`))
  await j('PUT', `${C}/menu-items/${menuItem.id}`, { isVisible: false }, t)
  assert.doesNotMatch(await page('/'), new RegExp(`Mục menu ${stamp}`))
})

await step('Đổi nhãn cột và liên kết chân trang → đổi theo; xóa liên kết → mất', async () => {
  const all = (await j('GET', `${C}/menu-items?pageSize=500`, null, t)).items
  const col = all.find((m) => m.groupCode === 'footer' && !m.parentId)
  await j('PUT', `${C}/menu-items/${col.id}`, { label: `Cột chân trang ${stamp}` }, t)
  const child = all.find((m) => m.parentId === col.id)
  await j('PUT', `${C}/menu-items/${child.id}`, { label: `Liên kết chân trang ${stamp}` }, t)
  let html = await page('/lien-he')
  assert.match(html, new RegExp(`Cột chân trang ${stamp}`))
  assert.match(html, new RegExp(`Liên kết chân trang ${stamp}`))
  await j('DELETE', `${C}/menu-items/${child.id}`, null, t)
  html = await page('/lien-he')
  assert.doesNotMatch(html, new RegExp(`Liên kết chân trang ${stamp}`))
})

await step('Thêm banner trang chủ → hiện; hết hạn hoặc ẩn → không hiện', async () => {
  const today = new Date().toISOString().slice(0, 10)
  const bn = await j('POST', `${C}/banners`, { title: `Banner kiểm thử ${stamp}`, subtitle: 'Dòng mô tả', position: 'home_slider', linkUrl: '/tin-tuc', isVisible: true, startsOn: today, endsOn: null, sortOrder: 1 }, t)
  assert.match(await page('/'), new RegExp(`Banner kiểm thử ${stamp}`))
  await j('PUT', `${C}/banners/${bn.id}`, { endsOn: '2020-01-01' }, t)
  assert.doesNotMatch(await page('/'), new RegExp(`Banner kiểm thử ${stamp}`))
  await j('PUT', `${C}/banners/${bn.id}`, { endsOn: null, isVisible: false }, t)
  assert.doesNotMatch(await page('/'), new RegExp(`Banner kiểm thử ${stamp}`))
})

await step('Banner cột phải hiện ở trang tin tức', async () => {
  const bn = await j('POST', `${C}/banners`, { title: `Banner cột phải ${stamp}`, position: 'sidebar_right', isVisible: true, sortOrder: 1 }, t)
  assert.match(await page('/tin-tuc'), new RegExp(`Banner cột phải ${stamp}`))
  await j('DELETE', `${C}/banners/${bn.id}`, null, t)
  assert.doesNotMatch(await page('/tin-tuc'), new RegExp(`Banner cột phải ${stamp}`))
})

await step('Trang tĩnh: tạo + xuất bản → /trang/{slug} hiện; sửa → đổi; nháp → 404; xóa → 404', async () => {
  const slug = `trang-kiem-thu-${stamp}`
  const pg = await j('POST', `${C}/pages`, { title: `Trang kiểm thử ${stamp}`, slug, template: 'default', status: 'published', bodyHtml: '<p>Nội dung ban đầu</p>' }, t)
  let res = await fetch(`${PUBLIC}/trang/${slug}`)
  assert.equal(res.status, 200)
  assert.match(await res.text(), /Nội dung ban đầu/)
  await j('PUT', `${C}/pages/${pg.id}`, { bodyHtml: '<p>Nội dung đã sửa</p><script>alert(1)</script>' }, t)
  const html = await page(`/trang/${slug}`)
  assert.match(html, /Nội dung đã sửa/)
  assert.doesNotMatch(html, /alert\(1\)/, 'HTML phải được làm sạch')
  await j('PUT', `${C}/pages/${pg.id}`, { status: 'draft' }, t)
  assert.equal((await fetch(`${PUBLIC}/trang/${slug}`)).status, 404)
  await j('PUT', `${C}/pages/${pg.id}`, { status: 'published' }, t)
  await j('DELETE', `${C}/pages/${pg.id}`, null, t)
  assert.equal((await fetch(`${PUBLIC}/trang/${slug}`)).status, 404)
})

await step('Trang tĩnh mẫu được liên kết từ chân trang', async () => {
  assert.match(await page('/'), /\/trang\/chinh-sach-bao-mat/)
  assert.match(await page('/trang/chinh-sach-bao-mat'), /Thông tin thu thập/)
})

/* ---------- Website Khoa (tenant cntt): cùng API, dữ liệu riêng ---------- */
const KHOA = 'cntt.localhost:3002'
const jt = async (method, path, body, token, tenant) => {
  const res = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', 'X-Tenant': tenant, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const text = await res.text()
  if (!res.ok) throw Object.assign(new Error(`${method} ${path} → ${res.status} ${text}`), { status: res.status })
  return text ? JSON.parse(text) : null
}
/* website suy ra tenant theo host (x-forwarded-host khi đi qua proxy/gateway) */
const pageOn = async (host, path) => (await fetch(PUBLIC + path, { headers: { 'x-forwarded-host': host } })).text()
const statusOn = async (host, path) => (await fetch(PUBLIC + path, { headers: { 'x-forwarded-host': host } })).status
const { accessToken: tk } = await j('POST', '/auth-api/api/v1/auth/login', { username: 'pvloc', password: 'Humg@2025' })

await step('Website Khoa: tên, menu, liên hệ của Khoa — không lẫn của Trường', async () => {
  const html = await pageOn(KHOA, '/')
  assert.match(html, /KHOA CÔNG NGHỆ THÔNG TIN/)
  assert.match(html, /Giới thiệu Khoa/)
  assert.match(html, /024\.3838\.9633/)
  assert.doesNotMatch(html, /Thông điệp Hiệu trưởng/, 'không được hiện menu của Trường')
  const truong = await page('/')
  assert.match(truong, /Thông điệp Hiệu trưởng/)
  assert.doesNotMatch(truong, /Giới thiệu Khoa/)
})

await step('Admin Khoa thêm mục menu → hiện ở website Khoa, website Trường không có', async () => {
  const all = (await jt('GET', `${C}/menu-items?pageSize=500`, null, tk, 'cntt')).items
  const parent = all.find((m) => m.groupCode === 'header' && !m.parentId && m.label === 'Giới thiệu Khoa')
  await jt('POST', `${C}/menu-items`, { groupCode: 'header', parentId: parent.id, label: `Menu Khoa ${stamp}`, url: '/trang/cac-bo-mon', type: 'page', sortOrder: 9, isVisible: true }, tk, 'cntt')
  assert.match(await pageOn(KHOA, '/'), new RegExp(`Menu Khoa ${stamp}`))
  assert.doesNotMatch(await page('/'), new RegExp(`Menu Khoa ${stamp}`))
})

await step('Admin Khoa thêm banner → chỉ website Khoa hiện', async () => {
  await jt('POST', `${C}/banners`, { title: `Banner Khoa ${stamp}`, position: 'home_slider', isVisible: true, sortOrder: 1 }, tk, 'cntt')
  assert.match(await pageOn(KHOA, '/'), new RegExp(`Banner Khoa ${stamp}`))
  assert.doesNotMatch(await page('/'), new RegExp(`Banner Khoa ${stamp}`))
})

await step('Admin Khoa tạo trang tĩnh → /trang/{slug} có ở Khoa, Trường 404', async () => {
  const slug = `trang-khoa-${stamp}`
  await jt('POST', `${C}/pages`, { title: `Trang Khoa ${stamp}`, slug, status: 'published', bodyHtml: '<p>Nội dung của Khoa</p>' }, tk, 'cntt')
  assert.equal(await statusOn(KHOA, `/trang/${slug}`), 200)
  assert.match(await pageOn(KHOA, `/trang/${slug}`), /Nội dung của Khoa/)
  assert.equal(await statusOn('localhost:3002', `/trang/${slug}`), 404)
})

await step('Admin Khoa đăng bài → hiện ở /tin-tuc của Khoa, không lên website Trường', async () => {
  const cats = (await jt('GET', `${C}/categories?pageSize=50`, null, tk, 'cntt')).items
  await jt('POST', `${C}/contents`, { title: `Tin Khoa ${stamp}`, categoryId: cats[0].id, ownerUnitCode: 'CNTT', status: 'published', contentBody: '<p>x</p>' }, tk, 'cntt')
  assert.match(await pageOn(KHOA, '/tin-tuc'), new RegExp(`Tin Khoa ${stamp}`))
  assert.doesNotMatch(await page('/tin-tuc'), new RegExp(`Tin Khoa ${stamp}`))
})

await step('Cấu hình Khoa: biên tập viên Khoa không có quyền (403); quản trị sửa → chỉ chân trang Khoa đổi', async () => {
  await assert.rejects(() => jt('PUT', `${C}/settings/general`, { phone: '000' }, tk, 'cntt'), (e) => e.status === 403)
  const g = await jt('GET', `${C}/settings/general`, null, t, 'cntt')
  await jt('PUT', `${C}/settings/general`, { ...g, phone: `024.7777.${stamp.slice(-4)}`, brandName: `KHOA CNTT ${stamp}` }, t, 'cntt')
  const html = await pageOn(KHOA, '/lien-he')
  assert.match(html, new RegExp(`024.7777.${stamp.slice(-4)}`))
  assert.match(html, new RegExp(`KHOA CNTT ${stamp}`))
  assert.doesNotMatch(await page('/lien-he'), new RegExp(`024.7777.${stamp.slice(-4)}`))
})

/* ---------- Trang đơn vị mới tạo trong CMS: website nhận tên miền ngay, không build lại ---------- */
const MOI = `pdt${stamp}.localhost:3002`
await step('Tạo trang đơn vị mới (Trang đơn vị) → tên miền mới hiện website riêng với tên, menu, trang Giới thiệu', async () => {
  await j('POST', '/cms-api/api/v1/admin/tenants', { id: `pdt-${stamp}`, name: `Phòng Thử nghiệm ${stamp}`, rootUnit: 'P-DT', domains: [MOI] }, t)
  const home = await pageOn(MOI, '/')
  assert.match(home, new RegExp(`PHÒNG THỬ NGHIỆM ${stamp.toUpperCase()}`))
  assert.match(home, /Tin tức – Sự kiện/)
  assert.match(await pageOn(MOI, '/trang/gioi-thieu'), new RegExp(`Giới thiệu Phòng Thử nghiệm ${stamp}`))
  assert.doesNotMatch(await page('/'), new RegExp(`PHÒNG THỬ NGHIỆM ${stamp.toUpperCase()}`))
})

await step('Tắt trang đơn vị → tên miền không còn phục vụ nội dung của trang (về website Trường, không lỗi)', async () => {
  await j('PUT', `/cms-api/api/v1/admin/tenants/pdt-${stamp}`, { isActive: false }, t)
  assert.equal(await statusOn(MOI, '/'), 200)
  assert.doesNotMatch(await pageOn(MOI, '/'), new RegExp(`PHÒNG THỬ NGHIỆM ${stamp.toUpperCase()}`))
  assert.equal(await statusOn(MOI, '/trang/gioi-thieu'), 404)
})

await j('POST', '/cms-api/api/v1/dev/reset')
console.log(process.exitCode ? '\nCÓ LỖI' : '\nĐồng bộ admin → public: OK')
