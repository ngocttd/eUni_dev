'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useMemo, useState } from 'react'
import { Link } from '../../../lib/router.jsx'
import Icon from '../../../shared/lib/Icon.jsx'
import { Panel, FilterBar, DataTable, Pagination } from '../../../shared/components/ui/page.jsx'
import { cmsApi } from '../../../lib/api/cmsApi.js'
import { useAction, Notice, confirmDelete } from '../actions.jsx'
import { TrashPanel } from '../workflow.jsx'
import { Head, PAGE_SIZE, Tag, norm } from '../shared.jsx'

const PRIORITY_CLS = { 0: '', 1: 'is-wait', 2: 'is-off' }

/**
 * Thông báo theo đối tượng (SV/GV/phụ huynh, đơn vị, lớp, cá nhân) — tách khỏi tin tức (docs/design/CMS_DESIGN.md §6).
 * Danh sách theo phạm vi được cấp quyền; cột "Đã đọc" từ receipts.
 */
export function CmsAnnouncements() {
  const { cmsAnnouncements, cmsPostStatuses, cmsCan } = useModuleData('cms')
  const [view, setView] = useState('list')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState(cmsPostStatuses[0])
  const [cat, setCat] = useState('Tất cả loại')
  const [page, setPage] = useState(1)
  const act = useAction()
  const cats = useMemo(() => ['Tất cả loại', ...new Set(cmsAnnouncements.map((a) => a.category))], [cmsAnnouncements])
  const filtered = useMemo(() => cmsAnnouncements.filter((a) => (status === cmsPostStatuses[0] || a.status === status)
    && (cat === 'Tất cả loại' || a.category === cat) && (!q || norm(`${a.title} ${a.unit} ${a.targets}`).includes(norm(q)))), [cmsAnnouncements, cmsPostStatuses, q, status, cat])
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const remove = (a) => confirmDelete(`thông báo "${a.title}" (chuyển vào thùng rác)`) && act.run(() => cmsApi.announcements.remove(a.id), 'Đã chuyển thông báo vào thùng rác')

  return (
    <>
      <Head title="Thông báo" sub="Gửi tới sinh viên, cán bộ, phụ huynh theo đơn vị, lớp hoặc từng người · hiển thị trong My eUni Portal" right={<>
        <span className="cms-tabs-inline">
          <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')}>Danh sách</button>
          <button type="button" className={view === 'trash' ? 'is-active' : ''} onClick={() => setView('trash')}><Icon name="x" size={12} /> Thùng rác</button>
        </span>
        {cmsCan.announcement?.edit && <Link to="/cms/thong-bao/moi" className="humg-btn humg-btn--primary humg-btn--sm"><Icon name="bell" size={13} /> Soạn thông báo</Link>}
      </>} />
      <Notice error={act.error} notice={act.notice} />
      {view === 'trash' ? <Panel flush><TrashPanel api={cmsApi.announcements} noun="thông báo" /></Panel> : (
        <Panel flush>
          <FilterBar search={q} onSearch={(v) => { setQ(v); setPage(1) }} searchPlaceholder="Tìm tiêu đề, đơn vị, đối tượng…"
            selects={[{ label: 'Trạng thái', value: status, onChange: (v) => { setStatus(v); setPage(1) }, options: cmsPostStatuses },
              { label: 'Loại', value: cat, onChange: (v) => { setCat(v); setPage(1) }, options: cats }]}
            count={rows.length} total={filtered.length} onReset={() => { setQ(''); setStatus(cmsPostStatuses[0]); setCat('Tất cả loại'); setPage(1) }} />
          <DataTable columns={['Tiêu đề', 'Đơn vị phát hành', 'Đối tượng nhận', 'Ưu tiên', 'Trạng thái', 'Đã đọc', 'Ngày đăng', 'Thao tác']} rows={rows.map((a) => [
            <span key="t">{a.title}{a.hasPendingRevision && <em className="cms-chip">sửa đổi chờ duyệt</em>}</span>,
            a.unit, <span key="g" className="ps-muted" style={{ fontSize: 12 }}>{a.targets}</span>,
            <span key="p" className={`cms-tag ${PRIORITY_CLS[a.priority]}`}>{a.priorityLabel}</span>, <Tag key="s" v={a.status} />,
            a.statusCode === 'published' ? `${a.stats.read}/${a.stats.recipients}${a.raw.requireAck ? ` · XN ${a.stats.acked}` : ''}` : '—', a.date,
            <span key="a" className="cms-rowact">
              <Link to={`/cms/thong-bao/moi/${a.id}`} className="cms-rowbtn"><Icon name={a.actions.includes('edit') ? 'file' : 'eye'} size={13} /> {a.actions.includes('edit') ? 'Sửa' : 'Xem'}</Link>
              {a.actions.includes('delete') && <button type="button" className="cms-rowbtn is-danger" onClick={() => remove(a)}><Icon name="x" size={13} /> Xóa</button>}
            </span>,
          ])} />
          {!rows.length && <p className="cms-empty">Không có thông báo nào khớp bộ lọc.</p>}
          <div className="cms-pagefoot">
            <span>{filtered.length} thông báo</span>
            <Pagination page={page} total={Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))} onChange={setPage} />
          </div>
        </Panel>
      )}
    </>
  )
}
