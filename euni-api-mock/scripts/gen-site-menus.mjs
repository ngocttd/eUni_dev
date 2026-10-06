import { pathToFileURL } from 'node:url'
import { writeFileSync } from 'node:fs'
const root = process.argv[2]
const s = await import(pathToFileURL(`${root}/euni-public/src/routes/sitemap.js`).href)
const dict = (await import(pathToFileURL(`${root}/euni-public/src/i18n/dictionary.js`).href)).default
/* nhãn tiếng Anh lấy từ từ điển dịch của website (nếu có) */
const EN_EXTRA = { 'Giảng viên / Cán bộ': 'Lecturers & Staff', 'Thông tin truy cập chính phủ': 'Government information access', 'Quy chế học vụ': 'Academic regulations', 'Chính sách bảo mật': 'Privacy policy', 'Điều khoản sử dụng': 'Terms of use', 'Chính sách & Quy định': 'Policies & Regulations' }
const en = (label) => dict[label] || EN_EXTRA[label] || null
const out = []
const POLICY = { 'Chính sách bảo mật': '/trang/chinh-sach-bao-mat', 'Điều khoản sử dụng': '/trang/dieu-khoan-su-dung' }
const push = (group, it, parent = null, order = 0, extra = {}) => { const row = { group, label: it.label, labelEn: en(it.label), url: it.path, icon: it.icon || null, parent, order, ...extra }; out.push(row); return out.length - 1 }
s.headerNav.forEach((m, i) => { const p = push('header', m, null, i + 1, {}); (m.mode === 'menu' ? m.children || [] : []).forEach((c, j) => push('header', c, p, j + 1)) })
s.footerColumns.forEach((col, i) => { const p = push('footer', { label: col.title, path: '' }, null, i + 1); col.links.forEach((l, j) => push('footer', { ...l, path: POLICY[l.label] || l.path }, p, j + 1)) })
;[{ label: 'Sơ đồ trang', path: '/sitemap' }, { label: 'Liên hệ', path: '/lien-he' }].forEach((l, i) => push('utility', l, null, i + 1))
writeFileSync(`${root}/euni-api-mock/mock-data/site-menus.json`, JSON.stringify(out, null, 1))
console.log(out.length, 'items', out.filter(x => x.group === 'header').length, 'header', out.filter((x) => !x.labelEn).length, 'chưa có nhãn EN:', out.filter((x) => !x.labelEn).map((x) => x.label).join(', '))
