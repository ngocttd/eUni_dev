'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import { crumbs, shell } from "../shared.jsx";
export function AdmBenchmarkPage() {
  const { admissionBenchmarks } = useModuleData('admissions');
  const [year, setYear] = useState(admissionBenchmarks.years[0]);
  const rows = admissionBenchmarks.data[year] || [];
  return shell({
    title: 'Tra cứu điểm chuẩn các năm',
    lead: `Điểm trúng tuyển theo ${admissionBenchmarks.method.toLowerCase()} các năm gần đây.`,
    crumbs: crumbs('Tra cứu điểm chuẩn'),
    children: <Panel title="Điểm chuẩn theo ngành" icon="award">
        <label className="adm-select">
          <span>Năm tuyển sinh</span>
          <select value={year} onChange={e => setYear(e.target.value)}>
            {admissionBenchmarks.years.map(y => <option key={y}>{y}</option>)}
          </select>
        </label>
        <DataTable columns={['Ngành', `Điểm chuẩn ${year} (A00)`, `Điểm chuẩn ${year} (D01)`]} rows={rows} />
        <p className="adm-muted">Điểm chuẩn mang tính tham khảo; ngưỡng nhận hồ sơ và điểm trúng tuyển chính thức công bố theo từng đợt.</p>
      </Panel>
  });
}
