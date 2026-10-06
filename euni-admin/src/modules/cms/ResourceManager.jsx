'use client'
/**
 * Màn hình quản trị dạng "danh sách + biểu mẫu" dùng chung cho các tài nguyên CRUD của cms-api
 * (album, video, podcast, banner, các khối trang chủ…). Danh sách bên trái, biểu mẫu thêm/sửa bên phải.
 * Mọi thao tác ghi gọi API thật → website public đọc lại cms-api nên đổi theo ngay.
 *
 * config:
 *   resource   khóa trong cmsApi (vd. 'videos')
 *   columns    [{ header, render(row) }]
 *   fields     [{ name, label, type: text|textarea|number|date|select|lines|media, options:[{value,label}], half, required, placeholder, hint }]
 *              type 'media': giá trị là id ảnh trong Media thư viện, chọn qua hộp thoại MediaPicker
 *   defaults   giá trị form khi thêm mới
 *   toForm(row) / toPayload(values)   chuyển đổi giữa dòng API và form
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cmsApi } from '../../lib/api/cmsApi.js'
import { asPage } from '../../lib/api/client.js'
import Icon from '../../shared/lib/Icon.jsx'
import { Panel, FilterBar, DataTable } from '../../shared/components/ui/page.jsx'
import { Head, norm, VisibilityToggle, RowActions } from './shared.jsx'
import MediaPicker from './MediaPicker.jsx'
import { mediaUrl } from '../../lib/api/media.js'
import { useModuleData } from '../../lib/datasets/useModuleData.jsx'

export const VISIBLE_OPTIONS = [{ value: 'true', label: 'Hiển thị' }, { value: 'false', label: 'Ẩn' }]

/** Ô chọn ảnh từ Media thư viện: xem trước + nút Chọn / Bỏ ảnh */
function MediaField({ f, value, onChange }) {
  const { cmsMedia } = useModuleData('cms')
  const [open, setOpen] = useState(false)
  const m = value ? cmsMedia.find((x) => String(x.id) === String(value)) : null
  return (
    <div className="cms-form__block">
      <span className="cms-form__label">{f.label}</span>
      <div className="cms-mediafield">
        <span className="cms-mediafield__thumb">{m ? <img src={mediaUrl(m.url)} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} /> : <Icon name="image" size={20} />}</span>
        <span className="cms-mediafield__name">{m ? m.name : value ? `Ảnh #${value}` : 'Chưa chọn ảnh'}</span>
        <button type="button" className="cms-rowbtn" onClick={() => setOpen(true)}><Icon name="image" size={13} /> {value ? 'Đổi ảnh' : 'Chọn ảnh'}</button>
        {value && <button type="button" className="cms-rowbtn is-danger" onClick={() => onChange('')} title="Bỏ ảnh"><Icon name="x" size={13} /> Bỏ ảnh</button>}
      </div>
      {f.hint && <span className="cms-hint">{f.hint}</span>}
      {open && <MediaPicker folder={f.folder || 'Banner'} onClose={() => setOpen(false)} onPick={(x) => { onChange(String(x.id)); setOpen(false) }} />}
    </div>
  )
}

function Field({ f, value, onChange }) {
  if (f.type === 'media') return <MediaField f={f} value={value} onChange={onChange} />
  const common = { value: value ?? '', onChange: (e) => onChange(e.target.value), placeholder: f.placeholder, required: f.required }
  let control
  if (f.type === 'textarea' || f.type === 'lines') control = <textarea rows={f.rows || (f.type === 'lines' ? 5 : 3)} {...common} />
  else if (f.type === 'select') control = <select {...common}>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
  else control = <input type={f.type || 'text'} {...common} />
  return (
    <label>{f.label}{f.required && <span className="cms-req"> *</span>}
      {control}
      {f.hint && <span className="cms-hint">{f.hint}</span>}
    </label>
  )
}

export default function ResourceManager({ config, embedded = false }) {
  const { title, sub, icon = 'file', resource, columns, fields, defaults, toForm = (r) => ({ ...r }), toPayload = (v) => v, noun = 'mục', searchFields = ['title', 'name', 'label'], sortFn } = config
  const api = cmsApi[resource]
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null) // null = thêm mới
  const [values, setValues] = useState(defaults)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const page = asPage(await api.list({ pageSize: 500 }))
      setRows(sortFn ? [...page.items].sort(sortFn) : [...page.items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || b.id - a.id))
      setError('')
    } catch (e) { setError(e.message) }
  }, [api, sortFn])
  useEffect(() => { load() }, [load])

  const list = useMemo(() => (rows || []).filter((r) => !q || norm(searchFields.map((k) => r[k] ?? '').join(' ')).includes(norm(q))), [rows, q, searchFields])

  const labelOf = (r) => String(searchFields.map((k) => r[k]).find(Boolean) ?? '')
  const formRef = useRef(null)
  /* Nút "Thêm …" trên đầu trang: đưa biểu mẫu về chế độ thêm mới và đặt con trỏ vào ô đầu tiên */
  const startNew = () => { reset(); setTimeout(() => { formRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); formRef.current?.querySelector('input, textarea, select')?.focus() }, 0) }
  const edit = (row) => { setSel(row); setValues(toForm(row)); setNotice(''); setError('') }
  const reset = () => { setSel(null); setValues(defaults); setNotice(''); setError('') }
  const set = (name) => (v) => setValues((s) => ({ ...s, [name]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      const body = toPayload(values)
      if (sel) await api.update(sel.id, body); else await api.create(body)
      setNotice(`${sel ? 'Đã lưu thay đổi' : `Đã thêm ${noun}`} — website công khai sẽ cập nhật ngay.`)
      if (!sel) setValues(defaults)
      setSel(null)
      await load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  const remove = async (row) => {
    if (!window.confirm(`Xóa ${noun} này?`)) return
    try { await api.remove(row.id); if (sel?.id === row.id) reset(); setNotice(`Đã xóa ${noun}.`); await load() } catch (err) { setError(err.message) }
  }
  const toggle = async (row) => {
    try { await api.update(row.id, { isVisible: !row.isVisible }); await load() } catch (err) { setError(err.message) }
  }

  // gom các trường `half` thành từng cặp
  const groups = []
  fields.forEach((f) => {
    const last = groups[groups.length - 1]
    if (f.half && last && last.length === 1 && last[0].half) last.push(f); else groups.push([f])
  })

  const hasVisible = rows?.some((r) => 'isVisible' in r)
  const cols = [...columns.map((c) => c.header), ...(hasVisible ? ['Trạng thái'] : []), 'Thao tác']

  return (
    <>
      {!embedded && <Head title={title} sub={sub} right={<button type="button" className="humg-btn humg-btn--primary humg-btn--sm" onClick={startNew} title={`Mở biểu mẫu thêm ${noun} mới ở cột bên phải`}><Icon name="plus" size={13} /> Thêm {noun}</button>} />}
      {error && <p className="cms-empty" role="alert" style={{ color: 'var(--humg-danger, #b42318)' }}>{error}</p>}
      {notice && <p className="cms-empty" role="status" style={{ color: 'var(--humg-success, #067647)' }}>{notice}</p>}
      <div className="ps-grid2">
        <Panel flush>
          <FilterBar search={q} onSearch={setQ} searchPlaceholder={`Tìm ${noun}…`} selects={[]} count={list.length} total={rows?.length ?? 0} onReset={() => setQ('')} />
          {rows === null && !error ? <p className="cms-empty">Đang tải…</p> : (
            <DataTable
              columns={cols}
              rows={list.map((r) => [
                ...columns.map((c) => c.render(r)),
                ...(hasVisible ? [<VisibilityToggle key="v" visible={r.isVisible} onToggle={() => toggle(r)} name={labelOf(r)} />] : []),
                <RowActions key="a" name={labelOf(r)} onEdit={() => edit(r)} onDelete={() => remove(r)} />,
              ])}
            />
          )}
          {rows && !list.length && <p className="cms-empty">Chưa có {noun} nào.</p>}
        </Panel>
        <Panel title={sel ? `Chỉnh sửa ${noun}` : `Thêm ${noun} mới`} icon={icon}>
          <form className="cms-form" onSubmit={submit} ref={formRef}>
            {sel && <p className="cms-hint" style={{ margin: 0 }}>Đang sửa: <strong>{labelOf(sel)}</strong>. Bấm “Hủy” để quay lại thêm mới.</p>}
            {groups.map((g, i) => g.length === 2
              ? <div key={i} className="cms-form__two">{g.map((f) => <Field key={f.name} f={f} value={values[f.name]} onChange={set(f.name)} />)}</div>
              : <Field key={g[0].name} f={g[0]} value={values[g[0].name]} onChange={set(g[0].name)} />)}
            <div className="cms-form__actions">
              <button type="submit" disabled={busy} className="humg-btn humg-btn--primary humg-btn--sm">{busy ? 'Đang lưu…' : sel ? 'Lưu thay đổi' : `Thêm ${noun}`}</button>
              {sel && <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={reset}>Hủy</button>}
            </div>
          </form>
        </Panel>
      </div>
    </>
  )
}

/* ---------- tiện ích chuyển đổi dùng trong các cấu hình ---------- */
export const secToMmss = (s = 0) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
export const mmssToSec = (v) => { const p = String(v || '0').split(':').map((x) => Number(x) || 0); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p.length === 2 ? p[0] * 60 + p[1] : p[0] }
export const linesToArr = (v) => String(v || '').split('\n').map((x) => x.trim()).filter(Boolean)
export const toBool = (v) => v === true || v === 'true'
export const num = (v, d = 0) => (v === '' || v == null || Number.isNaN(Number(v)) ? d : Number(v))
