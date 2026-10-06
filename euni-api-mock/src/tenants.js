// Quản lý trang đơn vị (tenant): Trường, Khoa, Phòng ban… mỗi trang có website + dữ liệu CMS riêng (docs/design/CMS_DESIGN.md §2).
//   GET    /api/v1/admin/tenants                 danh sách (kèm số bài viết, số người được cấp quyền)
//   POST   /api/v1/admin/tenants                 tạo trang; scaffold=true → sinh sẵn cấu hình, menu, trang Giới thiệu/Liên hệ; ownerSub → cấp quyền quản lý
//   PUT    /api/v1/admin/tenants/{id}            sửa tên, đơn vị gốc, tên miền, bật/tắt
//   GET    /api/v1/public/tenants/resolve?host=  tên miền → mã trang (website dùng để nhận tên miền mới mà không phải build lại)
// Chỉ cms.admin (cms.*) được quản lý trang. Không xóa cứng: tắt trang (isActive=false) thì website + API công khai của trang ngừng phục vụ.
import { getStore, persist, rows, insert, CMS_PAGES } from './store.js'
import { requireCms, isSuper } from './auth.js'
import { tenants } from './tenant.js'
import { log } from './audit.js'

const ID_RE = /^[a-z][a-z0-9-]{1,31}$/
const HOST_RE = /^[a-z0-9.-]+(:\d+)?$/
const now = () => new Date().toISOString()
const bad = (res, status, message) => res.status(status).json({ message })
const normHosts = (v) => [...new Set((Array.isArray(v) ? v : String(v || '').split(/[\s,]+/)).map((h) => String(h).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')).filter(Boolean))]
const unitOf = (code) => rows('orgUnits').find((u) => u.code === code)

/** Kiểm tra dữ liệu chung cho tạo/sửa. Trả chuỗi lỗi hoặc null. */
function validate(b, id) {
  if (b.name !== undefined && !String(b.name).trim()) return 'Thiếu tên trang.'
  if (b.rootUnit && !unitOf(b.rootUnit)) return `Đơn vị gốc "${b.rootUnit}" không có trong cây đơn vị.`
  if (b.domains) {
    const hosts = normHosts(b.domains)
    const badHost = hosts.find((h) => !HOST_RE.test(h))
    if (badHost) return `Tên miền "${badHost}" không hợp lệ.`
    const taken = hosts.find((h) => tenants().some((t) => t.id !== id && (t.domains || []).includes(h)))
    if (taken) return `Tên miền "${taken}" đang được trang khác dùng.`
  }
  return null
}

const out = (t) => ({
  id: t.id, name: t.name, rootUnit: t.rootUnit, rootUnitName: unitOf(t.rootUnit)?.name ?? null, domains: t.domains || [], isActive: t.isActive !== false,
  createdAt: t.createdAt ?? null,
  stats: {
    contents: rows('contents').filter((c) => c.tenantId === t.id && !c.deletedAt).length,
    pages: rows('pages').filter((c) => c.tenantId === t.id && !c.deletedAt).length,
    grants: rows('grants').filter((g) => g.tenantId === t.id && !g.deletedAt).length,
  },
})

/** Nội dung mẫu cho trang mới: cấu hình (theo tên trang), trang Giới thiệu/Liên hệ/Chính sách/Điều khoản, menu header/footer/utility */
function scaffold(t, actor) {
  const s = getStore()
  const base = JSON.parse(JSON.stringify(s.settings.humg))
  s.settings[t.id] = {
    ...base,
    general: { ...base.general, siteName: `${t.name} – HUMG`, brandName: t.name.toUpperCase(), brandNameEn: '', tagline: 'Trường Đại học Mỏ - Địa chất', taglineEn: 'Hanoi University of Mining and Geology' },
    seo: { ...base.seo, metaTitle: `${t.name} | HUMG` },
  }
  persist()
  const stamp = { tenantId: t.id, createdAt: now(), createdBy: actor, deletedAt: null }
  const page = (o) => insert('pages', { parentId: null, template: 'default', path: null, status: 'published', translations: {}, updatedAt: now(), ...stamp, ...o })
  page({ slug: 'gioi-thieu', title: `Giới thiệu ${t.name}`, sortOrder: 0, bodyHtml: `<p>Trang giới thiệu ${t.name}. Biên tập nội dung tại CMS → Trang &amp; Menu → Cây trang.</p>` })
  page({ slug: 'lien-he', title: 'Liên hệ', sortOrder: 1, bodyHtml: '<p>Địa chỉ, điện thoại, email của đơn vị. Cập nhật tại CMS → Trang &amp; Menu.</p>' })
  CMS_PAGES.forEach((p, i) => page({ ...p, sortOrder: 10 + i }))
  const menu = (o) => insert('menuItems', { groupCode: 'header', parentId: null, type: 'page', icon: null, sortOrder: 1, isVisible: true, openInNewTab: false, translations: {}, ...stamp, ...o })
  const intro = menu({ label: 'Giới thiệu', url: '/trang/gioi-thieu', icon: 'building', sortOrder: 1, translations: { en: { label: 'About', status: 'done' } } })
  menu({ label: 'Giới thiệu chung', url: '/trang/gioi-thieu', parentId: intro.id, sortOrder: 1, translations: { en: { label: 'Overview', status: 'done' } } })
  const news = menu({ label: 'Tin tức – Sự kiện', url: '/tin-tuc', icon: 'newspaper', sortOrder: 2, translations: { en: { label: 'News & Events', status: 'done' } } })
  menu({ label: 'Tin tức', url: '/tin-tuc', parentId: news.id, sortOrder: 1, translations: { en: { label: 'News', status: 'done' } } })
  menu({ label: 'Sự kiện', url: '/su-kien', parentId: news.id, sortOrder: 2, translations: { en: { label: 'Events', status: 'done' } } })
  menu({ label: 'Liên hệ', url: '/trang/lien-he', icon: 'phone', sortOrder: 3, translations: { en: { label: 'Contact', status: 'done' } } })
  menu({ label: 'Website Trường', url: 'https://humg.edu.vn', icon: 'globe', sortOrder: 4, type: 'link', openInNewTab: true, translations: { en: { label: 'University website', status: 'done' } } })
  const col = menu({ groupCode: 'footer', label: t.name, type: 'heading', url: null, sortOrder: 1 })
  ;[['Giới thiệu', '/trang/gioi-thieu'], ['Tin tức', '/tin-tuc'], ['Liên hệ', '/trang/lien-he']].forEach(([label, url], i) => menu({ groupCode: 'footer', parentId: col.id, label, url, sortOrder: i + 1 }))
  const pol = menu({ groupCode: 'footer', label: 'Chính sách & Quy định', type: 'heading', url: null, sortOrder: 2, translations: { en: { label: 'Policies', status: 'done' } } })
  ;[['Chính sách bảo mật', '/trang/chinh-sach-bao-mat'], ['Điều khoản sử dụng', '/trang/dieu-khoan-su-dung']].forEach(([label, url], i) => menu({ groupCode: 'footer', parentId: pol.id, label, url, sortOrder: i + 1 }))
  menu({ groupCode: 'utility', label: 'Liên hệ', url: '/trang/lien-he', sortOrder: 1 })
  menu({ groupCode: 'utility', label: 'Website Trường', url: 'https://humg.edu.vn', sortOrder: 2, openInNewTab: true, type: 'link' })
  insert('categories', { name: 'Tin tức', slug: 'tin-tuc', parentId: null, description: null, sortOrder: 0, isActive: true, translations: {}, ...stamp })
  /* khối trang chủ: 1 slide theo tên trang + các khối chép từ trang Trường để biên tập tiếp */
  insert('heroSlides', { code: `${t.id}-hero`, kicker: 'TRƯỜNG ĐẠI HỌC MỎ - ĐỊA CHẤT', title: t.name.toUpperCase(), subtitle: '', motto: 'Tri thức · Bản lĩnh · Sáng tạo · Hội nhập',
    primaryLabel: 'Giới thiệu', primaryUrl: '/trang/gioi-thieu', accentLabel: 'Tin tức', accentUrl: '/tin-tuc', isVisible: true, sortOrder: 0, ...stamp })
  const copy = (name, n) => rows(name).filter((r) => r.tenantId === 'humg' && !r.deletedAt).slice(0, n).forEach(({ id, tenantId, createdAt, createdBy, ...r }) => insert(name, { ...r, ...stamp }))
  copy('quickLinks', 4); copy('audiences', 6); copy('strengths', 3); copy('siteStats', 8)
}

export function tenantRoutes(cms) {
  /* chỉ cms.admin: X-Tenant không ràng buộc ở đây (quản lý toàn bộ trang) */
  const superOnly = [requireCms(), (req, res, next) => (isSuper(req.user.perms) ? next() : bad(res, 403, 'Chỉ quản trị CMS (cms.admin) được quản lý trang đơn vị.'))]

  cms.get('/api/v1/admin/tenants', superOnly, (_req, res) => res.json(tenants().map(out)))

  cms.post('/api/v1/admin/tenants', superOnly, (req, res) => {
    const b = req.body || {}
    const id = String(b.id || '').trim().toLowerCase()
    if (!ID_RE.test(id)) return bad(res, 422, 'Mã trang chỉ gồm chữ thường không dấu, số, dấu gạch ngang (2–32 ký tự), bắt đầu bằng chữ.')
    if (tenants().some((t) => t.id === id)) return bad(res, 409, `Mã trang "${id}" đã tồn tại.`)
    if (!String(b.name || '').trim()) return bad(res, 422, 'Thiếu tên trang.')
    const err = validate(b, id); if (err) return bad(res, 422, err)
    if (b.ownerSub && !rows('users').some((u) => u.sub === b.ownerSub)) return bad(res, 422, 'Người phụ trách không có trong danh bạ.')
    const t = { id, name: String(b.name).trim(), rootUnit: b.rootUnit || null, domains: normHosts(b.domains), isActive: b.isActive !== false, createdAt: now(), createdBy: req.user.sub }
    rows('tenants').push(t); persist()
    if (b.scaffold !== false) scaffold(t, req.user.sub)
    if (b.ownerSub) {
      insert('grants', { tenantId: id, principalType: 'user', principalId: b.ownerSub, resourceType: '*', scopeType: 'tenant', scopeId: null, permissions: ['manage'],
        note: `Phụ trách trang ${t.name}`, expiresAt: null, createdBy: req.user.sub, createdAt: now(), deletedAt: null })
    }
    log(Object.assign(Object.create(req), { tenant: id }), 'tenant.create', 'tenant', { id, title: t.name })
    res.status(201).json(out(t))
  })

  cms.put('/api/v1/admin/tenants/:id', superOnly, (req, res) => {
    const t = tenants().find((x) => x.id === req.params.id)
    if (!t) return bad(res, 404, 'Không tìm thấy trang.')
    const b = req.body || {}
    const err = validate(b, t.id); if (err) return bad(res, 422, err)
    if (b.isActive === false && t.id === 'humg') return bad(res, 422, 'Không tắt được trang Trường (trang mặc định).')
    if (b.name !== undefined) t.name = String(b.name).trim()
    if (b.rootUnit !== undefined) t.rootUnit = b.rootUnit || null
    if (b.domains !== undefined) t.domains = normHosts(b.domains)
    if (b.isActive !== undefined) t.isActive = !!b.isActive
    t.updatedAt = now(); t.updatedBy = req.user.sub
    persist()
    log(Object.assign(Object.create(req), { tenant: t.id }), 'tenant.update', 'tenant', { id: t.id, title: t.name })
    res.json(out(t))
  })

  /* tên miền → mã trang (chỉ trang đang bật) */
  cms.get('/api/v1/public/tenants/resolve', (req, res) => {
    const host = String(req.query.host || '').trim().toLowerCase()
    const t = tenants().find((x) => x.isActive !== false && (x.domains || []).includes(host))
    return t ? res.json({ id: t.id, name: t.name }) : bad(res, 404, 'Tên miền chưa gắn với trang nào.')
  })
}
