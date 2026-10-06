'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { Panel, FilterBar, DataTable, Pagination } from "../../../shared/components/ui/page.jsx";
import { Head, norm } from "../shared.jsx";
export function CmsActivity() {
  const { cmsActivity, cmsLogTotal, cmsLogUsers } = useModuleData('cms');
  const cmsLogActions = useMemo(() => ['Tất cả hành động', ...new Set(cmsActivity.map(a => a.action))], [cmsActivity]);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [action, setAction] = useState('Tất cả hành động');
  const [user, setUser] = useState('Tất cả người dùng');
  const list = useMemo(() => cmsActivity.filter(a => {
    if (action !== 'Tất cả hành động' && a.action !== action) return false;
    if (user !== 'Tất cả người dùng' && a.user !== user) return false;
    if (q && !norm(`${a.user} ${a.action} ${a.target} ${a.ip}`).includes(norm(q))) return false;
    return true;
  }), [cmsActivity, q, action, user]);
  const rows = list.slice((page - 1) * 20, page * 20);
  const changes = c => c ? Object.keys(c).join(', ') : '';
  return <>
      <Head title="Nhật ký hoạt động (audit)" sub={`${cmsLogTotal} bản ghi · chỉ ghi thêm, không sửa/xóa được`} />
      <Panel flush>
        <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo người dùng, đối tượng, IP…" selects={[{
        label: 'Hành động',
        value: action,
        onChange: v => { setAction(v); setPage(1); },
        options: cmsLogActions
      }, {
        label: 'Người dùng',
        value: user,
        onChange: v => { setUser(v); setPage(1); },
        options: cmsLogUsers
      }]} count={list.length} total={cmsLogTotal} onReset={() => {
        setQ('');
        setAction('Tất cả hành động');
        setUser('Tất cả người dùng');
      }} />
        <DataTable columns={['Thời gian', 'Người dùng', 'Hành động', 'Đối tượng', 'Trường thay đổi', 'IP']} rows={rows.map(a => [a.time, a.user, <span key="t" className="cms-logaction">{a.action}</span>, a.target, changes(a.changes) ? <span key="c" className="ps-muted" style={{ fontSize: 12 }} title={`Giá trị cũ → mới:\n${Object.entries(a.changes).map(([k, v]) => `${k}: ${Array.isArray(v) ? `${JSON.stringify(v[0])} → ${JSON.stringify(v[1])}` : JSON.stringify(v)}`).join('\n')}`}>{changes(a.changes)}</span>
          : <span key="c" className="ps-muted" title="Hành động này không sửa trường dữ liệu nào (vd. đăng nhập, tải tệp)">—</span>, a.ip])} />
        {!list.length && <p className="cms-empty">Không có nhật ký nào khớp bộ lọc.</p>}
        <div className="cms-pagefoot">
          <span>Hiển thị {rows.length ? (page - 1) * 20 + 1 : 0} – {(page - 1) * 20 + rows.length} trong {list.length} nhật ký</span>
          <Pagination page={page} total={Math.max(1, Math.ceil(list.length / 20))} onChange={setPage} />
        </div>
      </Panel>
    </>;
}
