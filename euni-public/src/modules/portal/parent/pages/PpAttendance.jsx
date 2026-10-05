'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { useState } from "react";
import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Head, Tag } from "../shared.jsx";
export function PpAttendance() {
  const { ppAttendance } = useModuleData('portal-parent');
  const a = ppAttendance;
  const [term, setTerm] = useState(a.terms[0]);
  const [subject, setSubject] = useState(a.subjects[0]);
  return <>
      <Head title="Điểm danh" right={<form className="ps-filter" onSubmit={e => e.preventDefault()}>
          <select value={term} onChange={e => setTerm(e.target.value)}>{a.terms.map(t => <option key={t}>{t}</option>)}</select>
          <select value={subject} onChange={e => setSubject(e.target.value)}>{a.subjects.map(s => <option key={s}>{s}</option>)}</select>
        </form>} />
      <div className="ps-stats pp-stats4">
        {a.stats.map(s => <div key={s.label} className="ps-stat">
            <strong className={s.tone === 'ok' ? 'pp-ok' : s.tone === 'bad' ? 'pp-bad' : ''}>{s.value}</strong>
            <span>{s.label}{s.note && <em className="pp-stat__note"> ({s.note})</em>}</span>
          </div>)}
      </div>
      <Panel title="Lịch sử điểm danh" icon="check">
        <DataTable columns={['Ngày', 'Buổi', 'Nội dung', 'Trạng thái', 'Ghi chú']} rows={a.history.map(r => [r[0], r[1], r[2], <Tag key="s" v={r[3]} />, r[4]])} />
      </Panel>
    </>;
}
