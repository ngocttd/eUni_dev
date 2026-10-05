/** Định dạng hiển thị dùng chung cho adapter (API trả ISO / số liệu thô, giao diện cần chuỗi hiển thị). */
const TZ = 'Asia/Ho_Chi_Minh'

const parts = (iso) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
  return Object.fromEntries(f.formatToParts(d).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value === '24' ? '00' : p.value]))
}

/** 2025-05-15T08:00:00+07:00 → 15/05/2025 */
export const fmtDate = (iso) => { const p = iso && parts(iso); return p ? `${p.day}/${p.month}/${p.year}` : '' }
/** → 08:00 */
export const fmtTime = (iso) => { const p = iso && parts(iso); return p ? `${p.hour}:${p.minute}` : '' }
/** → 15/05/2025 08:00 */
export const fmtDateTime = (iso) => { const p = iso && parts(iso); return p ? `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}` : '' }
/** → { day: '20', month: 'THG 5' } */
export const dayMonth = (iso) => { const p = iso && parts(iso); return p ? { day: p.day, month: `THG ${Number(p.month)}` } : { day: '', month: '' } }
/** 2025-05-15 | ISO → value cho <input type="datetime-local"> (giờ VN) */
export const toLocalInput = (iso) => { const p = iso && parts(iso); return p ? `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}` : '' }
/** giá trị datetime-local (giờ VN) → ISO */
export const fromLocalInput = (v) => (v ? `${v}:00+07:00` : null)

/** 925 → 15:25 · 3725 → 1:02:05 */
export const fmtDuration = (sec = 0) => {
  const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60); const s = sec % 60
  const mm = String(m).padStart(2, '0'); const ss = String(s).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export const fmtBytes = (n = 0) => (n >= 1048576 ? `${(n / 1048576).toFixed(1).replace(/\.0$/, '')} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

/** contentBody (chuỗi JSON các khối, hoặc văn bản thường) → mảng khối hiển thị */
export const parseBody = (s) => {
  if (Array.isArray(s)) return s
  if (!s) return []
  try { const v = JSON.parse(s); if (Array.isArray(v)) return v } catch { /* HTML hoặc văn bản thường */ }
  if (/^\s*</.test(s)) return [{ type: 'html', html: String(s) }]
  return String(s).split(/\n{2,}/).map((x) => x.trim()).filter(Boolean)
}

/**
 * contentBody (mảng khối) ⇄ văn bản biên tập (markdown rút gọn) cho ô soạn thảo của CMS.
 *   ## Tiêu đề        → { type: 'h2', text }
 *   > Trích dẫn       → { type: 'quote', text }
 *   - mục             → { type: 'list', items }   (các dòng '- ' liên tiếp)
 *   ![chú thích](nhãn ảnh) → { type: 'img', caption, label }
 *   còn lại           → đoạn văn (chuỗi); các đoạn cách nhau bởi dòng trống
 */
export const blocksToText = (blocks = []) => blocks.map((b) => {
  if (typeof b === 'string') return b
  if (b.type === 'h2') return `## ${b.text}`
  if (b.type === 'quote') return `> ${b.text}`
  if (b.type === 'list') return (b.items || []).map((i) => `- ${i}`).join('\n')
  if (b.type === 'img') return `![${b.caption || ''}](${b.label || ''})`
  return b.text ?? ''
}).join('\n\n')

export const textToBlocks = (text = '') => String(text).split(/\n{2,}/).map((x) => x.trim()).filter(Boolean).map((chunk) => {
  if (chunk.startsWith('## ')) return { type: 'h2', text: chunk.slice(3).trim() }
  if (chunk.startsWith('> ')) return { type: 'quote', text: chunk.slice(2).trim() }
  if (chunk.split('\n').every((l) => l.startsWith('- '))) return { type: 'list', items: chunk.split('\n').map((l) => l.slice(2).trim()) }
  const img = chunk.match(/^!\[(.*)\]\((.*)\)$/)
  if (img) return { type: 'img', caption: img[1], label: img[2] }
  return chunk
})

/* ---------- Nội dung bài viết dạng HTML (trình soạn WYSIWYG) ---------- */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Khối dữ liệu cũ (mảng chuỗi / h2 / quote / list / img) → HTML để mở trong trình soạn thảo */
export const blocksToHtml = (blocks = []) => blocks.map((b) => {
  if (typeof b === 'string') return `<p>${esc(b)}</p>`
  if (b.type === 'h2') return `<h2>${esc(b.text)}</h2>`
  if (b.type === 'quote') return `<blockquote><p>${esc(b.text)}</p></blockquote>`
  if (b.type === 'list') return `<ul>${(b.items || []).map((i) => `<li><p>${esc(i)}</p></li>`).join('')}</ul>`
  if (b.type === 'img') return `<p><em>[Ảnh: ${esc(b.caption || b.label || '')}]</em></p>`
  if (b.type === 'html') return b.html || ''
  return b.text ? `<p>${esc(b.text)}</p>` : ''
}).join('')

/** contentBody (JSON khối | HTML | văn bản thường) → HTML */
export const bodyToHtml = (body) => {
  if (!body) return ''
  if (typeof body === 'string' && /^\s*</.test(body)) return body
  return blocksToHtml(parseBody(body))
}
