'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel } from "../../../../shared/components/ui/page.jsx";
import { Filters, Head, KpiGrid, LineChart } from "../shared.jsx";
export function PlBI() {
  const { plYears, plTerms, plUnits, plBI } = useModuleData('portal-leader');
  const [year, setYear] = useState(plYears[0]);
  const [term, setTerm] = useState(plTerms[1]);
  const [unit, setUnit] = useState(plUnits[0]);
  return <>
      <Head title="Chỉ số điều hành (BI)" sub="Bộ chỉ số điều hành theo thời gian thực" />
      <Panel title="Bộ lọc" icon="search"><Filters year={year} setYear={setYear} term={term} setTerm={setTerm} unit={unit} setUnit={setUnit} /></Panel>
      <Panel title="Chỉ số đào tạo" icon="book"><KpiGrid items={plBI.training} cols={3} /></Panel>
      <Panel title="Chỉ số nghiên cứu" icon="flask"><KpiGrid items={plBI.research} cols={3} /></Panel>
      <Panel title="Chỉ số tài chính" icon="file"><KpiGrid items={plBI.finance} cols={3} /></Panel>
      <Panel title="Xu hướng chỉ số theo thời gian" icon="grid">
        <LineChart labels={plBI.trend.labels} series={plBI.trend.series} />
      </Panel>
    </>;
}
