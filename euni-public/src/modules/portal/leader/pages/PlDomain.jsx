'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { useState } from "react";
import Icon from "../../../../shared/lib/Icon.jsx";
import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Filters, Head, KpiGrid } from "../shared.jsx";
export function PlDomain({
  slug
}) {
  const { plDomains, plYears, plUnits } = useModuleData('portal-leader');
  const d = plDomains[slug];
  const [year, setYear] = useState(plYears[0]);
  const [unit, setUnit] = useState(plUnits[0]);
  if (!d) return <Head title="Chuyên đề" sub="Không tìm thấy dữ liệu" />;
  return <>
      <Head title={d.title} sub="Số liệu tổng hợp theo đơn vị" right={<div className="ps-head__right">
          <Filters year={year} setYear={setYear} unit={unit} setUnit={setUnit} />
          <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm"><Icon name="download" size={13} /> Xuất báo cáo</button>
        </div>} />
      <KpiGrid items={d.stats} cols={4} />
      <Panel title={`Chi tiết theo đơn vị · ${d.title}`} icon={d.icon} flush>
        <DataTable columns={d.columns} rows={d.rows} />
      </Panel>
    </>;
}
