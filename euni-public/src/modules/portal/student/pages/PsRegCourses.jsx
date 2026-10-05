'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { useState, useMemo } from "react";
import { Panel, FilterBar, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { ConditionCheck, PageHead, norm } from "../shared.jsx";
export function PsRegCourses() {
  const { psRegCourses } = useModuleData('portal-student');
  const d = psRegCourses;
  const eligible = d.conditions.every(c => c.ok);
  const [q, setQ] = useState('');
  const [type, setType] = useState('Tất cả');
  const [cart, setCart] = useState([]);
  const list = useMemo(() => d.offered.filter(c => (type === 'Tất cả' || c.type === type) && (!q || norm(`${c.code} ${c.name}`).includes(norm(q)))), [q, type]);
  const totalCr = cart.reduce((s, code) => s + (d.offered.find(c => c.code === code)?.credits || 0), 0);
  const toggle = code => setCart(c => c.includes(code) ? c.filter(x => x !== code) : [...c, code]);
  return <>
      <PageHead title="Đăng ký học phần" sub={d.window} />
      <Panel title="Điều kiện đăng ký" icon="shield"><ConditionCheck items={d.conditions} /></Panel>

      <Panel title="Học phần mở đăng ký" icon="book">
        <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo mã hoặc tên học phần…" selects={[{
        label: 'Loại học phần',
        value: type,
        onChange: setType,
        options: d.types
      }]} count={list.length} total={d.offered.length} onReset={() => {
        setQ('');
        setType('Tất cả');
      }} />
        <DataTable columns={['Mã HP', 'Học phần', 'TC', 'Loại', 'Nhóm', 'Lịch', 'Còn chỗ', '']} rows={list.map(c => [c.code, c.name, String(c.credits), c.type, c.group, c.schedule, c.seats > 0 ? String(c.seats) : <span key="f" className="ps-tag ps-tag--cancel">Hết chỗ</span>, <button key="b" type="button" disabled={!eligible || c.seats === 0} className={`humg-btn humg-btn--sm ${cart.includes(c.code) ? 'humg-btn--ghost' : 'humg-btn--primary'}`} onClick={() => toggle(c.code)}>{cart.includes(c.code) ? 'Bỏ chọn' : 'Chọn'}</button>])} />
      </Panel>

      <Panel title="Giỏ đăng ký" icon="check">
        {cart.length === 0 ? <p className="ps-muted">Chưa chọn học phần nào.</p> : <>
              <ul className="ps-cart">
                {cart.map(code => {
            const c = d.offered.find(x => x.code === code);
            return <li key={code}><span>{c.code} · {c.name} ({c.credits} TC)</span><button type="button" onClick={() => toggle(code)}><Icon name="x" size={13} /></button></li>;
          })}
              </ul>
              <div className="ps-payact">
                <strong>Tổng: {totalCr} / {d.maxCredits} tín chỉ</strong>
                <button type="button" className="humg-btn humg-btn--primary" disabled={!eligible || totalCr > d.maxCredits}>Xác nhận đăng ký</button>
              </div>
            </>}
      </Panel>
    </>;
}
