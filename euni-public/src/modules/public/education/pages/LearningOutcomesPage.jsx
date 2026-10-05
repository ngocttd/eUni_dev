'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { LinkList, Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, shell } from "../shared.jsx";
export function LearningOutcomesPage() {
  const { programs, outcomesGeneral } = useModuleData('education');
  const [prog, setProg] = useState(programs[0].id);
  const [year, setYear] = useState(outcomesGeneral.years[0]);
  const [tab, setTab] = useState('ctdt');
  const p = programs.find(x => x.id === prog) || programs[0];
  return shell({
    title: 'Chuẩn đầu ra',
    lead: outcomesGeneral.intro,
    crumbs: [{
      label: 'Học tập',
      to: '/hoc-tap'
    }, {
      label: 'Chuẩn đầu ra'
    }],
    sidebar: <>
        <LinkList title="Chuẩn đầu ra theo ngành" items={programs.slice(0, 8).map(x => ({
        label: x.name,
        to: `/hoc-tap/chuong-trinh-dao-tao/${x.id}`
      }))} />
        {SUPPORT}
      </>,
    children: <Panel title="Chuẩn đầu ra chương trình đào tạo" icon="target">
        <form className="edu-form" onSubmit={e => e.preventDefault()}>
          <label>Chương trình đào tạo
            <select value={prog} onChange={e => setProg(e.target.value)}>
              {programs.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
          <label>Áp dụng
            <select value={year} onChange={e => setYear(e.target.value)}>
              {outcomesGeneral.years.map(y => <option key={y}>{y}</option>)}
            </select>
          </label>
          <a href="#" className="humg-btn humg-btn--ghost"><Icon name="download" size={15} /> Tải chuẩn đầu ra (PDF)</a>
        </form>

        <div className="edu-tabs">
          <button type="button" className={tab === 'ctdt' ? 'is-active' : ''} onClick={() => setTab('ctdt')}>Chuẩn đầu ra chương trình</button>
          <button type="button" className={tab === 'hp' ? 'is-active' : ''} onClick={() => setTab('hp')}>Chuẩn đầu ra học phần</button>
        </div>

        <p className="edu-muted"><strong>{p.name}</strong> · {p.faculty} · {year}</p>

        {tab === 'ctdt' && outcomesGeneral.groups.map(g => <div key={g.title} style={{
        marginTop: 14
      }}>
            <h4 className="edu-subhead"><Icon name={g.icon} size={13} /> {g.title}</h4>
            <ul className="edu-num">{g.items.map((it, i) => <li key={i}>{it}</li>)}</ul>
          </div>)}

        {tab === 'hp' && <DataTable columns={['Mã HP', 'Tên học phần', 'TC', 'PLO liên quan']} rows={outcomesGeneral.courseOutcomes.map(c => [c.code, c.name, String(c.credits), c.plo.join(', ')])} />}
      </Panel>
  });
}
