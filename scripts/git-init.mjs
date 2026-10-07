// Khởi tạo git cho từng repo (nhánh main + develop), chưa commit/push.
//   node scripts/git-init.mjs
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
for (const repo of ['euni-public', 'euni-admin', 'euni-api-mock', 'euni-api-dotnet']) {
  const cwd = join(root, repo)
  if (existsSync(join(cwd, '.git'))) { console.log(`• ${repo}: đã có git`); continue }
  execSync('git init -b main', { cwd, stdio: 'inherit' })
  console.log(`✔ ${repo}: git init (main). Tiếp: git add . && git commit -m "init" && git remote add origin <url> && git push -u origin main && git checkout -b develop && git push -u origin develop`)
}
