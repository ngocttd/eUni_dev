'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useMemo, useState } from 'react'
import Icon from '../../../shared/lib/Icon.jsx'
import { Panel, DataTable, FilterBar } from '../../../shared/components/ui/page.jsx'
import { cmsApi } from '../../../lib/api/cmsApi.js'
import { fmtDate, fromLocalInput } from '../../../lib/datasets/format.js'
import { useAction, Notice, confirmDelete } from '../actions.jsx'
import { PersonPicker, UnitSelect, personLabel } from '../pickers.jsx'
import { Head, norm } from '../shared.jsx'

const PRINCIPAL = { user: 'Người dùng', unit: 'Đơn vị (mọi thành viên)', role: 'Vai trò (SSO)' }
const RESOURCE = { '*': 'Mọi loại nội dung', news: 'Tin tức', announcement: 'Thông báo', page: 'Trang', media: 'Media' }
const SCOPE = { tenant: 'Toàn trang', category: 'Chuyên mục', unit: 'Đơn vị sở hữu (gồm đơn vị con)', record: 'Một bản ghi' }
const PERMS = [['view', 'Xem'], ['edit', 'Soạn / sửa'], ['review', 'Duyệt'], ['publish', 'Xuất bản / gỡ / lưu trữ'], ['manage', 'Toàn quyền']]
/** Role trên SSO dùng làm principal: client role của cms-api (tầng 2) + realm role (tầng 1) */
const ROLES = ['cms.admin', 'cms.editor', 'cms.reviewer', 'cms.author', 'cms.viewer', 'lecturer', 'staff', 'manager', 'student']
const EMPTY = { principalType: 'user', principalId: '', principalName: '', resourceType: 'news', scopeType: 'unit', scopeId: '', permissions: ['view', 'edit'], note: '', expiresAt: '' }

/**
 * Phân quyền nội dung (mức bản ghi). Người dùng và vai trò quản lý trên Identity Server; ở đây chỉ cấp
 * "ai" (người / đơn vị / vai trò) được làm gì (xem, sửa, duyệt, xuất bản) trên "phạm vi nào" (toàn trang / chuyên mục / đơn vị / bản ghi).
 * Quyền hiệu lực = quyền chức năng của vai trò AND grant khớp phạm vi — xem docs/design/CMS_DESIGN.md §5.
 */
export function CmsGrants() {
  const { cmsGrants, cmsCategories, cmsUnitName } = useModuleData('cms')
  const act = useAction()
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [q, setQ] = useState('')
  const [effective, setEffective] = useState(null)
  const cats = useMemo(() => { const flat = (l) => l.flatMap((c) => [c, ...(c.children ? flat(c.children) : [])]); return flat(cmsCategories) }, [cmsCategories])
  if (!cmsGrants) return <p className="cms-empty" role="alert">Bạn không có quyền quản lý phân quyền nội dung (cần quyền grant.manage).</p>

  const rows = cmsGrants.filter((g) => !q || norm(`${g.principalLabel} ${g.scopeLabel} ${g.note || ''}`).includes(norm(q)))
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const togglePerm = (p) => set({ permissions: form.permissions.includes(p) ? form.permissions.filter((x) => x !== p) : [...form.permissions, p] })
  const edit = (g) => { setEditId(g.id); setForm({ ...EMPTY, ...g, principalName: g.principalLabel, scopeId: g.scopeId ?? '', note: g.note || '', expiresAt: g.expiresAt ? g.expiresAt.slice(0, 16) : '' }) }
  const reset = () => { setEditId(null); setForm(EMPTY) }
  const save = async (e) => {
    e.preventDefault()
    const body = {
      principalType: form.principalType, principalId: form.principalId, resourceType: form.resourceType, scopeType: form.scopeType,
      scopeId: form.scopeType === 'tenant' ? null : String(form.scopeId || ''), permissions: form.permissions, note: form.note || null,
      expiresAt: form.expiresAt ? fromLocalInput(form.expiresAt) : null,
    }
    const ok = await act.run(() => (editId ? cmsApi.grants.update(editId, body) : cmsApi.grants.create(body)), editId ? 'Đã cập nhật quyền' : 'Đã cấp quyền')
    if (ok) reset()
  }
  const revoke = (g) => confirmDelete(`quyền của ${g.principalLabel} trên ${g.scopeLabel}`) && act.run(() => cmsApi.grants.remove(g.id), 'Đã thu hồi quyền')
  const check = async (u) => setEffective(await cmsApi.grants.effective(u.sub))

  return (
    <>
      <Head title="Phân quyền nội dung" sub="Ai được xem / soạn / duyệt / xuất bản nội dung nào. Tài khoản & vai trò quản lý trên Identity Server." />
      <Notice error={act.error} notice={act.notice} />
      <div className="ps-grid2">
        <Panel title={editId ? `Sửa quyền #${editId}` : 'Cấp quyền mới'} icon="shield">
          <form className="cms-form" onSubmit={save}>
            <div className="cms-form__two">
              <label>Cấp cho<select value={form.principalType} onChange={(e) => set({ principalType: e.target.value, principalId: '', principalName: '' })}>{Object.entries(PRINCIPAL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
              <label>{PRINCIPAL[form.principalType]} <span className="cms-req">*</span>
                {form.principalType === 'user' && <>{form.principalId && <em className="cms-chip">{form.principalName || form.principalId}</em>}<PersonPicker onPick={(u) => set({ principalId: u.sub, principalName: personLabel(u) })} /></>}
                {form.principalType === 'unit' && <UnitSelect value={form.principalId} onChange={(v) => set({ principalId: v || '' })} emptyLabel="— chọn đơn vị —" />}
                {form.principalType === 'role' && <select value={form.principalId} onChange={(e) => set({ principalId: e.target.value })}><option value="">— chọn vai trò —</option>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>}
              </label>
            </div>
            <div className="cms-form__two">
              <label>Loại nội dung<select value={form.resourceType} onChange={(e) => set({ resourceType: e.target.value })}>{Object.entries(RESOURCE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
              <label>Phạm vi<select value={form.scopeType} onChange={(e) => set({ scopeType: e.target.value, scopeId: '' })}>{Object.entries(SCOPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            </div>
            {form.scopeType === 'category' && <label>Chuyên mục<select value={form.scopeId} onChange={(e) => set({ scopeId: e.target.value })}><option value="">— chọn —</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
            {form.scopeType === 'unit' && <label>Đơn vị sở hữu nội dung<UnitSelect value={form.scopeId} onChange={(v) => set({ scopeId: v || '' })} includeClasses={false} emptyLabel="— chọn đơn vị —" /></label>}
            {form.scopeType === 'record' && <label>Mã bản ghi (ID bài viết / thông báo)<input type="number" min="1" value={form.scopeId} onChange={(e) => set({ scopeId: e.target.value })} /></label>}
            <div className="cms-perms">{PERMS.map(([k, v]) => <label key={k}><input type="checkbox" checked={form.permissions.includes(k)} onChange={() => togglePerm(k)} /> {v}</label>)}</div>
            <div className="cms-form__two">
              <label>Hết hạn (tùy chọn)<input type="datetime-local" value={form.expiresAt} onChange={(e) => set({ expiresAt: e.target.value })} /></label>
              <label>Ghi chú<input type="text" value={form.note} onChange={(e) => set({ note: e.target.value })} placeholder="VD: Phụ trách chuyên mục Tuyển sinh" /></label>
            </div>
            <div className="cms-rowact">
              <button type="submit" disabled={act.busy || !form.principalId || !form.permissions.length || (form.scopeType !== 'tenant' && !form.scopeId)} className="humg-btn humg-btn--primary humg-btn--sm">{editId ? 'Lưu thay đổi' : 'Cấp quyền'}</button>
              {editId && <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={reset}>Hủy</button>}
            </div>
          </form>
        </Panel>
        <Panel title="Tra cứu quyền hiệu lực của một người" icon="users">
          <div className="cms-form">
            <PersonPicker onPick={check} />
            {effective && <>
              <p style={{ margin: 0 }}><strong>{effective.user.name}</strong> · vai trò IdS: {effective.user.roles.join(', ') || '—'} · đơn vị: {(effective.user.units || []).map(cmsUnitName).join(', ') || '—'}</p>
              <p className="ps-muted" style={{ margin: 0, fontSize: 12 }}>Quyền chức năng: {effective.permissions.join(', ') || 'không có'}</p>
              <ul className="cms-timeline">{effective.grants.map((g) => <li key={g.id}><em>{RESOURCE[g.resourceType]}</em><span>{g.scopeLabel}</span><em>{g.permissions.join(', ')}</em></li>)}
                {!effective.grants.length && <li><span className="ps-muted">Không có grant nào áp dụng — người này không thao tác được nội dung (trừ bản nháp tự tạo).</span></li>}</ul>
            </>}
          </div>
        </Panel>
      </div>
      <Panel flush>
        <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm người, đơn vị, phạm vi…" count={rows.length} total={cmsGrants.length} onReset={() => setQ('')} />
        <DataTable columns={['Cấp cho', 'Loại nội dung', 'Phạm vi', 'Quyền', 'Hết hạn', 'Ghi chú', 'Thao tác']} rows={rows.map((g) => [
          <span key="p"><strong>{g.principalLabel}</strong><br /><em className="ps-muted" style={{ fontSize: 11 }}>{PRINCIPAL[g.principalType]}</em></span>,
          RESOURCE[g.resourceType] || g.resourceType, g.scopeLabel, g.permissions.map((p) => PERMS.find(([k]) => k === p)?.[1] || p).join(', '),
          g.expiresAt ? fmtDate(g.expiresAt) : '—', g.note || '',
          <span key="a" className="cms-rowact">
            <button type="button" className="cms-rowbtn" onClick={() => edit(g)}><Icon name="file" size={13} /> Sửa</button>
            <button type="button" className="cms-rowbtn is-danger" onClick={() => revoke(g)}><Icon name="x" size={13} /> Thu hồi</button>
          </span>,
        ])} />
        {!rows.length && <p className="cms-empty">Chưa có quyền nào.</p>}
      </Panel>
    </>
  )
}
