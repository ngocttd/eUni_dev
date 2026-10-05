'use client'
import ResourceManager, { VISIBLE_OPTIONS, mmssToSec, secToMmss, linesToArr, toBool, num } from '../ResourceManager.jsx'

const today = () => new Date().toISOString().slice(0, 10)

const config = {
  title: 'Podcast',
  sub: 'Các tập podcast hiển thị ở mục Media và trang chủ',
  icon: 'headphones',
  noun: 'tập podcast',
  resource: 'podcasts',
  sortFn: (a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)) || b.id - a.id,
  columns: [
    { header: 'Tập', render: (r) => r.episode || '—' },
    { header: 'Tiêu đề', render: (r) => r.title },
    { header: 'Người dẫn', render: (r) => r.host || '—' },
    { header: 'Thời lượng', render: (r) => secToMmss(r.durationSec) },
  ],
  fields: [
    { name: 'title', label: 'Tiêu đề', required: true },
    { name: 'episode', label: 'Tập', half: true, placeholder: 'Tập 06' },
    { name: 'host', label: 'Người dẫn', half: true },
    { name: 'duration', label: 'Thời lượng (mm:ss)', half: true, placeholder: '28:45' },
    { name: 'publishedAt', label: 'Ngày đăng', type: 'date', half: true },
    { name: 'audioUrl', label: 'Liên kết âm thanh', placeholder: 'https://…' },
    { name: 'description', label: 'Mô tả', type: 'textarea', rows: 3 },
    { name: 'notes', label: 'Nội dung tập (mỗi dòng một ý)', type: 'lines', rows: 4 },
    { name: 'playCount', label: 'Lượt nghe', type: 'number', half: true },
    { name: 'isVisible', label: 'Hiển thị', type: 'select', options: VISIBLE_OPTIONS, half: true },
  ],
  defaults: { title: '', episode: '', host: '', duration: '', publishedAt: today(), audioUrl: '', description: '', notes: '', playCount: 0, isVisible: 'true' },
  toForm: (r) => ({
    title: r.title, episode: r.episode || '', host: r.host || '', duration: secToMmss(r.durationSec), publishedAt: String(r.publishedAt || '').slice(0, 10),
    audioUrl: r.audioUrl || '', description: r.description || '', notes: (r.notes || []).join('\n'), playCount: r.playCount ?? 0, isVisible: String(r.isVisible !== false),
  }),
  toPayload: (v) => ({
    title: v.title, episode: v.episode, host: v.host, durationSec: mmssToSec(v.duration), publishedAt: v.publishedAt, audioUrl: v.audioUrl || null,
    description: v.description, notes: linesToArr(v.notes), playCount: num(v.playCount), isVisible: toBool(v.isVisible),
  }),
}

export function CmsPodcasts() {
  return <ResourceManager config={config} />
}
