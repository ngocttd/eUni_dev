'use client'
/**
 * Lớp truy cập dữ liệu cho giao diện.
 *
 * Trước đây trang import thẳng `data.js` (mock). Giờ trang gọi:
 *     const { articles, getArticle } = useModuleData('content')
 * Dữ liệu của module được tải từ API (server component hoặc <ClientDatasets>) rồi đưa vào <DatasetProvider>.
 * Các hàm tra cứu (getArticle, getUnit…) được dựng lại từ dữ liệu trong helpers.js.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { makeHelpers, localizers } from './helpers.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

const DatasetContext = createContext({})
const ReloadContext = createContext(() => Promise.resolve())

const withHelpers = (module, data, lang = 'vi') => {
  const d = lang !== 'vi' && localizers[module] ? localizers[module](data, lang) : data
  return { ...d, ...(makeHelpers[module] ? makeHelpers[module](d) : {}) }
}

export function DatasetProvider({ datasets, children }) {
  const parent = useContext(DatasetContext)
  const { lang } = useLanguage()
  const value = useMemo(() => {
    const next = { ...parent }
    for (const [module, data] of Object.entries(datasets || {})) next[module] = withHelpers(module, data, lang)
    return next
  }, [datasets, parent, lang])
  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
}

export function useModuleData(module) {
  const all = useContext(DatasetContext)
  const data = all[module]
  if (!data) throw new Error(`Dataset "${module}" chưa được nạp. Bọc trang bằng <DatasetProvider> (server) hoặc <ClientDatasets modules={['${module}']}> (client).`)
  return data
}

/** Gọi lại API và làm mới dữ liệu (dùng sau khi ghi: lưu / xóa / đổi trạng thái…). */
export const useReloadDatasets = () => useContext(ReloadContext)

/**
 * Nạp dataset ở phía trình duyệt (khu vực cần đăng nhập: My eUni Portal, CMS admin).
 * `load(module)` do từng repo cung cấp (lib/datasets/loaders.js).
 */
export function ClientDatasets({ modules, load, fallback = null, children }) {
  const [datasets, setDatasets] = useState(null)
  const [error, setError] = useState(null)
  const key = modules.join('|')
  const seq = useRef(0)

  const reload = useCallback(async () => {
    const id = ++seq.current
    try {
      const entries = await Promise.all(modules.map(async (m) => [m, await load(m)]))
      if (id === seq.current) { setDatasets(Object.fromEntries(entries)); setError(null) }
    } catch (err) {
      if (id === seq.current) setError(err)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, load])

  useEffect(() => { reload() }, [reload])

  if (error && !datasets) {
    return (
      <div role="alert" style={{ padding: 24 }}>
        <strong>Không tải được dữ liệu từ API.</strong>
        <p style={{ opacity: 0.8 }}>{error.message}</p>
        <button type="button" className="humg-btn humg-btn--primary humg-btn--sm" onClick={reload}>Thử lại</button>
      </div>
    )
  }
  if (!datasets) return fallback ?? <div style={{ padding: 24 }}>Đang tải dữ liệu…</div>
  return (
    <ReloadContext.Provider value={reload}>
      <DatasetProvider datasets={datasets}>{children}</DatasetProvider>
    </ReloadContext.Provider>
  )
}
