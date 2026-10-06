'use client'
import ResourceManager, { VISIBLE_OPTIONS, toBool, num } from '../ResourceManager.jsx'

/* Vị trí ↔ chỗ hiển thị trên website (euni-public/src/shared/site/Banners.jsx) */
const POSITIONS = [
  { value: 'home_slider', label: 'Trang chủ – Slider' },
  { value: 'home_popup', label: 'Trang chủ – Popup' },
  { value: 'sidebar_right', label: 'Cột phải' },
  { value: 'footer', label: 'Chân trang' },
]
const POSITION_HINT = 'Slider: dải banner dưới slide đầu trang chủ · Popup: cửa sổ nổi khi mở trang chủ · Cột phải: cột bên phải trang tin tức, sự kiện · Chân trang: dải thông báo trên chân trang mọi trang'
const posLabel = (v) => POSITIONS.find((p) => p.value === v)?.label || v
const dmy = (d) => (d ? String(d).slice(0, 10).split('-').reverse().join('/') : '…')

const config = {
  title: 'Banner / Slider',
  sub: 'Banner hiện trên website theo vị trí, chỉ trong khoảng ngày đã chọn và khi đang để Hiển thị',
  icon: 'image',
  noun: 'banner',
  resource: 'banners',
  columns: [
    { header: 'Thứ tự', render: (r) => String(r.sortOrder) },
    { header: 'Tên banner', render: (r) => <span>{r.title}{r.imageId ? <em className="cms-chip" title="Có ảnh nền">ảnh</em> : null}</span> },
    { header: 'Vị trí', render: (r) => posLabel(r.position) },
    { header: 'Thời gian hiển thị', render: (r) => `${dmy(r.startsOn)} – ${dmy(r.endsOn)}` },
  ],
  fields: [
    { name: 'title', label: 'Tên banner', required: true, placeholder: 'Nhập tên banner' },
    { name: 'position', label: 'Vị trí hiển thị', type: 'select', options: POSITIONS, hint: POSITION_HINT },
    { name: 'isVisible', label: 'Trạng thái', type: 'select', options: VISIBLE_OPTIONS },
    { name: 'imageId', label: 'Ảnh banner', type: 'media', folder: 'Banner', hint: 'Không bắt buộc. Có ảnh thì ảnh làm nền banner; không có thì dùng nền màu.' },
    { name: 'subtitle', label: 'Dòng mô tả', placeholder: 'VD: Nhận hồ sơ trực tuyến đến 30/06', hint: 'Hiện dưới tên banner' },
    { name: 'linkUrl', label: 'Liên kết khi bấm vào', placeholder: 'https:// hoặc /duong-dan' },
    { name: 'startsOn', label: 'Từ ngày', type: 'date', half: true, hint: 'Để trống = hiện ngay' },
    { name: 'endsOn', label: 'Đến ngày', type: 'date', half: true, hint: 'Để trống = không tự ẩn' },
    { name: 'sortOrder', label: 'Thứ tự hiển thị', type: 'number', hint: 'Số nhỏ hiện trước trong cùng vị trí' },
  ],
  defaults: { title: '', imageId: '', subtitle: '', position: 'home_slider', isVisible: 'true', linkUrl: '', startsOn: '', endsOn: '', sortOrder: 1 },
  toForm: (r) => ({
    title: r.title, imageId: r.imageId ? String(r.imageId) : '', subtitle: r.subtitle || '', position: r.position, isVisible: String(r.isVisible !== false), linkUrl: r.linkUrl || '',
    startsOn: String(r.startsOn || '').slice(0, 10), endsOn: String(r.endsOn || '').slice(0, 10), sortOrder: r.sortOrder ?? 1,
  }),
  toPayload: (v) => ({
    title: v.title, imageId: v.imageId ? Number(v.imageId) : null, subtitle: v.subtitle || null, position: v.position, isVisible: toBool(v.isVisible), linkUrl: v.linkUrl || null,
    startsOn: v.startsOn || null, endsOn: v.endsOn || null, sortOrder: num(v.sortOrder, 1),
  }),
}

export function CmsBanners() {
  return <ResourceManager config={config} />
}
