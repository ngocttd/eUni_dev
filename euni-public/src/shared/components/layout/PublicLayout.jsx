'use client'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import ScrollToTop from '../common/ScrollToTop.jsx'
import { SiteProvider } from '../../site/SiteContext.jsx'
import { BannerStrip } from '../../site/Banners.jsx'
import './layout.css'

/** `site` = cấu hình, menu, banner từ cms-api (app/(site)/layout.jsx). Thiếu thì Header/Footer dùng cấu hình tĩnh. */
export default function PublicLayout({ site, children }) {
  return (
    <SiteProvider initial={site}>
      <div className="app-shell">
        <ScrollToTop />
        <Header />
        <main className="app-shell__main">
          {children}
        </main>
        <BannerStrip position="footer" label="Thông báo" />
        <Footer />
      </div>
    </SiteProvider>
  )
}
