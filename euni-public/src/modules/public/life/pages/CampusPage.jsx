'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, shell } from "../shared.jsx";
export function CampusPage() {
  const { campus } = useModuleData('life');
  return shell({
    title: 'Campus & Cơ sở vật chất',
    lead: campus.intro,
    crumbs: [{
      label: 'Đời sống',
      to: '/doi-song'
    }, {
      label: 'Campus & Cơ sở vật chất'
    }],
    sidebar: <>
        <Panel title="Thời gian mở cửa" icon="clock" flush>
          <DataTable columns={['Khu vực', 'Giờ mở cửa']} rows={campus.hours} />
        </Panel>
        {SUPPORT}
      </>,
    children: <>
        <div className="humg-ph life-cover" data-ratio="16-9"><span>Toàn cảnh khuôn viên HUMG</span></div>
        <Panel title="Cơ sở vật chất chính" icon="building">
          <div className="life-facil">
            {campus.facilities.map(f => <div key={f.name} className="life-facil__item">
                <span className="life-facil__ic"><Icon name="check" size={15} /></span>
                <div><strong>{f.name}</strong><em>{f.desc}</em></div>
              </div>)}
          </div>
        </Panel>
        <Panel title="Vị trí" icon="map-pin">
          <div className="humg-ph life-map" data-ratio="16-9"><span>Bản đồ · {campus.address}</span></div>
        </Panel>
      </>
  });
}
