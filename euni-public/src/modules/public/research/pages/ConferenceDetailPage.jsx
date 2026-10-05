'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams, Link } from '../../../../lib/router.jsx';

import { MetaBar, Panel, DataTable, NewsMini } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function ConferenceDetailPage() {
  const { getConference, conferences } = useModuleData('research');
  const {
    slug
  } = useParams();
  const c = getConference(slug) || conferences[0];
  return shell({
    title: c.name,
    crumbs: [{
      label: 'Nghiên cứu',
      to: '/nghien-cuu'
    }, {
      label: 'Hội nghị / Hội thảo',
      to: '/nghien-cuu/hoi-nghi-hoi-thao'
    }, {
      label: c.name
    }],
    hero: <div className="res-confhead">
        <MetaBar items={[{
        icon: 'calendar',
        text: c.date
      }, {
        icon: 'clock',
        text: c.time
      }, {
        icon: 'map-pin',
        text: c.place
      }]} />
        {c.status === 'Sắp diễn ra' && <Link to="/lien-he" className="humg-btn humg-btn--accent">Đăng ký tham dự <Icon name="arrow-right" size={15} /></Link>}
      </div>,
    sidebar: <>
        <Panel title="Thông tin" icon="grid" flush>
          <DataTable columns={['Mục', 'Chi tiết']} rows={[['Phạm vi', c.scope], ['Đơn vị tổ chức', c.organizer], ['Thời gian', `${c.date} · ${c.time}`], ['Địa điểm', c.place], ['Trạng thái', c.status]]} />
        </Panel>
        <Panel title="Sự kiện khác" icon="calendar">
          <NewsMini items={conferences.filter(x => x.slug !== c.slug).slice(0, 4).map(x => ({
          date: x.date,
          title: x.name,
          to: `/nghien-cuu/hoi-nghi-hoi-thao/${x.slug}`
        }))} />
        </Panel>
      </>,
    children: <>
        <div className="humg-ph res-cover" data-ratio="16-9"><span>Ảnh sự kiện · {c.name}</span></div>
        <Panel title="Giới thiệu" icon="calendar">
          <p style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.75
        }}>
            {c.name} là {c.scope === 'Quốc tế' ? 'hội thảo khoa học quốc tế' : 'sự kiện khoa học trong nước'} do {c.organizer} tổ chức,
            là diễn đàn để các nhà khoa học, chuyên gia và doanh nghiệp trao đổi kết quả nghiên cứu, thúc đẩy hợp tác và chuyển giao công nghệ.
          </p>
        </Panel>
        <Panel title="Các chủ đề chính" icon="target">
          <ul className="res-check">
            {['Xu hướng nghiên cứu mới trong lĩnh vực', 'Ứng dụng công nghệ số, AI và dữ liệu lớn', 'Phát triển bền vững và chuyển đổi xanh', 'Hợp tác nghiên cứu – đào tạo – doanh nghiệp'].map((t, i) => <li key={i}><Icon name="check" size={14} /> {t}</li>)}
          </ul>
        </Panel>
        <Panel title="Chương trình dự kiến" icon="clock">
          <ul className="res-agenda">
            {[{
            time: '08:00',
            item: 'Đón tiếp đại biểu & khai mạc'
          }, {
            time: '09:00',
            item: 'Báo cáo phiên toàn thể'
          }, {
            time: '10:30',
            item: 'Các phiên chuyên đề song song'
          }, {
            time: '13:30',
            item: 'Phiên poster & triển lãm'
          }, {
            time: '15:30',
            item: 'Thảo luận bàn tròn & bế mạc'
          }].map((a, i) => <li key={i}><span className="res-agenda__time">{a.time}</span><span>{a.item}</span></li>)}
          </ul>
        </Panel>
      </>
  });
}
