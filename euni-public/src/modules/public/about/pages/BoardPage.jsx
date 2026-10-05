'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel } from "../../../../shared/components/ui/page.jsx";

import { PersonCard, shell } from "../shared.jsx";
export function BoardPage() {
  const { board } = useModuleData('about');
  return shell({
    title: 'Ban Giám hiệu',
    crumbs: [{
      label: 'Giới thiệu HUMG',
      to: '/gioi-thieu'
    }, {
      label: 'Ban Giám hiệu'
    }],
    children: <>
        <Panel title="Hiệu trưởng" icon="user"><PersonCard p={board.rector} big /></Panel>
        <Panel title="Các Phó Hiệu trưởng" icon="users">
          <div className="about-people">
            {board.vices.map(v => <PersonCard key={v.name} p={v} />)}
          </div>
        </Panel>
      </>
  });
}
