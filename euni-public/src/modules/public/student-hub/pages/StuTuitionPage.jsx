'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel, Chips, DataTable, StepList, TileGrid } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { QUICKLINKS, SUPPORT, shell } from "../shared.jsx";
export function StuTuitionPage() {
  const { stuTuition } = useModuleData('student-hub');
  const [tab, setTab] = useState('Học phí');
  return shell({
    title: 'Học phí & Học bổng',
    lead: stuTuition.intro,
    crumbs: [{
      label: 'Sinh viên',
      to: '/sinh-vien'
    }, {
      label: 'Học phí & Học bổng'
    }],
    sidebar: <>
        {QUICKLINKS}
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Thông tin học phí & học bổng" icon="file">
          <Chips options={stuTuition.tabs.map(t => ({
          key: t,
          label: t
        }))} value={tab} onChange={setTab} />

          {tab === 'Học phí' && <>
              <label className="stu-select">
                <span>Năm học</span>
                <select defaultValue={stuTuition.years[0]}>
                  {stuTuition.years.map(y => <option key={y}>{y}</option>)}
                </select>
              </label>
              <DataTable columns={['Khóa', 'Chương trình / Ngành', 'Học phí (VNĐ/năm)']} rows={stuTuition.tuitionRows} />
              <p className="stu-muted">Mức học phí có thể điều chỉnh theo lộ trình được duyệt; xem thông báo chính thức từng năm học.</p>
            </>}

          {tab === 'Học bổng' && <ul className="stu-deflist">
              {stuTuition.scholarships.map(s => <li key={s.name}><strong>{s.name}</strong><span>{s.desc}</span></li>)}
            </ul>}

          {tab === 'Chính sách miễn giảm' && <>
              <ul className="stu-check">
                {stuTuition.waivers.map((w, i) => <li key={i}><Icon name="check" size={14} /> {w}</li>)}
              </ul>
              <h4 className="stu-subhead">Quy trình đề nghị miễn, giảm</h4>
              <StepList items={stuTuition.waiverSteps} />
            </>}
        </Panel>

        <Panel title="Thông tin thanh toán" icon="file"><TileGrid items={stuTuition.payTiles} cols={3} /></Panel>
      </>
  });
}
