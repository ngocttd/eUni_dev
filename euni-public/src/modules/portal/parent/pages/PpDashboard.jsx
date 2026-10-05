'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { Head, LineChart, MultiDonut } from "../shared.jsx";
export function PpDashboard() {
  const { ppDashboard, ppChild, ppParent } = useModuleData('portal-parent');
  const [year, setYear] = useState(ppDashboard.years[0]);
  const d = ppDashboard;
  const c = ppChild;
  return <>
      <Head title={`Xin chào, ${ppParent.name}! 👋`} sub={`Dưới đây là thông tin học tập của ${ppParent.child}`} right={<label className="ps-filter"><span>Năm học</span>
          <select value={year} onChange={e => setYear(e.target.value)}>{d.years.map(y => <option key={y}>{y}</option>)}</select>
        </label>} />

      <div className="pp-studentcard">
        <span className="humg-ph" data-ratio="1-1"><span>Ảnh</span></span>
        <div>
          <strong>{c.name}</strong>
          <ul>
            <li><span>MSSV</span>{c.mssv}</li>
            <li><span>Khoa</span>{c.faculty}</li>
            <li><span>Ngành</span>{c.major}</li>
            <li><span>Lớp</span>{c.class}</li>
            <li><span>Hệ đào tạo</span>{c.mode}</li>
            <li><span>Năm học</span>{c.year}</li>
          </ul>
        </div>
      </div>

      <div className="ps-stats pp-stats6">
        {d.stats.map(s => <div key={s.label} className="ps-stat">
            <strong>{s.value}{s.unit && <i> {s.unit}</i>}</strong>
            <span>{s.label}</span>
            {s.note && <em className="pp-stat__note">{s.note}</em>}
          </div>)}
      </div>

      <div className="ps-grid2">
        <Panel title="Kết quả học tập kỳ 2 (2024 – 2025)" icon="award" action={<Link className="humg-link-more" to="/euni/phu-huynh/ket-qua-hoc-tap">Xem chi tiết <Icon name="arrow-right" size={13} /></Link>}>
          <MultiDonut centerTop={d.gradeDonut.total} centerBottom="môn" parts={d.gradeDonut.parts} />
        </Panel>
        <Panel title="Điểm trung bình theo học kỳ" icon="grid" action={<Link className="humg-link-more" to="/euni/phu-huynh/ket-qua-hoc-tap">Xem toàn bộ <Icon name="arrow-right" size={13} /></Link>}>
          <LineChart labels={d.gpaTrend.labels} points={d.gpaTrend.points} />
        </Panel>
      </div>

      <Panel title="Thông báo mới nhất" icon="bell" action={<Link className="humg-link-more" to="/euni/phu-huynh/thong-bao">Xem tất cả <Icon name="arrow-right" size={13} /></Link>}>
        <ul className="ps-notice">{d.notices.map(n => <li key={n.title}><span>{n.date}</span><p>{n.title}</p></li>)}</ul>
      </Panel>
    </>;
}
