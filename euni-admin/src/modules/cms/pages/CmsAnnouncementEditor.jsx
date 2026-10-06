'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from '../../../lib/router.jsx'
import Icon from '../../../shared/lib/Icon.jsx'
import { Panel, DataTable } from '../../../shared/components/ui/page.jsx'
import { cmsApi } from '../../../lib/api/cmsApi.js'
import { toLocalInput, fromLocalInput, fmtDateTime } from '../../../lib/datasets/format.js'
import RichTextEditor from '../RichTextEditor.jsx'
import { useAction, Notice } from '../actions.jsx'
import { WorkflowBar, HistoryPanel } from '../workflow.jsx'
import { PersonPicker, UnitSelect, personLabel } from '../pickers.jsx'
import { Head, Toggle } from '../shared.jsx'

/** Đối tượng nhận = realm role trên SSO */
const AUDIENCES = [['', 'Mọi đối tượng'], ['student', 'Sinh viên'], ['lecturer', 'Giảng viên'], ['staff', 'Cán bộ, chuyên viên'], ['manager', 'Lãnh đạo'], ['parent', 'Phụ huynh'], ['applicant', 'Thí sinh'], ['alumni', 'Cựu người học']]
const CATEGORIES = [['general', 'Chung'], ['academic', 'Đào tạo'], ['exam', 'Thi cử'], ['tuition', 'Học phí'], ['event', 'Sự kiện'], ['admin', 'Hành chính']]
const PRIORITIES = [[0, 'Bình thường'], [1, 'Quan trọng'], [2, 'Khẩn']]
const CHANNELS = [['portal', 'My eUni Portal'], ['email', 'Email'], ['push', 'Thông báo đẩy']]
const TABS = ['Nội dung', 'Đối tượng nhận', 'Bản tiếng Anh', 'Tệp đính kèm', 'Thống kê đọc', 'Lịch sử']

/**
 * Đối tượng nhận: mỗi dòng = audience AND đơn vị (gồm đơn vị con) AND người; các dòng OR; dòng "trừ" bị loại.
 * Ví dụ: [Sinh viên × Khoa CNTT] · [Lớp DCCTKT66A] · [GV0123] · trừ [Lớp DCKTM66].
 */
function TargetEditor({ targets, onChange, readOnly }) {
  const { cmsUnitName } = useModuleData('cms')
  const [audience, setAudience] = useState('')
  const [unitCode, setUnitCode] = useState(null)
  const [person, setPerson] = useState(null)
  const [exclude, setExclude] = useState(false)
  const add = () => {
    const t = { audience: audience || null, unitCode: unitCode || null, userSub: person?.sub || null, isExclude: exclude }
    const parts = [AUDIENCES.find(([k]) => k === audience)?.[1], unitCode ? cmsUnitName(unitCode) : null].filter((x) => x && x !== 'Mọi đối tượng')
    t.label = person ? personLabel(person) : parts.length ? parts.join(' · ') : 'Mọi người'
    onChange([...targets, t]); setPerson(null); setExclude(false)
  }
  return (
    <div className="cms-form">
      <div>
        {targets.map((t, i) => (
          <span key={i} className={`cms-chip ${t.isExclude ? 'is-exclude' : ''}`}>
            {t.isExclude ? 'Trừ: ' : ''}{t.label}
            {!readOnly && <button type="button" aria-label="Bỏ" onClick={() => onChange(targets.filter((_, j) => j !== i))}>×</button>}
          </span>
        ))}
        {!targets.length && <p className="ps-muted" style={{ margin: 0 }}>Chưa chọn đối tượng nhận.</p>}
      </div>
      {!readOnly && (
        <>
          <div className="cms-targetrow">
            <label>Đối tượng<select value={audience} onChange={(e) => setAudience(e.target.value)}>{AUDIENCES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label>Đơn vị / lớp (gồm đơn vị con)<UnitSelect value={unitCode} onChange={setUnitCode} emptyLabel="Toàn trường" /></label>
            <label>Cá nhân {person && <em className="cms-chip">{personLabel(person)} <button type="button" onClick={() => setPerson(null)}>×</button></em>}
              <PersonPicker onPick={setPerson} />
            </label>
            <label className="cms-perms"><span><input type="checkbox" checked={exclude} onChange={(e) => setExclude(e.target.checked)} /> Loại trừ</span></label>
            <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={add}><Icon name="users" size={13} /> Thêm</button>
          </div>
          <p className="ps-muted" style={{ fontSize: 12, margin: 0 }}>Các trường trong một dòng kết hợp với nhau (VD: Sinh viên + Khoa CNTT = sinh viên Khoa CNTT). Chọn cá nhân thì gửi riêng người đó.</p>
        </>
      )}
    </div>
  )
}

function StatsPanel({ id }) {
  const [s, setS] = useState(null)
  useEffect(() => { cmsApi.announcements.stats(id).then(setS).catch(() => setS({ people: [], recipients: 0, read: 0, acked: 0 })) }, [id])
  if (!s) return <p className="ps-muted">Đang tải…</p>
  return (
    <div className="cms-form">
      <div className="cms-stats">
        <div className="cms-stat"><strong>{s.recipients}</strong><span>Người nhận (ước tính)</span></div>
        <div className="cms-stat"><strong>{s.read}</strong><span>Đã đọc</span></div>
        {s.requireAck && <div className="cms-stat"><strong>{s.acked}</strong><span>Đã xác nhận</span></div>}
      </div>
      <DataTable columns={['Họ tên', 'Mã', 'Đơn vị', 'Đọc lúc', 'Xác nhận lúc']} rows={s.people.map((p) => [p.name, p.code || '', (p.units || []).join(', '), fmtDateTime(p.readAt) || '—', fmtDateTime(p.ackedAt) || '—'])} />
    </div>
  )
}

export function CmsAnnouncementEditor() {
  const { cmsAnnouncements, cmsContext } = useModuleData('cms')
  const { id } = useParams()
  const navigate = useNavigate()
  const act = useAction()
  const row = id ? cmsAnnouncements.find((a) => String(a.id) === String(id)) : null
  const raw = row?.raw
  const editing = !!raw
  const actions = raw?.allowedActions || []
  const readOnly = editing && !actions.includes('edit')

  const [tab, setTab] = useState(TABS[0])
  const [title, setTitle] = useState(raw?.title || '')
  const [bodyHtml, setBodyHtml] = useState(raw?.bodyHtml || '')
  const [ownerUnitCode, setOwnerUnitCode] = useState(raw?.ownerUnitCode || cmsContext.user?.units?.[0] || 'HUMG')
  const [category, setCategory] = useState(raw?.category || 'general')
  const [priority, setPriority] = useState(raw?.priority ?? 0)
  const [requireAck, setRequireAck] = useState(!!raw?.requireAck)
  const [channels, setChannels] = useState(raw?.channels || ['portal'])
  const [publishAt, setPublishAt] = useState(toLocalInput(raw?.publishAt))
  const [expireAt, setExpireAt] = useState(toLocalInput(raw?.expireAt))
  const [pinnedUntil, setPinnedUntil] = useState(toLocalInput(raw?.pinnedUntil))
  const [targets, setTargets] = useState(raw?.targets || [])
  const [attachments, setAttachments] = useState(raw?.attachments || [])
  const [newAtt, setNewAtt] = useState({ title: '', meta: '' })
  const [en, setEn] = useState(raw?.translations?.en || { title: '', bodyHtml: '', status: 'missing' })

  const save = async (then) => {
    if (!title.trim()) { act.run(async () => { throw new Error('Vui lòng nhập tiêu đề.') }); return }
    const body = {
      title: title.trim(), bodyHtml, ownerUnitCode, category, priority: Number(priority), requireAck, channels,
      publishAt: fromLocalInput(publishAt), expireAt: fromLocalInput(expireAt), pinnedUntil: fromLocalInput(pinnedUntil),
      targets: targets.map(({ audience, unitCode, userSub, isExclude, label }) => ({ audience, unitCode, userSub, isExclude, label })),
      attachments, translations: en.title?.trim() ? { en } : {},
      ...(editing ? { version: raw.version } : {}),
    }
    let saved = null
    const ok = await act.run(async () => {
      saved = editing ? await cmsApi.announcements.update(raw.id, body) : await cmsApi.announcements.create(body)
      if (then === 'submit' && saved?.allowedActions?.includes('submit')) saved = await cmsApi.announcements.workflow(saved.id, 'submit')
      return saved
    }, (r) => r?.message || (then === 'submit' ? 'Đã lưu và gửi duyệt' : editing ? 'Đã lưu thông báo' : 'Đã tạo bản nháp thông báo'))
    if (ok && !editing && saved?.id) navigate(`/cms/thong-bao/moi/${saved.id}`, { replace: true })
  }
  const toggleChannel = (c) => setChannels((list) => (list.includes(c) ? list.filter((x) => x !== c) : [...list, c]))
  const tabs = editing ? TABS : TABS.filter((t) => t !== 'Thống kê đọc' && t !== 'Lịch sử')

  return (
    <>
      <Head title={editing ? 'Chỉnh sửa thông báo' : 'Soạn thông báo'} sub={editing ? raw.title : 'Thông báo hiển thị trong hộp thư My eUni của người nhận'} right={<Link to="/cms/thong-bao" className="humg-btn humg-btn--ghost humg-btn--sm"><Icon name="arrow-left" size={13} /> Về danh sách</Link>} />
      {id && !raw && <p className="cms-empty" role="alert">Không tìm thấy thông báo #{id} (hoặc bạn không có quyền xem).</p>}
      <Notice error={act.error} notice={act.notice} />
      <Panel flush key={id || 'new'}>
        {editing && <div style={{ padding: '12px 16px 0' }}><WorkflowBar api={cmsApi.announcements} record={raw} noun="thông báo" archiveLabel="Thu hồi / lưu trữ" /></div>}
        {readOnly && <p className="cms-banner is-info" style={{ margin: '0 16px 12px' }}><Icon name="eye" size={14} /> Bạn chỉ có quyền xem thông báo này.</p>}
        <div className="ps-tabs">{tabs.map((t) => <button key={t} type="button" className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
        <div className="ps-tabbody">
          <div className="cms-editor">
            <div className="cms-editor__main">
              {tab === 'Nội dung' && <div className="cms-form">
                <label>Tiêu đề <span className="cms-req">*</span><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} readOnly={readOnly} /></label>
                <RichTextEditor key={`vi-${id || 'new'}`} value={bodyHtml} onChange={setBodyHtml} placeholder="Nội dung thông báo…" />
              </div>}
              {tab === 'Đối tượng nhận' && <TargetEditor targets={targets} onChange={setTargets} readOnly={readOnly} />}
              {tab === 'Bản tiếng Anh' && <div className="cms-form">
                <label>Title (EN)<input type="text" value={en.title} onChange={(e) => setEn({ ...en, title: e.target.value })} /></label>
                <label>Trạng thái bản dịch<select value={en.status} onChange={(e) => setEn({ ...en, status: e.target.value })}>
                  <option value="missing">Chưa dịch</option><option value="in_progress">Đang dịch</option><option value="done">Đã dịch (hiển thị khi người nhận chọn EN)</option>
                </select></label>
                <RichTextEditor key={`en-${id || 'new'}`} value={en.bodyHtml || ''} onChange={(html) => setEn((x) => ({ ...x, bodyHtml: html }))} placeholder="English content…" />
              </div>}
              {tab === 'Tệp đính kèm' && <div className="cms-form">
                {attachments.map((a, i) => <div key={i} className="cms-filelist">
                  <span><Icon name="file" size={14} /> {a.title}{a.meta ? ` · ${a.meta}` : ''}</span>
                  {!readOnly && <button type="button" className="cms-rowbtn is-danger" onClick={() => setAttachments((l) => l.filter((_, j) => j !== i))}><Icon name="x" size={13} /> Gỡ</button>}
                </div>)}
                {!attachments.length && <p className="ps-muted" style={{ margin: 0 }}>Chưa có tệp đính kèm.</p>}
                {!readOnly && <div className="cms-form__two">
                  <label>Tên tệp<input type="text" value={newAtt.title} onChange={(e) => setNewAtt((s) => ({ ...s, title: e.target.value }))} /></label>
                  <label>Thông tin<input type="text" value={newAtt.meta} onChange={(e) => setNewAtt((s) => ({ ...s, meta: e.target.value }))} placeholder="PDF · 420 KB" /></label>
                </div>}
                {!readOnly && <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={() => { if (newAtt.title.trim()) { setAttachments((l) => [...l, { title: newAtt.title.trim(), meta: newAtt.meta.trim() || null }]); setNewAtt({ title: '', meta: '' }) } }}><Icon name="file" size={13} /> Thêm tệp</button>}
                <p className="ps-muted" style={{ fontSize: 12 }}>Tệp đính kèm thông báo lưu ở kho riêng tư (MinIO cms-private); người nhận tải qua liên kết có thời hạn.</p>
              </div>}
              {tab === 'Thống kê đọc' && editing && <StatsPanel id={raw.id} />}
              {tab === 'Lịch sử' && editing && <HistoryPanel api={cmsApi.announcements} record={raw} canRestore={!readOnly} />}
            </div>
            <aside className="cms-editor__side">
              <div className="cms-side-card">
                <h4>Phát hành</h4>
                <label>Đơn vị phát hành<UnitSelect value={ownerUnitCode} onChange={setOwnerUnitCode} includeClasses={false} /></label>
                <label>Loại<select value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                <label>Mức ưu tiên<select value={priority} onChange={(e) => setPriority(Number(e.target.value))}>{PRIORITIES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                <Toggle checked={requireAck} onChange={setRequireAck} label="Yêu cầu xác nhận đã đọc" />
                <div className="cms-perms">{CHANNELS.map(([k, v]) => <label key={k}><input type="checkbox" checked={channels.includes(k)} onChange={() => toggleChannel(k)} disabled={k === 'portal'} /> {v}</label>)}</div>
                <label>Thời gian đăng (hẹn giờ)<input type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} /></label>
                <label>Hết hạn (tự rời hộp thư)<input type="datetime-local" value={expireAt} onChange={(e) => setExpireAt(e.target.value)} /></label>
                <label>Ghim đến<input type="datetime-local" value={pinnedUntil} onChange={(e) => setPinnedUntil(e.target.value)} /></label>
              </div>
              <div className="cms-side-actions">
                {!readOnly && <button type="button" disabled={act.busy} className="humg-btn humg-btn--primary humg-btn--block" onClick={() => save()}>{act.busy ? 'Đang lưu…' : editing ? 'Lưu' : 'Lưu bản nháp'}</button>}
                {!readOnly && (!editing || actions.includes('submit')) && <button type="button" disabled={act.busy} className="humg-btn humg-btn--ghost humg-btn--block humg-btn--sm" onClick={() => save('submit')}>Lưu & gửi duyệt</button>}
              </div>
            </aside>
          </div>
        </div>
      </Panel>
    </>
  )
}
