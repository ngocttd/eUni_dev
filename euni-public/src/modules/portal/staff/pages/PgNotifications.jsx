'use client'
import AnnouncementInbox from '../../../../shared/portal/AnnouncementInbox.jsx'
import { Head } from '../shared.jsx'

/* Thông báo theo đối tượng từ CMS (cms-api /api/Me/announcements) — thay danh sách mẫu tĩnh */
export function PgNotifications() {
  return <AnnouncementInbox renderHead={(sub, right) => <Head title="Thông báo" sub={sub} right={right} />} />
}
