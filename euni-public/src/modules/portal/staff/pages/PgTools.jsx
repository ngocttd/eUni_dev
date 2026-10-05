'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel } from "../../../../shared/components/ui/page.jsx";

import Icon from "../../../../shared/lib/Icon.jsx";
import { Head, ToolGrid } from "../shared.jsx";
export function PgTools() {
  const { pgTools } = useModuleData('portal-staff');
  return <>
      <Head title="Tiện ích & E-learning" />
      <Panel title="Tiện ích" icon="grid"><ToolGrid items={pgTools.utilities} /></Panel>
      <Panel title="E-learning" icon="play">
        <div className="ps-elgrid">
          {pgTools.elearning.map(e => <a key={e.title} href={e.href || 'https://lms.humg.edu.vn'} target="_blank" rel="noreferrer" className="ps-el">
              <span className="ps-el__ic"><Icon name={e.icon} size={20} /></span>
              <strong>{e.title}</strong>
              <span>{e.desc}</span>
            </a>)}
        </div>
      </Panel>
    </>;
}
