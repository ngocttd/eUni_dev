'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams } from '../../../../lib/router.jsx';

import { MetaBar, Panel, NewsMini, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function PublicationDetailPage() {
  const { getPublication, publications } = useModuleData('research');
  const {
    id
  } = useParams();
  const p = getPublication(id) || publications[0];
  return shell({
    title: p.title,
    crumbs: [{
      label: 'Nghiên cứu',
      to: '/nghien-cuu'
    }, {
      label: 'Công bố khoa học',
      to: '/nghien-cuu/cong-bo'
    }, {
      label: p.titleVi
    }],
    hero: <MetaBar items={[{
      icon: 'calendar',
      text: `Năm ${p.year}`
    }, {
      icon: 'newspaper',
      text: p.type
    }, p.quartile !== '—' ? {
      icon: 'award',
      text: p.quartile
    } : null].filter(Boolean)} />,
    sidebar: <>
        <Panel title="Tải bài báo" icon="download">
          <a href="#" className="humg-btn humg-btn--primary humg-btn--block"><Icon name="download" size={16} /> Tải PDF</a>
          <p className="res-note" style={{
          marginTop: 10
        }}>{p.downloads} lượt tải · {p.citations} lượt trích dẫn</p>
        </Panel>
        <Panel title="Công bố liên quan" icon="newspaper">
          <NewsMini items={publications.filter(x => x.id !== p.id).slice(0, 4).map(x => ({
          date: String(x.year),
          title: x.title,
          to: `/nghien-cuu/cong-bo/${x.id}`
        }))} />
        </Panel>
      </>,
    children: <>
        <Panel title="Thông tin bài báo" icon="file" flush>
          <DataTable columns={['Mục', 'Chi tiết']} rows={[['Tên tiếng Việt', p.titleVi], ['Tác giả', p.authors], ['Tạp chí / Kỷ yếu', p.journal], ['Năm', String(p.year)], ['Loại', p.type + (p.quartile !== '—' ? ` (${p.quartile})` : '')], ['DOI', p.doi], ['Impact Factor', p.impactFactor], ['Lượt trích dẫn', String(p.citations)]]} />
        </Panel>
        <Panel title="Tóm tắt (Abstract)" icon="newspaper">
          <p style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.75
        }}>{p.abstract}</p>
        </Panel>
        <Panel title="Từ khóa" icon="target">
          <div className="res-chiprow">{p.keywords.map(k => <span key={k}>{k}</span>)}</div>
        </Panel>
        <Panel title="Trích dẫn (APA)" icon="file">
          <div className="res-cite">{p.apa}</div>
        </Panel>
      </>
  });
}
