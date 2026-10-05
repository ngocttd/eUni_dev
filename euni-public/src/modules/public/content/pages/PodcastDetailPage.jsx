'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams } from '../../../../lib/router.jsx';

import { PageShell, MetaBar, Panel, NewsMini, ShareBar } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
export function PodcastDetailPage() {
  const { getPodcast, podcasts } = useModuleData('content');
  const {
    slug
  } = useParams();
  const p = getPodcast(slug) || podcasts[0];
  return <PageShell eyebrow="Media · Podcast" title={p.title} crumbs={[{
    label: 'Media HUMG',
    to: '/media'
  }, {
    label: p.title
  }]} hero={<MetaBar items={[{
    icon: 'headphones',
    text: p.episode
  }, {
    icon: 'calendar',
    text: p.date
  }, {
    icon: 'clock',
    text: p.duration
  }, {
    icon: 'user',
    text: p.host
  }]} />} sidebar={<Panel title="Tập khác" icon="headphones">
          <NewsMini items={podcasts.filter(x => x.slug !== p.slug).map(x => ({
      date: x.episode,
      title: x.title,
      to: `/media/podcast/${x.slug}`
    }))} />
        </Panel>}>
      <div className="content-audio">
        <button type="button" className="content-audio__play" aria-label="Phát"><Icon name="play" size={22} /></button>
        <div className="content-audio__bar"><span style={{
          width: '32%'
        }} /></div>
        <span className="content-audio__time">10:18 / {p.duration}</span>
      </div>
      <Panel title="Nội dung tập" icon="newspaper">
        <p style={{
        marginTop: 0,
        fontSize: 14,
        lineHeight: 1.7
      }}>{p.desc}</p>
        <ul className="content-notes">
          {p.notes.map((n, i) => <li key={i}><Icon name="check" size={14} /> {n}</li>)}
        </ul>
      </Panel>
      <ShareBar />
    </PageShell>;
}
