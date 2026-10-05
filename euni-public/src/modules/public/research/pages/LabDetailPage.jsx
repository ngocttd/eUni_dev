'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams } from '../../../../lib/router.jsx';

import { MetaBar, SupportCard, Panel, NewsMini } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function LabDetailPage() {
  const { getLab, labs } = useModuleData('research');
  const {
    id
  } = useParams();
  const l = getLab(id) || labs[0];
  return shell({
    title: l.name,
    crumbs: [{
      label: 'Nghiên cứu',
      to: '/nghien-cuu'
    }, {
      label: 'Phòng thí nghiệm',
      to: '/nghien-cuu/phong-thi-nghiem'
    }, {
      label: l.name
    }],
    hero: <MetaBar items={[{
      icon: 'building',
      text: l.faculty
    }, {
      icon: 'user',
      text: `Phụ trách: ${l.head}`
    }]} />,
    sidebar: <>
        <SupportCard title="Đăng ký sử dụng dịch vụ" lead={`Liên hệ ${l.faculty} hoặc Phòng KHCN.`} phone="024.3838.3829" email="khcn@humg.edu.vn" cta={{
        label: 'Gửi yêu cầu',
        to: '/lien-he'
      }} />
        <Panel title="Phòng thí nghiệm khác" icon="grid">
          <NewsMini items={labs.filter(x => x.id !== l.id).slice(0, 4).map(x => ({
          date: x.faculty,
          title: x.name,
          to: `/nghien-cuu/phong-thi-nghiem/${x.id}`
        }))} />
        </Panel>
      </>,
    children: <>
        <div className="humg-ph res-cover" data-ratio="16-9"><span>Ảnh phòng thí nghiệm · {l.name}</span></div>
        <Panel title="Giới thiệu" icon="grid">
          <p style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.75
        }}>{l.desc}</p>
        </Panel>
        <Panel title="Thiết bị chính" icon="layers">
          <ul className="res-check">{l.equipment.map(x => <li key={x}><Icon name="check" size={14} /> {x}</li>)}</ul>
        </Panel>
        <Panel title="Dịch vụ cung cấp" icon="handshake">
          <ul className="res-check">{l.services.map(x => <li key={x}><Icon name="check" size={14} /> {x}</li>)}</ul>
        </Panel>
        <Panel title="Năng lực & tiêu chuẩn" icon="award">
          <ul className="res-check">
            {['Đội ngũ cán bộ được đào tạo bài bản, có kinh nghiệm', 'Quy trình thí nghiệm theo tiêu chuẩn hiện hành', 'Phục vụ đào tạo, nghiên cứu và dịch vụ cho doanh nghiệp'].map((t, i) => <li key={i}><Icon name="check" size={14} /> {t}</li>)}
          </ul>
        </Panel>
      </>
  });
}
