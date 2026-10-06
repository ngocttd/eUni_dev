// Mock API cho các phân hệ KHÔNG thuộc tin tức CMS (dữ liệu do các hệ thống ngoài cung cấp qua API gateway: qlns, qlkhcn, edusoft, esb).
// Dữ liệu lấy từ mock-data/<module>.json. Quy ước endpoint: chữ thường, ngăn cách bằng '-', có version, tách nhóm /public/ · /me/ · /admin/.
//   GET /{service}/api/v1/{group}/datasets/{module}     → toàn bộ dataset của module (FE dùng 1 lần/trang)
//   GET /{service}/api/v1/{group}/{module}/{resource}   → từng tài nguyên (mảng có phân trang pageIndex/pageSize/keyword)
// group = 'me' cho dữ liệu cá nhân của portal (module portal-*), 'public' cho phần còn lại.
import { Router } from 'express'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { paged } from './cms.js'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'mock-data')

/**
 * module → service gateway. Đổi ở đây (và ở FE: lib/datasets/loaders.js) khi backend thật chia service khác.
 * Không có `portal-api`: web/mobile gọi thẳng các service qua API gateway (edusoft-api = đào tạo, esb-api = tích hợp hệ thống ngoài),
 * nội dung tĩnh của website (hợp tác, đời sống, tiện ích) do cms-api phục vụ.
 */
export const MODULE_SERVICE = {
  about: 'qlns-api', 'staff-hub': 'qlns-api', 'portal-staff': 'qlns-api', 'portal-staff-tools': 'qlns-api', 'portal-leader': 'qlns-api',
  research: 'qlkhcn-api',
  admissions: 'edusoft-api', education: 'edusoft-api', 'student-hub': 'edusoft-api', 'portal-student': 'edusoft-api', 'portal-parent': 'edusoft-api',
  library: 'esb-api',
  cooperation: 'cms-api', life: 'cms-api', utilities: 'cms-api',
}
/** Service chỉ có dataset (cms-api có router riêng trong cms.js, chỉ gắn thêm phần dataset) */
export const SERVICES = [...new Set(Object.values(MODULE_SERVICE))].filter((s) => s !== 'cms-api')
/** Nhóm endpoint của module: dữ liệu cá nhân portal → /me/, còn lại → /public/ */
export const groupOf = (module) => (module.startsWith('portal-') ? 'me' : 'public')
const data = {}
for (const f of readdirSync(dir)) { const m = f.replace('.json', ''); if (MODULE_SERVICE[m]) data[m] = JSON.parse(readFileSync(join(dir, f), 'utf8')) }

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')

export function serviceRouter(service) {
  const r = Router()
  r.get('/api/v1/:group(public|me)/datasets/:module', (req, res) => {
    const m = req.params.module
    const d = MODULE_SERVICE[m] === service && groupOf(m) === req.params.group && data[m]
    return d ? res.json(d) : res.status(404).json({ message: 'Không có dataset.' })
  })
  for (const [module, d] of Object.entries(data)) {
    if (MODULE_SERVICE[module] !== service) continue
    for (const [key, value] of Object.entries(d)) {
      r.get(`/api/v1/${groupOf(module)}/${module}/${kebab(key)}`, (req, res) => {
        if (!Array.isArray(value)) return res.json(value)
        const kw = req.query.keyword && norm(req.query.keyword)
        const list = kw ? value.filter((x) => norm(JSON.stringify(x)).includes(kw)) : value
        res.json(paged(list, req.query))
      })
    }
  }
  /* Hai endpoint có trong Swagger thật của gateway demo (đưa về quy ước /api/v1/public/...) */
  if (service === 'qlkhcn-api') {
    r.get('/api/v1/public/research-topic-categories', (req, res) => {
      const list = data.research.researchFields.map((name, i) => ({ id: i + 1, code: `LV${String(i + 1).padStart(2, '0')}`, name }))
      const kw = req.query.keyword && norm(req.query.keyword)
      res.json(paged(kw ? list.filter((x) => norm(x.name).includes(kw)) : list, req.query))
    })
  }
  if (service === 'qlns-api') {
    r.get('/api/v1/public/employees', (req, res) => {
      const out = []
      for (const khoa of Object.values(data.about.facultyDepartments)) for (const dept of khoa) for (const l of dept.lecturers || []) out.push({ id: l.id, fullName: l.name, position: l.position, email: l.email, department: dept.name, publications: l.pubs, isCurrent: true })
      const kw = req.query.keyword && norm(req.query.keyword)
      res.json(paged(kw ? out.filter((x) => norm(`${x.fullName} ${x.department}`).includes(kw)) : out, req.query))
    })
  }
  return r
}
