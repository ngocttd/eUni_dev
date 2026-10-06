'use client'
import AnnouncementInbox from '../../../../shared/portal/AnnouncementInbox.jsx'
import { Head } from '../shared.jsx'

/* Thông báo theo đối tượng từ CMS (cms-api /api/v1/me/announcements) — thay danh sách mẫu tĩnh */
export function PpNotices() {
  return <AnnouncementInbox renderHead={(sub, right) => <Head title="Thông báo" sub={sub} right={right} />} />
}
