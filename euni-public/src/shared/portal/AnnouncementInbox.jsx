'use client'
/**
 * Hộp thư thông báo của người dùng (sinh viên, giảng viên, phụ huynh) — đọc từ cms-api /api/v1/me/announcements.
 * Server so khớp đối tượng nhận (vai trò, đơn vị / lớp kèm đơn vị cha, cá nhân) với tài khoản đang đăng nhập
 * và tự ẩn thông báo chưa đến giờ đăng / đã hết hạn / đã thu hồi (docs/design/CMS_DESIGN.md §6.4).
 */
import { useCallback, useEffect, useState } from 'react'
import api, { SERVICE } from '../../lib/api/client.js'
import Icon from '../lib/Icon.jsx'
import { Panel } from '../components/ui/page.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { fmtDateTime } from '../../lib/datasets/format.js'

const cms = api(SERVICE.cms)
const ICON = { exam: 'calendar', tuition: 'file', academic: 'book', event: 'calendar', admin: 'building', general: 'bell' }
const ALL = 'Tất cả'
const UNREAD = 'Chưa đọc'

export const inboxApi = {
  list: (lang) => cms.get('/api/v1/me/announcements', { query: { lang, pageSize: 100 } }),
  unread: () => cms.get('/api/v1/me/announcements/unread-count'),
  read: (id) => cms.post(`/api/v1/me/announcements/${id}/read`),
  ack: (id) => cms.post(`/api/v1/me/announcements/${id}/ack`),
  readAll: () => cms.post('/api/v1/me/announcements/read-all'),
}

export default function AnnouncementInbox({ renderHead }) {
  const { lang } = useLanguage()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState(ALL)
  const [open, setOpen] = useState(null)

  // Nội dung HTML do CMS soạn: backend làm sạch khi lưu, phía trình duyệt làm sạch thêm một lần trước khi hiển thị
  const load = useCallback(async () => {
    try {
      const [d, { cleanHtml }] = await Promise.all([inboxApi.list(lang), import('../../lib/datasets/sanitize.js')])
      setData({ ...d, items: d.items.map((x) => ({ ...x, bodyHtml: cleanHtml(x.bodyHtml) })) }); setError('')
    } catch (e) { setError(e?.message || 'Không tải được thông báo.') }
  }, [lang])
  useEffect(() => { load() }, [load])

  const patch = (item) => setData((d) => {
    const items = d.items.map((x) => (x.id === item.id ? { ...x, readAt: item.readAt, ackedAt: item.ackedAt } : x))
    return { ...d, items, unreadCount: items.filter((x) => !x.readAt).length }
  })
  const toggle = async (x) => {
    setOpen(open === x.id ? null : x.id)
    if (!x.readAt) patch(await inboxApi.read(x.id))
  }
  const ack = async (x) => patch(await inboxApi.ack(x.id))
  const readAll = async () => { await inboxApi.readAll(); load() }

  const right = <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={readAll} disabled={!data?.unreadCount}><Icon name="check" size={13} /> Đánh dấu đã đọc tất cả</button>
  if (error) return <>{renderHead('Thông báo', right)}<p className="ps-muted" role="alert" style={{ padding: 12 }}>{error}</p></>
  if (!data) return <>{renderHead('Đang tải…', null)}</>

  const cats = [...new Set(data.items.map((x) => x.categoryLabel))]
  const tabs = [ALL, UNREAD, ...cats]
  const list = data.items.filter((x) => tab === ALL || (tab === UNREAD ? !x.readAt : x.categoryLabel === tab))

  return (
    <>
      {renderHead(`${data.totalItems} thông báo · ${data.unreadCount} chưa đọc`, right)}
      <Panel flush>
        <div className="ps-tabs ps-tabs--wrap">
          {tabs.map((t) => <button key={t} type="button" className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>{t}{t === UNREAD && data.unreadCount ? ` (${data.unreadCount})` : ''}</button>)}
        </div>
        <div className="ps-tabbody">
          <ul className="ps-noti">
            {list.map((x) => (
              <li key={x.id} className={x.readAt ? '' : 'is-unread'}>
                <span className="ps-noti__ic"><Icon name={ICON[x.category] || 'bell'} size={18} /></span>
                <div className="ps-noti__body">
                  <div className="ps-noti__top">
                    <strong role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => toggle(x)} onKeyDown={(e) => e.key === 'Enter' && toggle(x)}>{x.title}</strong>
                    <span className={`ps-tag ${x.priority >= 1 ? 'ps-tag--warn' : 'ps-tag--run'}`}>{x.priority >= 1 ? x.priorityLabel : x.categoryLabel}</span>
                  </div>
                  {open === x.id
                    ? <div className="ps-noti__content" dangerouslySetInnerHTML={{ __html: x.bodyHtml }} />
                    : <p>{String(x.bodyHtml || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)}</p>}
                  {open === x.id && x.attachments?.length > 0 && (
                    <ul className="ps-noti__files">{x.attachments.map((a) => <li key={a.title}><Icon name="file" size={13} /> {a.title}{a.meta ? ` · ${a.meta}` : ''}</li>)}</ul>
                  )}
                  <em>{x.ownerUnitName} · {fmtDateTime(x.publishAt)}{x.pinned ? ' · Ghim' : ''}</em>
                  {x.requireAck && (x.ackedAt
                    ? <em> · Đã xác nhận {fmtDateTime(x.ackedAt)}</em>
                    : <button type="button" className="humg-btn humg-btn--primary humg-btn--sm" style={{ marginTop: 6 }} onClick={() => ack(x)}><Icon name="check" size={13} /> Xác nhận đã đọc</button>)}
                </div>
              </li>
            ))}
          </ul>
          {!list.length && <p className="ps-muted" style={{ padding: 12 }}>Không có thông báo trong mục này.</p>}
        </div>
      </Panel>
    </>
  )
}
