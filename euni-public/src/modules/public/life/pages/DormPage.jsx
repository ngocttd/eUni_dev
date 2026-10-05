'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { Panel, SupportCard, StepList } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function DormPage() {
  const { dorm } = useModuleData('life');
  return shell({
    title: 'Ký túc xá HUMG',
    lead: dorm.intro,
    crumbs: [{
      label: 'Đời sống',
      to: '/doi-song'
    }, {
      label: 'Ký túc xá'
    }],
    sidebar: <>
        <Panel title="Thông tin nhanh" icon="grid">
          <p style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.7
        }}><strong>Phí:</strong> {dorm.fee}</p>
        </Panel>
        <SupportCard title="Ban Quản lý Ký túc xá" lead="Hỗ trợ đăng ký, nhận phòng, đời sống nội trú." phone={dorm.contact.phone} email={dorm.contact.email} cta={{
        label: 'Liên hệ',
        to: '/lien-he'
      }} />
      </>,
    children: <>
        <div className="humg-ph life-cover" data-ratio="16-9"><span>Khu ký túc xá HUMG</span></div>
        <Panel title="Các khu ký túc xá" icon="building">
          <div className="life-zones">
            {dorm.zones.map(z => <div key={z.name} className="life-zone">
                <strong>{z.name}</strong>
                <span>{z.type}</span>
                <em>{z.note}</em>
              </div>)}
          </div>
        </Panel>
        <Panel title="Tiện nghi & dịch vụ" icon="heart">
          <ul className="life-check">{dorm.amenities.map((a, i) => <li key={i}><Icon name="check" size={14} /> {a}</li>)}</ul>
        </Panel>
        <Panel title="Quy trình đăng ký ở ký túc xá" icon="layers"><StepList items={dorm.steps} /></Panel>
        <Panel title="Nội quy cơ bản" icon="shield">
          <ul className="life-check">{dorm.rules.map((r, i) => <li key={i}><Icon name="check" size={14} /> {r}</li>)}</ul>
        </Panel>
      </>
  });
}
