'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useSearchParams } from '../../../../lib/router.jsx';
import { useState, useMemo } from "react";

import { PageShell, SupportCard, Panel, ArticleRow, Pagination } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
export function SearchResultsPage() {
  const { searchAll } = useModuleData('content');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [term, setTerm] = useState(q);
  const [type, setType] = useState('Tất cả');
  const all = useMemo(() => searchAll(q), [q]);
  const types = ['Tất cả', 'Bài viết', 'Trang', 'Sự kiện', 'Tài liệu', 'Media'];
  const counts = useMemo(() => {
    const m = {
      'Tất cả': all.length
    };
    types.slice(1).forEach(t => {
      m[t] = all.filter(r => r.type === t).length;
    });
    return m;
  }, [all]);
  const results = type === 'Tất cả' ? all : all.filter(r => r.type === type);
  const submit = e => {
    e.preventDefault();
    setParams(term ? {
      q: term
    } : {});
  };
  return <PageShell eyebrow="Tìm kiếm" title="Kết quả tìm kiếm" crumbs={[{
    label: 'Kết quả tìm kiếm toàn cục'
  }]} hero={<form className="pg-search" onSubmit={submit}>
          <Icon name="search" size={18} />
          <input type="search" value={term} onChange={e => setTerm(e.target.value)} placeholder="Nhập từ khóa…" />
          <button type="submit" className="humg-btn humg-btn--primary">Tìm kiếm</button>
        </form>} sidebar={<>
          <div className="ui-linklist">
            <h3>Loại nội dung</h3>
            <ul>
              {types.map(t => <li key={t}>
                  <button type="button" className={`content-typebtn ${type === t ? 'is-active' : ''}`} onClick={() => setType(t)}>
                    <span>{t}</span><em>{counts[t] ?? 0}</em>
                  </button>
                </li>)}
            </ul>
          </div>
          <SupportCard title="Bạn cần hỗ trợ?" lead="Không tìm thấy thông tin bạn cần?" cta={{
      label: 'Liên hệ ngay',
      to: '/lien-he'
    }} />
        </>}>
      <p className="content-searchmeta">
        {q ? <>Khoảng <strong>{all.length}</strong> kết quả cho “{q}” (0,28 giây)</> : <>Nhập từ khóa để tìm kiếm trên toàn bộ cổng thông tin.</>}
      </p>
      <Panel>
        {results.length === 0 ? <p style={{
        margin: 0,
        color: 'var(--humg-text-secondary)'
      }}>Không có kết quả phù hợp.</p> : <div className="content-list">
            {results.map((r, i) => <ArticleRow key={i} to={r.to} tag={r.type} title={r.title} excerpt={r.excerpt} meta={[{
          icon: 'layers',
          text: r.meta
        }]} />)}
          </div>}
      </Panel>
      <Pagination page={1} total={Math.max(1, Math.ceil(results.length / 10))} />
    </PageShell>;
}
