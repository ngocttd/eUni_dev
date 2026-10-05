'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { useState, useMemo } from "react";
import { Panel, FilterBar, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { Head, TicketTag, norm } from "../shared.jsx";
export function PgTickets() {
  const { pgTickets } = useModuleData('portal-staff');
  const t = pgTickets;
  const [tab, setTab] = useState('list');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('Tất cả trạng thái');
  const list = useMemo(() => t.list.filter(x => (status === 'Tất cả trạng thái' || x.status === status) && (!q || norm(`${x.id} ${x.title} ${x.cat}`).includes(norm(q)))), [q, status]);
  return <>
      <Head title="Ticket hỗ trợ" />
      <Panel flush>
        <div className="ps-tabs">
          <button type="button" className={tab === 'list' ? 'is-active' : ''} onClick={() => setTab('list')}>Danh sách ticket</button>
          <button type="button" className={tab === 'new' ? 'is-active' : ''} onClick={() => setTab('new')}>Tạo ticket mới</button>
        </div>
        <div className="ps-tabbody">
          {tab === 'list' && <>
              <div className="ps-tstats">
                {t.stats.map(s => <div key={s.label} className="ps-tstat">
                    <span className="ps-tstat__ic"><Icon name={s.icon} size={16} /></span>
                    <strong>{s.value}</strong><span>{s.label}</span>
                  </div>)}
              </div>
              <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm kiếm ticket…" selects={[{
            label: 'Trạng thái',
            value: status,
            onChange: setStatus,
            options: t.statuses
          }]} count={list.length} total={t.list.length} onReset={() => {
            setQ('');
            setStatus('Tất cả trạng thái');
          }} />
              <DataTable columns={['Mã ticket', 'Tiêu đề', 'Danh mục', 'Trạng thái', 'Cập nhật lần cuối']} rows={list.map(x => [x.id, x.title, x.cat, <TicketTag key="s" v={x.status} />, x.updated])} />
              {!list.length && <p className="ps-muted" style={{
            padding: 12
          }}>Không tìm thấy ticket phù hợp.</p>}
              <div className="ps-listfoot"><span>Hiển thị 1 – {list.length} trong tổng số {t.list.length} ticket</span></div>
            </>}
          {tab === 'new' && <form className="ps-formgrid" onSubmit={e => e.preventDefault()}>
              <label>Danh mục
                <select>{t.categories.map(c => <option key={c}>{c}</option>)}</select>
              </label>
              <label>Mức độ ưu tiên
                <select>{['Thấp', 'Trung bình', 'Cao'].map(c => <option key={c}>{c}</option>)}</select>
              </label>
              <label className="ps-formgrid__wide">Tiêu đề<input type="text" placeholder="Mô tả ngắn gọn vấn đề" /></label>
              <label className="ps-formgrid__wide">Nội dung chi tiết<textarea rows="4" placeholder="Mô tả chi tiết, kèm mã lỗi / ảnh chụp màn hình nếu có…" /></label>
              <button type="submit" className="humg-btn humg-btn--primary">Gửi ticket</button>
            </form>}
        </div>
      </Panel>
    </>;
}
