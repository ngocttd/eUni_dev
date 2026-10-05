import PublicLayout from '../shared/components/layout/PublicLayout.jsx'
import NotFound from '../views/NotFound.jsx'

export const metadata = { title: 'Không tìm thấy trang' }

export default function NotFoundPage() {
  return (
    <PublicLayout>
      <NotFound />
    </PublicLayout>
  )
}
