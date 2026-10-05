'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import Icon from "../../../../shared/lib/Icon.jsx";
import { Panel, FilterBar, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import { Head, ToolGrid, norm } from "../shared.jsx";
export function PgClasses() {
  const { pgClasses, pgTerm } = useModuleData('portal-staff');
  const [term, setTerm] = useState(pgClasses.terms[0]);
  const [q, setQ] = useState('');
  const list = useMemo(() => pgClasses.list.filter(c => !q || norm(`${c.code} ${c.course} ${c.group}`).includes(norm(q))), [q]);
  return <>
      <Head title="Quản lý lớp học" sub={pgTerm} right={<button type="button" className="humg-btn humg-btn--primary humg-btn--sm"><Icon name="users" size={13} /> Thêm lớp</button>} />
      <Panel title="Danh sách lớp đang giảng dạy" icon="users" flush>
        <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo mã lớp, tên học phần…" selects={[{
        label: 'Học kỳ',
        value: term,
        onChange: setTerm,
        options: pgClasses.terms
      }]} count={list.length} total={pgClasses.list.length} onReset={() => {
        setQ('');
        setTerm(pgClasses.terms[0]);
      }} />
        <DataTable columns={['STT', 'Mã lớp', 'Tên học phần', 'Lớp', 'Sĩ số', 'Học kỳ', 'Thao tác']} rows={list.map((c, i) => [String(i + 1), c.code, c.course, c.group, c.size, c.term, <button key="a" type="button" className="humg-btn humg-btn--ghost humg-btn--sm"><Icon name="users" size={13} /> Mở lớp</button>])} />
      </Panel>
      <Panel title="Công cụ quản lý lớp" icon="grid"><ToolGrid items={pgClasses.tools} /></Panel>
      <Panel title="Thông báo lớp học" icon="bell" action={<Link to="/euni/giang-vien/thong-bao" className="humg-link-more">Xem tất cả <Icon name="arrow-right" size={13} /></Link>}>
        <ul className="ps-notice">
          {pgClasses.notices.map(n => <li key={n.title}><span>{n.date}</span><p>{n.title}</p></li>)}
        </ul>
      </Panel>
    </>;
}
