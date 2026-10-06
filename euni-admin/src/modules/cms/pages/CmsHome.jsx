'use client'
import { useEffect, useState } from 'react'
import { cmsApi } from '../../../lib/api/cmsApi.js'
import { Panel } from '../../../shared/components/ui/page.jsx'
import ResourceManager, { VISIBLE_OPTIONS, linesToArr, toBool, num } from '../ResourceManager.jsx'
import { Head } from '../shared.jsx'

const ICONS = ['calendar', 'library', 'play', 'search', 'file', 'mail', 'grid', 'phone', 'graduation', 'user', 'users', 'award', 'briefcase', 'handshake', 'flask', 'book', 'building', 'globe', 'heart', 'rocket', 'target', 'newspaper', 'headphones'].map((v) => ({ value: v, label: v }))
const sortField = { name: 'sortOrder', label: 'Thứ tự', type: 'number', half: true, hint: 'Số nhỏ hiện trước' }
const visField = { name: 'isVisible', label: 'Hiển thị', type: 'select', options: VISIBLE_OPTIONS, half: true }
const common = (r) => ({ sortOrder: r.sortOrder ?? 1, isVisible: String(r.isVisible !== false) })
const commonOut = (v) => ({ sortOrder: num(v.sortOrder, 1), isVisible: toBool(v.isVisible) })

const TABS = [
  {
    key: 'hero', label: 'Slide đầu trang',
    config: {
      resource: 'heroSlides', noun: 'slide', icon: 'image', searchFields: ['title', 'kicker'],
      columns: [{ header: 'Dòng nhấn', render: (r) => r.kicker }, { header: 'Tiêu đề', render: (r) => String(r.title).replace(/\n/g, ' ') }, { header: 'Nút chính', render: (r) => r.primaryLabel }],
      fields: [
        { name: 'kicker', label: 'Dòng nhấn', placeholder: '60 NĂM', hint: 'Chữ nhỏ in hoa phía trên tiêu đề slide' },
        { name: 'title', label: 'Tiêu đề (xuống dòng = ngắt dòng)', type: 'textarea', rows: 3, required: true },
        { name: 'subtitle', label: 'Dòng phụ', placeholder: '1966 – 2026' },
        { name: 'motto', label: 'Khẩu hiệu' },
        { name: 'primaryLabel', label: 'Chữ trên nút chính', half: true, placeholder: 'VD: Khám phá HUMG' }, { name: 'primaryUrl', label: 'Liên kết nút chính', half: true, placeholder: '/gioi-thieu hoặc https://…' },
        { name: 'accentLabel', label: 'Chữ trên nút phụ', half: true, placeholder: 'Để trống nếu không cần' }, { name: 'accentUrl', label: 'Liên kết nút phụ', half: true, placeholder: '/tuyen-sinh hoặc https://…' },
        sortField, visField,
      ],
      defaults: { kicker: '', title: '', subtitle: '', motto: '', primaryLabel: '', primaryUrl: '', accentLabel: '', accentUrl: '', sortOrder: 1, isVisible: 'true' },
      toForm: (r) => ({ kicker: r.kicker || '', title: r.title, subtitle: r.subtitle || '', motto: r.motto || '', primaryLabel: r.primaryLabel || '', primaryUrl: r.primaryUrl || '', accentLabel: r.accentLabel || '', accentUrl: r.accentUrl || '', ...common(r) }),
      toPayload: (v) => ({ code: `sl-${Date.now().toString(36)}`, kicker: v.kicker, title: v.title, subtitle: v.subtitle, motto: v.motto, primaryLabel: v.primaryLabel, primaryUrl: v.primaryUrl, accentLabel: v.accentLabel, accentUrl: v.accentUrl, ...commonOut(v) }),
    },
  },
  {
    key: 'quick', label: 'Lối tắt nhanh',
    config: {
      resource: 'quickLinks', noun: 'lối tắt', icon: 'external', searchFields: ['label', 'url'],
      columns: [{ header: 'Tên', render: (r) => r.label }, { header: 'Biểu tượng', render: (r) => r.icon }, { header: 'Liên kết', render: (r) => r.url }],
      fields: [
        { name: 'label', label: 'Tên hiển thị', required: true },
        { name: 'icon', label: 'Biểu tượng', type: 'select', options: ICONS, half: true }, { name: 'url', label: 'Liên kết', required: true, half: true, placeholder: '/duong-dan hoặc https://…' },
        sortField, visField,
      ],
      defaults: { label: '', icon: 'grid', url: '', sortOrder: 1, isVisible: 'true' },
      toForm: (r) => ({ label: r.label, icon: r.icon || 'grid', url: r.url, ...common(r) }),
      toPayload: (v) => ({ label: v.label, icon: v.icon, url: v.url, ...commonOut(v) }),
    },
  },
  {
    key: 'aud', label: 'Nhóm đối tượng',
    config: {
      resource: 'audiences', noun: 'nhóm đối tượng', icon: 'users', searchFields: ['title', 'description'],
      columns: [{ header: 'Tên', render: (r) => r.title }, { header: 'Mô tả', render: (r) => r.description }, { header: 'Liên kết', render: (r) => r.url }],
      fields: [
        { name: 'title', label: 'Tên nhóm', required: true, half: true }, { name: 'code', label: 'Mã (không dấu)', half: true, required: true },
        { name: 'description', label: 'Mô tả ngắn' },
        { name: 'icon', label: 'Biểu tượng', type: 'select', options: ICONS, half: true }, { name: 'color', label: 'Màu (#rrggbb)', half: true },
        { name: 'url', label: 'Liên kết', required: true, placeholder: '/duong-dan hoặc https://…' },
        sortField, visField,
      ],
      defaults: { title: '', code: '', description: '', icon: 'user', color: '#1976d2', url: '', sortOrder: 1, isVisible: 'true' },
      toForm: (r) => ({ title: r.title, code: r.code, description: r.description || '', icon: r.icon || 'user', color: r.color || '#1976d2', url: r.url, ...common(r) }),
      toPayload: (v) => ({ title: v.title, code: v.code, description: v.description, icon: v.icon, color: v.color, url: v.url, ...commonOut(v) }),
    },
  },
  {
    key: 'str', label: 'Thế mạnh',
    config: {
      resource: 'strengths', noun: 'thế mạnh', icon: 'award', searchFields: ['title', 'text'],
      columns: [{ header: 'Tiêu đề', render: (r) => r.title }, { header: 'Nội dung', render: (r) => r.text }],
      fields: [
        { name: 'title', label: 'Tiêu đề', required: true }, { name: 'text', label: 'Nội dung', type: 'textarea' },
        { name: 'icon', label: 'Biểu tượng', type: 'select', options: ICONS },
        sortField, visField,
      ],
      defaults: { title: '', text: '', icon: 'award', sortOrder: 1, isVisible: 'true' },
      toForm: (r) => ({ title: r.title, text: r.text || '', icon: r.icon || 'award', ...common(r) }),
      toPayload: (v) => ({ title: v.title, text: v.text, icon: v.icon, ...commonOut(v) }),
    },
  },
  {
    key: 'par', label: 'Đối tác',
    config: {
      resource: 'partners', noun: 'đối tác', icon: 'handshake', searchFields: ['name', 'shortName'],
      columns: [{ header: 'Tên đối tác', render: (r) => r.name }, { header: 'Viết tắt', render: (r) => r.shortName }, { header: 'Màu', render: (r) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><i style={{ width: 12, height: 12, borderRadius: 3, background: r.color || '#999', display: 'inline-block' }} />{r.color}</span> }],
      fields: [
        { name: 'name', label: 'Tên đối tác', required: true },
        { name: 'shortName', label: 'Tên viết tắt (monogram)', required: true, half: true }, { name: 'color', label: 'Màu thương hiệu (#rrggbb)', half: true },
        { name: 'website', label: 'Website' },
        sortField, visField,
      ],
      defaults: { name: '', shortName: '', color: '#0057a8', website: '', sortOrder: 1, isVisible: 'true' },
      toForm: (r) => ({ name: r.name, shortName: r.shortName, color: r.color || '#0057a8', website: r.website || '', ...common(r) }),
      toPayload: (v) => ({ name: v.name, shortName: v.shortName, color: v.color, website: v.website || null, ...commonOut(v) }),
    },
  },
  {
    key: 'stat', label: 'Chỉ số thống kê',
    config: {
      resource: 'siteStats', noun: 'chỉ số', icon: 'target', searchFields: ['label', 'value'],
      sortFn: (a, b) => a.placement.localeCompare(b.placement) || a.sortOrder - b.sortOrder,
      columns: [{ header: 'Vị trí', render: (r) => (r.placement === 'hero' ? 'Đầu trang chủ' : 'HUMG qua các con số') }, { header: 'Giá trị', render: (r) => r.value }, { header: 'Nhãn', render: (r) => r.label }],
      fields: [
        { name: 'placement', label: 'Vị trí hiển thị', type: 'select', options: [{ value: 'hero', label: 'Đầu trang chủ (nêm xanh)' }, { value: 'about', label: 'HUMG qua các con số' }] },
        { name: 'value', label: 'Giá trị hiển thị', required: true, half: true, placeholder: '20.000+' }, { name: 'label', label: 'Nhãn', required: true, half: true },
        { name: 'sub', label: 'Chú thích phụ', placeholder: 'Tính đến 2025' },
        sortField, visField,
      ],
      defaults: { placement: 'hero', value: '', label: '', sub: '', sortOrder: 1, isVisible: 'true' },
      toForm: (r) => ({ placement: r.placement, value: r.value, label: r.label, sub: r.sub || '', ...common(r) }),
      toPayload: (v) => ({ placement: v.placement, value: v.value, label: v.label, sub: v.sub || null, ...commonOut(v) }),
    },
  },
]

/** Chip đặc điểm dưới tiêu đề hero — lưu trong cấu hình nhóm "home" */
function ChipsEditor() {
  const [text, setText] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    cmsApi.settings.get('home').then((s) => { setText((s.heroChips || []).join('\n')); setLoaded(true) }).catch((e) => setErr(e.message))
  }, [])
  const save = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    try { await cmsApi.settings.save('home', { heroChips: linesToArr(text) }); setMsg('Đã lưu — website công khai sẽ cập nhật ngay.') } catch (x) { setErr(x.message) }
  }
  return (
    <Panel title="Chip đặc điểm dưới tiêu đề trang chủ" icon="award">
      <form className="cms-form" onSubmit={save}>
        {err && <p className="cms-empty" role="alert">{err}</p>}
        {msg && <p className="cms-empty" role="status">{msg}</p>}
        <label>Mỗi dòng một chip
          <textarea rows="5" value={text} disabled={!loaded} onChange={(e) => setText(e.target.value)} />
        </label>
        <div className="cms-form__actions"><button type="submit" disabled={!loaded} className="humg-btn humg-btn--primary humg-btn--sm">Lưu</button></div>
      </form>
    </Panel>
  )
}

export function CmsHome() {
  const [tab, setTab] = useState('hero')
  const cur = TABS.find((t) => t.key === tab)
  return (
    <>
      <Head title="Trang chủ" sub="Quản lý các khối hiển thị ở trang chủ website: slide, lối tắt, đối tượng, thế mạnh, đối tác, chỉ số" />
      <div className="cms-langtabs" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        {[...TABS, { key: 'chips', label: 'Chip đặc điểm' }].map((t) => (
          <button key={t.key} type="button" className={tab === t.key ? 'is-active' : ''} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>
      {tab === 'chips' ? <ChipsEditor /> : <ResourceManager key={cur.key} embedded config={cur.config} />}
    </>
  )
}
