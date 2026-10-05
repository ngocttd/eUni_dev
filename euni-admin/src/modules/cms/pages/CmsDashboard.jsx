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
      <Head title={`Xin chào, ${cmsUser.name}!`} sub="Đây là tổng quan hoạt động của hệ thống CMS HUMG." right={<span className="cms-clock"><Icon name="clock" size={14} /> {new Date().toLocaleString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>} />

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
        <Panel title="Chờ tôi duyệt" icon="clock">
          {d.awaitingReview.length ? <ul className="cms-mini">{d.awaitingReview.map(p => <li key={`${p.type}${p.id}`}><p><Link to={p.to}>{p.title}</Link></p><span>{p.meta}</span></li>)}</ul>
            : <p className="ps-muted" style={{ margin: 0 }}>Không có nội dung nào đang chờ bạn duyệt.</p>}
        </Panel>
      </div>
    </>;
}
