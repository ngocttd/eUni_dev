'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { LinkList, Panel } from "../../../../shared/components/ui/page.jsx";

import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, shell } from "../shared.jsx";
export function LabsPage() {
  const { labs } = useModuleData('research');
  return shell({
    title: 'Phòng thí nghiệm',
    lead: 'Hệ thống phòng thí nghiệm phục vụ đào tạo, nghiên cứu và cung cấp dịch vụ khoa học công nghệ.',
    crumbs: [{
      label: 'Nghiên cứu',
      to: '/nghien-cuu'
    }, {
      label: 'Phòng thí nghiệm'
    }],
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={[{
        label: 'Nhóm nghiên cứu',
        to: '/nghien-cuu/nhom-nghien-cuu'
      }, {
        label: 'Chuyển giao công nghệ',
        to: '/nghien-cuu/chuyen-giao-cong-nghe'
      }, {
        label: 'Danh sách chuyên gia',
        to: '/nghien-cuu/chuyen-gia'
      }, {
        label: 'Đề tài / Dự án',
        to: '/nghien-cuu/de-tai'
      }]} />
        {SUPPORT}
      </>,
    children: <div className="res-labs">
        {labs.map(l => <Panel key={l.id} title={l.name} icon="grid" action={<Link to={`/nghien-cuu/phong-thi-nghiem/${l.id}`} className="humg-link-more">Chi tiết <Icon name="arrow-right" size={14} /></Link>}>
            <p className="res-lead" style={{
          marginTop: 0
        }}>{l.desc}</p>
            <p className="res-note"><Icon name="user" size={13} /> Phụ trách: {l.head} · {l.faculty}</p>
            <div className="res-labcols">
              <div>
                <h4>Thiết bị chính</h4>
                <ul className="res-check">{l.equipment.map(x => <li key={x}><Icon name="check" size={13} /> {x}</li>)}</ul>
              </div>
              <div>
                <h4>Dịch vụ</h4>
                <ul className="res-check">{l.services.map(x => <li key={x}><Icon name="check" size={13} /> {x}</li>)}</ul>
              </div>
            </div>
          </Panel>)}
      </div>
  });
}
