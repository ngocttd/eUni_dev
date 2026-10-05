'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Head, ToolGrid } from "../shared.jsx";
export function PgMaterials() {
  const { pgMaterials } = useModuleData('portal-staff');
  const [q, setQ] = useState('');
  const [type, setType] = useState(pgMaterials.types[0]);
  return <>
      <Head title="Học liệu số" />
      <Panel title="Kho học liệu" icon="layers">
        <form className="ps-filter ps-filter--full" onSubmit={e => e.preventDefault()}>
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm học liệu…" />
          <select value={type} onChange={e => setType(e.target.value)}>{pgMaterials.types.map(t => <option key={t}>{t}</option>)}</select>
        </form>
        <ToolGrid items={pgMaterials.tiles} />
        <h4 className="ps-subhead">Học liệu mới nhất</h4>
        <DataTable columns={['Tên học liệu', 'Loại', 'Ngày tải']} rows={pgMaterials.latest} />
      </Panel>
    </>;
}
