'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import Icon from "../../../../shared/lib/Icon.jsx";
import { Panel } from "../../../../shared/components/ui/page.jsx";

import { Head } from "../shared.jsx";
export function PlReports() {
  const { plReports } = useModuleData('portal-leader');
  return <>
      <Head title="Báo cáo & Thống kê" right={<button type="button" className="humg-btn humg-btn--primary humg-btn--sm"><Icon name="file" size={13} /> Tạo báo cáo mới</button>} />
      <Panel title="Danh mục báo cáo" icon="grid">
        <div className="pl-repcat">
          {plReports.catalog.map(r => <button key={r.title} type="button" className="pl-repcard">
              <span className="pl-repcard__ic"><Icon name={r.icon} size={18} /></span>
              <strong>{r.title}</strong>
              <span>{r.desc}</span>
            </button>)}
        </div>
      </Panel>
      <Panel title="Báo cáo yêu thích" icon="award">
        <ul className="pl-favlist">
          {plReports.favorites.map(f => <li key={f[0]}>
              <Icon name="file" size={15} />
              <span className="pl-favlist__name">{f[0]}</span>
              <span className="pl-favlist__meta">{f[1]} · {f[2]}</span>
              <button type="button" aria-label="Tải xuống"><Icon name="download" size={14} /></button>
            </li>)}
        </ul>
      </Panel>
    </>;
}
