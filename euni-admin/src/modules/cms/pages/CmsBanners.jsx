'use client'
import ResourceManager, { VISIBLE_OPTIONS, toBool, num } from '../ResourceManager.jsx'

const POSITIONS = [
  { value: 'home_slider', label: 'Trang chủ – Slider' },
  { value: 'home_popup', label: 'Trang chủ – Popup' },
  { value: 'sidebar_right', label: 'Cột phải' },
  { value: 'footer', label: 'Chân trang' },
]
const posLabel = (v) => POSITIONS.find((p) => p.value === v)?.label || v
const dmy = (d) => (d ? String(d).slice(0, 10).split('-').reverse().join('/') : '…')

const config = {
  title: 'Banner / Slider',
  sub: 'Quản lý banner quảng bá trên trang chủ và các vị trí hiển thị',
  icon: 'image',
  noun: 'banner',
  resource: 'banners',
  columns: [
    { header: 'Thứ tự', render: (r) => String(r.sortOrder) },
    { header: 'Tên banner', render: (r) => r.title },
    { header: 'Vị trí', render: (r) => posLabel(r.position) },
    { header: 'Thời gian hiển thị', render: (r) => `${dmy(r.startsOn)} – ${dmy(r.endsOn)}` },
  ],
  fields: [
    { name: 'title', label: 'Tên banner', required: true, placeholder: 'Nhập tên banner' },
    { name: 'position', label: 'Vị trí hiển thị', type: 'select', options: POSITIONS, half: true },
    { name: 'isVisible', label: 'Trạng thái', type: 'select', options: VISIBLE_OPTIONS, half: true },
    { name: 'linkUrl', label: 'Liên kết khi bấm vào', placeholder: 'https:// hoặc /duong-dan' },
    { name: 'startsOn', label: 'Từ ngày', type: 'date', half: true },
    { name: 'endsOn', label: 'Đến ngày', type: 'date', half: true },
    { name: 'sortOrder', label: 'Thứ tự hiển thị', type: 'number' },
  ],
  defaults: { title: '', position: 'home_slider', isVisible: 'true', linkUrl: '', startsOn: '', endsOn: '', sortOrder: 1 },
  toForm: (r) => ({
    title: r.title, position: r.position, isVisible: String(r.isVisible !== false), linkUrl: r.linkUrl || '',
    startsOn: String(r.startsOn || '').slice(0, 10), endsOn: String(r.endsOn || '').slice(0, 10), sortOrder: r.sortOrder ?? 1,
  }),
  toPayload: (v) => ({
    title: v.title, position: v.position, isVisible: toBool(v.isVisible), linkUrl: v.linkUrl || null,
    startsOn: v.startsOn || null, endsOn: v.endsOn || null, sortOrder: num(v.sortOrder, 1),
  }),
}

export function CmsBanners() {
  return <ResourceManager config={config} />
}
