// Audit log chỉ ghi thêm (docs/design/CMS_DESIGN.md §8): ai · làm gì · lúc nào · ở đâu · thay đổi gì.
import { insert } from './store.js'
import { readToken } from './auth.js'

const SKIP = new Set(['updatedAt', 'updatedBy', 'version', 'viewCount'])
const short = (v) => {
  const s = typeof v === 'string' ? v : JSON.stringify(v ?? null)
  return s && s.length > 200 ? `${s.slice(0, 200)}…` : v ?? null
}

/** Diff gọn giữa hai trạng thái bản ghi: { field: [cũ, mới] } (bỏ trường hệ thống, cắt chuỗi dài). */
export function diff(before = {}, after = {}) {
  const out = {}
  for (const k of new Set([...Object.keys(before || {}), ...Object.keys(after || {})])) {
    if (SKIP.has(k)) continue
    if (JSON.stringify(before?.[k] ?? null) !== JSON.stringify(after?.[k] ?? null)) out[k] = [short(before?.[k]), short(after?.[k])]
  }
  return Object.keys(out).length ? out : null
}

export function log(req, action, entityType, entity, changes = null, extra = {}) {
  const u = req.user || readToken(req) || {}
  const label = typeof entity === 'object' && entity ? entity.title ?? entity.name ?? entity.label ?? entity.fileName ?? entity.id : entity
  return insert('activityLogs', {
    tenantId: req.tenant, actorSub: u.sub ?? null, userName: u.name ?? 'Hệ thống', action, entityType,
    entityId: typeof entity === 'object' && entity ? String(entity.id ?? '') : null, targetLabel: String(label ?? ''),
    changes, ipAddress: req.ip?.replace('::ffff:', '') ?? null, userAgent: req.headers['user-agent'] ?? null, createdAt: new Date().toISOString(), ...extra,
  })
}
