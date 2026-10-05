'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { useState } from "react";
import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Head, Tag } from "../shared.jsx";
export function PgFinance() {
  const { pgFinance } = useModuleData('portal-staff');
  const f = pgFinance;
  const [tab, setTab] = useState('tq');
  return <>
      <Head title="Tài chính" sub={`Cập nhật đến ngày ${f.asOf}`} />
      <Panel flush>
        <div className="ps-tabs ps-tabs--wrap">
          <button type="button" className={tab === 'tq' ? 'is-active' : ''} onClick={() => setTab('tq')}>Tổng quan</button>
          <button type="button" className={tab === 'luong' ? 'is-active' : ''} onClick={() => setTab('luong')}>Bảng lương</button>
          <button type="button" className={tab === 'gio' ? 'is-active' : ''} onClick={() => setTab('gio')}>Giờ giảng</button>
          <button type="button" className={tab === 'dt' ? 'is-active' : ''} onClick={() => setTab('dt')}>Kinh phí đề tài</button>
        </div>
        <div className="ps-tabbody">
          {tab === 'tq' && <div className="ps-stats ps-stats--4">
              {f.summary.map(s => <div key={s.label} className="ps-stat"><strong>{s.value}</strong><span>{s.label}</span></div>)}
            </div>}
          {tab === 'luong' && <DataTable columns={['Kỳ lương', 'Lương cơ bản', 'Phụ cấp / Vượt giờ', 'Thực nhận', 'Trạng thái']} rows={f.payslips.map(r => [r[0], r[1], r[2], r[3], <Tag key="t" v={r[4]} />])} />}
          {tab === 'gio' && <DataTable columns={['Học kỳ', 'Giờ đã giảng', 'Định mức', 'Chênh lệch']} rows={f.teachingLoad} />}
          {tab === 'dt' && <DataTable columns={['Đề tài', 'Vai trò', 'Tổng kinh phí', 'Đã giải ngân']} rows={f.grants} />}
        </div>
      </Panel>
    </>;
}
