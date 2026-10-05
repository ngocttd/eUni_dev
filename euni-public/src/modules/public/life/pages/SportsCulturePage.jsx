'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import { SUPPORT, shell } from "../shared.jsx";
export function SportsCulturePage() {
  const { sportsCulture } = useModuleData('life');
  return shell({
    title: 'Thể thao – Văn hóa',
    lead: sportsCulture.intro,
    crumbs: [{
      label: 'Đời sống',
      to: '/doi-song'
    }, {
      label: 'Thể thao – Văn hóa'
    }],
    sidebar: SUPPORT,
    children: <>
        <Panel title="Cơ sở vật chất thể thao" icon="grid">
          <div className="life-chiprow">{sportsCulture.facilities.map(f => <span key={f}>{f}</span>)}</div>
        </Panel>
        <Panel title="Sự kiện thường niên" icon="calendar" flush>
          <DataTable columns={['Sự kiện', 'Thời gian']} rows={sportsCulture.events.map(e => [e.name, e.time])} />
        </Panel>
        <Panel title="Các đội tuyển sinh viên" icon="users">
          <div className="life-chiprow">{sportsCulture.teams.map(t => <span key={t}>{t}</span>)}</div>
        </Panel>
      </>
  });
}
