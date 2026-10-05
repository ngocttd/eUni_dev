'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { PageHead } from "../shared.jsx";
export function PsResults() {
  const { psResults, psTerm } = useModuleData('portal-student');
  const [term, setTerm] = useState(psResults.terms[0]);
  const [tab, setTab] = useState('hk');
  return <>
      <PageHead title="Kết quả học tập" sub={psTerm} />
      <Panel flush>
        <div className="ps-tabs">
          <button type="button" className={tab === 'hk' ? 'is-active' : ''} onClick={() => setTab('hk')}>Kết quả học kỳ</button>
          <button type="button" className={tab === 'tl' ? 'is-active' : ''} onClick={() => setTab('tl')}>Kết quả tích lũy</button>
        </div>
        <div className="ps-tabbody">
          {tab === 'hk' && <>
              <div className="ps-resbar">
                <label className="ps-filter"><span>Học kỳ</span>
                  <select value={term} onChange={e => setTerm(e.target.value)}>{psResults.terms.map(t => <option key={t}>{t}</option>)}</select>
                </label>
                <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm"><Icon name="download" size={13} /> Xuất PDF</button>
              </div>
              <DataTable columns={['STT', 'Mã học phần', 'Tên học phần', 'Số tín chỉ', 'Điểm chữ', 'Điểm số']} rows={psResults.courses} />
              <div className="ps-stats ps-stats--4 ps-resstats">
                {psResults.summary.map(s => <div key={s.label} className="ps-stat"><strong>{s.value}</strong><span>{s.label}</span></div>)}
              </div>
            </>}
          {tab === 'tl' && <DataTable columns={psResults.cumulative.columns} rows={psResults.cumulative.rows} />}
        </div>
      </Panel>
    </>;
}
