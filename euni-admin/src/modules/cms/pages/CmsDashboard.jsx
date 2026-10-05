'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import Icon from "../../../shared/lib/Icon.jsx";
import { Panel } from "../../../shared/components/ui/page.jsx";
import { Link } from '../../../lib/router.jsx';
import { Donut, Head, Spark } from "../shared.jsx";
export function CmsDashboard() {
  const { cmsDashboard, cmsUser } = useModuleData('cms');
  const d = cmsDashboard;
  return <>
      <Head title={`Xin chào, ${cmsUser.name}!`} sub="Đây là tổng quan hoạt động của hệ thống CMS HUMG." right={<span className="cms-clock"><Icon name="clock" size={14} /> Thứ Sáu, 16/05/2025 · 10:30</span>} />

      <div className="cms-stats">
        {d.stats.map(s => <div key={s.label} className="cms-stat">
            <strong>{s.value}</strong>
            <span>{s.label}</span>
            <em>{s.delta}</em>
          </div>)}
      </div>

      <div className="ps-grid2">
        <Panel title="Thống kê bài viết (30 ngày)" icon="grid"><Spark data={d.trend} /></Panel>
        <Panel title="Bài viết theo trạng thái" icon="newspaper"><Donut total={d.status.total} parts={d.status.parts} /></Panel>
      </div>

      <div className="cms-quad">
        <Panel title="Bài viết mới nhất" icon="newspaper" action={<Link to="/cms/bai-viet" className="humg-link-more">Xem danh sách <Icon name="external" size={12} /></Link>}>
          <ul className="cms-mini">{d.latestPosts.map(p => <li key={p.title}><p>{p.title}</p><span>{p.meta}</span></li>)}</ul>
        </Panel>
        <Panel title="Sự kiện sắp diễn ra" icon="calendar" action={<Link to="/cms/su-kien" className="humg-link-more">Xem danh sách <Icon name="external" size={12} /></Link>}>
          <ul className="cms-mini">{d.upcomingEvents.map(p => <li key={p.title}><p>{p.title}</p><span>{p.meta}</span></li>)}</ul>
        </Panel>
        <Panel title="Media mới" icon="image" action={<Link to="/cms/media" className="humg-link-more">Xem thư viện <Icon name="external" size={12} /></Link>}>
          <ul className="cms-mini">{d.latestMedia.map(p => <li key={p.title}><p>{p.title}</p><span>{p.meta}</span></li>)}</ul>
        </Panel>
        <Panel title="Người dùng online" icon="users">
          <div className="cms-online"><strong>{d.onlineUsers}</strong><span>người đang truy cập CMS</span></div>
        </Panel>
      </div>
    </>;
}
