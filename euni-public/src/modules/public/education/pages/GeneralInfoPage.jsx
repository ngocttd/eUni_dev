'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel, DocList, DataTable } from "../../../../shared/components/ui/page.jsx";

import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, shell } from "../shared.jsx";
export function GeneralInfoPage() {
  const { generalInfo } = useModuleData('education');
  return shell({
    title: 'Thông tin chung về đào tạo',
    lead: 'Các hệ đào tạo, hình thức đào tạo, quy chế học vụ, thang điểm và điều kiện tốt nghiệp.',
    crumbs: [{
      label: 'Học tập',
      to: '/hoc-tap'
    }, {
      label: 'Thông tin chung'
    }],
    sidebar: <>
        <Panel title="Văn bản, quy chế" icon="file"><DocList items={generalInfo.docs} /></Panel>
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Các hệ & hình thức đào tạo" icon="layers">
          <div className="edu-syslist">
            {generalInfo.systems.map(s => <div key={s.name} className="edu-sys">
                <span className="edu-sys__ic"><Icon name="graduation" size={16} /></span>
                <div><strong>{s.name}</strong><em>{s.desc}</em></div>
              </div>)}
          </div>
        </Panel>
        <Panel title="Thang điểm & xếp loại" icon="award" flush>
          <DataTable columns={generalInfo.grading.columns} rows={generalInfo.grading.rows} />
        </Panel>
        <Panel title="Điều kiện tốt nghiệp" icon="check">
          <ul className="edu-check">{generalInfo.graduation.map((g, i) => <li key={i}><Icon name="check" size={14} /> {g}</li>)}</ul>
        </Panel>
      </>
  });
}
