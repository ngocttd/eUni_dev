'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Head, Stats, Tag, norm } from "../shared.jsx";
export function PgStudents() {
  const { pgStudents } = useModuleData('portal-staff');
  const [group, setGroup] = useState(pgStudents.groups[0]);
  const [q, setQ] = useState('');
  const list = useMemo(() => pgStudents.list.filter(r => !q || norm(`${r[0]} ${r[1]} ${r[2]}`).includes(norm(q))), [q]);
  return <>
      <Head title="Sinh viên" right={<form className="ps-filter" onSubmit={e => e.preventDefault()}>
          <select value={group} onChange={e => setGroup(e.target.value)}>{pgStudents.groups.map(g => <option key={g}>{g}</option>)}</select>
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm sinh viên…" />
        </form>} />
      <Stats items={pgStudents.stats} four />
      <Panel title={`Danh sách sinh viên · ${group}`} icon="user" flush>
        <DataTable columns={['MSSV', 'Họ và tên', 'Lớp', 'Email', 'Trạng thái']} rows={list.map(r => [r[0], r[1], r[2], r[3], <Tag key="t" v={r[4]} />])} />
      </Panel>
    </>;
}
