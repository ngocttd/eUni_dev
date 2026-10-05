'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { useState } from "react";
import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Head, MiniCal, TaskTag } from "../shared.jsx";
export function PgAdmin() {
  const { pgAdmin, pgTerm } = useModuleData('portal-staff');
  const a = pgAdmin;
  const [tab, setTab] = useState('nv');
  return <>
      <Head title="Công tác – Hành chính" sub={pgTerm} />
      <div className="ps-admingrid">
        <Panel flush>
          <div className="ps-tabs ps-tabs--wrap">
            <button type="button" className={tab === 'nv' ? 'is-active' : ''} onClick={() => setTab('nv')}>Nhiệm vụ</button>
            <button type="button" className={tab === 'hs' ? 'is-active' : ''} onClick={() => setTab('hs')}>Hồ sơ – Công văn</button>
            <button type="button" className={tab === 'lc' ? 'is-active' : ''} onClick={() => setTab('lc')}>Lịch công tác</button>
          </div>
          <div className="ps-tabbody">
            {tab === 'nv' && <>
                <h4 className="ps-subhead">Danh sách nhiệm vụ</h4>
                <DataTable columns={['Nhiệm vụ', 'Giao bởi', 'Hạn hoàn thành', 'Trạng thái']} rows={a.tasks.map(r => [r[0], r[1], r[2], <TaskTag key="t" v={r[3]} />])} />
                <p className="ps-muted" style={{
              marginTop: 12
            }}>Hiển thị toàn bộ {a.tasks.length} nhiệm vụ được phân công.</p>
              </>}
            {tab === 'hs' && <DataTable columns={['Số hiệu', 'Trích yếu', 'Đơn vị / Nguồn', 'Ngày', 'Trạng thái']} rows={a.docs.map(r => [r[0], r[1], r[2], r[3], <TaskTag key="t" v={r[4]} />])} />}
            {tab === 'lc' && <DataTable columns={['Ngày', 'Giờ', 'Nội dung', 'Địa điểm']} rows={a.weekEvents} />}
          </div>
        </Panel>

        <div className="ps-col">
          <Panel title="Lịch công tác tuần" icon="calendar">
            <MiniCal label={a.monthLabel} today={16} />
          </Panel>
          <Panel title={`Hôm nay – ${a.todayDate}`} icon="clock">
            <ul className="ps-agenda">
              {a.agenda.map(x => <li key={x.time}><span>{x.time}</span><div><strong>{x.title}</strong><em>{x.place}</em></div></li>)}
            </ul>
          </Panel>
        </div>
      </div>
    </>;
}
