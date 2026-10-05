'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { Panel, TileGrid, NewsMini } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { QUICKLINKS, SUPPORT, shell } from "../shared.jsx";
export function StfResearchPage() {
  const { stfResearch } = useModuleData('staff-hub');
  return shell({
    title: 'Nghiên cứu khoa học',
    lead: stfResearch.intro,
    crumbs: [{
      label: 'Giảng viên / Cán bộ',
      to: '/giang-vien'
    }, {
      label: 'Nghiên cứu khoa học'
    }],
    sidebar: <>
        {QUICKLINKS}
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Hoạt động nghiên cứu" icon="flask"><TileGrid items={stfResearch.tiles} cols={3} /></Panel>
        <Panel title="Tin tức nghiên cứu" icon="newspaper" action={<Link to="/nghien-cuu" className="humg-link-more">Xem tất cả <Icon name="arrow-right" size={14} /></Link>}>
          <NewsMini items={stfResearch.news.map(n => ({
          ...n,
          to: '/tin-tuc'
        }))} />
        </Panel>
      </>
  });
}
