// Xuất toàn bộ mock data của prototype React cũ (src/modules/**/data.js) ra JSON để mock API phục vụ.
// Chạy 1 lần:  node scripts/export-mock-data.mjs <đường-dẫn-tới-thư-mục-src-cũ>
import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const src = resolve(process.argv[2] || '../../src')
const out = resolve('mock-data')
mkdirSync(out, { recursive: true })

const MODULES = {
  about: 'modules/public/about/data.js',
  admissions: 'modules/public/admissions/data.js',
  content: 'modules/public/content/data.js',
  cooperation: 'modules/public/cooperation/data.js',
  education: 'modules/public/education/data.js',
  home: 'modules/public/home/data.js',
  library: 'modules/public/library/data.js',
  life: 'modules/public/life/data.js',
  research: 'modules/public/research/data.js',
  'staff-hub': 'modules/public/staff-hub/data.js',
  'student-hub': 'modules/public/student-hub/data.js',
  utilities: 'modules/public/utilities/data.js',
  'portal-leader': 'modules/portal/leader/data.js',
  'portal-parent': 'modules/portal/parent/data.js',
  'portal-staff': 'modules/portal/staff/data.js',
  'portal-staff-tools': 'modules/portal/staff/toolData.js',
  'portal-student': 'modules/portal/student/data.js',
  cms: 'modules/cms/data.js',
}

for (const [name, rel] of Object.entries(MODULES)) {
  const mod = await import(pathToFileURL(join(src, rel)).href)
  const data = {}
  for (const [k, v] of Object.entries(mod)) if (typeof v !== 'function') data[k] = v
  writeFileSync(join(out, `${name}.json`), JSON.stringify(data, null, 1))
  console.log(name.padEnd(20), Object.keys(data).length, 'keys')
}
