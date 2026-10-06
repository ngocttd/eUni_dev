'use client'
/**
 * Trang đơn vị (tenant): mỗi Khoa / Phòng ban có website riêng dùng chung CMS với Trường.
 * Tạo trang mới → cms-api sinh sẵn cấu hình, menu, trang Giới thiệu/Liên hệ/Chính sách; website nhận tên miền mới ngay
 * (tra qua /api/v1/public/tenants/resolve, không cần build lại). Chỉ cms.admin dùng được màn này.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../../../shared/lib/Icon.jsx'
import { Panel, DataTable, FilterBar } from '../../../shared/components/ui/page.jsx'
import { cmsApi } from '../../../lib/api/cmsApi.js'
import { APP_URLS } from '../../../config/apps.js'
import tenantService from '../../../shared/services/tenantService.js'
import { useAction, Notice } from '../actions.jsx'
import { PersonPicker, UnitSelect, personLabel } from '../pickers.jsx'
import { Head, Toggle, norm, slugify } from '../shared.jsx'

const EMPTY = { id: '', name: '', rootUnit: '', domains: '', owner: null, scaffold: true, isActive: true }
/** URL website của một trang theo tên miền đầu tiên (giữ giao thức của website Trường) */
const siteOf = (t) => (t.domains?.[0] ? `${new URL(APP_URLS.public).protocol}//${t.domains[0]}` : null)

export function CmsTenants() {
  const act = useAction()
  const [list, setList] = useState(null)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null) // null = tạo mới
  const [v, setV] = useState(EMPTY)
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e?.target ? e.target.value : e }))

  const load = useCallback(async () => { try { setList(await cmsApi.tenants.list()) } catch (e) { act.run(() => Promise.reject(e)) } }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])
  const rows = useMemo(() => (list || []).filter((t) => !q || norm(`${t.name} ${t.id} ${t.domains.join(' ')}`).includes(norm(q))), [list, q])

  const pick = (t) => { setSel(t); act.clear(); setV({ id: t.id, name: t.name, rootUnit: t.rootUnit || '', domains: t.domains.join('\n'), owner: null, scaffold: false, isActive: t.isActive }) }
  const reset = () => { setSel(null); setV(EMPTY); act.clear() }
  const domains = v.domains.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean)

  const submit = async (e) => {
    e.preventDefault()
    const body = { name: v.name.trim(), rootUnit: v.rootUnit || null, domains, isActive: v.isActive }
    const ok = await act.run(async () => {
      if (sel) await cmsApi.tenants.update(sel.id, body)
      else await cmsApi.tenants.create({ ...body, id: v.id.trim(), scaffold: v.scaffold, ownerSub: v.owner?.sub || null })
      await load()
    }, sel ? 'Đã lưu trang đơn vị' : `Đã tạo trang “${body.name}”. Chuyển sang trang này để biên tập nội dung.`)
    if (ok && !sel) setV(EMPTY)
  }
  const toggle = (t) => act.run(async () => { await cmsApi.tenants.update(t.id, { isActive: !t.isActive }); await load() },
    t.isActive ? `Đã tắt trang “${t.name}” — website và API công khai của trang ngừng phục vụ` : `Đã bật lại trang “${t.name}”`)
  /* chuyển CMS sang quản trị trang này (giống ô chọn trang ở góc trên) */
  const manage = (t) => { tenantService.set(t.id); window.location.assign('/cms') }

  return (
    <>
      <Head title="Trang đơn vị" sub="Website riêng của Khoa, Phòng ban… dùng chung CMS và API với Trường, dữ liệu tách riêng theo từng trang" right={
        <button type="button" className="humg-btn humg-btn--primary humg-btn--sm" onClick={reset}><Icon name="plus" size={13} /> Thêm trang đơn vị</button>} />
      <Notice error={act.error} notice={act.notice} />
      <div className="ps-grid2">
        <Panel flush>
          <FilterBar search={q} onSearch={setQ} onReset={() => setQ('')} searchPlaceholder="Tìm theo tên, mã, tên miền…" count={rows.length} total={list?.length ?? 0} />
          {list === null ? <p className="cms-empty">Đang tải…</p> : (
            <DataTable columns={['Trang', 'Tên miền', 'Nội dung', 'Trạng thái', 'Thao tác']} rows={rows.map((t) => [
              <span key="n"><strong>{t.name}</strong><br /><em className="ps-muted" style={{ fontSize: 11 }}>Mã: {t.id}{t.rootUnitName ? ` · Đơn vị gốc: ${t.rootUnitName}` : ''}</em></span>,
              t.domains.length ? <span key="d" className="cms-domains">{t.domains.map((d) => <code key={d}>{d}</code>)}</span> : <span key="d" className="ps-muted" title="Chưa gắn tên miền nên website chưa mở được">Chưa có</span>,
              <span key="s" className="ps-muted" style={{ fontSize: 12 }}>{t.stats.contents} bài · {t.stats.pages} trang · {t.stats.grants} quyền</span>,
              <button key="v" type="button" className="cms-vistoggle" aria-pressed={t.isActive} onClick={() => toggle(t)} disabled={t.id === 'humg'}
                title={t.id === 'humg' ? 'Trang Trường là trang mặc định, không tắt được' : t.isActive ? `Đang hoạt động — bấm để tắt trang “${t.name}”` : `Đang tắt — bấm để bật lại “${t.name}”`}>
                <span className="cms-switch__track" aria-hidden="true"><span className="cms-switch__dot" /></span>{t.isActive ? 'Hoạt động' : 'Đã tắt'}
              </button>,
              <span key="a" className="cms-rowact">
                <button type="button" className="cms-rowbtn" onClick={() => pick(t)} title={`Sửa trang “${t.name}”`} aria-label={`Sửa trang “${t.name}”`}><Icon name="edit" size={13} /> Sửa</button>
                {t.isActive && <button type="button" className="cms-rowbtn" onClick={() => manage(t)} title={`Chuyển CMS sang quản trị nội dung của “${t.name}”`}><Icon name="settings" size={13} /> Quản trị</button>}
                {t.isActive && siteOf(t) && <a className="cms-rowbtn" href={siteOf(t)} target="_blank" rel="noopener noreferrer" title={`Mở website ${t.domains[0]} ở tab mới`}><Icon name="globe" size={13} /> Website</a>}
              </span>,
            ])} />
          )}
        </Panel>
        <Panel title={sel ? `Sửa trang “${sel.name}”` : 'Thêm trang đơn vị'} icon="building">
          <form className="cms-form" onSubmit={submit}>
            <label>Tên trang <span className="cms-req">*</span>
              <input type="text" required value={v.name} onChange={(e) => setV((s) => ({ ...s, name: e.target.value, ...(sel || s.idTouched ? {} : { id: slugify(e.target.value).replace(/^(khoa|phong|trung-tam)-/, '').slice(0, 32) }) }))} placeholder="VD: Khoa Địa chất" />
            </label>
            <label>Mã trang <span className="cms-req">*</span>
              <input type="text" required value={v.id} disabled={!!sel} onChange={(e) => setV((s) => ({ ...s, id: e.target.value.toLowerCase(), idTouched: true }))} placeholder="dia-chat" pattern="[a-z][a-z0-9-]{1,31}" />
              <span className="cms-hint">{sel ? 'Không đổi được sau khi tạo (dữ liệu của trang gắn với mã này).' : 'Chữ thường không dấu, số, dấu “-”. Dùng trong API (header X-Tenant).'}</span>
            </label>
            <label>Đơn vị gốc
              <UnitSelect value={v.rootUnit} onChange={(x) => setV((s) => ({ ...s, rootUnit: x || '' }))} includeClasses={false} emptyLabel="— chọn đơn vị trong cây tổ chức —" />
              <span className="cms-hint">Đơn vị mà trang này đại diện (lấy từ hệ thống nhân sự). Dùng để gợi ý đơn vị sở hữu bài viết.</span>
            </label>
            <label>Tên miền
              <textarea rows="2" value={v.domains} onChange={set('domains')} placeholder={'diachat.humg.edu.vn\n(môi trường thử: diachat.localhost:3002)'} />
              <span className="cms-hint">Mỗi dòng một tên miền. Website nhận tên miền ngay khi lưu; cần trỏ DNS tên miền về máy chủ website.</span>
            </label>
            {!sel && <>
              <label>Người phụ trách
                {v.owner && <em className="cms-chip">{personLabel(v.owner)} <button type="button" aria-label="Bỏ chọn" title="Bỏ chọn" onClick={() => setV((s) => ({ ...s, owner: null }))}>×</button></em>}
                <PersonPicker onPick={(u) => setV((s) => ({ ...s, owner: u }))} label="Chọn người phụ trách trang" />
                <span className="cms-hint">Được cấp toàn quyền nội dung trên trang này. Người đó cần có vai trò cms.* trên SSO.</span>
              </label>
              <Toggle checked={v.scaffold} onChange={(x) => setV((s) => ({ ...s, scaffold: x }))} label="Tạo sẵn nội dung mẫu" hint="Cấu hình theo tên trang, menu đầu/chân trang, trang Giới thiệu, Liên hệ, Chính sách, Điều khoản, chuyên mục Tin tức" />
            </>}
            {sel && sel.id !== 'humg' && <Toggle checked={v.isActive} onChange={(x) => setV((s) => ({ ...s, isActive: x }))} label="Trang đang hoạt động" hint="Tắt: website và API công khai của trang ngừng phục vụ; dữ liệu vẫn giữ" />}
            <div className="cms-form__actions">
              <button type="submit" disabled={act.busy} className="humg-btn humg-btn--primary humg-btn--sm">{act.busy ? 'Đang lưu…' : sel ? 'Lưu thay đổi' : 'Tạo trang'}</button>
              {sel && <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={reset}>Hủy</button>}
            </div>
            {!sel && <p className="cms-hint" style={{ margin: 0 }}><Icon name="info" size={12} /> Sau khi tạo: bấm “Quản trị” ở dòng của trang để biên tập Cấu hình, Menu, Trang, Banner, Bài viết của trang đó.</p>}
          </form>
        </Panel>
      </div>
    </>
  )
}
