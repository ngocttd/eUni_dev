'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams, Link } from '../../../../lib/router.jsx';

import { MetaBar, Panel, DataTable, NewsMini } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function JobDetailPage() {
  const { getJob, jobs } = useModuleData('life');
  const {
    id
  } = useParams();
  const j = getJob(id) || jobs.listings[0];
  return shell({
    title: j.title,
    crumbs: [{
      label: 'Đời sống',
      to: '/doi-song'
    }, {
      label: 'Việc làm – Khởi nghiệp',
      to: '/doi-song/viec-lam-khoi-nghiep'
    }, {
      label: j.title
    }],
    hero: <div className="life-jobhead">
        <MetaBar items={[{
        icon: 'briefcase',
        text: j.company
      }, {
        icon: 'map-pin',
        text: j.place
      }, {
        icon: 'clock',
        text: `Hạn nộp: ${j.deadline}`
      }]} />
        <Link to="/lien-he" className="humg-btn humg-btn--accent">Ứng tuyển ngay <Icon name="arrow-right" size={15} /></Link>
      </div>,
    sidebar: <>
        <Panel title="Thông tin tuyển dụng" icon="grid" flush>
          <DataTable columns={['Mục', 'Chi tiết']} rows={[['Công ty', j.company], ['Địa điểm', j.place], ['Hình thức', j.type], ['Mức lương', j.salary], ['Số lượng', j.quantity], ['Hạn nộp', j.deadline]]} />
        </Panel>
        <Panel title="Tin tuyển dụng khác" icon="briefcase">
          <NewsMini items={jobs.listings.filter(x => x.id !== j.id).slice(0, 4).map(x => ({
          date: x.company,
          title: x.title,
          to: `/doi-song/viec-lam-khoi-nghiep/${x.id}`
        }))} />
        </Panel>
      </>,
    children: <>
        <Panel title="Mô tả công việc" icon="briefcase">
          <p style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.75
        }}>{j.description}</p>
        </Panel>
        <Panel title="Yêu cầu ứng viên" icon="check">
          <ul className="life-check">{j.requirements.map((r, i) => <li key={i}><Icon name="check" size={14} /> {r}</li>)}</ul>
        </Panel>
        <Panel title="Quyền lợi" icon="award">
          <ul className="life-check">{j.benefits.map((b, i) => <li key={i}><Icon name="award" size={14} /> {b}</li>)}</ul>
        </Panel>
        <Panel title="Cách thức ứng tuyển" icon="file">
          <p style={{
          margin: 0,
          fontSize: 13.5,
          lineHeight: 1.7
        }}>{j.applyNote}</p>
        </Panel>
      </>
  });
}
