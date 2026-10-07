// Kiểm thử outbox + worker trên API đang chạy (OUTBOX_POLL_SECONDS nhỏ): thông báo hẹn giờ xuất bản chỉ được "fan-out" (chốt số người nhận) khi ĐẾN GIỜ.
//   API_URL=http://127.0.0.1:3000 node tests/contract/outbox.mjs
const API = process.env.API_URL || 'http://127.0.0.1:3000'
const call = async (m, p, token, body) => {
  const r = await fetch(API + p, { method: m, headers: { 'Content-Type': 'application/json', 'X-Tenant': 'humg', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body && JSON.stringify(body) })
  const t = await r.text(); return { status: r.status, data: t ? JSON.parse(t) : null }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const assert = (c, msg) => { if (!c) { console.log('✗', msg); process.exitCode = 1 } else console.log('✔', msg) }
const A = '/cms-api/api/v1/admin/announcements'
const { data: { accessToken: t } } = await call('POST', '/auth-api/api/v1/auth/login', null, { username: 'tvanminh', password: 'Humg@2025' })
const at = new Date(Date.now() + 12000).toISOString()
const c = await call('POST', A, t, { title: 'Outbox hẹn giờ', bodyHtml: '<p>x</p>', ownerUnitCode: 'P-DT', targets: [{ audience: 'student' }] })
const id = c.data.id
const pub = await call('POST', `${A}/${id}/workflow/publish`, t, { publishAt: at })
assert(pub.status === 200 && pub.data.isScheduled, 'xuất bản hẹn giờ (isScheduled=true)')
await sleep(3500)
assert((await call('GET', `${A}/${id}`, t)).data.recipientCount == null, 'chưa đến giờ → chưa fan-out (recipientCount rỗng)')
await sleep(14000)
const after = (await call('GET', `${A}/${id}`, t)).data
assert(after.recipientCount > 0, `đến giờ → worker chốt người nhận (recipientCount=${after.recipientCount})`)
assert(after.recipientCount === after.stats.recipients, 'số chốt khớp ước tính từ danh bạ')
// gỡ trước khi đến giờ → không fan-out
const c2 = await call('POST', A, t, { title: 'Outbox bị thu hồi', ownerUnitCode: 'P-DT', targets: [{ audience: 'student' }] })
await call('POST', `${A}/${c2.data.id}/workflow/publish`, t, { publishAt: new Date(Date.now() + 8000).toISOString() })
await call('POST', `${A}/${c2.data.id}/workflow/unpublish`, t, {})
await sleep(12000)
assert((await call('GET', `${A}/${c2.data.id}`, t)).data.recipientCount == null, 'gỡ trước giờ xuất bản → không fan-out')
