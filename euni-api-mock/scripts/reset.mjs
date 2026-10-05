import { rmSync } from 'node:fs'
rmSync(new URL('../data/store.json', import.meta.url), { force: true })
console.log('Đã xóa data/store.json — lần chạy sau mock sẽ nạp lại dữ liệu gốc.')
