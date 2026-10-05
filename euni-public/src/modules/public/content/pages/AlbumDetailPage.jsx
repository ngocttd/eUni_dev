'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams } from '../../../../lib/router.jsx';

import { useState } from "react";
import { PageShell, MetaBar, Panel, NewsMini, Lightbox } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
export function AlbumDetailPage() {
  const { getAlbum, albums } = useModuleData('content');
  const {
    slug
  } = useParams();
  const a = getAlbum(slug) || albums[0];
  const [open, setOpen] = useState(null);
  return <PageShell eyebrow="Media · Thư viện ảnh" title={a.title} crumbs={[{
    label: 'Media HUMG',
    to: '/media'
  }, {
    label: a.title
  }]} hero={<MetaBar items={[{
    icon: 'calendar',
    text: a.date
  }, {
    icon: 'image',
    text: `${a.count} ảnh`
  }]} />} sidebar={<Panel title="Album khác" icon="image">
          <NewsMini items={albums.filter(x => x.slug !== a.slug).map(x => ({
      date: `${x.count} ảnh`,
      title: x.title,
      to: `/media/anh/${x.slug}`
    }))} />
        </Panel>}>
      <Panel flush>
        <div className="content-photos">
          {a.photos.map((p, i) => <button key={i} type="button" className="content-photo" onClick={() => setOpen(i)}>
              <span className="humg-ph" data-ratio="1-1"><span>{p.label}</span></span>
              <span className="content-photo__zoom"><Icon name="search" size={16} /></span>
            </button>)}
        </div>
      </Panel>

      {open !== null && <Lightbox photos={a.photos} startIndex={open} onClose={() => setOpen(null)} />}
    </PageShell>;
}
