// Phân quyền mức bản ghi (docs/design/CMS_DESIGN.md §5):
//   quyền hiệu lực = quyền chức năng `${type}.${action}` (role trong token)  AND  có grant khớp phạm vi.
//   Ngoại lệ: cms.* bỏ qua mọi kiểm tra; người tạo luôn xem được bản ghi của mình và sửa được khi còn là bản nháp.
import { rows } from './store.js'
import { hasPerm, isSuper } from './auth.js'

export const ACTIONS = ['view', 'edit', 'review', 'publish']

const unit = (code) => rows('orgUnits').find((u) => u.code === code)
/** code + mọi đơn vị cha: DCCTKT66A → [DCCTKT66A, BM-KHMT, CNTT, HUMG] */
export function withAncestors(codes = []) {
  const out = new Set()
  for (let code of codes) {
    for (let guard = 0; code && guard < 20; guard++) { out.add(code); code = unit(code)?.parentCode }
  }
  return [...out]
}
/** `child` nằm trong cây con của `ancestor` (kể cả chính nó) */
export const isWithin = (child, ancestor) => !!child && withAncestors([child]).includes(ancestor)

export function principals(user) {
  return new Set([`user:${user.sub}`, ...withAncestors(user.units).map((u) => `unit:${u}`), ...(user.roles || []).map((r) => `role:${r}`)])
}

const live = (g, tenant) => g.tenantId === tenant && !g.deletedAt && (!g.expiresAt || Date.parse(g.expiresAt) > Date.now())

function grantAllows(g, action) {
  const p = g.permissions || []
  return p.includes('manage') || p.includes(action) || (action === 'view' && p.length > 0)
}
function scopeMatches(g, rec) {
  if (g.scopeType === 'tenant') return true
  if (!rec) return false
  if (g.scopeType === 'category') return String(rec.categoryId ?? '') === String(g.scopeId)
  if (g.scopeType === 'record') return String(rec.id) === String(g.scopeId)
  if (g.scopeType === 'unit') return isWithin(rec.ownerUnitCode, g.scopeId)
  return false
}

/**
 * Tầng 3 (app tự phân, không cấu hình trên SSO): các trang (tenant) user được vào CMS = các tenant có ít nhất một grant
 * khớp user (theo sub, đơn vị kèm đơn vị cha, hoặc role). cms.* (super) được vào mọi tenant — xử lý ở nơi gọi.
 */
export function tenantsOf(user) {
  const mine = principals(user)
  return [...new Set(rows('grants').filter((g) => !g.deletedAt && (!g.expiresAt || Date.parse(g.expiresAt) > Date.now()) && mine.has(`${g.principalType}:${g.principalId}`)).map((g) => g.tenantId))]
}

/** Các grant (đang hiệu lực) của user trong tenant cho loại tài nguyên `type` */
export function grantsFor(user, tenant, type) {
  const mine = principals(user)
  return rows('grants').filter((g) => live(g, tenant) && (g.resourceType === '*' || g.resourceType === type) && mine.has(`${g.principalType}:${g.principalId}`))
}

/**
 * user được thực hiện `action` trên bản ghi `rec` (loại `type`) trong `tenant`?
 * rec = null: hỏi "có phạm vi nào cho phép không" (vd. hiện nút "Thêm mới").
 */
export function can(user, tenant, type, action, rec = null) {
  if (!user) return false
  if (isSuper(user.perms)) return true
  if (!hasPerm(user.perms, `${type}.${action}`)) return false
  if (rec && rec.createdBy === user.sub && (action === 'view' || (action === 'edit' && rec.status === 'draft'))) return true
  const gs = grantsFor(user, tenant, type).filter((g) => grantAllows(g, action))
  return rec ? gs.some((g) => scopeMatches(g, rec)) : gs.length > 0
}

/** Các hành động hợp lệ trên bản ghi — trả về cho UI (`allowedActions`). Backend vẫn kiểm tra lại ở mỗi lệnh. */
export function allowedActions(user, tenant, type, rec) {
  const c = (a) => can(user, tenant, type, a, rec)
  if (rec.deletedAt) return c('edit') || c('publish') ? ['restore'] : []
  const out = []
  const st = rec.status
  if (st !== 'archived' && (c('edit') || (st === 'published' && c('publish')))) out.push('edit')
  if (st === 'draft' && c('edit')) out.push('submit')
  if (st === 'pending_review' && c('review')) out.push('approve', 'reject')
  if ((st === 'draft' || st === 'archived') && c('publish')) out.push('publish')
  if (st === 'published' && c('publish')) out.push('unpublish')
  if ((st === 'published' || st === 'draft') && c('publish')) out.push('archive')
  if (rec.pendingRevisionId && c('review')) out.push('approve-revision', 'reject-revision')
  if ((st !== 'published' && c('edit')) || c('publish')) out.push('delete')
  return out
}
