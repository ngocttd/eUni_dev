'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Head, Tag, ToolGrid } from "../shared.jsx";
export function PgModules() {
  const { pgClasses, pgTerm, pgModules } = useModuleData('portal-staff');
  const [term, setTerm] = useState(pgClasses.terms[0]);
  return <>
      <Head title="Quản lý học phần" sub={pgTerm} right={<label className="ps-filter"><span>Học kỳ</span>
          <select value={term} onChange={e => setTerm(e.target.value)}>{pgClasses.terms.map(t => <option key={t}>{t}</option>)}</select>
        </label>} />
      <Panel title="Danh sách học phần" icon="book" flush>
        <DataTable columns={['Mã HP', 'Học phần', 'Số TC', 'Số lớp', 'Trạng thái']} rows={pgModules.list.map(m => [m.code, m.course, String(m.credits), String(m.groups), <Tag key="t" v={m.status} />])} />
      </Panel>
      <Panel title="Công cụ học phần" icon="grid"><ToolGrid items={pgModules.tools} /></Panel>
    </>;
}
