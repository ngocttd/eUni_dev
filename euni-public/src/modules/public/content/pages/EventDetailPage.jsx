'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams, Link } from '../../../../lib/router.jsx';

import { PageShell, MetaBar, Panel, NewsMini, ArticleBody, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
export function EventDetailPage() {
  const { getEvent, events, otherEvents } = useModuleData('content');
  const {
    slug
  } = useParams();
  const e = getEvent(slug) || events[0];
  return <PageShell eyebrow="Sự kiện" title={e.title} crumbs={[{
    label: 'Sự kiện',
    to: '/su-kien'
  }, {
    label: e.title
  }]} hero={<div className="content-articlehead">
          <MetaBar items={[{
      icon: 'calendar',
      text: e.date
    }, {
      icon: 'clock',
      text: e.time
    }, {
      icon: 'map-pin',
      text: e.place
    }]} />
          <Link to="/lien-he" className="humg-btn humg-btn--accent">Đăng ký tham dự <Icon name="arrow-right" size={15} /></Link>
        </div>} sidebar={<>
          <Panel title="Sự kiện khác" icon="calendar">
            <NewsMini items={otherEvents(e.slug).map(x => ({
        date: x.date,
        title: x.title,
        to: `/su-kien/${x.slug}`
      }))} />
          </Panel>
          <div className="humg-ph content-map" data-ratio="4-3"><span>Bản đồ · {e.place}</span></div>
        </>}>
      <div className="humg-ph content-cover" data-ratio="16-9"><span>Ảnh sự kiện · {e.title}</span></div>
      <ArticleBody blocks={e.desc} />
      <Panel title="Chương trình" icon="clock">
        <ul className="content-agenda">
          {e.agenda.map((a, i) => <li key={i}><span className="content-agenda__time">{a.time}</span><span>{a.item}</span></li>)}
        </ul>
      </Panel>
      <Panel title="Thông tin sự kiện" icon="grid" flush>
        <DataTable columns={['Mục', 'Chi tiết']} rows={[['Thời gian', `${e.date} · ${e.time}`], ['Địa điểm', e.placeFull], ['Đơn vị tổ chức', e.organizer], ['Đối tượng', e.audience], ['Liên hệ', e.contact]]} />
      </Panel>
    </PageShell>;
}
