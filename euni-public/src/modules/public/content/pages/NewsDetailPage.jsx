'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams, Link } from '../../../../lib/router.jsx';

import { PageShell, MetaBar, ShareBar, Panel, NewsMini, LinkList, ArticleBody } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
export function NewsDetailPage() {
  const { getArticle, articles, relatedArticles } = useModuleData('content');
  const {
    slug
  } = useParams();
  const a = getArticle(slug) || articles[0];
  return <PageShell eyebrow={a.category} title={a.title} crumbs={[{
    label: 'Tin tức & Sự kiện',
    to: '/tin-tuc'
  }, {
    label: a.title
  }]} hero={<div className="content-articlehead">
          <MetaBar items={[{
      icon: 'calendar',
      text: a.date
    }, {
      icon: 'grid',
      text: `${a.views.toLocaleString('vi-VN')} lượt xem`
    }, {
      icon: 'building',
      text: a.unit
    }]} />
          <ShareBar />
        </div>} sidebar={<>
          <Panel title="Tin tức liên quan" icon="newspaper">
            <NewsMini items={relatedArticles(a.slug).map(x => ({
        date: x.date,
        title: x.title,
        to: `/tin-tuc/${x.slug}`
      }))} />
          </Panel>
          <LinkList title="Chủ đề nổi bật" items={['Đào tạo & Tuyển sinh', 'Nghiên cứu khoa học', 'Hợp tác quốc tế', 'Hoạt động sinh viên'].map(l => ({
      label: l,
      to: '/tin-tuc'
    }))} />
        </>}>
      <div className="humg-ph content-cover" data-ratio="16-9"><span>Ảnh bài viết · {a.title}</span></div>
      <ArticleBody blocks={a.body} />
      {a.docs?.length > 0 && <Panel title="Tài liệu liên quan" icon="file">
          <ul className="ui-doclist">
            {a.docs.map((d, i) => <li key={i}>
                <span className="ui-doclist__ic"><Icon name="file" size={16} /></span>
                <span className="ui-doclist__name">{d.name}<em>{d.meta}</em></span>
                <a href="#" className="ui-doclist__dl" aria-label="Tải xuống"><Icon name="download" size={16} /></a>
              </li>)}
          </ul>
        </Panel>}
      <div className="content-tags">
        <span>Tags:</span>
        {a.tags.map(t => <Link key={t} to="/tin-tuc" className="humg-tag">{t}</Link>)}
      </div>
    </PageShell>;
}
