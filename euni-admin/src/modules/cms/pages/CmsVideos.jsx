'use client'
import ResourceManager, { VISIBLE_OPTIONS, mmssToSec, secToMmss, toBool, num } from '../ResourceManager.jsx'

const today = () => new Date().toISOString().slice(0, 10)

const config = {
  title: 'Video',
  sub: 'Video giới thiệu, tuyển sinh, sự kiện hiển thị ở mục Media và trang chủ',
  icon: 'play',
  noun: 'video',
  resource: 'videos',
  sortFn: (a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)) || b.id - a.id,
  columns: [
    { header: 'Tiêu đề', render: (r) => r.title },
    { header: 'Kênh', render: (r) => r.channel || '—' },
    { header: 'Thời lượng', render: (r) => secToMmss(r.durationSec) },
    { header: 'Lượt xem', render: (r) => String(r.viewCount ?? 0) },
  ],
  fields: [
    { name: 'title', label: 'Tiêu đề video', required: true },
    { name: 'channel', label: 'Kênh / nguồn', half: true, placeholder: 'HUMG Media' },
    { name: 'duration', label: 'Thời lượng (mm:ss)', half: true, placeholder: '06:12' },
    { name: 'videoUrl', label: 'Liên kết video', placeholder: 'https://youtube.com/watch?v=…' },
    { name: 'publishedAt', label: 'Ngày đăng', type: 'date', half: true },
    { name: 'viewCount', label: 'Lượt xem', type: 'number', half: true },
    { name: 'description', label: 'Mô tả', type: 'textarea', rows: 4 },
    { name: 'isVisible', label: 'Hiển thị', type: 'select', options: VISIBLE_OPTIONS },
  ],
  defaults: { title: '', channel: '', duration: '', videoUrl: '', publishedAt: today(), viewCount: 0, description: '', isVisible: 'true' },
  toForm: (r) => ({
    title: r.title, channel: r.channel || '', duration: secToMmss(r.durationSec), videoUrl: r.videoUrl || '',
    publishedAt: String(r.publishedAt || '').slice(0, 10), viewCount: r.viewCount ?? 0, description: r.description || '', isVisible: String(r.isVisible !== false),
  }),
  toPayload: (v) => ({
    title: v.title, channel: v.channel, durationSec: mmssToSec(v.duration), videoUrl: v.videoUrl || null,
    publishedAt: v.publishedAt, viewCount: num(v.viewCount), description: v.description, isVisible: toBool(v.isVisible),
  }),
}

export function CmsVideos() {
  return <ResourceManager config={config} />
}
