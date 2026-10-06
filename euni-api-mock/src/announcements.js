// Thông báo (Announcement) — bảng riêng với tin tức (docs/design/CMS_DESIGN.md §6):
//   · quản trị: cùng vòng đời workflow/revision/thùng rác với tin tức (lifecycle.js), ACL theo đơn vị sở hữu
//   · đối tượng nhận: targets[] — mỗi dòng AND (audience × unitCode × userSub), các dòng OR, dòng isExclude bị trừ
//   · hộp thư: /api/v1/me/announcements — so khớp lúc đọc với membership của user (role → audience, đơn vị + đơn vị cha)
//   · receipts: đã đọc / đã xác nhận theo từng user
import { rows, insert, persist } from './store.js'
import { requireCms, requireUser } from './auth.js'
import { withAncestors } from './acl.js'
import { workflowResource, paged, isLive, now } from './lifecycle.js'

/** Đối tượng nhận = realm role trên SSO (tầng 1) */
export const AUDIENCES = { student: 'Sinh viên', lecturer: 'Giảng viên', staff: 'Cán bộ, chuyên viên', manager: 'Lãnh đạo', parent: 'Phụ huynh', applicant: 'Thí sinh', alumni: 'Cựu người học' }
export const CATEGORIES = { general: 'Chung', academic: 'Đào tạo', exam: 'Thi cử', tuition: 'Học phí', event: 'Sự kiện', admin: 'Hành chính' }
const PRIORITY = { 0: 'Bình thường', 1: 'Quan trọng', 2: 'Khẩn' }
const CHANNELS = ['portal', 'email', 'push']

const unitName = (code) => rows('orgUnits').find((u) => u.code === code)?.name ?? code
const findUser = (key) => {
  const k = String(key || '').trim().toLowerCase()
  return rows('users').find((u) => [u.sub, u.email, u.username, u.staffCode, u.studentCode].some((v) => v && String(v).toLowerCase() === k))
}

/** Membership của một người: audience từ role (vai trò CMS tính là cán bộ), đơn vị trực tiếp + mọi đơn vị cha */
export function membership(u) {
  const roles = u.roles || []
  const audiences = Object.keys(AUDIENCES).filter((a) => roles.includes(a))
  if (roles.some((r) => r.startsWith('cms.')) && !audiences.includes('staff')) audiences.push('staff')
  return { sub: u.sub, audiences, units: withAncestors(u.units || []) }
}
const rowMatches = (t, m) => (!t.audience || m.audiences.includes(t.audience)) && (!t.unitCode || m.units.includes(t.unitCode)) && (!t.userSub || t.userSub === m.sub)
/** Thông báo `a` có gửi tới người có membership `m` không */
export const isRecipient = (a, m) => {
  const ts = a.targets || []
  return ts.some((t) => !t.isExclude && rowMatches(t, m)) && !ts.some((t) => t.isExclude && rowMatches(t, m))
}

const labelOf = (t) => {
  if (t.userSub) { const u = rows('users').find((x) => x.sub === t.userSub); return `${u?.staffCode || u?.studentCode || u?.email || t.userSub} – ${u?.fullName ?? ''}`.trim() }
  const parts = [t.audience ? AUDIENCES[t.audience] : null, t.unitCode ? unitName(t.unitCode) : null].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'Mọi người'
}

const bad = (status, message) => Object.assign(new Error(message), { status, http: true })

function normalizeTargets(list) {
  if (!Array.isArray(list)) throw bad(422, 'targets phải là mảng.')
  return list.map((t) => {
    const out = { audience: t.audience || null, unitCode: t.unitCode || null, userSub: t.userSub || null, isExclude: !!t.isExclude }
    if (out.audience && !AUDIENCES[out.audience]) throw bad(422, `Đối tượng không hợp lệ: ${out.audience}.`)
    if (out.unitCode && !rows('orgUnits').some((u) => u.code === out.unitCode)) throw bad(422, `Đơn vị không tồn tại: ${out.unitCode}.`)
    // nhắm cá nhân bằng mã cán bộ / mã sinh viên / email → đổi ra sub (một người dù đăng nhập M365 hay tài khoản trường)
    if (!out.userSub && t.userKey) {
      const u = findUser(t.userKey)
      if (!u) throw bad(422, `Không tìm thấy người dùng "${t.userKey}" trong danh bạ.`)
      out.userSub = u.sub
    }
    if (out.userSub && !rows('users').some((u) => u.sub === out.userSub)) throw bad(422, `Người dùng không tồn tại: ${out.userSub}.`)
    return { ...out, label: t.label || labelOf(out) }
  })
}

const FIELDS = ['title', 'bodyHtml', 'category', 'priority', 'ownerUnitCode', 'publishAt', 'expireAt', 'pinnedUntil', 'requireAck', 'channels', 'attachments', 'translations']
function normalize(b, existing) {
  const f = {}
  for (const k of FIELDS) if (b[k] !== undefined) f[k] = b[k]
  for (const k of ['publishAt', 'expireAt', 'pinnedUntil']) if (f[k] === '') f[k] = null
  if (!existing && !String(b.title || '').trim()) throw bad(422, 'Thiếu tiêu đề.')
  if (f.title !== undefined && !String(f.title).trim()) throw bad(422, 'Tiêu đề không được để trống.')
  if (f.category && !CATEGORIES[f.category]) throw bad(422, 'Loại thông báo không hợp lệ.')
  if (f.priority !== undefined) { f.priority = Number(f.priority); if (![0, 1, 2].includes(f.priority)) throw bad(422, 'priority phải là 0, 1 hoặc 2.') }
  if (f.channels && (!Array.isArray(f.channels) || f.channels.some((c) => !CHANNELS.includes(c)))) throw bad(422, 'channels chỉ gồm portal, email, push.')
  if (f.ownerUnitCode && !rows('orgUnits').some((u) => u.code === f.ownerUnitCode)) throw bad(422, 'Đơn vị phát hành không tồn tại.')
  if (b.targets !== undefined) f.targets = normalizeTargets(b.targets)
  if (f.requireAck !== undefined) f.requireAck = !!f.requireAck
  if (f.expireAt && f.publishAt && Date.parse(f.expireAt) <= Date.parse(f.publishAt)) throw bad(422, 'Thời gian hết hạn phải sau thời gian đăng.')
  return f
}

/** Ước tính người nhận từ danh bạ (thật: Membership API, chốt khi fan-out) */
const recipientsOf = (a) => rows('users').filter((u) => u.status === 1 && (u.tenants || ['humg']).includes(a.tenantId) && isRecipient(a, membership(u)))
const receiptsOf = (a) => rows('receipts').filter((r) => r.announcementId === a.id)

export function announcementRoutes(cms) {
  const { find } = workflowResource(cms, {
    path: 'announcements', col: 'announcements', type: 'announcement',
    normalize,
    defaults: (req) => ({
      ownerUnitCode: req.user.units?.[0] || 'HUMG', category: 'general', priority: 0, bodyHtml: '', publishAt: null, expireAt: null, pinnedUntil: null,
      requireAck: false, channels: ['portal'], targets: [], attachments: [], translations: {}, recallReason: null, authorSub: req.user.sub, authorName: req.user.name,
    }),
    validate: (a) => {
      if (!String(a.title || '').trim()) return 'Thông báo chưa có tiêu đề.'
      if (!(a.targets || []).some((t) => !t.isExclude)) return 'Chưa chọn đối tượng nhận thông báo.'
      return null
    },
    onArchive: (b) => ({ recallReason: b.note || null }),
    out: (a) => {
      const rc = receiptsOf(a)
      return {
        ownerUnitName: unitName(a.ownerUnitCode), categoryLabel: CATEGORIES[a.category] ?? a.category, priorityLabel: PRIORITY[a.priority],
        targetSummary: (a.targets || []).map((t) => (t.isExclude ? `trừ ${t.label}` : t.label)).join('; '),
        stats: { recipients: recipientsOf(a).length, read: rc.filter((r) => r.readAt).length, acked: rc.filter((r) => r.ackedAt).length },
      }
    },
    filter: (list, q) => (q.category ? list.filter((a) => a.category === q.category) : list),
  })

  /* Thống kê đọc / xác nhận của một thông báo */
  cms.get('/api/v1/admin/announcements/:id/stats', requireCms('announcement.view'), (req, res, next) => {
    try {
      const a = find(req, req.params.id)
      const rc = receiptsOf(a)
      const people = recipientsOf(a).map((u) => {
        const r = rc.find((x) => x.userSub === u.sub)
        return { sub: u.sub, name: u.fullName, code: u.studentCode || u.staffCode, units: u.units, readAt: r?.readAt ?? null, ackedAt: r?.ackedAt ?? null }
      })
      res.json({ recipients: people.length, read: people.filter((p) => p.readAt).length, acked: people.filter((p) => p.ackedAt).length, requireAck: a.requireAck, people })
    } catch (e) { next(e) }
  })

  /* Danh mục dùng cho form soạn thông báo */
  cms.get('/api/v1/admin/announcements/meta/options', requireCms('announcement.view'), (_req, res) => {
    res.json({ audiences: AUDIENCES, categories: CATEGORIES, priorities: PRIORITY, channels: CHANNELS })
  })

  /* ---------------- Hộp thư của người dùng (portal SV / GV / phụ huynh / lãnh đạo) ---------------- */
  const inbox = (req) => {
    const t = req.user
    const m = membership({ sub: t.sub, roles: t.roles, units: t.units })
    const allowed = req.allTenants ? (t.tenants || ['humg']) : [req.tenant]
    return rows('announcements').filter((a) => allowed.includes(a.tenantId) && isLive(a) && isRecipient(a, m))
  }
  const receipt = (a, sub) => rows('receipts').find((r) => r.announcementId === a.id && r.userSub === sub)
  const view = (req, a) => {
    const lang = req.query.lang || 'vi'
    const tr = lang !== 'vi' ? a.translations?.[lang] : null
    const ok = tr && tr.status === 'done' && tr.title
    const r = receipt(a, req.user.sub)
    return {
      id: a.id, tenantId: a.tenantId, title: ok ? tr.title : a.title, bodyHtml: ok && tr.bodyHtml ? tr.bodyHtml : a.bodyHtml, language: ok ? lang : 'vi',
      category: a.category, categoryLabel: CATEGORIES[a.category], priority: a.priority, priorityLabel: PRIORITY[a.priority],
      ownerUnitCode: a.ownerUnitCode, ownerUnitName: unitName(a.ownerUnitCode), publishAt: a.publishAt, expireAt: a.expireAt,
      pinned: !!a.pinnedUntil && Date.parse(a.pinnedUntil) > Date.now(), requireAck: a.requireAck, attachments: a.attachments || [],
      readAt: r?.readAt ?? null, ackedAt: r?.ackedAt ?? null,
    }
  }
  const order = (a, b) => (Number(b.pinned) - Number(a.pinned)) || (b.priority - a.priority) || String(b.publishAt).localeCompare(String(a.publishAt))

  cms.get('/api/v1/me/announcements', requireUser, (req, res) => {
    let list = inbox(req).map((a) => view(req, a))
    const unreadCount = list.filter((x) => !x.readAt).length
    if (req.query.unread === 'true') list = list.filter((x) => !x.readAt)
    if (req.query.category) list = list.filter((x) => x.category === req.query.category)
    res.json({ ...paged(list.sort(order), { pageSize: 50, ...req.query }), unreadCount, categories: CATEGORIES })
  })
  cms.get('/api/v1/me/announcements/unread-count', requireUser, (req, res) => {
    res.json({ unread: inbox(req).filter((a) => !receipt(a, req.user.sub)?.readAt).length })
  })
  const mark = (field) => (req, res) => {
    const a = inbox(req).find((x) => x.id === Number(req.params.id))
    if (!a) return res.status(404).json({ message: 'Không có thông báo này trong hộp thư của bạn.' })
    const r = receipt(a, req.user.sub) || insert('receipts', { announcementId: a.id, userSub: req.user.sub, deliveredAt: null, readAt: null, ackedAt: null })
    if (!r.readAt) r.readAt = now()
    if (field === 'ackedAt' && !r.ackedAt) r.ackedAt = now()
    persist()
    res.json(view(req, a))
  }
  cms.get('/api/v1/me/announcements/:id', requireUser, (req, res) => {
    const a = inbox(req).find((x) => x.id === Number(req.params.id))
    return a ? res.json(view(req, a)) : res.status(404).json({ message: 'Không có thông báo này trong hộp thư của bạn.' })
  })
  cms.post('/api/v1/me/announcements/read-all', requireUser, (req, res) => {
    let n = 0
    inbox(req).forEach((a) => {
      const r = receipt(a, req.user.sub)
      if (r?.readAt) return
      if (r) r.readAt = now(); else insert('receipts', { announcementId: a.id, userSub: req.user.sub, deliveredAt: null, readAt: now(), ackedAt: null })
      n++
    })
    persist()
    res.json({ marked: n })
  })
  cms.post('/api/v1/me/announcements/:id/read', requireUser, mark('readAt'))
  cms.post('/api/v1/me/announcements/:id/ack', requireUser, mark('ackedAt'))
}
