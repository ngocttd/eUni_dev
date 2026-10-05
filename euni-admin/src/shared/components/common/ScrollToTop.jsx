'use client'
import { useEffect } from 'react'
import { useLocation } from '../../../lib/router.jsx'

/** Cuộn lên đầu trang mỗi khi đổi route */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [pathname])
  return null
}
