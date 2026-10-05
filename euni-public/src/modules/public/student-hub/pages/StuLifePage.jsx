'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { Panel, TileGrid } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { QUICKLINKS, SUPPORT, shell } from "../shared.jsx";
export function StuLifePage() {
  const { stuLife } = useModuleData('student-hub');
  return shell({
    title: 'Đời sống & Hỗ trợ sinh viên',
    lead: stuLife.intro,
    crumbs: [{
      label: 'Sinh viên',
      to: '/sinh-vien'
    }, {
      label: 'Đời sống & Hỗ trợ sinh viên'
    }],
    sidebar: <>
        {QUICKLINKS}
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Dịch vụ & hỗ trợ" icon="heart"><TileGrid items={stuLife.tiles} cols={3} /></Panel>
        <Panel title="Cần hỗ trợ?" icon="headphones">
          <p className="stu-note"><Icon name="headphones" size={14} /> {stuLife.note}</p>
        </Panel>
      </>
  });
}
