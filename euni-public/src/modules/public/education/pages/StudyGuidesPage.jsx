'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel, DocList, TileGrid, Faq } from "../../../../shared/components/ui/page.jsx";

import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, shell } from "../shared.jsx";
export function StudyGuidesPage() {
  const { studyGuides } = useModuleData('education');
  return shell({
    title: 'Hướng dẫn học tập',
    lead: 'Quy chế, hướng dẫn đăng ký học phần, cố vấn học tập và các kênh hỗ trợ người học.',
    crumbs: [{
      label: 'Học tập',
      to: '/hoc-tap'
    }, {
      label: 'Hướng dẫn học tập'
    }],
    sidebar: <>
        <Panel title="Tài liệu hướng dẫn" icon="file"><DocList items={studyGuides.docs} /></Panel>
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Chủ đề hướng dẫn" icon="grid"><TileGrid items={studyGuides.tiles} cols={3} /></Panel>
        <Panel title="Video hướng dẫn" icon="play">
          <ul className="edu-linkrows">
            {studyGuides.videos.map(v => <li key={v.title}>
                <Link to={v.to}><span className="edu-linkrows__ic"><Icon name="play" size={14} /></span>{v.title}<Icon name="arrow-right" size={14} /></Link>
              </li>)}
          </ul>
        </Panel>
        <Panel title="Câu hỏi thường gặp" icon="headphones"><Faq items={studyGuides.faqs} /></Panel>
      </>
  });
}
