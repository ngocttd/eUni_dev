'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { LinkList, Panel, DocList, SupportCard, StatRow, StepList, NewsMini } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function PhdTrainingPage() {
  const { phdTraining } = useModuleData('research');
  return shell({
    title: 'Đào tạo Nghiên cứu sinh',
    lead: phdTraining.intro,
    crumbs: [{
      label: 'Nghiên cứu',
      to: '/nghien-cuu'
    }, {
      label: 'Nghiên cứu sinh'
    }],
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={[{
        label: 'Tuyển sinh sau đại học',
        to: '/hoc-tap/tuyen-sinh'
      }, {
        label: 'Chương trình đào tạo',
        to: '/hoc-tap/chuong-trinh-dao-tao'
      }, {
        label: 'Công bố khoa học',
        to: '/nghien-cuu/cong-bo'
      }, {
        label: 'Danh sách chuyên gia',
        to: '/nghien-cuu/chuyen-gia'
      }]} />
        <Panel title="Văn bản, biểu mẫu" icon="file"><DocList items={phdTraining.docs} /></Panel>
        <SupportCard title="Phòng Đào tạo Sau đại học" lead="Tư vấn tuyển sinh và quản lý NCS." phone="024.3838.3828" email="saudaihoc@humg.edu.vn" cta={{
        label: 'Liên hệ',
        to: '/lien-he'
      }} />
      </>,
    children: <>
        <Panel title="Số liệu đào tạo tiến sĩ" icon="award"><StatRow items={phdTraining.stats} /></Panel>
        <Panel title="Các ngành đào tạo trình độ tiến sĩ" icon="graduation">
          <div className="res-chiprow">{phdTraining.fields.map(f => <span key={f}>{f}</span>)}</div>
        </Panel>
        <Panel title="Quy trình đào tạo" icon="layers"><StepList items={phdTraining.steps} /></Panel>
        <Panel title="Thông báo" icon="bell" action={<Link to="/tin-tuc" className="humg-link-more">Xem tất cả <Icon name="arrow-right" size={14} /></Link>}>
          <NewsMini items={phdTraining.notices.map(n => ({
          ...n,
          to: '/tin-tuc'
        }))} />
        </Panel>
      </>
  });
}
