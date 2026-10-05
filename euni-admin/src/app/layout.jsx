import './module-styles'
import './globals.css'
import Providers from './providers'

/* Admin luôn thao tác dữ liệu thật-thời-gian-thực nên không prerender tĩnh. */
export const dynamic = 'force-dynamic'

export const metadata = {
  title: { default: 'HUMG CMS — Quản trị nội dung', template: '%s | HUMG CMS' },
  description: 'Hệ thống quản trị nội dung Cổng thông tin điện tử Trường Đại học Mỏ - Địa chất',
  icons: { icon: '/brand/logo-60-nam.png' },
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
