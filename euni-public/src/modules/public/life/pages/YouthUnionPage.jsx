'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { LinkList, SupportCard, Panel } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function YouthUnionPage() {
  const { youthUnion } = useModuleData('life');
  return shell({
    title: 'Đoàn Thanh niên – Hội Sinh viên',
    lead: youthUnion.intro,
    crumbs: [{
      label: 'Đời sống',
      to: '/doi-song'
    }, {
      label: 'Đoàn – Hội'
    }],
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={[{
        label: 'Hoạt động sinh viên',
        to: '/doi-song/hoat-dong-sinh-vien'
      }, {
        label: 'Câu lạc bộ sinh viên',
        to: '/doi-song/cau-lac-bo'
      }, {
        label: 'Thể thao – Văn hóa',
        to: '/doi-song/the-thao-van-hoa'
      }]} />
        <SupportCard title="Văn phòng Đoàn – Hội" lead="Tầng 1, Nhà A" phone={youthUnion.contact.phone} email={youthUnion.contact.email} cta={{
        label: 'Liên hệ',
        to: '/lien-he'
      }} />
      </>,
    children: <>
        <Panel title="Cơ cấu tổ chức" icon="layers">
          <ul className="life-deflist">
            {youthUnion.bodies.map(b => <li key={b.name}><strong>{b.name}</strong><span>{b.desc}</span></li>)}
          </ul>
        </Panel>
        <Panel title="Các phong trào tiêu biểu" icon="rocket">
          <ul className="life-check">{youthUnion.movements.map((m, i) => <li key={i}><Icon name="check" size={14} /> {m}</li>)}</ul>
        </Panel>
        <Panel title="Thành tích" icon="award">
          <ul className="life-check">{youthUnion.achievements.map((a, i) => <li key={i}><Icon name="award" size={14} /> {a}</li>)}</ul>
        </Panel>
      </>
  });
}
