'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { PageShell, HeroSearch, Panel, NewsMini, SupportCard, Chips, ArticleRow, Pagination } from "../../../../shared/components/ui/page.jsx";
export function NewsListPage() {
  const { categoryCounts, articles, newsCategories } = useModuleData('content');
  const [cat, setCat] = useState('Tất cả');
  const [unit, setUnit] = useState('Tất cả');
  const [sort, setSort] = useState('new');
  const counts = useMemo(categoryCounts, []);
  const units = useMemo(() => ['Tất cả', ...Array.from(new Set(articles.map(a => a.unit)))], []);
  const list = useMemo(() => {
    let l = articles.filter(a => (cat === 'Tất cả' || a.category === cat) && (unit === 'Tất cả' || a.unit === unit));
    l = [...l].sort((a, b) => sort === 'new' ? 0 : b.views - a.views);
    return l;
  }, [cat, unit, sort]);
  const chipOpts = [{
    key: 'Tất cả',
    label: 'Tất cả',
    count: counts['Tất cả']
  }, ...newsCategories.map(c => ({
    key: c,
    label: c,
    count: counts[c]
  }))];
  return <PageShell eyebrow="Trang chủ" title="Tin tức & Sự kiện" lead="Cập nhật những thông tin, hoạt động và thông báo mới nhất của Trường Đại học Mỏ - Địa chất." crumbs={[{
    label: 'Tin tức & Sự kiện'
  }]} hero={<HeroSearch placeholder="Tìm tin tức, sự kiện…" />} sidebar={<>
          <Panel title="Danh mục tin" icon="layers" flush>
            <ul className="content-catlist">
              {chipOpts.map(o => <li key={o.key}>
                  <button type="button" className={cat === o.key ? 'is-active' : ''} onClick={() => setCat(o.key)}>
                    <span>{o.label}</span><em>{o.count}</em>
                  </button>
                </li>)}
            </ul>
          </Panel>
          <Panel title="Tin nổi bật" icon="award">
            <NewsMini items={articles.slice(0, 4).map(a => ({
        date: a.date,
        title: a.title,
        to: `/tin-tuc/${a.slug}`
      }))} />
          </Panel>
          <SupportCard title="Đăng ký nhận tin" lead="Nhận bản tin mới nhất từ HUMG qua email." cta={{
      label: 'Đăng ký',
      to: '/lien-he'
    }} />
        </>}>
      <div className="content-toolbar">
        <Chips options={chipOpts} value={cat} onChange={setCat} />
        <div className="content-toolbar__right">
          <label className="content-sel">
            <span>Đơn vị</span>
            <select value={unit} onChange={e => setUnit(e.target.value)}>
              {units.map(u => <option key={u}>{u}</option>)}
            </select>
          </label>
          <label className="content-sel">
            <span>Sắp xếp</span>
            <select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="new">Mới nhất</option>
              <option value="view">Xem nhiều nhất</option>
            </select>
          </label>
        </div>
      </div>

      <Panel>
        <p className="content-count"><strong>{list.length}</strong> kết quả</p>
        <div className="content-list">
          {list.map(a => <ArticleRow key={a.slug} to={`/tin-tuc/${a.slug}`} tag={a.category} title={a.title} excerpt={a.excerpt} meta={[{
          icon: 'calendar',
          text: a.date
        }, {
          icon: 'grid',
          text: `${a.views.toLocaleString('vi-VN')} lượt xem`
        }, {
          icon: 'building',
          text: a.unit
        }]} />)}
        </div>
      </Panel>
      <Pagination page={1} total={8} />
    </PageShell>;
}
