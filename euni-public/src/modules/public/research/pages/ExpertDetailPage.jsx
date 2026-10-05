'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams, Link } from '../../../../lib/router.jsx';

import { MetaBar, Panel, DataTable, NewsMini, StatRow } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { GENERIC_EDU, shell } from "../shared.jsx";
export function ExpertDetailPage() {
  const { getExpert, experts, publications } = useModuleData('research');
  const {
    id
  } = useParams();
  const e = getExpert(id) || experts[0];
  return shell({
    title: e.name,
    crumbs: [{
      label: 'Nghiên cứu',
      to: '/nghien-cuu'
    }, {
      label: 'Danh sách chuyên gia',
      to: '/nghien-cuu/chuyen-gia'
    }, {
      label: e.name
    }],
    hero: <MetaBar items={[{
      icon: 'award',
      text: e.position
    }, {
      icon: 'building',
      text: e.faculty
    }, {
      icon: 'mail',
      text: e.email
    }]} />,
    sidebar: <>
        <Panel title="Liên hệ" icon="phone" flush>
          <DataTable columns={['Mục', 'Chi tiết']} rows={[['Đơn vị', e.faculty], ['Email', e.email], ['Điện thoại', e.phone]]} />
        </Panel>
        <Panel title="Chuyên gia khác" icon="users">
          <NewsMini items={experts.filter(x => x.id !== e.id).slice(0, 5).map(x => ({
          date: x.faculty,
          title: x.name,
          to: `/nghien-cuu/chuyen-gia/${x.id}`
        }))} />
        </Panel>
      </>,
    children: <>
        <Panel>
          <StatRow items={[{
          value: String(e.pubs),
          label: 'Công bố khoa học'
        }, {
          value: String(e.projects),
          label: 'Đề tài / dự án'
        }, {
          value: String(e.hIndex),
          label: 'Chỉ số h-index'
        }, {
          value: String(e.fields.length),
          label: 'Lĩnh vực chuyên môn'
        }]} />
        </Panel>
        <Panel title="Giới thiệu" icon="user">
          <div className="res-profile">
            <span className="res-profile__photo humg-ph" data-ratio="3-2"><span>Chân dung</span></span>
            <p style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.75
          }}>
              {e.name} hiện là {e.position.toLowerCase()} tại {e.faculty}, chuyên gia trong các lĩnh vực {e.fields.join(', ')}.
              Ông/Bà đã chủ trì và tham gia nhiều đề tài nghiên cứu các cấp, công bố hàng chục bài báo khoa học trên các tạp chí trong nước và quốc tế,
              đồng thời tham gia hướng dẫn nghiên cứu sinh và học viên cao học.
            </p>
          </div>
        </Panel>
        <Panel title="Lĩnh vực nghiên cứu" icon="target">
          <div className="res-chiprow">{e.fields.map(f => <span key={f}>{f}</span>)}</div>
        </Panel>
        <Panel title="Quá trình đào tạo" icon="graduation">
          <ul className="res-check">{GENERIC_EDU.map((x, i) => <li key={i}><Icon name="check" size={14} /> {x}</li>)}</ul>
        </Panel>
        <Panel title="Công bố tiêu biểu" icon="newspaper">
          <ul className="res-list">
            {publications.slice(0, 3).map(p => <Link key={p.id} to={`/nghien-cuu/cong-bo/${p.id}`} className="res-item">
                <span className="res-item__body"><strong>{p.title}</strong><em>{p.journal} · {p.year}</em></span>
                {p.quartile !== '—' && <span className="res-q">{p.quartile}</span>}
              </Link>)}
          </ul>
        </Panel>
      </>
  });
}
