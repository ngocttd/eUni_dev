import Link from 'next/link'

export const metadata = { title: 'Không tìm thấy trang' }

export default function NotFound() {
  return (
    <div style={{ maxWidth: 520, margin: '16vh auto', padding: 24, textAlign: 'center' }}>
      <h1>404 — Không tìm thấy trang</h1>
      <p style={{ margin: '12px 0 20px', opacity: 0.75 }}>Trang bạn tìm không tồn tại trong CMS.</p>
      <Link href="/cms" className="humg-btn humg-btn--primary">Về tổng quan CMS</Link>
    </div>
  )
}
