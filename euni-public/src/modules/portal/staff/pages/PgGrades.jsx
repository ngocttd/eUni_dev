'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { useState } from "react";
import { Panel, DataTable, Pagination } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { GradeTag, Head } from "../shared.jsx";
export function PgGrades() {
  const { pgGrades, pgTerm } = useModuleData('portal-staff');
  const g = pgGrades;
  const [tab, setTab] = useState('ql');
  const [term, setTerm] = useState(g.terms[0]);
  const [cls, setCls] = useState(g.classes[0]);
  return <>
      <Head title="Kết quả học tập" sub={`Quản lý điểm lớp học phần · ${pgTerm}`} />
      <Panel flush>
        <div className="ps-tabs ps-tabs--wrap">
          <button type="button" className={tab === 'ql' ? 'is-active' : ''} onClick={() => setTab('ql')}>Quản lý điểm</button>
          <button type="button" className={tab === 'np' ? 'is-active' : ''} onClick={() => setTab('np')}>Nhập điểm</button>
          <button type="button" className={tab === 'bd' ? 'is-active' : ''} onClick={() => setTab('bd')}>Bảng điểm</button>
          <button type="button" className={tab === 'tk' ? 'is-active' : ''} onClick={() => setTab('tk')}>Thống kê</button>
        </div>
        <div className="ps-tabbody">
          <div className="ps-calbar">
            <label className="ps-filter"><span>Học kỳ</span>
              <select value={term} onChange={e => setTerm(e.target.value)}>{g.terms.map(t => <option key={t}>{t}</option>)}</select>
            </label>
            <label className="ps-filter"><span>Lớp học phần</span>
              <select value={cls} onChange={e => setCls(e.target.value)}>{g.classes.map(c => <option key={c}>{c}</option>)}</select>
            </label>
            <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm"><Icon name="download" size={13} /> Xuất Excel</button>
          </div>

          {tab === 'tk' ? <>
              <div className="ps-stats ps-stats--4">
                {g.stats.map(s => <div key={s.label} className="ps-stat"><strong>{s.value}</strong><span>{s.label}</span></div>)}
              </div>
              <h4 className="ps-subhead">Phân bố xếp loại</h4>
              <DataTable columns={['Xếp loại', 'Số lượng', 'Tỷ lệ']} rows={[['Giỏi', '18', '40.0%'], ['Khá', '20', '44.4%'], ['Trung bình', '5', '11.1%'], ['Yếu / Không đạt', '2', '4.4%']]} />
            </> : <>
              <DataTable columns={g.columns} rows={g.rows.map(r => [...r.slice(0, 8), <GradeTag key="x" v={r[8]} />])} />
              <div className="ps-listfoot">
                <span>Hiển thị 1 – {g.rows.length} trong tổng số {g.total} sinh viên</span>
                <Pagination page={1} total={9} />
              </div>
              {tab === 'np' && <div className="ps-payact">
                  <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm">Nhập từ file Excel</button>
                  <button type="button" className="humg-btn humg-btn--primary humg-btn--sm">Lưu bảng điểm</button>
                </div>}
              <div className="ps-stats ps-stats--4" style={{
            marginTop: 16
          }}>
                {g.stats.map(s => <div key={s.label} className="ps-stat"><strong>{s.value}</strong><span>{s.label}</span></div>)}
              </div>
            </>}
        </div>
      </Panel>
    </>;
}
