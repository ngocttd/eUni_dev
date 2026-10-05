'use client'
import ResourceManager, { VISIBLE_OPTIONS, linesToArr, toBool } from '../ResourceManager.jsx'

const today = () => new Date().toISOString().slice(0, 10)

const config = {
  title: 'Album ảnh',
  sub: 'Thư viện ảnh hiển thị ở Media và trang chủ — mỗi dòng ở ô "Chú thích ảnh" là một ảnh',
  icon: 'image',
  noun: 'album',
  resource: 'albums',
  sortFn: (a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)) || b.id - a.id,
  columns: [
    { header: 'Tiêu đề', render: (r) => r.title },
    { header: 'Ngày đăng', render: (r) => String(r.publishedAt || '').slice(0, 10).split('-').reverse().join('/') },
    { header: 'Số ảnh', render: (r) => String(r.photos?.length ?? 0) },
  ],
  fields: [
    { name: 'title', label: 'Tiêu đề album', required: true, placeholder: 'VD: Lễ khai giảng năm học mới' },
    { name: 'publishedAt', label: 'Ngày đăng', type: 'date', half: true },
    { name: 'isVisible', label: 'Hiển thị', type: 'select', options: VISIBLE_OPTIONS, half: true },
    { name: 'photos', label: 'Chú thích ảnh (mỗi dòng một ảnh)', type: 'lines', rows: 7, hint: 'Gắn file ảnh thật từ Media thư viện sẽ bổ sung khi có kho lưu trữ.' },
  ],
  defaults: { title: '', publishedAt: today(), isVisible: 'true', photos: '' },
  toForm: (r) => ({ title: r.title, publishedAt: String(r.publishedAt || '').slice(0, 10), isVisible: String(r.isVisible !== false), photos: (r.photos || []).map((p) => p.caption).join('\n') }),
  toPayload: (v) => ({
    title: v.title,
    publishedAt: v.publishedAt,
    isVisible: toBool(v.isVisible),
    photos: linesToArr(v.photos).map((caption, i) => ({ id: i + 1, caption, mediaId: null, sortOrder: i })),
  }),
}

export function CmsAlbums() {
  return <ResourceManager config={config} />
}
