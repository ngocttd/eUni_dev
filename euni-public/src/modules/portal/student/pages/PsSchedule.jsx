'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { CalendarGrid, PageHead } from "../shared.jsx";
export function PsSchedule() {
  const { psSchedule, psTerm } = useModuleData('portal-student');
  const [tab, setTab] = useState('tkb');
  const [term, setTerm] = useState(psSchedule.terms[0]);
  const [wk, setWk] = useState(0);
  return <>
      <PageHead title="Thời khóa biểu" sub={psTerm} />
      <Panel flush>
        <div className="ps-tabs">
          <button type="button" className={tab === 'tkb' ? 'is-active' : ''} onClick={() => setTab('tkb')}>Thời khóa biểu</button>
          <button type="button" className={tab === 'thi' ? 'is-active' : ''} onClick={() => setTab('thi')}>Lịch thi</button>
        </div>
        <div className="ps-tabbody">
          {tab === 'tkb' && <>
              <div className="ps-calbar">
                <label className="ps-filter"><span>Học kỳ</span>
                  <select value={term} onChange={e => setTerm(e.target.value)}>{psSchedule.terms.map(t => <option key={t}>{t}</option>)}</select>
                </label>
                <div className="ps-weeknav">
                  <button type="button" onClick={() => setWk(w => Math.max(0, w - 1))} aria-label="Tuần trước"><Icon name="chevron-left" size={16} /></button>
                  <span>{psSchedule.weeks[wk]}</span>
                  <button type="button" onClick={() => setWk(w => Math.min(psSchedule.weeks.length - 1, w + 1))} aria-label="Tuần sau"><Icon name="chevron-right" size={16} /></button>
                </div>
                <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={() => setWk(0)}>Hôm nay</button>
              </div>
              <CalendarGrid data={psSchedule.timetable} />
              <div className="ps-callegend">
                <span><i className="is-ly-thuyet" /> Lý thuyết</span>
                <span><i className="is-thuc-hanh" /> Thực hành</span>
                <span><i className="is-tu-chon" /> Tự chọn</span>
              </div>
            </>}
          {tab === 'thi' && <DataTable columns={['Học phần', 'Mã HP', 'Ngày thi', 'Ca thi', 'Phòng', 'Hình thức']} rows={psSchedule.exams} />}
        </div>
      </Panel>
    </>;
}
