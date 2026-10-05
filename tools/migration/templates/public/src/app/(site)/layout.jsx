import PublicLayout from '../../shared/components/layout/PublicLayout.jsx'

/** Khung website công khai (header + footer). Nội dung từng trang do server component nạp từ API. */
export default function SiteLayout({ children }) {
  return <PublicLayout>{children}</PublicLayout>
}
