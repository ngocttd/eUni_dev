'use client'
import AnnouncementInbox from '../../../../shared/portal/AnnouncementInbox.jsx'
import { PageHead } from '../shared.jsx'

/* Thông báo theo đối tượng từ CMS (cms-api /api/Me/announcements) — thay danh sách mẫu tĩnh */
export function PsNotifications() {
  return <AnnouncementInbox renderHead={(sub, right) => <PageHead title="Thông báo" sub={sub} right={right} />} />
}
