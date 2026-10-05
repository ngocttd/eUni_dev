'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { BarChart, Donut, Filters, Head, KpiGrid } from "../shared.jsx";
export function PlDashboard() {
  const { plYears, plTerms, plDashboard } = useModuleData('portal-leader');
  const [year, setYear] = useState(plYears[0]);
  const [term, setTerm] = useState(plTerms[1]);
  const d = plDashboard;
  return <>
      <Head title="Tổng quan toàn trường" sub={`Cập nhật: ${d.updatedAt}`} right={<Filters year={year} setYear={setYear} term={term} setTerm={setTerm} />} />
      <KpiGrid items={d.stats} cols={4} />

      <div className="ps-grid2">
        <Panel title="Tuyển sinh theo ngành" icon="award">
          <Donut total={d.admissionDonut.total} parts={d.admissionDonut.parts} />
        </Panel>
        <Panel title="Doanh thu theo quý (tỷ VND)" icon="file">
          <BarChart data={d.revenue.quarters} total={d.revenue.total} delta={d.revenue.delta} />
        </Panel>
      </div>

      <div className="ps-grid2">
        <Panel title="Cảnh báo & Thông báo" icon="bell" action={<Link to="/euni/lanh-dao/canh-bao" className="humg-link-more">Xem tất cả <Icon name="arrow-right" size={13} /></Link>}>
          <ul className="pl-alertlist">
            {d.alerts.map(a => <li key={a.text} className={a.urgent ? 'is-urgent' : ''}>
                <Icon name={a.urgent ? 'bell' : 'clock'} size={14} /> {a.text}
              </li>)}
          </ul>
        </Panel>
        <Panel title="Hoạt động gần đây" icon="clock">
          <ul className="ps-notice">
            {d.activity.map(a => <li key={a.text}><p>{a.text}</p><span>{a.time}</span></li>)}
          </ul>
        </Panel>
      </div>
    </>;
}
