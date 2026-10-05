'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { LinkList, Panel } from "../../../../shared/components/ui/page.jsx";

import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, shell } from "../shared.jsx";
export function CampusServicesPage() {
  const { campusServices } = useModuleData('life');
  return shell({
    title: 'Dịch vụ Campus',
    lead: 'Các dịch vụ tiện ích phục vụ học tập và đời sống hằng ngày của sinh viên trong khuôn viên Trường.',
    crumbs: [{
      label: 'Đời sống',
      to: '/doi-song'
    }, {
      label: 'Dịch vụ Campus'
    }],
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={[{
        label: 'Ký túc xá',
        to: '/doi-song/ky-tuc-xa'
      }, {
        label: 'Y tế – Chăm sóc sức khỏe',
        to: '/doi-song/y-te'
      }, {
        label: 'Hỗ trợ sinh viên',
        to: '/doi-song/ho-tro-sinh-vien'
      }]} />
        {SUPPORT}
      </>,
    children: <Panel title="Các dịch vụ trong khuôn viên" icon="grid">
        <div className="life-svc">
          {campusServices.map(s => <div key={s.title} className="life-svc__item">
              <span className="life-svc__ic"><Icon name={s.icon} size={18} /></span>
              <div>
                <strong>{s.title}</strong>
                <span>{s.desc}</span>
              </div>
            </div>)}
        </div>
      </Panel>
  });
}
