import jwt from 'jsonwebtoken'
import { Router } from 'express'
import { getStore } from './store.js'

const SECRET = process.env.JWT_SECRET || 'dev-only-change-me'
const EXPIRES = process.env.JWT_EXPIRES_IN || '8h'
export const DEV_PASSWORD = 'Humg@2025'

/* Tài khoản mock cho các cổng người dùng (mật khẩu: bất kỳ khi dùng "demo login", hoặc Humg@2025) */
export const PORTAL_USERS = {
  student: { id: 'SV001', username: '2151000123', name: 'Nguyễn Văn Sinh', role: 'student', permissions: ['portal.student.view'], portal: '/euni/sinh-vien' },
  staff: { id: 'GV001', username: 'giangvien', name: 'Giảng viên HUMG', role: 'staff', permissions: ['portal.staff.view'], portal: '/euni/giang-vien' },
  parent: { id: 'PH001', username: 'phuhuynh', name: 'Phụ huynh', role: 'parent', permissions: ['portal.parent.view'], portal: '/euni/phu-huynh' },
  leader: { id: 'LD001', username: 'lanhdao', name: 'Lãnh đạo HUMG', role: 'leader', permissions: ['portal.leader.view'], portal: '/euni/lanh-dao' },
}

const resolvePortalRole = (username = '') => {
  const v = String(username).trim().toLowerCase()
  if (v.includes('lanh') || v.includes('leader')) return 'leader'
  if (v.includes('phu') || v.includes('parent')) return 'parent'
  if (v.includes('giang') || v.includes('staff') || v.includes('gv')) return 'staff'
  return 'student'
}

function cmsUserView(u) {
  const perms = getStore().rolePermissions[u.roleCode] || []
  return {
    id: `CMS${u.id}`, userId: u.id, username: u.username, name: u.fullName, email: u.email,
    role: u.roleCode === 'super_admin' ? 'cms-admin' : u.roleCode === 'viewer' ? 'cms-viewer' : 'cms-editor',
    roleCode: u.roleCode, permissions: u.roleCode === 'super_admin' ? ['cms.*', ...perms] : perms, portal: '/',
  }
}

const sign = (user) => jwt.sign({ sub: user.id, role: user.role, name: user.name, perms: user.permissions, uid: user.userId }, SECRET, { expiresIn: EXPIRES })

export function readToken(req) {
  const h = req.headers.authorization || ''
  if (!h.startsWith('Bearer ')) return null
  try { return jwt.verify(h.slice(7), SECRET) } catch { return null }
}

const matches = (granted = [], need) => granted.includes(need) || granted.some((g) => g.endsWith('.*') && need.startsWith(g.slice(0, -1)))

/** Middleware: bắt buộc đăng nhập CMS (+ quyền tuỳ chọn). */
export function requireCms(perm) {
  return (req, res, next) => {
    const t = readToken(req)
    if (!t) return res.status(401).json({ message: 'Chưa đăng nhập hoặc phiên đã hết hạn.' })
    if (!String(t.role).startsWith('cms-') || !matches(t.perms, 'cms.access')) return res.status(403).json({ message: 'Tài khoản không có quyền truy cập CMS.' })
    if (perm && !matches(t.perms, perm)) return res.status(403).json({ message: `Thiếu quyền ${perm}.` })
    req.user = t
    next()
  }
}

export const authRouter = Router()

authRouter.post('/auth/login', (req, res) => {
  const { username, password, role } = req.body || {}
  if (role && PORTAL_USERS[role]) { const u = PORTAL_USERS[role]; return res.json({ accessToken: sign(u), user: u }) } // demo login theo vai trò
  const key = String(username || '').trim().toLowerCase()
  if (!key) return res.status(422).json({ message: 'Thiếu tên đăng nhập.' })
  const cmsUser = getStore().collections.users.find((u) => u.username.toLowerCase() === key || u.email.toLowerCase() === key)
  if (cmsUser) {
    if (cmsUser.status !== 1) return res.status(403).json({ message: 'Tài khoản đã bị khóa.' })
    if (password !== DEV_PASSWORD) return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu.' })
    const user = cmsUserView(cmsUser)
    return res.json({ accessToken: sign(user), user })
  }
  const u = PORTAL_USERS[resolvePortalRole(key)]
  return res.json({ accessToken: sign(u), user: { ...u, username: key } })
})

authRouter.get('/auth/me', (req, res) => {
  const t = readToken(req)
  if (!t) return res.status(401).json({ message: 'Chưa đăng nhập.' })
  const cms = t.uid && getStore().collections.users.find((u) => u.id === t.uid)
  const user = cms ? cmsUserView(cms) : Object.values(PORTAL_USERS).find((u) => u.id === t.sub)
  if (!user) return res.status(401).json({ message: 'Tài khoản không tồn tại.' })
  res.json({ user })
})

authRouter.post('/auth/refresh', (req, res) => {
  const t = readToken(req)
  if (!t) return res.status(401).json({ message: 'Phiên đã hết hạn.' })
  const cms = t.uid && getStore().collections.users.find((u) => u.id === t.uid)
  const user = cms ? cmsUserView(cms) : Object.values(PORTAL_USERS).find((u) => u.id === t.sub)
  if (!user) return res.status(401).json({ message: 'Tài khoản không tồn tại.' })
  res.json({ accessToken: sign(user), user })
})

authRouter.post('/auth/logout', (_req, res) => res.status(204).end())
