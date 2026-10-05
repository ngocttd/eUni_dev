'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams } from '../../../../lib/router.jsx';

import { MetaBar, Panel, DataTable, SupportCard, NewsMini } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function ClubDetailPage() {
  const { getClub, clubs } = useModuleData('life');
  const {
    id
  } = useParams();
  const c = getClub(id) || clubs[0];
  return shell({
    title: c.name,
    crumbs: [{
      label: 'Đời sống',
      to: '/doi-song'
    }, {
      label: 'Câu lạc bộ sinh viên',
      to: '/doi-song/cau-lac-bo'
    }, {
      label: c.name
    }],
    hero: <MetaBar items={[{
      icon: 'target',
      text: c.category
    }, {
      icon: 'users',
      text: `${c.members} thành viên`
    }, {
      icon: 'calendar',
      text: `Thành lập ${c.founded}`
    }]} />,
    sidebar: <>
        <Panel title="Thông tin CLB" icon="grid" flush>
          <DataTable columns={['Mục', 'Chi tiết']} rows={[['Lĩnh vực', c.category], ['Chủ nhiệm', c.lead], ['Số thành viên', String(c.members)], ['Năm thành lập', String(c.founded)], ['Lịch sinh hoạt', c.schedule], ['Fanpage', c.fanpage]]} />
        </Panel>
        <SupportCard title="Tham gia CLB" lead="Liên hệ Chủ nhiệm hoặc theo dõi fanpage để biết lịch tuyển thành viên." cta={{
        label: 'Liên hệ tham gia',
        to: '/lien-he'
      }} />
        <Panel title="CLB khác" icon="target">
          <NewsMini items={clubs.filter(x => x.id !== c.id).slice(0, 5).map(x => ({
          date: x.category,
          title: x.name,
          to: `/doi-song/cau-lac-bo/${x.id}`
        }))} />
        </Panel>
      </>,
    children: <>
        <div className="humg-ph life-cover" data-ratio="16-9"><span>Hình ảnh hoạt động · {c.name}</span></div>
        <Panel title="Giới thiệu" icon="target">
          <p style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.75
        }}>{c.desc}</p>
          <p className="life-note" style={{
          marginTop: 10
        }}><Icon name="clock" size={13} /> {c.schedule}</p>
        </Panel>
        <Panel title="Hoạt động thường xuyên" icon="calendar">
          <ul className="life-check">{c.activities.map((a, i) => <li key={i}><Icon name="check" size={14} /> {a}</li>)}</ul>
        </Panel>
        <Panel title="Thành tích tiêu biểu" icon="award">
          <ul className="life-check">{c.achievements.map((a, i) => <li key={i}><Icon name="award" size={14} /> {a}</li>)}</ul>
        </Panel>
        <Panel title={`Hình ảnh (${c.gallery})`} icon="image">
          <div className="life-gallery">
            {Array.from({
            length: c.gallery
          }).map((_, i) => <span key={i} className="humg-ph" data-ratio="1-1"><span>{i + 1}</span></span>)}
          </div>
        </Panel>
      </>
  });
}
