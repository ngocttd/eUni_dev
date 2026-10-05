'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel } from "../../../../shared/components/ui/page.jsx";

import { crumbs, shell } from "../shared.jsx";
export function AdmTimelinePage() {
  const { admissionTimeline } = useModuleData('admissions');
  return shell({
    title: 'Thời gian tuyển sinh 2026',
    lead: 'Các mốc thời gian quan trọng trong kỳ tuyển sinh đại học chính quy năm 2026.',
    crumbs: crumbs('Thời gian tuyển sinh'),
    children: <Panel title="Lịch tuyển sinh" icon="calendar">
        <ol className="adm-timeline">
          {admissionTimeline.map(t => <li key={t.phase}>
              <span className="adm-timeline__time">{t.time}</span>
              <span className="adm-timeline__body">
                <strong>{t.phase}</strong>
                {t.note && <em>{t.note}</em>}
              </span>
            </li>)}
        </ol>
      </Panel>
  });
}
