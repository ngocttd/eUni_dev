'use client'
/** Chọn người (danh bạ Identity Server) và chọn đơn vị (cây đơn vị) — dùng cho Thông báo và Phân quyền. */
import { useEffect, useRef, useState } from 'react'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { cmsApi } from '../../lib/api/cmsApi.js'

/** Tìm theo tên, email, mã cán bộ, mã sinh viên. Một người dù đăng nhập M365 hay tài khoản trường vẫn là một `sub`. */
export function PersonPicker({ onPick, placeholder = 'Tên, email, mã CB / mã SV…', roles, label = 'Tìm người theo tên, email, mã cán bộ hoặc mã sinh viên' }) {
  const [q, setQ] = useState('')
  const [list, setList] = useState([])
  const [open, setOpen] = useState(false)
  const seq = useRef(0)
  useEffect(() => {
    const kw = q.trim()
    if (kw.length < 2) { setList([]); return undefined }
    const id = ++seq.current
    const t = setTimeout(() => {
      cmsApi.directory.users(kw, { pageSize: 10 }).then((p) => {
        if (id !== seq.current) return
        const items = (p.items || []).filter((u) => !roles || u.roles.some((r) => roles.includes(r)))
        setList(items); setOpen(true)
      }).catch(() => setList([]))
    }, 250)
    return () => clearTimeout(t)
  }, [q, roles])
  const pick = (u) => { onPick(u); setQ(''); setList([]); setOpen(false) }
  return (
    <div className="cms-suggest">
      <input type="search" value={q} aria-label={label} title={`${label} (gõ ít nhất 2 ký tự)`} autoComplete="off" onChange={(e) => setQ(e.target.value)} onFocus={() => list.length && setOpen(true)} placeholder={placeholder} />
      {q.trim().length >= 2 && open && !list.length && <div className="cms-suggest__list"><span className="cms-hint" style={{ padding: '8px 10px', display: 'block' }}>Không tìm thấy ai khớp “{q.trim()}”.</span></div>}
      {open && list.length > 0 && (
        <ul role="listbox">
          {list.map((u) => (
            <li key={u.sub}><button type="button" onClick={() => pick(u)}>
              <strong>{u.name}</strong> · {u.staffCode || u.studentCode || ''} {u.email ? `· ${u.email}` : ''} {!u.active ? '(đã khóa)' : ''}
            </button></li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const personLabel = (u) => `${u.staffCode || u.studentCode || u.email || u.sub} – ${u.name}`

export function UnitSelect({ value, onChange, includeClasses = true, emptyLabel }) {
  const { cmsOrgUnits } = useModuleData('cms')
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
      {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
      {cmsOrgUnits.filter((u) => includeClasses || u.kind !== 'class').map((u) => <option key={u.code} value={u.code}>{'— '.repeat(u.depth)}{u.name}</option>)}
    </select>
  )
}
