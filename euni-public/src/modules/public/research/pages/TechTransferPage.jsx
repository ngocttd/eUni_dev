'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { LinkList, Panel, StepList, Faq } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, shell } from "../shared.jsx";
export function TechTransferPage() {
  const { techTransfer } = useModuleData('research');
  return shell({
    title: 'Chuyển giao công nghệ',
    lead: techTransfer.intro,
    crumbs: [{
      label: 'Nghiên cứu',
      to: '/nghien-cuu'
    }, {
      label: 'Chuyển giao công nghệ'
    }],
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={[{
        label: 'Phòng thí nghiệm',
        to: '/nghien-cuu/phong-thi-nghiem'
      }, {
        label: 'Nhóm nghiên cứu',
        to: '/nghien-cuu/nhom-nghien-cuu'
      }, {
        label: 'Danh sách chuyên gia',
        to: '/nghien-cuu/chuyen-gia'
      }]} />
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Quy trình chuyển giao" icon="layers"><StepList items={techTransfer.steps} /></Panel>
        <Panel title="Sản phẩm / hợp đồng tiêu biểu" icon="handshake">
          <div className="res-tt">
            {techTransfer.products.map(t => <div key={t.name} className="res-tt__item">
                <strong>{t.name}</strong>
                <span className="res-tt__value">{t.value}</span>
                <em>{t.field} · Đối tác: {t.partner} · {t.year}</em>
              </div>)}
          </div>
        </Panel>
        <Panel title="Năng lực cung cấp dịch vụ" icon="check">
          <ul className="res-check">{techTransfer.capabilities.map((c, i) => <li key={i}><Icon name="check" size={14} /> {c}</li>)}</ul>
        </Panel>
        <Panel title="Câu hỏi thường gặp" icon="headphones"><Faq items={techTransfer.faqs} /></Panel>
      </>
  });
}
