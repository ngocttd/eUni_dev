'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";
import { PageShell, HeroSearch, Panel, NewsMini, LinkList, Chips, MediaCard, Pagination } from "../../../../shared/components/ui/page.jsx";

export function MediaPage() {
  const { videos, podcasts, albums } = useModuleData('content');
  const [tab, setTab] = useState('anh');
  const tabs = [{
    key: 'anh',
    label: `Thư viện ảnh`
  }, {
    key: 'video',
    label: `Video`
  }, {
    key: 'podcast',
    label: `Podcast`
  }];
  return <PageShell eyebrow="Trang chủ" title="Media HUMG" lead="Kho hình ảnh, video và podcast về hoạt động đào tạo, nghiên cứu và đời sống tại Trường Đại học Mỏ - Địa chất." crumbs={[{
    label: 'Media HUMG'
  }]} hero={<HeroSearch placeholder="Tìm album, video, podcast…" />} sidebar={<>
          <Panel title="Xem nhiều nhất" icon="award">
            <NewsMini items={[videos[0] && {
        date: `${videos[0].views.toLocaleString('vi-VN')} lượt xem`,
        title: videos[0].title,
        to: `/media/video/${videos[0].slug}`
      }, (podcasts[2] || podcasts[0]) && {
        date: `${(podcasts[2] || podcasts[0]).plays.toLocaleString('vi-VN')} lượt nghe`,
        title: (podcasts[2] || podcasts[0]).title,
        to: `/media/podcast/${(podcasts[2] || podcasts[0]).slug}`
      }, albums[0] && {
        date: `${albums[0].count} ảnh`,
        title: albums[0].title,
        to: `/media/anh/${albums[0].slug}`
      }].filter(Boolean)} />
          </Panel>
          <LinkList title="Kênh HUMG" items={[{
      label: 'YouTube HUMG',
      external: true
    }, {
      label: 'Fanpage HUMG',
      external: true
    }, {
      label: 'Podcast trên Spotify',
      external: true
    }]} />
        </>}>
      <Chips options={tabs} value={tab} onChange={setTab} />

      {tab === 'anh' && <Panel title="Album ảnh" icon="image">
          <div className="content-mgrid">
            {albums.map(a => <MediaCard key={a.slug} to={`/media/anh/${a.slug}`} kind="album" badge="Album" title={a.title} meta={`${a.date} · ${a.count} ảnh`} />)}
          </div>
        </Panel>}
      {tab === 'video' && <Panel title="Video" icon="play">
          <div className="content-mgrid">
            {videos.map(v => <MediaCard key={v.slug} to={`/media/video/${v.slug}`} kind="video" badge={v.duration} title={v.title} meta={`${v.date} · ${v.channel}`} />)}
          </div>
        </Panel>}
      {tab === 'podcast' && <Panel title="Podcast" icon="headphones">
          <div className="content-mgrid">
            {podcasts.map(p => <MediaCard key={p.slug} to={`/media/podcast/${p.slug}`} kind="podcast" badge={p.episode} title={p.title} meta={`${p.date} · ${p.duration}`} />)}
          </div>
        </Panel>}
      <Pagination page={1} total={3} />
    </PageShell>;
}
