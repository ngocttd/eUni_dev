import PublicLayout from '../../shared/components/layout/PublicLayout.jsx'
import { loadSiteData } from '../../lib/datasets/server.js'

export const dynamic = 'force-dynamic'

/** Tiêu đề, mô tả trình duyệt theo Cấu hình → SEO của trang đang xem (Trường hoặc Khoa) */
export async function generateMetadata() {
  const { settings } = await loadSiteData()
  const seo = settings?.seo || {}
  const site = settings?.general?.siteName
  return {
    /* trang chủ dùng nguyên metaTitle; trang con: "Tên trang | Tên website" */
    ...(seo.metaTitle ? { title: { absolute: seo.metaTitle, template: `%s | ${site || 'HUMG'}` } } : {}),
    ...(seo.metaDesc ? { description: seo.metaDesc } : {}),
  }
}

/** Khung website công khai (header + footer). Menu, cấu hình, banner lấy từ cms-api; nội dung từng trang do server component nạp. */
export default async function SiteLayout({ children }) {
  const site = await loadSiteData()
  return <PublicLayout site={site}>{children}</PublicLayout>
}
