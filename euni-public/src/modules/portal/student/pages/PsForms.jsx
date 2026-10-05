'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { PageHead, norm } from "../shared.jsx";
export function PsForms() {
  const { psForms } = useModuleData('portal-student');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Tất cả loại');
  const list = useMemo(() => psForms.list.filter(f => (cat === 'Tất cả loại' || f.category === cat) && (!q || norm(f.name).includes(norm(q)))), [q, cat]);
  return <>
      <PageHead title="Biểu mẫu" />
      <Panel title="Danh sách biểu mẫu" icon="layers">
        <form className="ps-filter ps-filter--full" onSubmit={e => e.preventDefault()}>
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm biểu mẫu…" />
          <select value={cat} onChange={e => setCat(e.target.value)}>{psForms.categories.map(c => <option key={c}>{c}</option>)}</select>
        </form>
        <DataTable columns={['#', 'Tên biểu mẫu', 'Loại', 'Định dạng', 'Tải về']} rows={list.map((f, i) => [String(i + 1), f.name, f.category, f.format, <button key="d" type="button" className="ps-dl" aria-label={`Tải ${f.name}`}><Icon name="download" size={14} /></button>])} />
      </Panel>
      <Panel title="Đơn từ của tôi" icon="file">
        <DataTable columns={['Mã đơn', 'Biểu mẫu', 'Ngày gửi', 'Trạng thái']} rows={psForms.mine} />
      </Panel>
    </>;
}
