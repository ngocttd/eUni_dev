'use client'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import ScrollToTop from '../common/ScrollToTop.jsx'
import './layout.css'

export default function PublicLayout({ children }) {
  return (
    <div className="app-shell">
      <ScrollToTop />
      <Header />
      <main className="app-shell__main">
        {children}
      </main>
      <Footer />
    </div>
  )
}
