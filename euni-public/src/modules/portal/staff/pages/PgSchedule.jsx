'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { Head, MiniCal, StaffCalendar } from "../shared.jsx";
export function PgSchedule() {
  const { pgTerm, pgSchedule, pgAdmin } = useModuleData('portal-staff');
  const [tab, setTab] = useState('tuan');
  const [wk, setWk] = useState(0);
  return <>
      <Head title="Lịch giảng dạy" sub={pgTerm} />
      <Panel flush>
        <div className="ps-tabs">
          <button type="button" className={tab === 'tuan' ? 'is-active' : ''} onClick={() => setTab('tuan')}>Theo tuần</button>
          <button type="button" className={tab === 'thang' ? 'is-active' : ''} onClick={() => setTab('thang')}>Theo tháng</button>
          <button type="button" className={tab === 'ds' ? 'is-active' : ''} onClick={() => setTab('ds')}>Danh sách</button>
        </div>
        <div className="ps-tabbody">
          {tab === 'tuan' && <>
              <div className="ps-calbar">
                <div className="ps-weeknav">
                  <button type="button" onClick={() => setWk(w => Math.max(0, w - 1))} aria-label="Tuần trước"><Icon name="chevron-left" size={16} /></button>
                  <span>{pgSchedule.weeks[wk]}</span>
                  <button type="button" onClick={() => setWk(w => Math.min(pgSchedule.weeks.length - 1, w + 1))} aria-label="Tuần sau"><Icon name="chevron-right" size={16} /></button>
                </div>
                <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={() => setWk(0)}>Hôm nay</button>
              </div>
              <StaffCalendar data={pgSchedule.timetable} />
              <div className="ps-callegend">
                <span><i className="is-giang-lt" /> Giảng lý thuyết</span>
                <span><i className="is-giang-th" /> Giảng thực hành</span>
                <span><i className="is-huong-dan" /> Hướng dẫn</span>
                <span><i className="is-khac" /> Khác</span>
              </div>
            </>}
          {tab === 'thang' && <div className="ps-monthview">
              <MiniCal label={pgAdmin.monthLabel} today={16} />
              <div>
                <h4 className="ps-subhead">Buổi giảng trong tuần</h4>
                <DataTable columns={['Ngày', 'Giờ', 'Học phần', 'Lớp', 'Phòng', 'Hình thức']} rows={pgSchedule.listView} />
              </div>
            </div>}
          {tab === 'ds' && <DataTable columns={['Ngày', 'Giờ', 'Học phần', 'Lớp', 'Phòng', 'Hình thức']} rows={pgSchedule.listView} />}
        </div>
      </Panel>
    </>;
}
