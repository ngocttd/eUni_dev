'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams } from '../../../../lib/router.jsx';

import { MetaBar, Panel, DataTable, NewsMini } from "../../../../shared/components/ui/page.jsx";
import { shell } from "../shared.jsx";
export function ActivityDetailPage() {
  const { getActivity, activities } = useModuleData('life');
  const {
    slug
  } = useParams();
  const a = getActivity(slug) || activities[0];
  return shell({
    title: a.title,
    crumbs: [{
      label: 'Đời sống',
      to: '/doi-song'
    }, {
      label: 'Hoạt động sinh viên',
      to: '/doi-song/hoat-dong-sinh-vien'
    }, {
      label: a.title
    }],
    hero: <MetaBar items={[{
      icon: 'calendar',
      text: a.date
    }, {
      icon: 'map-pin',
      text: a.place
    }, {
      icon: 'users',
      text: `${a.people} người tham gia`
    }]} />,
    sidebar: <>
        <Panel title="Thông tin" icon="grid" flush>
          <DataTable columns={['Mục', 'Chi tiết']} rows={[['Loại hoạt động', a.tag], ['Thời gian', a.date], ['Địa điểm', a.place], ['Đơn vị tổ chức', a.organizer]]} />
        </Panel>
        <Panel title="Hoạt động khác" icon="calendar">
          <NewsMini items={activities.filter(x => x.slug !== a.slug).slice(0, 4).map(x => ({
          date: x.date,
          title: x.title,
          to: `/doi-song/hoat-dong-sinh-vien/${x.slug}`
        }))} />
        </Panel>
      </>,
    children: <>
        <div className="humg-ph life-cover" data-ratio="16-9"><span>Ảnh hoạt động · {a.title}</span></div>
        <Panel title="Nội dung" icon="calendar">
          {a.content.map((t, i) => <p key={i} style={{
          margin: i ? '12px 0 0' : 0,
          fontSize: 14,
          lineHeight: 1.75
        }}>{t}</p>)}
        </Panel>
        <Panel title="Chương trình" icon="clock">
          <ul className="life-agenda">
            {a.agenda.map((x, i) => <li key={i}><span className="life-agenda__time">{x.time}</span><span>{x.item}</span></li>)}
          </ul>
        </Panel>
        <Panel title={`Hình ảnh (${a.gallery})`} icon="image">
          <div className="life-gallery">
            {Array.from({
            length: a.gallery
          }).map((_, i) => <span key={i} className="humg-ph" data-ratio="1-1"><span>{i + 1}</span></span>)}
          </div>
        </Panel>
      </>
  });
}
