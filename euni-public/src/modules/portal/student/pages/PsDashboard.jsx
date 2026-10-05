'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { Panel } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { Donut, PageHead } from "../shared.jsx";
export function PsDashboard() {
  const { psDashboard, psStudent } = useModuleData('portal-student');
  const d = psDashboard;
  return <>
      <PageHead title={`Xin chào, ${psStudent.name} 👋`} sub={`Sinh viên · ${psStudent.faculty}`} />
      <div className="ps-stats ps-stats--4">
        {d.stats.map(s => <div key={s.label} className="ps-stat">
            <strong>{s.value}{s.unit && <i> {s.unit}</i>}</strong>
            <span>{s.label}</span>
          </div>)}
      </div>

      <div className="ps-grid2">
        <Panel title="Thông tin kỳ học hiện tại" icon="grid">
          <ul className="ps-kv">
            {d.termInfo.map(([k, v]) => <li key={k}><span>{k}</span><strong>{v}</strong></li>)}
          </ul>
        </Panel>
        <Panel title="Thông báo mới" icon="bell" action={<Link to="/euni/sinh-vien/thong-bao" className="humg-link-more">Xem tất cả <Icon name="arrow-right" size={13} /></Link>}>
          <ul className="ps-notice">
            {d.notices.map(n => <li key={n.title}><span>{n.date}</span><p>{n.title}</p></li>)}
          </ul>
        </Panel>
      </div>

      <div className="ps-grid2">
        <Panel title={`Lịch học hôm nay · ${d.today.date}`} icon="calendar" action={<Link to="/euni/sinh-vien/lich-hoc" className="humg-link-more">Xem TKB <Icon name="arrow-right" size={13} /></Link>}>
          {d.today.rows.length === 0 ? <p className="ps-muted">Hôm nay không có lịch học.</p> : d.today.rows.map(r => <div key={r.course} className="ps-todaycard">
                <span className="ps-todaycard__time">{r.time}</span>
                <div>
                  <strong>{r.course}</strong>
                  <span>Phòng {r.room} · Giảng viên: {r.lecturer}</span>
                </div>
              </div>)}
        </Panel>
        <Panel title="Tiến độ học tập" icon="target" action={<Link to="/euni/sinh-vien/tien-do-hoc-tap" className="humg-link-more">Xem chi tiết <Icon name="arrow-right" size={13} /></Link>}>
          <div className="ps-plan">
            <Donut pct={d.progress.pct} caption="Đã hoàn thành" />
            <p className="ps-muted">Bạn đã hoàn thành <strong>{d.progress.done}/{d.progress.total}</strong> tín chỉ toàn khóa.</p>
          </div>
        </Panel>
      </div>

      <Panel title="Tính năng nhanh" icon="grid">
        <div className="ps-quicklinks">
          {d.quickLinks.map(q => <Link key={q.label} to={q.to} className="ps-quicklink">
              <span className="ps-quicklink__ic"><Icon name={q.icon} size={20} /></span>
              {q.label}
            </Link>)}
        </div>
      </Panel>
    </>;
}
