'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { Panel, DocList, StepList } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, shell } from "../shared.jsx";
export function IntlLecturersPage() {
  const { intlLecturers } = useModuleData('cooperation');
  return shell({
    title: 'Giảng viên quốc tế',
    lead: intlLecturers.intro,
    crumbs: [{
      label: 'Hợp tác',
      to: '/hop-tac'
    }, {
      label: 'Giảng viên quốc tế'
    }],
    sidebar: <>
        <Panel title="Văn bản, biểu mẫu" icon="file"><DocList items={intlLecturers.docs} /></Panel>
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Hình thức tham gia" icon="users">
          <ul className="coop-deflist">
            {intlLecturers.programs.map(p => <li key={p.name}><strong>{p.name}</strong><span>{p.text}</span></li>)}
          </ul>
        </Panel>
        <Panel title="Quy trình mời chuyên gia" icon="layers"><StepList items={intlLecturers.steps} /></Panel>
        <Panel title="Quyền lợi & hỗ trợ" icon="award">
          <ul className="coop-check">{intlLecturers.benefits.map((b, i) => <li key={i}><Icon name="check" size={14} /> {b}</li>)}</ul>
        </Panel>
      </>
  });
}
