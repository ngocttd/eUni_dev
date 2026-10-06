import { notFound } from 'next/navigation'
import { loadCmsPage } from '@/lib/datasets/loaders'
import { currentTenant } from '@/lib/datasets/server'
import CmsPage from '@/modules/public/cms-page/CmsPage'

export const dynamic = 'force-dynamic'

/** Trang tĩnh soạn ở CMS (Trang & Menu → Cây trang, giao diện khác "Trang hệ thống"). Sửa/ẩn/xóa ở admin → trang đổi theo ngay. */
async function load(params) {
  const { slug } = await params
  return loadCmsPage(slug, { tenant: await currentTenant() })
}

export async function generateMetadata({ params }) {
  const page = await load(params)
  return { title: page ? `${page.title} | HUMG` : 'Không tìm thấy trang | HUMG' }
}

export default async function Page({ params }) {
  const page = await load(params)
  if (!page) notFound()
  return <CmsPage initial={page} />
}
