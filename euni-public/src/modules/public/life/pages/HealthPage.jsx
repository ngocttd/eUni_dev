'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { Panel, DataTable, SupportCard } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function HealthPage() {
  const { health } = useModuleData('life');
  return shell({
    title: 'Y tế – Chăm sóc sức khỏe',
    lead: health.intro,
    crumbs: [{
      label: 'Đời sống',
      to: '/doi-song'
    }, {
      label: 'Y tế – Chăm sóc sức khỏe'
    }],
    sidebar: <>
        <Panel title="Giờ làm việc" icon="clock" flush>
          <DataTable columns={['Ngày', 'Giờ']} rows={health.schedule} />
        </Panel>
        <SupportCard title="Trạm Y tế HUMG" lead={`Cấp cứu: ${health.contact.emergency}`} phone={health.contact.phone} email={health.contact.email} />
      </>,
    children: <>
        <Panel title="Dịch vụ y tế" icon="shield">
          <ul className="life-check">{health.services.map((s, i) => <li key={i}><Icon name="check" size={14} /> {s}</li>)}</ul>
        </Panel>
        <Panel title="Bảo hiểm y tế sinh viên" icon="file">
          <ul className="life-check">{health.insurance.map((s, i) => <li key={i}><Icon name="check" size={14} /> {s}</li>)}</ul>
        </Panel>
      </>
  });
}
