// Vòng đời dùng chung cho nội dung có workflow (tin tức, thông báo) — docs/design/CMS_DESIGN.md §7, §8:
//   workflow draft → pending_review → published → archived (+ publish_at hẹn giờ, expire_at)
//   revision (snapshot mỗi lần lưu, khôi phục = phiên bản mới), bản sửa đổi chờ duyệt khi sửa bài đang xuất bản,
//   soft delete (thùng rác, khôi phục), optimistic concurrency (version / If-Match), audit diff, lịch sử workflow.
import { rows, insert, update, remove, revisionSnapshot, LEGACY_STATUS, STATUSES, persist } from './store.js'
import { requireCms, isSuper } from './auth.js'
import { can, allowedActions } from './acl.js'
import { log, diff } from './audit.js'

export const now = () => new Date().toISOString()
const ts = (v) => (v ? Date.parse(v) || 0 : 0)
export const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
const toInt = (v, d) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : d }

export function paged(list, q = {}) {
  const pageIndex = toInt(q.pageIndex, 1)
  const pageSize = Math.min(toInt(q.pageSize, 20), 500)
  const totalItems = list.length
  return { items: list.slice((pageIndex - 1) * pageSize, pageIndex * pageSize), pageIndex, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) }
}
export const statusStr = (v) => (v === undefined || v === null || v === '' ? undefined : STATUSES.includes(v) ? v : LEGACY_STATUS[v])

/** Bản ghi đang hiển thị công khai: published, đã đến publishAt, chưa quá expireAt, chưa xóa. */
export const isLive = (r) => r.status === 'published' && !r.deletedAt && ts(r.publishAt) <= Date.now() && (!r.expireAt || ts(r.expireAt) > Date.now())

/** Bảng chuyển trạng thái (§7.1). perm = hành động ACL cần có trên bản ghi. */
export const TRANSITIONS = {
  submit: { from: ['draft'], to: 'pending_review', perm: 'edit', label: 'Gửi duyệt' },
  reject: { from: ['pending_review'], to: 'draft', perm: 'review', needNote: true, label: 'Trả lại' },
  approve: { from: ['pending_review'], to: 'published', perm: 'review', label: 'Duyệt & xuất bản' },
  publish: { from: ['draft', 'archived'], to: 'published', perm: 'publish', label: 'Xuất bản' },
  unpublish: { from: ['published'], to: 'draft', perm: 'publish', label: 'Gỡ xuống' },
  archive: { from: ['published', 'draft'], to: 'archived', perm: 'publish', label: 'Lưu trữ' },
}
/** Trường workflow / hệ thống: không bị ghi đè khi sửa nội dung hay khôi phục revision */
const SYSTEM = new Set(['id', 'tenantId', 'status', 'publishAt', 'firstPublishedAt', 'submittedAt', 'submittedBy', 'reviewedAt', 'reviewedBy', 'reviewNote',
  'pendingRevisionId', 'version', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'deletedAt', 'deletedBy', 'viewCount', 'recallReason'])
const contentOf = (snap) => Object.fromEntries(Object.entries(snap || {}).filter(([k]) => !SYSTEM.has(k)))

class HttpError extends Error { constructor(status, message, extra) { super(message); this.status = status; this.extra = extra } }
const fail = (status, message, extra) => { throw new HttpError(status, message, extra) }
const handle = (fn) => (req, res) => {
  try { return fn(req, res) } catch (e) {
    if (e instanceof HttpError) return res.status(e.status).json({ message: e.message, ...(e.extra || {}) })
    throw e
  }
}

/** Đăng ký đầy đủ API vòng đời cho một loại nội dung. */
export function workflowResource(router, cfg) {
  const { path, col, type, label = (r) => r.title } = cfg
  const base = `/api/v1/admin/${path}`
  const userName = (sub) => rows('users').find((u) => u.sub === sub)?.fullName ?? sub
  const mine = (req) => rows(col).filter((r) => r.tenantId === req.tenant)
  const find = (req, id, { deleted = false } = {}) => {
    const r = mine(req).find((x) => x.id === Number(id))
    if (!r || (!!r.deletedAt !== deleted)) fail(404, deleted ? 'Không có trong thùng rác.' : 'Không tìm thấy dữ liệu.')
    return r
  }
  const need = (req, action, rec) => { if (!can(req.user, req.tenant, type, action, rec)) fail(403, `Bạn không có quyền "${action}" trên bản ghi này.`) }
  const out = (req, r) => {
    const pending = r.pendingRevisionId ? rows('revisions').find((v) => v.id === r.pendingRevisionId) : null
    return {
      ...r, ...(cfg.out ? cfg.out(r) : {}),
      isScheduled: r.status === 'published' && ts(r.publishAt) > Date.now(),
      isExpired: !!r.expireAt && ts(r.expireAt) <= Date.now(),
      authorName: r.authorName ?? userName(r.authorSub),
      updatedByName: r.updatedBy ? userName(r.updatedBy) : null,
      pendingRevision: pending ? { id: pending.id, version: pending.version, createdBy: pending.createdBy, createdByName: userName(pending.createdBy), createdAt: pending.createdAt } : null,
      allowedActions: allowedActions(req.user, req.tenant, type, r),
    }
  }
  const checkVersion = (req, r) => {
    const raw = req.headers['if-match'] ?? req.body?.version
    if (raw === undefined || raw === null || raw === '') return
    const v = Number(String(raw).replace(/^W\//, '').replace(/"/g, ''))
    if (v !== r.version) fail(409, `Bản ghi đã được người khác cập nhật (phiên bản hiện tại v${r.version}, bạn đang sửa v${v}). Tải lại để xem thay đổi mới nhất.`, { currentVersion: r.version })
  }
  const revisionsOf = (r) => rows('revisions').filter((v) => v.entityType === type && v.entityId === r.id)
  const saveRevision = (req, r, reason, state = 'current', snap = revisionSnapshot(r)) => {
    if (state === 'current') revisionsOf(r).filter((v) => v.state === 'current').forEach((v) => { v.state = 'superseded' })
    const version = state === 'current' ? r.version : Math.max(0, ...revisionsOf(r).map((v) => v.version)) + 1
    return insert('revisions', { tenantId: req.tenant, entityType: type, entityId: r.id, version, state, snapshot: snap, reason, createdBy: req.user.sub, createdAt: now() })
  }
  const history = (req, r, action, from, to, note) => insert('workflowHistory', { tenantId: req.tenant, entityType: type, entityId: r.id, action, fromStatus: from, toStatus: to, note: note || null, actorSub: req.user.sub, actorName: req.user.name, at: now() })

  /** Ghi nội dung mới: trực tiếp (version+1) hoặc thành bản sửa đổi chờ duyệt nếu bài đang xuất bản mà user không có quyền publish. */
  const applyContent = (req, r, patch, reason) => {
    if (r.status === 'archived') fail(409, 'Bản ghi đang lưu trữ — xuất bản lại hoặc khôi phục trước khi sửa.')
    const direct = r.status !== 'published' || can(req.user, req.tenant, type, 'publish', r)
    if (!direct) {
      need(req, 'edit', r)
      if (r.pendingRevisionId) fail(409, 'Đã có một bản sửa đổi đang chờ duyệt cho bản ghi này.')
      const rev = saveRevision(req, r, reason || 'Đề xuất sửa đổi', 'proposed', revisionSnapshot({ ...r, ...patch }))
      update(col, r.id, { pendingRevisionId: rev.id })
      log(req, `${type}.propose`, type, r, diff(contentOf(r), contentOf({ ...r, ...patch })), { revisionVersion: rev.version })
      return { proposed: true, revision: rev }
    }
    if (r.status !== 'draft' || r.createdBy !== req.user.sub) need(req, r.status === 'published' ? 'publish' : 'edit', r)
    if (r.pendingRevisionId) fail(409, 'Bản ghi có bản sửa đổi chờ duyệt — duyệt hoặc từ chối bản đó trước.')
    const before = contentOf(r)
    update(col, r.id, { ...patch, version: r.version + 1, updatedAt: now(), updatedBy: req.user.sub })
    const rev = saveRevision(req, r, reason || 'Cập nhật')
    log(req, `${type}.update`, type, r, diff(before, contentOf(r)), { revisionVersion: rev.version })
    return { proposed: false, revision: rev }
  }

  router.get(base, requireCms(`${type}.view`), handle((req, res) => {
    const q = req.query; const st = statusStr(q.status)
    let list = mine(req).filter((r) => !r.deletedAt && can(req.user, req.tenant, type, 'view', r))
    if (st) list = list.filter((r) => r.status === st)
    if (q.scheduled === 'true') list = list.filter((r) => r.status === 'published' && ts(r.publishAt) > Date.now())
    if (q.mine === 'true') list = list.filter((r) => r.createdBy === req.user.sub)
    if (q.ownerUnitCode) list = list.filter((r) => r.ownerUnitCode === q.ownerUnitCode)
    if (q.keyword) list = list.filter((r) => norm(`${label(r)} ${r.authorName ?? ''}`).includes(norm(q.keyword)))
    if (cfg.filter) list = cfg.filter(list, q)
    list = [...list].sort((a, b) => ts(b.updatedAt || b.createdAt) - ts(a.updatedAt || a.createdAt) || b.id - a.id)
    const p = paged(list, q)
    res.json({ ...p, items: p.items.map((r) => out(req, r)), canCreate: can(req.user, req.tenant, type, 'edit') })
  }))

  router.get(`${base}/trash`, requireCms(`${type}.view`), handle((req, res) => {
    const list = mine(req).filter((r) => r.deletedAt && (can(req.user, req.tenant, type, 'edit', r) || can(req.user, req.tenant, type, 'publish', r)))
      .sort((a, b) => ts(b.deletedAt) - ts(a.deletedAt))
    const p = paged(list, req.query)
    res.json({ ...p, items: p.items.map((r) => ({ ...out(req, r), deletedByName: userName(r.deletedBy) })) })
  }))

  router.get(`${base}/:id`, requireCms(`${type}.view`), handle((req, res) => {
    const r = find(req, req.params.id); need(req, 'view', r)
    res.set('ETag', `"${r.version}"`).json(out(req, r))
  }))

  router.post(base, requireCms(`${type}.edit`), handle((req, res) => {
    const b = req.body || {}
    const f = cfg.normalize(b, null, req)
    const draft = { ...cfg.defaults(req), ...f, tenantId: req.tenant, status: 'draft', createdBy: req.user.sub }
    if (!can(req.user, req.tenant, type, 'edit', { ...draft, createdBy: null })) fail(403, 'Bạn không có quyền tạo nội dung trong phạm vi (chuyên mục / đơn vị) này.')
    const r = insert(col, { ...draft, version: 1, pendingRevisionId: null, submittedAt: null, submittedBy: null, reviewedAt: null, reviewedBy: null, reviewNote: null,
      firstPublishedAt: null, createdAt: now(), updatedAt: now(), updatedBy: req.user.sub, deletedAt: null, deletedBy: null })
    saveRevision(req, r, 'Tạo mới')
    history(req, r, 'create', null, 'draft')
    log(req, `${type}.create`, type, r, null, { revisionVersion: 1 })
    // tiện ích: tạo rồi chuyển trạng thái luôn (giữ tương thích FE cũ gửi status khi tạo)
    const want = statusStr(b.status)
    const act = want === 'pending_review' ? 'submit' : want === 'published' ? 'publish' : null
    if (act) transition(req, r, act, { publishAt: b.publishAt })
    res.status(201).set('ETag', `"${r.version}"`).json(out(req, r))
  }))

  router.put(`${base}/:id`, requireCms(`${type}.view`), handle((req, res) => {
    const r = find(req, req.params.id)
    checkVersion(req, r)
    const patch = cfg.normalize(req.body || {}, r, req)
    const result = applyContent(req, r, patch)
    res.status(result.proposed ? 202 : 200).set('ETag', `"${r.version}"`).json({ ...out(req, r), ...(result.proposed ? { message: 'Đã gửi bản sửa đổi chờ duyệt; nội dung đang hiển thị giữ nguyên.' } : {}) })
  }))

  router.delete(`${base}/:id`, requireCms(`${type}.view`), handle((req, res) => {
    const r = find(req, req.params.id)
    if (!allowedActions(req.user, req.tenant, type, r).includes('delete')) fail(403, 'Bạn không có quyền xóa bản ghi này.')
    update(col, r.id, { deletedAt: now(), deletedBy: req.user.sub })
    log(req, `${type}.delete`, type, r)
    res.status(204).end()
  }))

  router.post(`${base}/:id/restore`, requireCms(`${type}.view`), handle((req, res) => {
    const r = find(req, req.params.id, { deleted: true })
    if (!allowedActions(req.user, req.tenant, type, r).includes('restore')) fail(403, 'Bạn không có quyền khôi phục bản ghi này.')
    update(col, r.id, { deletedAt: null, deletedBy: null, updatedAt: now(), updatedBy: req.user.sub })
    log(req, `${type}.restore`, type, r)
    res.json(out(req, r))
  }))

  router.delete(`${base}/:id/purge`, requireCms(`${type}.view`), handle((req, res) => {
    const r = find(req, req.params.id, { deleted: true })
    if (!isSuper(req.user.perms)) fail(403, 'Chỉ quản trị hệ thống được xóa vĩnh viễn.')
    remove(col, r.id)
    log(req, `${type}.purge`, type, r)
    res.status(204).end()
  }))

  function transition(req, r, action, b = {}) {
    if (action === 'approve-revision' || action === 'reject-revision') {
      need(req, 'review', r)
      const rev = rows('revisions').find((v) => v.id === r.pendingRevisionId)
      if (!rev) fail(409, 'Không có bản sửa đổi chờ duyệt.')
      if (action === 'reject-revision') {
        if (!b.note) fail(422, 'Vui lòng nhập lý do từ chối.')
        rev.state = 'rejected'; rev.reviewNote = b.note
        update(col, r.id, { pendingRevisionId: null })
      } else {
        const before = contentOf(r)
        revisionsOf(r).filter((v) => v.state === 'current').forEach((v) => { v.state = 'superseded' })
        rev.state = 'current'
        update(col, r.id, { ...contentOf(rev.snapshot), version: rev.version, pendingRevisionId: null, updatedAt: now(), updatedBy: req.user.sub })
        log(req, `${type}.update`, type, r, diff(before, contentOf(r)), { revisionVersion: rev.version })
      }
      persist()
      history(req, r, action, r.status, r.status, b.note)
      log(req, `${type}.${action}`, type, r)
      return
    }
    const t = TRANSITIONS[action]
    if (!t) fail(400, `Hành động không hợp lệ: ${action}.`)
    if (!t.from.includes(r.status)) fail(409, `Không thể "${t.label}" khi bản ghi đang ở trạng thái ${r.status}.`)
    need(req, t.perm, r)
    if (t.needNote && !String(b.note || '').trim()) fail(422, 'Vui lòng nhập lý do.')
    if (t.to === 'published' || t.to === 'pending_review') { const msg = cfg.validate?.(r); if (msg) fail(422, msg) }
    const from = r.status
    const patch = { status: t.to, updatedAt: now(), updatedBy: req.user.sub }
    if (action === 'submit') Object.assign(patch, { submittedAt: now(), submittedBy: req.user.sub, reviewNote: null })
    if (action === 'reject' || action === 'approve') Object.assign(patch, { reviewedAt: now(), reviewedBy: req.user.sub, reviewNote: b.note || null })
    if (t.to === 'published') {
      const at = b.publishAt || (r.publishAt && (action === 'approve' || ts(r.publishAt) > Date.now()) ? r.publishAt : null) || now()
      if (r.expireAt && ts(r.expireAt) <= ts(at)) fail(422, 'Thời gian hết hạn phải sau thời gian xuất bản.')
      Object.assign(patch, { publishAt: at, firstPublishedAt: r.firstPublishedAt || at })
    }
    if (action === 'archive' && cfg.onArchive) Object.assign(patch, cfg.onArchive(b))
    update(col, r.id, patch)
    history(req, r, action, from, t.to, b.note)
    log(req, `${type}.${action}`, type, r, { status: [from, t.to] })
  }

  router.post(`${base}/:id/workflow/:action`, requireCms(`${type}.view`), handle((req, res) => {
    const r = find(req, req.params.id)
    checkVersion(req, r)
    transition(req, r, req.params.action, req.body || {})
    res.json(out(req, r))
  }))

  router.get(`${base}/:id/revisions`, requireCms(`${type}.view`), handle((req, res) => {
    const r = find(req, req.params.id); need(req, 'view', r)
    res.json(revisionsOf(r).sort((a, b) => b.version - a.version || b.id - a.id)
      .map(({ snapshot, ...v }) => ({ ...v, createdByName: userName(v.createdBy), title: snapshot?.title ?? null })))
  }))
  router.get(`${base}/:id/revisions/:version`, requireCms(`${type}.view`), handle((req, res) => {
    const r = find(req, req.params.id); need(req, 'view', r)
    const v = revisionsOf(r).find((x) => x.version === Number(req.params.version))
    if (!v) fail(404, 'Không có phiên bản này.')
    res.json({ ...v, createdByName: userName(v.createdBy), changesFromCurrent: diff(contentOf(r), contentOf(v.snapshot)) })
  }))
  router.post(`${base}/:id/revisions/:version/restore`, requireCms(`${type}.view`), handle((req, res) => {
    const r = find(req, req.params.id)
    const v = revisionsOf(r).find((x) => x.version === Number(req.params.version))
    if (!v) fail(404, 'Không có phiên bản này.')
    const result = applyContent(req, r, contentOf(v.snapshot), `Khôi phục từ v${v.version}`)
    res.status(result.proposed ? 202 : 200).json(out(req, r))
  }))

  router.get(`${base}/:id/history`, requireCms(`${type}.view`), handle((req, res) => {
    const r = find(req, req.params.id); need(req, 'view', r)
    const wf = rows('workflowHistory').filter((h) => h.entityType === type && h.entityId === r.id)
    const audit = rows('activityLogs').filter((l) => l.entityType === type && l.entityId === String(r.id))
    res.json({ workflow: wf.sort((a, b) => ts(b.at) - ts(a.at)), audit: audit.sort((a, b) => ts(b.createdAt) - ts(a.createdAt)) })
  }))

  return { find, out, transition }
}

