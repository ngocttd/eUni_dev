'use client'
/** Hỗ trợ thao tác ghi trong các màn hình CMS: chạy hành động, báo lỗi/thành công, nạp lại dữ liệu CMS. */
import { useCallback, useState } from 'react'
import { useReloadDatasets } from '../../lib/datasets/useModuleData.jsx'

export function useAction() {
  const reload = useReloadDatasets()
  const [state, setState] = useState({ busy: false, error: '', notice: '' })

  /** run(fn, 'Đã lưu') → true nếu thành công. Tự reload dữ liệu CMS khi thành công. */
  const run = useCallback(async (fn, okMessage = 'Đã lưu') => {
    setState({ busy: true, error: '', notice: '' })
    try {
      await fn()
      await reload()
      setState({ busy: false, error: '', notice: `${okMessage} — website công khai cập nhật ngay.` })
      return true
    } catch (e) {
      setState({ busy: false, error: e?.message || 'Thao tác không thành công.', notice: '' })
      return false
    }
  }, [reload])

  const clear = useCallback(() => setState((s) => ({ ...s, error: '', notice: '' })), [])
  return { ...state, run, clear }
}

export function Notice({ error, notice }) {
  return (
    <>
      {error && <p className="cms-empty" role="alert" style={{ color: 'var(--humg-danger, #b42318)' }}>{error}</p>}
      {notice && <p className="cms-empty" role="status" style={{ color: 'var(--humg-success, #067647)' }}>{notice}</p>}
    </>
  )
}

export const confirmDelete = (what) => window.confirm(`Xóa ${what}? Thao tác này không thể hoàn tác.`)

/** <form> → object (checkbox → boolean, number → Number) theo thuộc tính name */
export function formToObject(form) {
  const out = {}
  for (const el of form.elements) {
    if (!el.name) continue
    out[el.name] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value
  }
  return out
}
