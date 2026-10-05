'use client'
import NotFound from '../../../../views/NotFound.jsx';
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams } from '../../../../lib/router.jsx';

import { PageShell, MetaBar, Panel, NewsMini, ShareBar } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
export function VideoDetailPage() {
  const { getVideo, videos } = useModuleData('content');
  const {
    slug
  } = useParams();
  const v = getVideo(slug) || videos[0];
  if (!v) return <NotFound />; // trang (tenant) chưa có nội dung loại này
  return <PageShell eyebrow="Media · Video" title={v.title} crumbs={[{
    label: 'Media HUMG',
    to: '/media'
  }, {
    label: v.title
  }]} hero={<MetaBar items={[{
    icon: 'calendar',
    text: v.date
  }, {
    icon: 'play',
    text: v.channel
  }, {
    icon: 'clock',
    text: v.duration
  }, {
    icon: 'grid',
    text: `${v.views.toLocaleString('vi-VN')} lượt xem`
  }]} />} sidebar={<Panel title="Video liên quan" icon="play">
          <NewsMini items={videos.filter(x => x.slug !== v.slug).map(x => ({
      date: x.duration,
      title: x.title,
      to: `/media/video/${x.slug}`
    }))} />
        </Panel>}>
      <div className="humg-ph content-player" data-ratio="16-9">
        <span className="content-player__btn"><Icon name="play" size={28} /></span>
        <span>{v.title}</span>
      </div>
      <Panel title="Mô tả" icon="newspaper"><p style={{
        margin: 0,
        fontSize: 14,
        lineHeight: 1.7
      }}>{v.desc}</p></Panel>
      <ShareBar />
    </PageShell>;
}
