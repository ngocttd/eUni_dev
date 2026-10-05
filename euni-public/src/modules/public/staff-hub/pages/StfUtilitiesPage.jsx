'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { Panel, TileGrid } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { QUICKLINKS, SUPPORT, shell } from "../shared.jsx";
export function StfUtilitiesPage() {
  const { stfUtilities } = useModuleData('staff-hub');
  return shell({
    title: 'Tiện ích cán bộ',
    lead: stfUtilities.intro,
    crumbs: [{
      label: 'Giảng viên / Cán bộ',
      to: '/giang-vien'
    }, {
      label: 'Tiện ích cán bộ'
    }],
    sidebar: <>
        {QUICKLINKS}
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Tiện ích nội bộ" icon="grid"><TileGrid items={stfUtilities.tiles} cols={3} /></Panel>
        <Panel title="Liên kết ngoài" icon="external">
          <div className="stf-extlinks">
            {stfUtilities.external.map(l => <a key={l.label} href={l.href} className="stf-extlink" target="_blank" rel="noreferrer">
                <Icon name="external" size={13} /> {l.label}
              </a>)}
          </div>
        </Panel>
      </>
  });
}
