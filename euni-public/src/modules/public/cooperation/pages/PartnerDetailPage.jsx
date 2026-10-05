'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams, Link } from '../../../../lib/router.jsx';

import { MetaBar, Panel, DataTable, NewsMini } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function PartnerDetailPage() {
  const { getPartner, partners } = useModuleData('cooperation');
  const {
    id
  } = useParams();
  const p = getPartner(id) || partners[0];
  return shell({
    title: p.name,
    crumbs: [{
      label: 'Hợp tác',
      to: '/hop-tac'
    }, {
      label: 'Danh sách đối tác',
      to: '/hop-tac/doi-tac'
    }, {
      label: p.name
    }],
    hero: <MetaBar items={[{
      icon: p.type === 'Quốc tế' ? 'globe' : 'map-pin',
      text: p.country
    }, {
      icon: 'building',
      text: p.category
    }, {
      icon: 'calendar',
      text: `Hợp tác từ ${p.since}`
    }]} />,
    sidebar: <>
        <Panel title="Thông tin đối tác" icon="grid" flush>
          <DataTable columns={['Mục', 'Chi tiết']} rows={[['Quốc gia', p.country], ['Loại hình', p.category], ['Thiết lập quan hệ', String(p.since)], ['MOU gần nhất', String(p.mou)]]} />
        </Panel>
        <Panel title="Đối tác khác" icon="handshake">
          <NewsMini items={partners.filter(x => x.id !== p.id).slice(0, 5).map(x => ({
          date: x.country,
          title: x.name,
          to: `/hop-tac/doi-tac/${x.id}`
        }))} />
        </Panel>
      </>,
    children: <>
        <Panel title="Giới thiệu" icon="building">
          <p style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.75
        }}>{p.desc}</p>
        </Panel>
        <Panel title="Lĩnh vực hợp tác" icon="target">
          <div className="coop-chiprow">{p.fields.map(f => <span key={f}>{f}</span>)}</div>
        </Panel>
        <Panel title="Hoạt động hợp tác" icon="layers">
          <ul className="coop-check">{p.activities.map((a, i) => <li key={i}><Icon name="check" size={14} /> {a}</li>)}</ul>
        </Panel>
        {p.programs?.length > 0 && <Panel title="Chương trình / dự án liên quan" icon="handshake">
            <ul className="coop-linkrows">
              {p.programs.map(name => <li key={name}>
                  <Link to="/hop-tac/chuong-trinh-du-an">
                    <span className="coop-linkrows__ic"><Icon name="layers" size={14} /></span>{name}<Icon name="arrow-right" size={14} />
                  </Link>
                </li>)}
            </ul>
          </Panel>}
      </>
  });
}
