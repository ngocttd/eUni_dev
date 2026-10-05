'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import Icon from "../../../../shared/lib/Icon.jsx";
import { Panel, FilterBar, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Head, RESEARCH_TABS, Tag, norm } from "../shared.jsx";
export function PgResearch() {
  const { pgResearch, pgStaff } = useModuleData('portal-staff');
  const [tab, setTab] = useState(RESEARCH_TABS[0].key);
  const [q, setQ] = useState('');
  const active = RESEARCH_TABS.find(t => t.key === tab);
  const raw = pgResearch[active.data];
  const rows = useMemo(() => raw.filter(r => !q || norm(`${r[0]} ${r[2]} ${r[3]}`).includes(norm(q))), [raw, q]);
  return <>
      <Head title="Quản lý nghiên cứu khoa học" sub={`Hoạt động khoa học – công nghệ của ${pgStaff.displayName}`} right={<button type="button" className="humg-btn humg-btn--primary humg-btn--sm"><Icon name="flask" size={13} /> Đăng ký đề tài mới</button>} />
      <Panel flush>
        <div className="ps-tabs ps-tabs--wrap">
          {RESEARCH_TABS.map(t => <button key={t.key} type="button" className={tab === t.key ? 'is-active' : ''} onClick={() => {
          setTab(t.key);
          setQ('');
        }}>{t.label}</button>)}
        </div>
        <div className="ps-tabbody">
          <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo tên, vai trò, đơn vị…" count={rows.length} total={raw.length} onReset={() => setQ('')} />
          <DataTable columns={active.cols} rows={rows.map((r, i) => [String(i + 1), r[0], r[1], r[2], r[3], <Tag key="t" v={r[4]} />, <button key="a" type="button" className="humg-btn humg-btn--ghost humg-btn--sm"><Icon name="eye" size={13} /> Xem</button>])} />
          {!rows.length && <p className="ps-empty">Không có mục nào khớp bộ lọc.</p>}
        </div>
      </Panel>
      <Panel title="Thống kê nhanh" icon="grid">
        <div className="ps-tstats">
          {pgResearch.quickStats.map(s => <div key={s.label} className="ps-tstat">
              <strong>{s.value}</strong><span>{s.label}</span>
            </div>)}
        </div>
      </Panel>
    </>;
}
