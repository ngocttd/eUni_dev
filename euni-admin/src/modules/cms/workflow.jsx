'use client'
/**
 * Thành phần dùng chung cho nội dung có workflow (tin tức, thông báo) — docs/design/CMS_DESIGN.md §7–8:
 *   WorkflowBar   trạng thái + các nút hành động theo allowedActions (server tính theo ACL), lý do trả lại, hẹn giờ
 *   HistoryPanel  phiên bản (xem khác biệt, khôi phục) + lịch sử workflow + audit
 *   TrashPanel    thùng rác (xóa mềm) + khôi phục
 */
import { useCallback, useEffect, useState } from 'react'
import Icon from '../../shared/lib/Icon.jsx'
import { Panel, DataTable } from '../../shared/components/ui/page.jsx'
import { ACTION_LABEL_WF, STATUS_LABEL, statusLabel } from '../../lib/datasets/loaders.js'
import { fmtDateTime, toLocalInput, fromLocalInput } from '../../lib/datasets/format.js'
import { useAction, Notice } from './actions.jsx'
import { Tag } from './shared.jsx'

/** Hành động workflow hiển thị dạng nút (edit/delete/restore do màn hình tự xử lý) */
const WF_ACTIONS = ['submit', 'approve', 'reject', 'publish', 'unpublish', 'archive', 'approve-revision', 'reject-revision']
const NEED_NOTE = new Set(['reject', 'reject-revision'])
const OPTIONAL_NOTE = new Set(['archive'])
const SCHEDULE = new Set(['publish', 'approve'])
const PRIMARY = new Set(['approve', 'publish', 'approve-revision', 'submit'])

export const conflictMessage = (e) => (e?.status === 409 && e?.data?.currentVersion
  ? `${e.message} Nhấn "Tải lại" để lấy bản mới nhất (nội dung bạn đang soạn sẽ mất).`
  : e?.message)

export function WorkflowBar({ api, record, noun = 'bài viết', archiveLabel = 'Lưu trữ', onDone }) {
  const act = useAction()
  const [pending, setPending] = useState(null) // hành động đang chờ nhập lý do / giờ đăng
  const [note, setNote] = useState('')
  const [publishAt, setPublishAt] = useState('')
  if (!record) return null
  const actions = (record.allowedActions || []).filter((a) => WF_ACTIONS.includes(a))

  const run = async (action) => {
    const body = { version: record.version }
    if (note.trim()) body.note = note.trim()
    if (SCHEDULE.has(action) && publishAt) body.publishAt = fromLocalInput(publishAt)
    const ok = await act.run(() => api.workflow(record.id, action, body), `${ACTION_LABEL_WF[action] || action} — xong`)
    if (ok) { setPending(null); setNote(''); setPublishAt(''); onDone?.(action) }
  }
  const click = (action) => {
    if (NEED_NOTE.has(action) || OPTIONAL_NOTE.has(action) || SCHEDULE.has(action)) {
      setPending(action); setNote(''); setPublishAt(SCHEDULE.has(action) ? toLocalInput(record.publishAt && Date.parse(record.publishAt) > Date.now() ? record.publishAt : '') : '')
      return
    }
    run(action)
  }
  const label = (a) => (a === 'archive' ? archiveLabel : ACTION_LABEL_WF[a] || a)

  return (
    <>
      {record.pendingRevision && (
        <div className="cms-banner">
          <Icon name="clock" size={15} />
          <span>Có <strong>bản sửa đổi v{record.pendingRevision.version}</strong> của {record.pendingRevision.createdByName} đang chờ duyệt — website vẫn hiển thị nội dung hiện tại.</span>
        </div>
      )}
      {record.status === 'draft' && record.reviewNote && (
        <div className="cms-banner"><Icon name="x" size={15} /><span>Bị trả lại: <strong>{record.reviewNote}</strong></span></div>
      )}
      {record.recallReason && <div className="cms-banner"><Icon name="x" size={15} /><span>Đã thu hồi: <strong>{record.recallReason}</strong></span></div>}
      <div className="cms-wfbar">
        <span className="cms-wfbar__state">
          Trạng thái: <Tag v={statusLabel(record)} />
          {record.isScheduled && <em>đăng lúc {fmtDateTime(record.publishAt)}</em>}
          <em className="ps-muted">v{record.version}</em>
        </span>
        {actions.map((a) => (
          <button key={a} type="button" disabled={act.busy} className={`humg-btn humg-btn--sm ${PRIMARY.has(a) ? 'humg-btn--primary' : 'humg-btn--ghost'}`} onClick={() => click(a)}>{label(a)}</button>
        ))}
        {!actions.length && <span className="ps-muted">Bạn không có thao tác workflow nào trên {noun} này.</span>}
        {pending && (
          <>
            {(NEED_NOTE.has(pending) || OPTIONAL_NOTE.has(pending)) && (
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={NEED_NOTE.has(pending) ? 'Lý do (bắt buộc)…' : 'Lý do (không bắt buộc)…'} />
            )}
            {SCHEDULE.has(pending) && (
              <label className="cms-wfbar__note">Thời gian đăng (để trống = ngay bây giờ)
                <input type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
              </label>
            )}
            <button type="button" className="humg-btn humg-btn--primary humg-btn--sm" disabled={act.busy || (NEED_NOTE.has(pending) && !note.trim())} onClick={() => run(pending)}>Xác nhận: {label(pending)}</button>
            <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={() => setPending(null)}>Hủy</button>
          </>
        )}
      </div>
      <Notice error={act.error} notice={act.notice} />
    </>
  )
}

const changesText = (changes) => (changes ? Object.entries(changes).map(([k, [a, b]]) => `${k}: ${short(a)} → ${short(b)}`).join('\n') : '')
const short = (v) => { const s = typeof v === 'string' ? v : JSON.stringify(v); return s && s.length > 80 ? `${s.slice(0, 80)}…` : s ?? '∅' }
const REV_STATE = { current: 'Hiện tại', superseded: 'Cũ', proposed: 'Đề xuất chờ duyệt', rejected: 'Bị từ chối' }

export function HistoryPanel({ api, record, canRestore }) {
  const act = useAction()
  const [data, setData] = useState(null)
  const [diff, setDiff] = useState(null)
  const load = useCallback(async () => {
    const [revisions, history] = await Promise.all([api.revisions(record.id), api.history(record.id)])
    setData({ revisions, history })
  }, [api, record.id])
  useEffect(() => { load().catch(() => setData({ revisions: [], history: { workflow: [], audit: [] } })) }, [load, record.version, record.status])

  const show = async (v) => setDiff({ version: v, ...(await api.revision(record.id, v)) })
  const restore = (v) => window.confirm(`Khôi phục nội dung phiên bản v${v}? Một phiên bản mới sẽ được tạo, lịch sử giữ nguyên.`)
    && act.run(() => api.restoreRevision(record.id, v), `Đã khôi phục từ v${v}`).then((ok) => ok && load())

  if (!data) return <p className="ps-muted">Đang tải lịch sử…</p>
  return (
    <div className="cms-form">
      <Notice error={act.error} notice={act.notice} />
      <Panel title="Phiên bản" icon="layers" flush>
        <DataTable columns={['Phiên bản', 'Trạng thái', 'Người lưu', 'Thời gian', 'Ghi chú', '']} rows={data.revisions.map((r) => [
          `v${r.version}`, REV_STATE[r.state] || r.state, r.createdByName, fmtDateTime(r.createdAt), r.reason || '',
          <span key="a" className="cms-rowact">
            <button type="button" className="cms-rowbtn" onClick={() => show(r.version)}><Icon name="eye" size={13} /> Khác biệt</button>
            {canRestore && r.state !== 'current' && r.state !== 'proposed' && <button type="button" className="cms-rowbtn" onClick={() => restore(r.version)}><Icon name="download" size={13} /> Khôi phục</button>}
          </span>,
        ])} />
      </Panel>
      {diff && (
        <Panel title={`So với hiện tại · v${diff.version}`} icon="file" action={<button type="button" className="cms-rowbtn" onClick={() => setDiff(null)}><Icon name="x" size={13} /> Đóng</button>}>
          {diff.changesFromCurrent ? <pre className="cms-timeline__changes">{changesText(diff.changesFromCurrent)}</pre> : <p className="ps-muted">Nội dung giống bản hiện tại.</p>}
        </Panel>
      )}
      <Panel title="Lịch sử xử lý" icon="clock">
        <ul className="cms-timeline">
          {data.history.workflow.map((h) => (
            <li key={`w${h.id}`}><em>{fmtDateTime(h.at)}</em><span><strong>{ACTION_LABEL_WF[h.action] || (h.action === 'create' ? 'Tạo mới' : h.action)}</strong>{h.fromStatus && h.toStatus && h.fromStatus !== h.toStatus ? ` · ${STATUS_LABEL[h.fromStatus]} → ${STATUS_LABEL[h.toStatus]}` : ''}{h.note ? ` · “${h.note}”` : ''}</span><em>{h.actorName}</em></li>
          ))}
          {!data.history.workflow.length && <li><span className="ps-muted">Chưa có.</span></li>}
        </ul>
      </Panel>
      <Panel title="Nhật ký thay đổi (audit)" icon="file">
        <ul className="cms-timeline">
          {data.history.audit.map((a) => (
            <li key={`a${a.id}`}><em>{fmtDateTime(a.createdAt)}</em><span>{a.action}{a.revisionVersion ? ` · v${a.revisionVersion}` : ''}</span><em>{a.userName}</em>
              {a.changes && <pre className="cms-timeline__changes">{changesText(a.changes)}</pre>}</li>
          ))}
          {!data.history.audit.length && <li><span className="ps-muted">Chưa có.</span></li>}
        </ul>
      </Panel>
    </div>
  )
}

export function TrashPanel({ api, noun = 'bài viết' }) {
  const act = useAction()
  const [rows, setRows] = useState(null)
  const load = useCallback(() => api.trash({ pageSize: 200 }).then((p) => setRows(p.items || [])).catch(() => setRows([])), [api])
  useEffect(() => { load() }, [load])
  const restore = (r) => act.run(() => api.restore(r.id), `Đã khôi phục ${noun}`).then((ok) => ok && load())
  if (!rows) return <p className="cms-empty">Đang tải thùng rác…</p>
  return (
    <>
      <Notice error={act.error} notice={act.notice} />
      <DataTable columns={['Tiêu đề', 'Trạng thái trước khi xóa', 'Người xóa', 'Thời gian xóa', '']} rows={rows.map((r) => [
        r.title, STATUS_LABEL[r.status] || r.status, r.deletedByName || r.deletedBy, fmtDateTime(r.deletedAt),
        r.allowedActions?.includes('restore') ? <button key="r" type="button" className="cms-rowbtn" onClick={() => restore(r)}><Icon name="download" size={13} /> Khôi phục</button> : '',
      ])} />
      {!rows.length && <p className="cms-empty">Thùng rác trống.</p>}
    </>
  )
}
