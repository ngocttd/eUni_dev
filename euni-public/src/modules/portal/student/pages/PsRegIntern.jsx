'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { useState, useMemo } from "react";
import { Panel, FilterBar, DataTable } from "../../../../shared/components/ui/page.jsx";
import { ConditionCheck, PageHead, norm } from "../shared.jsx";
export function PsRegIntern() {
  const { psRegIntern } = useModuleData('portal-student');
  const d = psRegIntern;
  const eligible = d.conditions.every(c => c.ok);
  const [q, setQ] = useState('');
  const list = useMemo(() => d.companies.filter(c => !q || norm(`${c.name} ${c.role} ${c.place}`).includes(norm(q))), [q]);
  return <>
      <PageHead title="Đăng ký thực tập doanh nghiệp" sub={d.round} />
      <Panel title="Kiểm tra điều kiện" icon="shield"><ConditionCheck items={d.conditions} /></Panel>

      <Panel title="Vị trí thực tập từ doanh nghiệp đối tác" icon="briefcase">
        <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo doanh nghiệp, vị trí, địa điểm…" count={list.length} total={d.companies.length} onReset={() => setQ('')} />
        <DataTable columns={['Doanh nghiệp', 'Vị trí', 'SL', 'Địa điểm', 'Hạn đăng ký', '']} rows={list.map(c => [c.name, c.role, String(c.slots), c.place, c.deadline, <button key="b" type="button" className="humg-btn humg-btn--primary humg-btn--sm" disabled={!eligible}>Đăng ký</button>])} />
      </Panel>

      <Panel title="Tự liên hệ doanh nghiệp" icon="user">
        <form className="ps-formgrid" onSubmit={e => e.preventDefault()}>
          <label>Tên doanh nghiệp<input type="text" disabled={!eligible} placeholder="Công ty / Tổ chức" /></label>
          <label>Vị trí thực tập<input type="text" disabled={!eligible} placeholder="VD: Lập trình viên" /></label>
          <label>Người liên hệ tại DN<input type="text" disabled={!eligible} placeholder="Họ tên · SĐT / email" /></label>
          <label>Thời gian dự kiến<input type="text" disabled={!eligible} placeholder="VD: 15/01 – 15/04/2026" /></label>
          <button type="submit" className="humg-btn humg-btn--primary" disabled={!eligible}>Gửi đề nghị</button>
        </form>
      </Panel>
    </>;
}
