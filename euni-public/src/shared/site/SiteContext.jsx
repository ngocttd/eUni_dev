'use client'
/**
 * Dữ liệu chung của website do CMS quản lý: cấu hình (tên, liên hệ, mạng xã hội), menu header/footer/tiện ích, banner.
 * Nạp phía server ở app/(site)/layout.jsx cho lần tải đầu; khi người dùng chuyển trang (điều hướng phía client,
 * layout không render lại) thì nạp lại ngầm để thay đổi ở admin hiện ra mà không cần tải lại trình duyệt.
 */
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { loadSite } from '../../lib/datasets/loaders.js'

const SiteContext = createContext({ settings: null, menus: {}, banners: null })

export function SiteProvider({ initial, children }) {
  const [site, setSite] = useState(initial || { settings: null, menus: {}, banners: null })
  const pathname = usePathname()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    let alive = true
    loadSite().then((s) => { if (alive) setSite(s) }).catch(() => {})
    return () => { alive = false }
  }, [pathname])
  return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>
}

export const useSite = () => useContext(SiteContext)
