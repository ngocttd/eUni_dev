// Chuyển prototype React (Vite + react-router) sang 2 repo Next.js (App Router):
//   node scaffold.mjs public   → ../euni-public  (website công khai + My eUni Portal + đăng nhập)
//   node scaffold.mjs portal   → ../euni-portal
//   node scaffold.mjs admin    → ../euni-admin
// Việc tự động hoá: sao chép + biến đổi mã nguồn (router, 'use client', import data.js → useModuleData),
// sinh route Next từ sitemap + registry. Phần viết tay nằm ở templates/.
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, rmSync, cpSync } from 'node:fs'
import { join, dirname, resolve, relative, sep, posix, extname } from 'node:path'
import { pathToFileURL } from 'node:url'

const TARGET = process.argv[2]
if (!['public', 'admin'].includes(TARGET)) throw new Error('Dùng: node scaffold.mjs public|admin')

const TOOLS = resolve('.')
const ROOT = resolve(TOOLS, '../..')
// Mã nguồn prototype React/Vite cũ: giải nén euni_legacy_vite_backup.zip vào tools/migration/legacy (hoặc đặt LEGACY_DIR)
const OLD = process.env.LEGACY_DIR ? resolve(process.env.LEGACY_DIR) : join(TOOLS, 'legacy')
const OUT = join(ROOT, `euni-${TARGET}`)
const SRC = join(OLD, 'src')
const NEW_SRC = join(OUT, 'src')
const require = createRequire(join(OLD, 'package.json'))
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default

const posixPath = (p) => p.split(sep).join('/')
const rel = (p) => posixPath(relative(SRC, p))
const isCode = (f) => /\.(jsx?|mjs)$/.test(f)
const walk = (d, out = []) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p, out) : out.push(p) } return out }
const read = (p) => readFileSync(p, 'utf8')
const write = (p, s) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, s) }
const parse = (code) => parser.parse(code, { sourceType: 'module', plugins: ['jsx'], errorRecovery: false })

/* ---------- module key theo thư mục chứa data.js ---------- */
const DATA_FILE = /(^|[\\/])(data|toolData)\.js$/
const moduleKeyOf = (abs) => {
  const r = rel(abs)
  const m = r.match(/^modules\/(public|portal)\/([^/]+)\/(data|toolData)\.js$/) || r.match(/^modules\/(cms)\/(data)\.js$/)
  if (!m) return null
  if (m[1] === 'cms') return 'cms'
  if (m[1] === 'portal') return m[3] === 'toolData' ? `portal-${m[2]}-tools` : `portal-${m[2]}`
  return m[2]
}
const resolveImport = (fromFile, source) => {
  const base = resolve(dirname(fromFile), source)
  for (const c of [base, `${base}.jsx`, `${base}.js`, join(base, 'index.jsx'), join(base, 'index.js')]) if (existsSync(c) && statSync(c).isFile()) return c
  return null
}

/* ============================================================
 * PASS 1 — tìm các tên dữ liệu được dùng ở mức module (nav, hằng cấu hình...) → cấu hình tĩnh
 * ============================================================ */
const allFiles = walk(SRC).filter(isCode)
const STATIC = {} // moduleKey → Set(name)
for (const file of allFiles) {
  if (DATA_FILE.test(file)) continue
  const code = read(file)
  if (!/data\.js|toolData\.js/.test(code)) continue
  const ast = parse(code)
  const imps = {}
  ast.program.body.forEach((n) => {
    if (n.type !== 'ImportDeclaration' || !DATA_FILE.test(n.source.value)) return
    const abs = resolveImport(file, n.source.value)
    const key = abs && moduleKeyOf(abs)
    if (key) n.specifiers.forEach((s) => (imps[s.local.name] = { key, imported: s.imported?.name }))
  })
  if (!Object.keys(imps).length) continue
  traverse(ast, {
    Program(p) {
      for (const [name, info] of Object.entries(imps)) {
        p.scope.getBinding(name).referencePaths.forEach((r) => {
          if (!r.findParent((x) => x.isFunction())) (STATIC[info.key] ||= new Set()).add(info.imported)
        })
      }
    },
  })
}
// các tên nav/danh sách tĩnh luôn dùng chung giữa nhiều file → gom theo tên ở mọi module nguồn
for (const k of Object.keys(STATIC)) console.log('[static]', k, [...STATIC[k]].join(', '))

/* ============================================================
 * PASS 2 — chọn file & biến đổi
 * ============================================================ */
const DIRS = {
  public: ['modules/public', 'modules/portal', 'modules/authentication', 'shared', 'i18n'],
  admin: ['modules/cms', 'shared', 'i18n'],
}
const KEEP_DIRS = DIRS[TARGET]
const LAYOUT = 'shared/components/layout'
const EXCLUDE = [
  /^shared\/services\/(apiClient|authService|tokenService)\.js$/, /^shared\/auth\//, /^shared\/guards\//, /^shared\/hooks\/useApiQuery\.js$/,
  /\/services\/[a-zA-Z]+Service\.js$/, /^modules\/portal\/student\/hooks\//,
  ...(TARGET === 'admin' ? [new RegExp(`^${LAYOUT}/(Header|Footer|PublicLayout)\.jsx`)] : []),
]
const included = (f) => {
  const r = rel(f)
  if (DATA_FILE.test(f)) return false
  if (r === 'routes/sitemap.js') return false // được tách riêng bên dưới
  if (EXCLUDE.some((re) => re.test(r))) return false
  return KEEP_DIRS.some((d) => r === d || r.startsWith(`${d}/`))
}

const STATIC_USED = new Set()
const usedModules = {} // file(rel) → Set(moduleKey) (trực tiếp)
const importGraph = {} // file(abs) → [abs]
const problems = []
const toRel = (fromFile, toAbs) => { let r = posixPath(relative(dirname(fromFile), toAbs)); if (!r.startsWith('.')) r = `./${r}`; return r }

function transform(file, override) {
  let code = override?.code ?? read(file)
  const r = rel(file)
  const destRel = override?.destRel ?? r
  const isJsx = file.endsWith('.jsx')
  const edits = [] // {start,end,text}
  const ast = parse(code)
  const body = ast.program.body

  // 1) react-router-dom → shim
  const routerImport = body.find((n) => n.type === 'ImportDeclaration' && n.source.value === 'react-router-dom')
  const shimAbs = join(NEW_SRC, 'lib', 'router.jsx')
  if (routerImport) {
    const newFile = join(NEW_SRC, destRel)
    edits.push({ start: routerImport.source.start, end: routerImport.source.end, text: `'${toRel(newFile, shimAbs).replace(/\.jsx$/, '.jsx')}'` })
  }

  // 2) import dữ liệu
  const imps = []
  body.forEach((n) => {
    if (n.type !== 'ImportDeclaration' || !DATA_FILE.test(n.source.value)) return
    const abs = resolveImport(file, n.source.value)
    const key = abs && moduleKeyOf(abs)
    if (!key) { problems.push(`${r}: không resolve được ${n.source.value}`); return }
    const names = n.specifiers.map((s) => ({ local: s.local.name, imported: s.imported?.name, kind: s.type }))
    if (names.some((x) => x.kind !== 'ImportSpecifier')) problems.push(`${r}: import default/namespace từ ${n.source.value}`)
    imps.push({ node: n, key, names })
  })

  const newFile = join(NEW_SRC, destRel)
  const hookCalls = new Map() // fn node → Map(module → [{local, imported}])
  const fnNodes = new Map()
  const staticByImport = []
  if (imps.length) {
    for (const imp of imps) {
      const stat = STATIC[imp.key] || new Set()
      const staticNames = imp.names.filter((x) => stat.has(x.imported))
      const dynNames = imp.names.filter((x) => !stat.has(x.imported))
      imp.dyn = dynNames
      if (staticNames.length) {
        STATIC_USED.add(imp.key)
        const staticAbs = join(NEW_SRC, 'config', 'static', `${imp.key}.js`)
        staticByImport.push(`import { ${staticNames.map((x) => (x.local === x.imported ? x.local : `${x.imported} as ${x.local}`)).join(', ')} } from '${toRel(newFile, staticAbs)}'`)
      }
      edits.push({ start: imp.node.start, end: imp.node.end, text: '' })
    }
    traverse(ast, {
      Program(p) {
        for (const imp of imps) {
          for (const nm of imp.dyn) {
            const binding = p.scope.getBinding(nm.local)
            binding.referencePaths.forEach((ref) => {
              let top = null
              ref.findParent((x) => { if (x.isFunction()) top = x; return false })
              if (!top) { problems.push(`${r}: dùng ${nm.local} ở mức module`); return }
              if (top.node.params.some((pm) => ref.findParent((x) => x === top) && ref.node.start >= pm.start && ref.node.end <= pm.end)) problems.push(`${r}: ${nm.local} dùng trong tham số hàm`)
              fnNodes.set(top.node, top.node)
              const perFn = hookCalls.get(top.node) || new Map()
              const arr = perFn.get(imp.key) || []
              if (!arr.some((a) => a.local === nm.local)) arr.push(nm)
              perFn.set(imp.key, arr)
              hookCalls.set(top.node, perFn)
            })
          }
        }
      },
    })
    const mods = new Set()
    for (const [fn, perFn] of hookCalls) {
      const lines = [...perFn.entries()].map(([key, names]) => {
        mods.add(key)
        return `const { ${names.map((x) => (x.local === x.imported ? x.local : `${x.imported}: ${x.local}`)).join(', ')} } = useModuleData('${key}');`
      }).join(' ')
      if (fn.body.type === 'BlockStatement') {
        edits.push({ start: fn.body.start + 1, end: fn.body.start + 1, text: `\n  ${lines}` })
      } else {
        const b = fn.body
        const par = b.extra?.parenthesized
        let s = par ? b.extra.parenStart : b.start
        let e = b.end
        if (par) { while (/\s/.test(code[e])) e++; if (code[e] === ')') e++ }
        edits.push({ start: s, end: e, text: `{ ${lines} return (${code.slice(b.start, b.end)}) }` })
      }
    }
    if (mods.size) usedModules[r] = mods
  }

  // 3) áp dụng edits (từ cuối về đầu)
  edits.sort((a, b) => b.start - a.start)
  for (const e of edits) code = code.slice(0, e.start) + e.text + code.slice(e.end)

  // 4) header: 'use client' + import bổ sung
  const header = []
  const hasHook = usedModules[r]
  if (isJsx || /\/hooks\//.test(r)) header.push("'use client'")
  const lines = [...staticByImport]
  if (hasHook) lines.push("import { useModuleData } from '@/lib/datasets/useModuleData'")
  // đặt sau các import hiện có không cần thiết → chèn ngay sau 'use client'
  code = [...header, ...lines, code.replace(/^﻿/, '')].filter(Boolean).join('\n') + (code.endsWith('\n') ? '' : '\n')
  return code
}

/* sao chép + biến đổi */
const compiled = []
for (const file of allFiles.concat(walk(SRC).filter((f) => !isCode(f)))) {
  if (!included(file)) continue
  const r = rel(file)
  const dest = join(NEW_SRC, r)
  if (isCode(file)) { write(dest, transform(file)); compiled.push(file) } else write(dest, readFileSync(file))
  if (isCode(file)) {
    const ast = parse(read(file))
    importGraph[file] = ast.program.body.filter((n) => (n.type === 'ImportDeclaration' || (n.type === 'ExportNamedDeclaration' && n.source) || n.type === 'ExportAllDeclaration') && n.source && n.source.value.startsWith('.'))
      .map((n) => resolveImport(file, n.source.value)).filter(Boolean)
  }
}

/* ---------- tách routes/sitemap.js theo repo ---------- */
const SITEMAP = join(SRC, 'routes', 'sitemap.js')
const SITEMAP_PLAN = {
  public: { exports: ['mainNav', 'headerNav', 'quickAccessLinks', 'publicRoutes', 'footerColumns', 'portals', 'authRoutes'], dest: 'routes/sitemap.js' },
  admin: { exports: ['cmsConfig'], dest: 'routes/cmsConfig.js' },
}[TARGET]

function sliceSitemap(exportNames) {
  const code = read(SITEMAP)
  const ast = parse(code)
  const body = ast.program.body
  const declNames = (n) => {
    const d = n.type === 'ExportNamedDeclaration' ? n.declaration : n
    if (n.type === 'ImportDeclaration') return n.specifiers.map((x) => x.local.name)
    if (d?.type === 'VariableDeclaration') return d.declarations.map((x) => x.id.name)
    if (d?.type === 'FunctionDeclaration') return [d.id.name]
    return []
  }
  const owner = new Map()
  body.forEach((n, i) => declNames(n).forEach((nm) => owner.set(nm, i)))
  const deps = body.map(() => new Set())
  traverse(ast, {
    Program(p) {
      p.get('body').forEach((stmt, i) => {
        stmt.traverse({
          ReferencedIdentifier(ip) {
            const nm = ip.node.name
            if (!owner.has(nm) || owner.get(nm) === i) return
            if (ip.scope.getBinding(nm) === p.scope.getBinding(nm)) deps[i].add(owner.get(nm))
          },
        })
      })
    },
  })
  const keep = new Set()
  const stack = exportNames.map((nm) => owner.get(nm))
  if (stack.some((x) => x === undefined)) throw new Error(`sitemap thiếu export: ${exportNames}`)
  while (stack.length) { const i = stack.pop(); if (keep.has(i)) continue; keep.add(i); deps[i].forEach((d) => stack.push(d)) }
  return [...keep].sort((a, b) => a - b).map((i) => code.slice(body[i].start, body[i].end)).join('\n\n') + '\n'
}

{
  const code = sliceSitemap(SITEMAP_PLAN.exports)
  write(join(NEW_SRC, SITEMAP_PLAN.dest), transform(SITEMAP, { code, destRel: SITEMAP_PLAN.dest }))
}

/* cấu hình tĩnh */
for (const [key, names] of Object.entries(STATIC)) {
  if (!STATIC_USED.has(key)) continue
  const json = JSON.parse(read(join(ROOT, 'euni-api-mock', 'mock-data', `${key}.json`)))
  const body = [...names].map((n) => `export const ${n} = ${JSON.stringify(json[n], null, 2)}\n`).join('\n')
  write(join(NEW_SRC, 'config', 'static', `${key}.js`), `/* Cấu hình tĩnh của giao diện (menu/nav, danh sách lựa chọn) — sinh từ data.js cũ, thuộc về FE, không lấy từ API. */\n\n${body}`)
}

/* ---------- đóng gói biến đổi layout (Outlet → children) ---------- */
function patch(file, fn) { const p = join(NEW_SRC, file); write(p, fn(read(p))) }
for (const f of ['shared/components/layout/PublicLayout.jsx', 'shared/components/layout/AuthLayout.jsx', 'shared/components/layout/PortalLayout.jsx']) {
  if (!existsSync(join(NEW_SRC, f))) continue
  patch(f, (s) => s
    .replace(/import \{ Outlet, Link \} from '([^']+)'/, "import { Link } from '$1'")
    .replace(/import \{ NavLink, Outlet, Link \} from '([^']+)'/, "import { NavLink, Link } from '$1'")
    .replace(/import \{ Outlet \} from '([^']+)'\n/, '')
    .replace(/export default function PublicLayout\(\)/, 'export default function PublicLayout({ children })')
    .replace(/export default function AuthLayout\(\)/, 'export default function AuthLayout({ children })')
    .replace(/export default function PortalLayout\(\{ config, variant = 'portal' \}\)/, "export default function PortalLayout({ config, variant = 'portal', children })")
    .replace(/<Outlet \/>/g, '{children}'))
}

/* LanguageContext: tránh lệch hydrate (đọc localStorage sau khi mount) */
patch('i18n/LanguageContext.jsx', (s) => s
  .replace(/function readInitialLang\(\) \{[\s\S]*?\n\}\n/, '')
  .replace("const [lang, setLang] = useState(readInitialLang)", "const [lang, setLang] = useState('vi')\n\n  useEffect(() => {\n    const saved = window.localStorage.getItem(STORAGE_KEY)\n    if (saved === 'en') setLang('en')\n  }, [])")
  .replace("window.localStorage.setItem(STORAGE_KEY, lang)\n    document.documentElement.lang = lang", "document.documentElement.lang = lang\n    if (lang !== 'vi' || window.localStorage.getItem(STORAGE_KEY)) window.localStorage.setItem(STORAGE_KEY, lang)"))

/* ============================================================
 * Sinh route Next.js
 * ============================================================ */
const toNextSeg = (seg) => (seg.startsWith(':') ? `[${seg.slice(1)}]` : seg)
/* Next yêu cầu cùng một cấp dùng cùng tên tham số: /khoa/:id và /khoa/:khoaId/... → [khoaId] (router shim ánh xạ id) */
const normPath = (p) => p.replace(/\/gioi-thieu\/khoa\/:id(?=$)/, '/gioi-thieu/khoa/:khoaId')
const routeDir = (base, p) => join(NEW_SRC, 'app', base, ...normPath(p).split('/').filter(Boolean).map(toNextSeg))

const modFile = (m) => `@/${m}`

function parseRegistry(file) {
  const code = read(file)
  const ast = parse(code)
  const imports = {}
  ast.program.body.forEach((n) => {
    if (n.type === 'ImportDeclaration') n.specifiers.forEach((s) => (imports[s.local.name] = { source: n.source.value, imported: s.type === 'ImportDefaultSpecifier' ? 'default' : s.imported.name }))
  })
  const objects = {}
  ast.program.body.forEach((n) => {
    if (n.type !== 'VariableDeclaration') return
    for (const d of n.declarations) {
      if (d.init?.type !== 'ObjectExpression') continue
      objects[d.id.name] = d.init.properties.map((p) => {
        if (p.type === 'SpreadElement') return { spread: true }
        const key = p.key.type === 'StringLiteral' ? p.key.value : p.key.name
        return { key, jsx: code.slice(p.value.start, p.value.end), name: p.value.openingElement?.name?.name }
      })
    }
  })
  return { imports, objects }
}

/** component name + registry imports → file thật trong src mới (@/modules/...) */
function resolveComponent(registryFile, imports, name) {
  const imp = imports[name]
  if (!imp) throw new Error(`Không thấy import cho <${name}>`)
  let abs = resolveImport(registryFile, imp.source)
  if (!abs) throw new Error(`Không resolve ${imp.source}`)
  if (imp.imported === 'default') return { path: rel(abs).replace(/\.jsx?$/, ''), named: null }
  // barrel: tìm export { name } from './pages/X.jsx'
  const barrel = parse(read(abs))
  for (const n of barrel.program.body) {
    if (n.type === 'ExportNamedDeclaration' && n.source && n.specifiers.some((s) => s.exported.name === imp.imported)) {
      const target = resolveImport(abs, n.source.value)
      return { path: rel(target).replace(/\.jsx?$/, ''), named: imp.imported }
    }
  }
  throw new Error(`Barrel ${abs} không export ${imp.imported}`)
}

/** các module dữ liệu mà file (và các file nó import trong modules/) cần */
function closureModules(entryRelNoExt) {
  const entry = ['.jsx', '.js'].map((e) => join(SRC, entryRelNoExt + e)).find(existsSync)
  const seen = new Set(); const mods = new Set(); const stack = [entry]
  while (stack.length) {
    const f = stack.pop()
    if (seen.has(f)) continue
    seen.add(f)
    ;(usedModules[rel(f)] || []).forEach((m) => mods.add(m))
    ;(importGraph[f] || []).forEach((x) => { if (rel(x).startsWith('modules/')) stack.push(x) })
  }
  return [...mods]
}

const serverPageSrc = (comps, jsx, mods) => `${mods.length ? `import { loadDatasets } from '@/lib/datasets/loaders'\nimport { DatasetProvider } from '@/lib/datasets/useModuleData'\n` : ''}${comps.join('\n')}

export const dynamic = 'force-dynamic'

export default async function Page() {
${mods.length ? `  const datasets = await loadDatasets(${JSON.stringify(mods)})\n  return <DatasetProvider datasets={datasets}>${jsx}</DatasetProvider>` : `  return ${jsx}`}
}
`
const importLine = (r) => r.named ? `import { ${r.named} } from '${modFile(r.path)}'` : `import ${r.local} from '${modFile(r.path)}'`

const generated = []
const emit = (dir, src) => { write(join(dir, 'page.jsx'), src); generated.push(dir) }


const configModule = async (p) => import(`${pathToFileURL(join(NEW_SRC, p)).href}?t=${Date.now()}`)

/* ---------- views dùng chung (NotFound / PlaceholderPage) ---------- */
function copyViews(files) {
  for (const f of files) {
    let s = read(join(SRC, 'app', 'pages', f))
    s = s.replace(/'\.\.\/\.\.\//g, "'../").replace(/"\.\.\/\.\.\//g, '"../')
    if (f.endsWith('.jsx')) {
      s = s.replace("from 'react-router-dom'", "from '../lib/router.jsx'")
      s = `'use client'\n${s}`
    }
    write(join(NEW_SRC, 'views', f), s)
  }
}

if (TARGET === 'public') {
  const sitemap = await configModule('routes/sitemap.js')
  const reg = parseRegistry(join(SRC, 'routes', 'publicPageRegistry.jsx'))
  const built = reg.objects.builtPages
  const builtPaths = new Set(built.map((b) => b.key))
  const seenDirs = new Set()
  for (const b of built) {
    const comp = resolveComponent(join(SRC, 'routes', 'publicPageRegistry.jsx'), reg.imports, b.name)
    comp.local = b.name
    const dir = routeDir('(site)', b.key)
    if (seenDirs.has(dir)) continue
    seenDirs.add(dir)
    emit(dir, serverPageSrc([importLine(comp)], b.jsx, closureModules(comp.path)))
  }
  emit(join(NEW_SRC, 'app', '(site)'), serverPageSrc(["import HomePage from '@/modules/public/home/HomePage'"], '<HomePage />', closureModules('modules/public/home/HomePage')))
  for (const r of sitemap.publicRoutes) {
    if (!r.path || r.path === '/' || builtPaths.has(r.path)) continue
    const dir = routeDir('(site)', r.path)
    if (seenDirs.has(dir)) continue
    seenDirs.add(dir)
    emit(dir, `import PlaceholderPage from '@/views/PlaceholderPage'\n\nexport default function Page() {\n  return <PlaceholderPage title=${JSON.stringify(r.title)} wireframe=${JSON.stringify(r.wireframe || '')} />\n}\n`)
  }
  const { portals } = sitemap
  const preg = parseRegistry(join(SRC, 'routes', 'portalPageRegistry.jsx'))
  const PORTAL = {
    'sinh-vien': { obj: 'portalStudentPages', roles: ['student'], mods: ['portal-student'] },
    'giang-vien': { obj: 'portalStaffPages', roles: ['staff', 'lecturer'], mods: ['portal-staff', 'portal-staff-tools'] },
    'phu-huynh': { obj: 'portalParentPages', roles: ['parent'], mods: ['portal-parent'] },
    'lanh-dao': { obj: 'portalLeaderPages', roles: ['leader'], mods: ['portal-leader'] },
  }
  const toolList = (await configModule('config/static/portal-staff-tools.js')).staffToolList
  for (const cfg of portals) {
    const meta = PORTAL[cfg.key]
    const entries = preg.objects[meta.obj].flatMap((e) => (e.spread ? toolList.map((t) => ({ key: t.path, jsx: `<PgToolPage toolKey=${JSON.stringify(t.key)} />`, name: 'PgToolPage' })) : [e]))
    const byKey = new Map(entries.map((e) => [e.key, e]))
    const baseDir = join(NEW_SRC, 'app', '(portal)', ...cfg.base.split('/').filter(Boolean))
    write(join(baseDir, 'layout.jsx'), `'use client'\nimport PortalShell from '@/shared/portal/PortalShell'\n\nexport default function Layout({ children }) {\n  return <PortalShell portal=${JSON.stringify(cfg.key)} roles={${JSON.stringify(meta.roles)}} modules={${JSON.stringify(meta.mods)}}>{children}</PortalShell>\n}\n`)
    for (const it of cfg.items) {
      const e = byKey.get(it.path || '')
      const dir = join(baseDir, ...(it.path || '').split('/').filter(Boolean).map(toNextSeg))
      if (e) {
        const comp = resolveComponent(join(SRC, 'routes', 'portalPageRegistry.jsx'), preg.imports, e.name); comp.local = e.name
        write(join(dir, 'page.jsx'), `'use client'\n${importLine(comp)}\n\nexport default function Page() {\n  return ${e.jsx}\n}\n`)
      } else {
        write(join(dir, 'page.jsx'), `'use client'\nimport PlaceholderPage from '@/views/PlaceholderPage'\n\nexport default function Page() {\n  return <PlaceholderPage title=${JSON.stringify(it.title)} wireframe=${JSON.stringify(it.wireframe || '')} />\n}\n`)
      }
    }
    generated.push(baseDir)
  }
  const authPages = { '/dang-nhap': 'LoginPage', '/dang-nhap-phu-huynh': 'ParentLoginPage', '/doi-mat-khau': 'ChangePasswordPage', '/quen-mat-khau': 'ForgotPasswordPage' }
  for (const [p, name] of Object.entries(authPages)) {
    emit(routeDir('(auth)', p), `import { ${name} } from '@/modules/authentication/pages/${name}'\n\nexport default function Page() {\n  return <${name} />\n}\n`)
  }
  patch('modules/authentication/pages/LoginPage.jsx', (t) => t.replace('const from = location.state?.from?.pathname', "const from = new URLSearchParams(location.search).get('next')"))
  patch('modules/authentication/shared.jsx', (t) => t.replace(/, \{\s*label: 'CMS \/ Quản trị',\s*to: '\/cms',\s*role: 'cms'\s*\}\]/, ']'))
  copyViews(['NotFound.jsx', 'NotFound.css', 'PlaceholderPage.jsx', 'PlaceholderPage.css'])
  write(join(NEW_SRC, 'app', 'globals.css'), read(join(SRC, 'index.css')))
}

if (TARGET === 'admin') {
  const { cmsConfig: cfg } = await configModule('routes/cmsConfig.js')
  const reg = parseRegistry(join(SRC, 'routes', 'cmsPageRegistry.jsx'))
  const entries = new Map(reg.objects.cmsPages.map((e) => [e.key, e]))
  const baseDir = join(NEW_SRC, 'app', '(cms)', 'cms')
  write(join(baseDir, 'layout.jsx'), `'use client'\nimport CmsShell from '@/shared/portal/CmsShell'\n\nexport default function Layout({ children }) {\n  return <CmsShell>{children}</CmsShell>\n}\n`)
  for (const it of cfg.items) {
    const e = entries.get(it.path || '')
    if (!e) { problems.push(`CMS: thiếu registry cho '${it.path}'`); continue }
    const comp = resolveComponent(join(SRC, 'routes', 'cmsPageRegistry.jsx'), reg.imports, e.name); comp.local = e.name
    const dir = join(baseDir, ...(it.path || '').split('/').filter(Boolean).map(toNextSeg))
    write(join(dir, 'page.jsx'), `'use client'\n${importLine(comp)}\n\nexport default function Page() {\n  return ${e.jsx}\n}\n`)
  }
  write(join(NEW_SRC, 'app', 'globals.css'), read(join(SRC, 'index.css')))
  // hằng số giao diện của CMS (tab, danh sách lựa chọn, mặc định form) — không phải dữ liệu API
  const cmsJson = JSON.parse(read(join(ROOT, 'euni-api-mock', 'mock-data', 'cms.json')))
  const API_KEYS = new Set(['cmsUser', 'cmsDashboard', 'cmsPostCategories', 'cmsPosts', 'cmsPostTotal', 'cmsCategories', 'cmsMedia', 'cmsMediaTotal', 'cmsPageTree', 'cmsMenus', 'cmsUsers', 'cmsUserTotal', 'cmsRoles', 'cmsPermissionMatrix', 'cmsSettings', 'cmsLogUsers', 'cmsActivity', 'cmsLogTotal', 'cmsBackups', 'cmsBanners', 'cmsLanguages', 'cmsPostI18n', 'cmsI18nCoverage'])
  const uiBody = Object.entries(cmsJson).filter(([k]) => !API_KEYS.has(k)).map(([k, v]) => `export const ${k} = ${JSON.stringify(v, null, 2)}\n`).join('\n')
  write(join(NEW_SRC, 'config', 'cmsUi.js'), `/* Hằng số giao diện CMS (tab, danh sách lựa chọn, giá trị mặc định form). Dữ liệu nghiệp vụ lấy từ cms-api (lib/datasets/loaders.js). */\n\n${uiBody}`)
  write(join(NEW_SRC, 'modules', 'authentication', 'auth.css'), read(join(SRC, 'modules', 'authentication', 'auth.css')))
  // CMS dùng chung các class ps-* của portal sinh viên → tách bản CSS riêng để repo admin tự đứng được
  write(join(NEW_SRC, 'modules', 'cms', 'portal-student.css'), read(join(SRC, 'modules', 'portal', 'student', 'portal-student.css')))
  patch('modules/cms/shared.jsx', (t) => t.replace("'../portal/student/portal-student.css'", "'./portal-student.css'"))
}

/* ---------- CSS: nạp đúng thứ tự như bản Vite cũ ---------- */
// Thứ tự cascade quan trọng (index.css được import SAU CÙNG ở main.jsx nên thắng .pg-section, v.v.).
// Dựng lại bằng cách duyệt import theo thứ tự ES từ main.jsx.
function legacyCssOrder() {
  const order = []
  const seen = new Set()
  const visit = (file) => {
    if (seen.has(file)) return
    seen.add(file)
    if (file.endsWith('.css')) { order.push(file); return }
    if (!isCode(file)) return
    const ast = parse(read(file))
    for (const n of ast.program.body) {
      const src = (n.type === 'ImportDeclaration' || n.type === 'ExportAllDeclaration' || (n.type === 'ExportNamedDeclaration' && n.source)) && n.source?.value
      if (!src || !src.startsWith('.')) continue
      const abs = resolveImport(file, src)
      if (abs) visit(abs)
    }
  }
  visit(join(SRC, 'main.jsx'))
  return order
}
{
  const css = legacyCssOrder().map((f) => rel(f)).map((r) => (TARGET === 'admin' && r === 'modules/portal/student/portal-student.css' ? 'modules/cms/portal-student.css' : r)).filter((r) => r !== 'index.css' && existsSync(join(NEW_SRC, r)))
  const missing = walk(NEW_SRC).filter((f) => f.endsWith('.css') && /[\\/](modules|shared)[\\/]/.test(f)).map((f) => posixPath(relative(NEW_SRC, f))).filter((r) => !css.includes(r)).sort()
  const all = [...css, ...missing]
  write(join(NEW_SRC, 'app', 'module-styles.js'), `/* CSS của mọi module/shared theo đúng thứ tự import của bản Vite cũ (globals.css được nạp sau cùng trong layout). */\n${all.map((f) => `import '../${f}'`).join('\n')}\n`)
}

/* ---------- assets + templates ---------- */
cpSync(join(OLD, 'public'), join(OUT, 'public'), { recursive: true })
cpSync(join(TOOLS, 'templates', 'common'), OUT, { recursive: true })
cpSync(join(TOOLS, 'templates', TARGET), OUT, { recursive: true })

if (problems.length) { console.log('\n⚠ CẦN XỬ LÝ THỦ CÔNG:'); problems.forEach((p) => console.log(' -', p)) }
console.log(`\n✔ ${TARGET}: ${compiled.length} file mã nguồn, ${generated.length} route sinh tự động → ${OUT}`)
