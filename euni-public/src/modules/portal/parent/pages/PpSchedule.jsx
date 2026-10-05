'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Head, Week } from "../shared.jsx";
export function PpSchedule() {
  const { ppSchedule, ppTerm } = useModuleData('portal-parent');
  const [tab, setTab] = useState('hoc');
  const [week, setWeek] = useState(ppSchedule.weeks[0]);
  return <>
      <Head title="Lịch học – Lịch thi" sub={ppTerm} />
      <Panel flush>
        <div className="ps-tabs">
          <button type="button" className={tab === 'hoc' ? 'is-active' : ''} onClick={() => setTab('hoc')}>Lịch học</button>
          <button type="button" className={tab === 'thi' ? 'is-active' : ''} onClick={() => setTab('thi')}>Lịch thi</button>
        </div>
        <div className="ps-tabbody">
          {tab === 'hoc' && <>
              <form className="ps-filter" onSubmit={e => e.preventDefault()} style={{
            marginBottom: 14
          }}>
                <span>Chọn tuần</span>
                <select value={week} onChange={e => setWeek(e.target.value)}>{ppSchedule.weeks.map(w => <option key={w}>{w}</option>)}</select>
              </form>
              <Week rows={ppSchedule.timetable} slots={ppSchedule.slots} />
            </>}
          {tab === 'thi' && <DataTable columns={['Học phần', 'Mã HP', 'Ngày thi', 'Ca thi', 'Phòng']} rows={ppSchedule.exams} />}
        </div>
      </Panel>
    </>;
}
