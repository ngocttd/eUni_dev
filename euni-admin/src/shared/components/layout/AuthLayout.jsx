'use client'
import { Link } from '../../../lib/router.jsx'
import Brand from '../common/Brand.jsx'
import ScrollToTop from '../common/ScrollToTop.jsx'
import './layout.css'

/** Layout cho nhóm AUTH-01 → AUTH-04 (không header/footer công khai) */
export default function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <ScrollToTop />
      <div className="auth-shell__panel">
        <div className="auth-shell__brand">
          <Brand subtitle={false} />
        </div>
        {children}
        <Link to="/" className="auth-shell__back">← Về trang chủ</Link>
      </div>
    </div>
  )
}
