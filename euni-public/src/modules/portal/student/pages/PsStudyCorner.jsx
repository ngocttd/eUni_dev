'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { Donut, PageHead } from "../shared.jsx";
export function PsStudyCorner() {
  const { psStudyCorner, psTerm } = useModuleData('portal-student');
  const p = psStudyCorner.plan;
  return <>
      <PageHead title="Góc học tập" sub={psTerm} />
      <Panel title="Kế hoạch học tập" icon="target" action={<Link to="/euni/sinh-vien/tien-do-hoc-tap" className="humg-link-more">Chi tiết kế hoạch <Icon name="arrow-right" size={13} /></Link>}>
        <div className="ps-plan">
          <Donut pct={p.pct} caption="Đã học / tổng CT" />
          <ul className="ps-plan__list">
            <li><span>Số tín chỉ chương trình</span><strong>{p.total}</strong></li>
            <li><span>Số tín chỉ đã tích lũy</span><strong>{p.done}</strong></li>
            <li><span>Đang đăng ký học kỳ này</span><strong>{p.required}</strong></li>
            <li><span>Số tín chỉ còn lại</span><strong>{p.remain}</strong></li>
          </ul>
        </div>
      </Panel>
      <Panel title="Môn học đang học" icon="book" action={<Link to="/euni/sinh-vien/ket-qua-hoc-tap" className="humg-link-more">Tất cả môn học <Icon name="arrow-right" size={13} /></Link>}>
        <DataTable columns={['Mã HP', 'Tên học phần', 'TC', 'Giảng viên', 'Trạng thái']} rows={psStudyCorner.courses.map(c => [c.code, c.name, String(c.credits), c.lecturer, <span key="s" className="ps-tag ps-tag--run">{c.status}</span>])} />
      </Panel>
    </>;
}
