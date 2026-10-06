import PublicLayout from '../../shared/components/layout/PublicLayout.jsx'
import { loadSiteData } from '../../lib/datasets/server.js'

export const dynamic = 'force-dynamic'

/** Khung website công khai (header + footer). Menu, cấu hình, banner lấy từ cms-api; nội dung từng trang do server component nạp. */
export default async function SiteLayout({ children }) {
  const site = await loadSiteData()
  return <PublicLayout site={site}>{children}</PublicLayout>
}
