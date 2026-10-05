'use client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import dict from './dictionary.js'

const LanguageContext = createContext(null)

export const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', short: 'VI' },
  { code: 'en', label: 'English', short: 'EN' },
]

const STORAGE_KEY = 'humg-lang'


/**
 * Ngữ cảnh ngôn ngữ toàn site (Public + My eUni Portal + CMS).
 * - `lang` : 'vi' | 'en' — lưu vào localStorage để giữ lựa chọn giữa các phiên.
 * - `t(vi)`: dịch một chuỗi "khung" (menu, nút bấm, sidebar…) sang tiếng Anh
 *            khi lang = 'en'; nếu chưa có bản dịch trong từ điển thì trả về
 *            nguyên chuỗi tiếng Việt (fallback an toàn, không vỡ giao diện).
 * Đây là mô hình mà CMS áp dụng cho toàn bộ nội dung: bản Việt luôn là
 * "nguồn", bản Anh là bản dịch — thiếu bản Anh thì hệ thống tự hiển thị lại bản Việt.
 */
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('vi')

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'en') setLang('en')
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    if (lang !== 'vi' || window.localStorage.getItem(STORAGE_KEY)) window.localStorage.setItem(STORAGE_KEY, lang)
  }, [lang])

  const value = useMemo(() => ({
    lang,
    setLang,
    toggleLang: () => setLang((l) => (l === 'vi' ? 'en' : 'vi')),
    isEn: lang === 'en',
    t: (vi) => (lang === 'en' ? (dict[vi] ?? vi) : vi),
  }), [lang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage() phải dùng bên trong <LanguageProvider>')
  return ctx
}
