'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import Icon from "../../../../shared/lib/Icon.jsx";
import { Panel } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import { ClassStatusPill, Head } from "../shared.jsx";
export function PgDashboard() {
  const { pgDashboard, pgStaff, pgTerm } = useModuleData('portal-staff');
  const d = pgDashboard;
  return <>
      <Head title={`Xin chào, ${pgStaff.displayName} 👋`} sub={`Hôm nay là ${d.today} · ${pgTerm}`} />
      <div className="ps-stats ps-stats--4">
        {d.stats.map(s => <div key={s.label} className="ps-tstat">
            <span className="ps-tstat__ic"><Icon name={s.icon} size={16} /></span>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>)}
      </div>

      <div className="ps-grid2">
        <Panel title="Lịch giảng hôm nay" icon="calendar" action={<Link to="/euni/giang-vien/lich-giang-day" className="humg-link-more">Xem tất cả <Icon name="arrow-right" size={13} /></Link>}>
          {d.todayClasses.map(c => <div key={c.time} className="ps-todaycard">
              <span className="ps-todaycard__time">{c.time}</span>
              <div>
                <strong>{c.course} <ClassStatusPill v={c.status} /></strong>
                <span>{c.group} · Phòng {c.room}</span>
              </div>
            </div>)}
        </Panel>
        <Panel title="Thông báo mới" icon="bell" action={<Link to="/euni/giang-vien/thong-bao" className="humg-link-more">Xem tất cả <Icon name="arrow-right" size={13} /></Link>}>
          <ul className="ps-notice">
            {d.notices.map(n => <li key={n.title}><span>{n.date}</span><p>{n.title}</p></li>)}
          </ul>
        </Panel>
      </div>

      <div className="ps-grid2">
        <Panel title="Nghiên cứu khoa học" icon="flask" action={<Link to="/euni/giang-vien/nghien-cuu" className="humg-link-more">Chi tiết <Icon name="arrow-right" size={13} /></Link>}>
          <div className="ps-ministat">
            {d.research.map(s => <div key={s.label}><strong>{s.value}</strong><span>{s.label}</span></div>)}
          </div>
        </Panel>
        <Panel title="Công tác – Hành chính" icon="building" action={<Link to="/euni/giang-vien/cong-tac" className="humg-link-more">Chi tiết <Icon name="arrow-right" size={13} /></Link>}>
          <div className="ps-ministat">
            {d.admin.map(s => <div key={s.label}><strong>{s.value}</strong><span>{s.label}</span></div>)}
          </div>
        </Panel>
      </div>
    </>;
}
