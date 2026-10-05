import './module-styles'
import './globals.css'
import Providers from './providers'

/* Dữ liệu CMS luôn phải mới (admin sửa → public đổi ngay) nên không prerender tĩnh. */
export const dynamic = 'force-dynamic'

export const metadata = {
  title: { default: 'HUMG Digital Portal — Trường Đại học Mỏ - Địa chất', template: '%s | HUMG' },
  description: 'Cổng thông tin điện tử Trường Đại học Mỏ - Địa chất (HUMG Digital Portal)',
  icons: { icon: '/brand/logo-60-nam.png', apple: '/brand/logo-60-nam.png' },
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
