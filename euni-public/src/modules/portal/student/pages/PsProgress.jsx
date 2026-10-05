'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { Panel } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { Donut, PageHead } from "../shared.jsx";
export function PsProgress() {
  const { psProgress } = useModuleData('portal-student');
  const o = psProgress.overall;
  return <>
      <PageHead title="Tiến độ học tập" sub={psProgress.program} />
      <Panel title="Tiến độ chương trình" icon="target" action={<Link to="/hoc-tap/chuong-trinh-dao-tao" className="humg-link-more">Kế hoạch chi tiết <Icon name="arrow-right" size={13} /></Link>}>
        <div className="ps-plan">
          <Donut pct={o.pct} caption="Hoàn thành" />
          <ul className="ps-plan__list">
            <li><span>Tổng số tín chỉ chương trình</span><strong>{o.total}</strong></li>
            <li><span>Đã hoàn thành</span><strong>{o.done}</strong></li>
            <li><span>Còn lại</span><strong>{o.remain}</strong></li>
          </ul>
        </div>
      </Panel>
      <Panel title="Phân bố tín chỉ" icon="grid">
        <div className="ps-bars">
          {psProgress.credits.map(c => <div key={c.label} className="ps-bar">
              <span className="ps-bar__label">{c.label}</span>
              <span className="ps-bar__track"><span style={{
              width: `${c.pct}%`
            }} /></span>
              <span className="ps-bar__val">{c.done}/{c.total} · {c.pct}%</span>
            </div>)}
        </div>
      </Panel>
      <Panel title="Việc cần làm tiếp theo" icon="check">
        <ul className="ps-check">
          {psProgress.next.map(t => <li key={t}><Icon name="check" size={14} /> {t}</li>)}
        </ul>
      </Panel>
    </>;
}
