'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { Panel, FilterBar, DataTable, Pagination } from "../../../../shared/components/ui/page.jsx";
import { Head, norm } from "../shared.jsx";
export function PlSysLog() {
  const { plSysLog } = useModuleData('portal-leader');
  const [q, setQ] = useState('');
  const [type, setType] = useState('Tất cả');
  const rows = useMemo(() => plSysLog.rows.filter(r => {
    if (type !== 'Tất cả' && !norm(r[2]).includes(norm(type))) return false;
    if (q && !norm(`${r[1]} ${r[2]} ${r[3]}`).includes(norm(q))) return false;
    return true;
  }), [q, type]);
  return <>
      <Head title="Nhật ký hệ thống" sub={`${plSysLog.total} bản ghi thao tác`} />
      <Panel flush>
        <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo người dùng, sự kiện, IP…" selects={[{
        label: 'Loại sự kiện',
        value: type,
        onChange: setType,
        options: plSysLog.eventTypes
      }]} count={rows.length} total={plSysLog.total} onReset={() => {
        setQ('');
        setType('Tất cả');
      }} />
        <DataTable columns={['Thời gian', 'Người dùng', 'Sự kiện', 'IP / Thiết bị']} rows={rows} />
        {!rows.length && <p className="ps-empty">Không có nhật ký nào khớp bộ lọc.</p>}
        <div className="ps-listfoot">
          <span>Hiển thị 1 – {rows.length} trong tổng số {plSysLog.total} nhật ký</span>
          <Pagination page={1} total={19} />
        </div>
      </Panel>
    </>;
}
