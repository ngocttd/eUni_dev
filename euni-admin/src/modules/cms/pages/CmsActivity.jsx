'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { Panel, FilterBar, DataTable, Pagination } from "../../../shared/components/ui/page.jsx";
import { Head, norm } from "../shared.jsx";
export function CmsActivity() {
  const { cmsActivity, cmsLogTotal, cmsLogActions, cmsLogUsers } = useModuleData('cms');
  const [q, setQ] = useState('');
  const [action, setAction] = useState('Tất cả hành động');
  const [user, setUser] = useState('Tất cả người dùng');
  const list = useMemo(() => cmsActivity.filter(a => {
    if (action !== 'Tất cả hành động' && a.action !== action) return false;
    if (user !== 'Tất cả người dùng' && a.user !== user) return false;
    if (q && !norm(`${a.user} ${a.action} ${a.target} ${a.ip}`).includes(norm(q))) return false;
    return true;
  }), [q, action, user]);
  return <>
      <Head title="Nhật ký hoạt động" sub={`${cmsLogTotal} bản ghi thao tác của người dùng`} />
      <Panel flush>
        <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo người dùng, đối tượng, IP…" selects={[{
        label: 'Hành động',
        value: action,
        onChange: setAction,
        options: cmsLogActions
      }, {
        label: 'Người dùng',
        value: user,
        onChange: setUser,
        options: cmsLogUsers
      }]} count={list.length} total={cmsLogTotal} onReset={() => {
        setQ('');
        setAction('Tất cả hành động');
        setUser('Tất cả người dùng');
      }} />
        <DataTable columns={['Thời gian', 'Người dùng', 'Hành động', 'Đối tượng', 'IP']} rows={list.map(a => [a.time, a.user, <span key="t" className="cms-logaction">{a.action}</span>, a.target, a.ip])} />
        {!list.length && <p className="cms-empty">Không có nhật ký nào khớp bộ lọc.</p>}
        <div className="cms-pagefoot">
          <span>Hiển thị 1 – {list.length} trong tổng số {cmsLogTotal} nhật ký</span>
          <Pagination page={1} total={20} />
        </div>
      </Panel>
    </>;
}
