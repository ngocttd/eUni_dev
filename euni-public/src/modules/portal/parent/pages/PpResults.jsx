'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { Head, Tag } from "../shared.jsx";
export function PpResults() {
  const { ppResults } = useModuleData('portal-parent');
  const [tab, setTab] = useState('hk');
  const [term, setTerm] = useState(ppResults.terms[0]);
  return <>
      <Head title="Kết quả học tập" />
      <Panel flush>
        <div className="ps-tabs">
          <button type="button" className={tab === 'hk' ? 'is-active' : ''} onClick={() => setTab('hk')}>Theo học kỳ</button>
          <button type="button" className={tab === 'mh' ? 'is-active' : ''} onClick={() => setTab('mh')}>Theo môn học</button>
        </div>
        <div className="ps-tabbody">
          {tab === 'hk' && <>
              <div className="pp-bar">
                <label className="ps-filter"><span>Học kỳ</span>
                  <select value={term} onChange={e => setTerm(e.target.value)}>{ppResults.terms.map(t => <option key={t}>{t}</option>)}</select>
                </label>
                <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm"><Icon name="download" size={13} /> Xuất PDF</button>
              </div>
              <DataTable columns={['STT', 'Mã học phần', 'Tên học phần', 'Số tín chỉ', 'Điểm chữ', 'Điểm số']} rows={ppResults.courses} />
              <div className="ps-stats pp-stats4">
                {ppResults.summary.map(s => <div key={s.label} className="ps-stat"><strong>{s.value}</strong><span>{s.label}</span></div>)}
              </div>
            </>}
          {tab === 'mh' && <DataTable columns={ppResults.bySubject.columns} rows={ppResults.bySubject.rows.map(r => [...r.slice(0, 4), <Tag key="x" v={r[4]} />])} />}
        </div>
      </Panel>
    </>;
}
