// Mock API cho các phân hệ KHÔNG thuộc CMS (dữ liệu sẽ do các hệ thống ngoài cung cấp: qlns, qlkhcn, qldt, portal).
// Dữ liệu lấy từ mock-data/<module>.json. Với mỗi module có 2 kiểu endpoint:
//   GET /{service}/api/v1/datasets/{module}            → toàn bộ dataset của module (FE dùng 1 lần/trang)
//   GET /{service}/api/v1/{module}/{resource}          → từng tài nguyên (mảng có phân trang pageIndex/pageSize/keyword)
import { Router } from 'express'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { paged } from './cms.js'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'mock-data')

/** module → service gateway. Đổi ở đây (và ở FE: lib/api/registry.js) khi backend thật chia service khác. */
export const MODULE_SERVICE = {
  about: 'qlns-api', 'staff-hub': 'qlns-api', 'portal-staff': 'qlns-api', 'portal-staff-tools': 'qlns-api', 'portal-leader': 'qlns-api',
  research: 'qlkhcn-api',
  admissions: 'qldt-api', education: 'qldt-api', 'student-hub': 'qldt-api', 'portal-student': 'qldt-api', 'portal-parent': 'qldt-api',
  cooperation: 'portal-api', library: 'portal-api', life: 'portal-api', utilities: 'portal-api',
}
export const SERVICES = [...new Set(Object.values(MODULE_SERVICE))]
const data = {}
for (const f of readdirSync(dir)) { const m = f.replace('.json', ''); if (MODULE_SERVICE[m]) data[m] = JSON.parse(readFileSync(join(dir, f), 'utf8')) }

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')

export function serviceRouter(service) {
  const r = Router()
  r.get('/api/v1/datasets/:module', (req, res) => {
    const d = MODULE_SERVICE[req.params.module] === service && data[req.params.module]
    return d ? res.json(d) : res.status(404).json({ message: 'Không có dataset.' })
  })
  for (const [module, d] of Object.entries(data)) {
    if (MODULE_SERVICE[module] !== service) continue
    for (const [key, value] of Object.entries(d)) {
      r.get(`/api/v1/${module}/${kebab(key)}`, (req, res) => {
        if (!Array.isArray(value)) return res.json(value)
        const kw = req.query.keyword && norm(req.query.keyword)
        const list = kw ? value.filter((x) => norm(JSON.stringify(x)).includes(kw)) : value
        res.json(paged(list, req.query))
      })
    }
  }
  /* Hai endpoint có trong Swagger thật của gateway demo */
  if (service === 'qlkhcn-api') {
    r.get('/api/v1/research-topic-categories', (req, res) => {
      const list = data.research.researchFields.map((name, i) => ({ id: i + 1, code: `LV${String(i + 1).padStart(2, '0')}`, name }))
      const kw = req.query.keyword && norm(req.query.keyword)
      res.json(paged(kw ? list.filter((x) => norm(x.name).includes(kw)) : list, req.query))
    })
  }
  if (service === 'qlns-api') {
    r.get('/api/v1/employees', (req, res) => {
      const out = []
      for (const khoa of Object.values(data.about.facultyDepartments)) for (const dept of khoa) for (const l of dept.lecturers || []) out.push({ id: l.id, fullName: l.name, position: l.position, email: l.email, department: dept.name, publications: l.pubs, isCurrent: true })
      const kw = req.query.keyword && norm(req.query.keyword)
      res.json(paged(kw ? out.filter((x) => norm(`${x.fullName} ${x.department}`).includes(kw)) : out, req.query))
    })
  }
  return r
}
