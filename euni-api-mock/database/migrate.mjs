// Tạo database (nếu chưa có) → áp dụng schema.sql → (tuỳ chọn) seed.
// Dùng:  node migrate.mjs            giữ dữ liệu, chỉ tạo bảng còn thiếu
//        node migrate.mjs --fresh    xóa schema "cms" rồi tạo lại (MẤT dữ liệu CMS)
//        node migrate.mjs --seed     áp schema rồi nạp dữ liệu mẫu
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { config, newClient } from './db.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const args = new Set(process.argv.slice(2))

async function ensureDatabase() {
  const admin = newClient('postgres')
  await admin.connect()
  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [config.database])
    if (!rowCount) {
      await admin.query(`CREATE DATABASE "${config.database.replace(/"/g, '""')}" ENCODING 'UTF8'`)
      console.log(`✔ Đã tạo database ${config.database}`)
    } else {
      console.log(`• Database ${config.database} đã tồn tại`)
    }
  } finally {
    await admin.end()
  }
}

async function applySchema() {
  const client = newClient()
  await client.connect()
  try {
    if (args.has('--fresh')) {
      await client.query('DROP SCHEMA IF EXISTS cms CASCADE')
      console.log('✔ Đã xóa schema cms')
    }
    await client.query(readFileSync(join(here, 'schema.sql'), 'utf8'))
    const { rows } = await client.query(
      "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'cms' AND table_type = 'BASE TABLE'")
    console.log(`✔ Đã áp dụng schema.sql (${rows[0].n} bảng trong schema cms)`)
  } finally {
    await client.end()
  }
}

await ensureDatabase()
await applySchema()
if (args.has('--seed')) await import('./seed.mjs')
