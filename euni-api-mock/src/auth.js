// auth-api mock — đóng vai Identity Server (IdS) khi phát triển.
// Hệ thống thật: user, role, tenant, đơn vị do IdS quản lý; CMS chỉ đọc claim trong token (xem docs/design/CMS_DESIGN.md §3, §5).
// Token mock mang các claim giống IdS: sub, name, email, roles[] (realm + client role), tenants[] (membership), units[], staff_code, student_code.
import jwt from 'jsonwebtoken'
import { Router } from 'express'
import { getStore, rows } from './store.js'
import { tenantsOf } from './acl.js'

const SECRET = process.env.JWT_SECRET || 'dev-only-change-me'
const EXPIRES = process.env.JWT_EXPIRES_IN || '8h'
export const DEV_PASSWORD = 'Humg@2025'

/*
 * Phân quyền 2 tầng trên SSO (docs/design/CMS_DESIGN.md §5):
 *   Tầng 1 — realm role (persona của người dùng, cả hệ thống): REALM_ROLES
 *   Tầng 2 — client role theo từng app/service, có tiền tố tên client: CLIENT_ROLES (SSO đẩy vào client tương ứng)
 *   Tầng 3 — phạm vi chi tiết (trang/tenant, chuyên mục, đơn vị, bản ghi) KHÔNG cấu hình trên SSO: mỗi app tự phân.
 *            Với CMS là bảng grants (acl.js) — tenant được quản trị cũng suy ra từ grants, không lấy từ claim.
 */
export const REALM_ROLES = {
  student: 'Sinh viên, học viên', lecturer: 'Giảng viên', staff: 'Cán bộ, chuyên viên phòng ban', manager: 'Lãnh đạo (BGH, trưởng/phó đơn vị)',
  parent: 'Phụ huynh', applicant: 'Thí sinh', alumni: 'Cựu người học',
}
export const CLIENT_ROLES = {
  'cms-api': { 'cms.viewer': 'Xem nội dung trong CMS', 'cms.author': 'Soạn bài', 'cms.reviewer': 'Duyệt bài', 'cms.editor': 'Biên tập, xuất bản', 'cms.admin': 'Quản trị CMS, cấu hình site đơn vị' },
  'euni-admin-api': { 'euni.dashboard-viewer': 'Dashboard lãnh đạo', 'euni.report-viewer': 'Báo cáo', 'euni.account-support': 'Hỗ trợ tài khoản', 'euni.admin': 'Quản trị eUni' },
  'edusoft-api': { 'edusoft.training-officer': 'Cán bộ P.Đào tạo', 'edusoft.grade-entry': 'Nhập điểm', 'edusoft.academic-advisor': 'Cố vấn học tập', 'edusoft.data-reader': 'Đọc dữ liệu (cho job)' },
  'qlns-api': { 'qlns.hr-officer': 'Cán bộ nhân sự', 'qlns.hr-viewer': 'Xem dữ liệu nhân sự', 'qlns.data-reader': 'Đọc dữ liệu (cho job)' },
  'qlkhcn-api': { 'qlkhcn.research-officer': 'Cán bộ quản lý KHCN', 'qlkhcn.researcher': 'Nhà nghiên cứu', 'qlkhcn.data-reader': 'Đọc dữ liệu (cho job)' },
}

/** Ánh xạ role (SSO) → quyền chức năng của CMS. Cấu hình tĩnh, không có màn hình quản lý role. */
export const ROLE_PERMISSIONS = {
  'cms.admin': ['cms.*'],
  'cms.editor': ['cms.access', 'news.view', 'news.edit', 'news.review', 'news.publish', 'announcement.view', 'announcement.edit', 'announcement.review', 'announcement.publish',
    'media.manage', 'category.manage', 'page.manage', 'menu.manage', 'site.manage', 'log.view'],
  'cms.reviewer': ['cms.access', 'news.view', 'news.review', 'announcement.view', 'announcement.review'],
  'cms.author': ['cms.access', 'news.view', 'news.edit', 'announcement.view', 'announcement.edit', 'media.manage'],
  'cms.viewer': ['cms.access', 'news.view', 'announcement.view'],
  ...Object.fromEntries(Object.keys(REALM_ROLES).map((r) => [r, [`portal.${r}.view`]])),
}
/** realm role → cổng My eUni (cán bộ dùng chung cổng giảng viên; thí sinh, cựu người học chưa có cổng riêng) */
const PORTAL_OF = { student: '/euni/sinh-vien', lecturer: '/euni/giang-vien', staff: '/euni/giang-vien', manager: '/euni/lanh-dao', parent: '/euni/phu-huynh' }
/** Thứ tự ưu tiên khi user có nhiều realm role */
const PORTAL_ROLES = ['manager', 'lecturer', 'staff', 'student', 'parent', 'applicant', 'alumni']
const DEMO_SUB = { student: 'SV001', lecturer: 'GV001', staff: 'CB001', parent: 'PH001', manager: 'LD001' }
/** Tên role cũ (trước khi thống nhất) — chỉ để đăng nhập demo bằng { role } cũ không lỗi */
const LEGACY_ROLE = { leader: 'manager' }
const ROLE_LABEL = { 'cms.admin': 'Quản trị CMS', 'cms.editor': 'Biên tập viên', 'cms.reviewer': 'Người duyệt', 'cms.author': 'Tác giả', 'cms.viewer': 'Người xem' }
const CMS_ORDER = ['cms.admin', 'cms.editor', 'cms.reviewer', 'cms.author', 'cms.viewer']

export const permissionsOf = (roles = []) => [...new Set(roles.flatMap((r) => ROLE_PERMISSIONS[r] || []))]
export const isSuper = (perms = []) => perms.includes('cms.*')
export const hasPerm = (perms = [], need) => isSuper(perms) || perms.includes(need) || perms.some((g) => g.endsWith('.*') && need.startsWith(g.slice(0, -1)))

/** Người dùng (dạng FE dùng) từ một dòng danh bạ IdS. `role` = vai trò chính để điều hướng FE. */
export function userView(u) {
  const roles = u.roles || []
  const cmsRole = CMS_ORDER.find((r) => roles.includes(r))
  const portalRole = PORTAL_ROLES.find((r) => roles.includes(r))
  const role = cmsRole ? (cmsRole === 'cms.admin' ? 'cms-admin' : 'cms-editor') : portalRole || 'student'
  return {
    id: u.sub, sub: u.sub, username: u.username, name: u.fullName, email: u.email, role, roles,
    roleLabel: ROLE_LABEL[cmsRole] || null,
    permissions: permissionsOf(roles), tenants: u.tenants || ['humg'], units: u.units || [],
    staffCode: u.staffCode || null, studentCode: u.studentCode || null,
    portal: cmsRole ? '/cms' : PORTAL_OF[role] || '/',
  }
}

/* Token mock mang realm role + client role chung trong `roles` (Keycloak: realm_access.roles + resource_access.{client}.roles).
   `tenants` chỉ là membership (trang mà user thuộc về, dùng cho hộp thư thông báo), KHÔNG phải quyền quản trị (tầng 3, xem acl.js tenantsOf). */
const sign = (u) => jwt.sign({ sub: u.sub, name: u.name, email: u.email, role: u.role, roles: u.roles, perms: u.permissions, tenants: u.tenants, units: u.units,
  staff_code: u.staffCode, student_code: u.studentCode }, SECRET, { expiresIn: EXPIRES })

export function readToken(req) {
  const h = req.headers.authorization || ''
  if (!h.startsWith('Bearer ')) return null
  try { return jwt.verify(h.slice(7), SECRET) } catch { return null }
}

/** Middleware: bắt buộc đăng nhập (mọi vai trò). */
export function requireUser(req, res, next) {
  const t = readToken(req)
  if (!t) return res.status(401).json({ message: 'Chưa đăng nhập hoặc phiên đã hết hạn.' })
  req.user = t
  next()
}

/**
 * Middleware: bắt buộc đăng nhập CMS + quyền chức năng (tùy chọn) + được quản trị tenant đang chọn (X-Tenant).
 * Quyền mức bản ghi kiểm tra tiếp trong acl.js.
 */
export function requireCms(perm) {
  return (req, res, next) => {
    const t = readToken(req)
    if (!t) return res.status(401).json({ message: 'Chưa đăng nhập hoặc phiên đã hết hạn.' })
    if (!hasPerm(t.perms, 'cms.access')) return res.status(403).json({ message: 'Tài khoản không có quyền truy cập CMS.' })
    if (!isSuper(t.perms) && !tenantsOf(t).includes(req.tenant)) return res.status(403).json({ message: `Tài khoản không được quản trị trang "${req.tenant}".` })
    if (perm && !hasPerm(t.perms, perm)) return res.status(403).json({ message: `Thiếu quyền ${perm}.` })
    req.user = t
    next()
  }
}

const findUser = (key) => rows('users').find((u) => [u.username, u.email, u.staffCode, u.studentCode].some((v) => v && String(v).toLowerCase() === key))
const resolvePortalRole = (v = '') => (v.includes('lanh') || v.includes('leader') || v.includes('manager') ? 'manager' : v.includes('phu') || v.includes('parent') ? 'parent'
  : v.includes('giang') || v.includes('lecturer') || v.includes('gv') ? 'lecturer' : v.includes('can-bo') || v.includes('canbo') || v.includes('staff') ? 'staff' : 'student')

export const authRouter = Router()

/**
 * Đăng nhập mock (thay cho trang đăng nhập của IdS khi dev):
 *   { role: 'student' | 'lecturer' | 'staff' | 'manager' | 'parent' }  → vào thẳng cổng demo
 *   { username, password }                    → tài khoản trong danh bạ (username / email / mã CB / mã SV)
 * Tài khoản có vai trò CMS cần mật khẩu Humg@2025; tài khoản portal mock nhận mật khẩu bất kỳ.
 */
authRouter.post('/auth/login', (req, res) => {
  const { username, password, role } = req.body || {}
  getStore()
  const demoRole = LEGACY_ROLE[role] || role
  if (demoRole && DEMO_SUB[demoRole]) { const u = userView(rows('users').find((x) => x.sub === DEMO_SUB[demoRole])); return res.json({ accessToken: sign(u), user: u }) }
  const key = String(username || '').trim().toLowerCase()
  if (!key) return res.status(422).json({ message: 'Thiếu tên đăng nhập.' })
  const found = findUser(key)
  if (found) {
    if (found.status !== 1) return res.status(403).json({ message: 'Tài khoản đã bị khóa.' })
    const u = userView(found)
    if (u.roles.some((r) => r.startsWith('cms.')) && password !== DEV_PASSWORD) return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu.' })
    found.lastLoginAt = new Date().toISOString()
    return res.json({ accessToken: sign(u), user: u })
  }
  const u = userView(rows('users').find((x) => x.sub === DEMO_SUB[resolvePortalRole(key)]))
  return res.json({ accessToken: sign(u), user: { ...u, username: key } })
})

const current = (t) => { const u = t && rows('users').find((x) => x.sub === t.sub); return u && u.status === 1 ? userView(u) : null }

authRouter.get('/auth/me', (req, res) => {
  const user = current(readToken(req))
  return user ? res.json({ user }) : res.status(401).json({ message: 'Chưa đăng nhập.' })
})

authRouter.post('/auth/refresh', (req, res) => {
  const user = current(readToken(req))
  return user ? res.json({ accessToken: sign(user), user }) : res.status(401).json({ message: 'Phiên đã hết hạn.' })
})

authRouter.post('/auth/logout', (_req, res) => res.status(204).end())
