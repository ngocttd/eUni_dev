'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel } from "../../../../shared/components/ui/page.jsx";

import { shell } from "../shared.jsx";
export function HistoryPage() {
  const { history } = useModuleData('about');
  return shell({
    title: 'Lịch sử phát triển',
    lead: 'Chặng đường 60 năm hình thành và phát triển của Trường Đại học Mỏ - Địa chất (1966 – 2026).',
    crumbs: [{
      label: 'Giới thiệu HUMG',
      to: '/gioi-thieu'
    }, {
      label: 'Lịch sử phát triển'
    }],
    children: <Panel title="Dòng thời gian" icon="clock">
        <ol className="about-timeline">
          {history.map(h => <li key={h.year}>
              <span className="about-timeline__year">{h.year}</span>
              <div className="about-timeline__card">
                <strong>{h.title}</strong>
                <p>{h.text}</p>
              </div>
            </li>)}
        </ol>
      </Panel>
  });
}
