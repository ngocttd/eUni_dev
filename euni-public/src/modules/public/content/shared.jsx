'use client'
import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from '../../../lib/router.jsx';
import Icon from '../../../shared/lib/Icon.jsx';
import { PageShell, HeroSearch, Panel, DataTable, LinkList, SupportCard, NewsMini, MetaBar, Chips, Pagination, ArticleRow, MediaCard, ShareBar, ArticleBody, Lightbox } from '../../../shared/components/ui/page.jsx';

import './content.css';

/* ============================================================ TIN TỨC ============================================================ */
export /* ============================================================ SỰ KIỆN ============================================================ */
function EventRow({
  e
}) {
  return <article className="content-event">
      <Link to={`/su-kien/${e.slug}`} className="content-event__date">
        <strong>{e.day}</strong><span>{e.month}</span>
      </Link>
      <div className="content-event__body">
        <span className="humg-tag humg-tag--accent">{e.status}</span>
        <h3><Link to={`/su-kien/${e.slug}`}>{e.title}</Link></h3>
        <MetaBar items={[{
        icon: 'clock',
        text: e.time
      }, {
        icon: 'map-pin',
        text: e.place
      }, {
        icon: 'building',
        text: e.organizer
      }]} />
      </div>
      <Link to={`/su-kien/${e.slug}`} className="humg-btn humg-btn--ghost content-event__cta">Chi tiết</Link>
    </article>;
}
