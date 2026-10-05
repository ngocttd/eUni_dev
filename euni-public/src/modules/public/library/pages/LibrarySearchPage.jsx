'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useSearchParams, Link } from '../../../../lib/router.jsx';

import { useState, useMemo } from "react";
import Icon from "../../../../shared/lib/Icon.jsx";
import { Panel, Chips, Pagination } from "../../../../shared/components/ui/page.jsx";
import { CopyState, SUPPORT, TYPE_ICON, shell } from "../shared.jsx";
export function LibrarySearchPage() {
  const { resourceTypeFacets, items, yearFacets, languageFacets } = useModuleData('library');
  const [params, setParams] = useSearchParams();
  const known = resourceTypeFacets.map(f => f.key);
  const initial = known.includes(params.get('loai')) ? params.get('loai') : 'Tất cả';
  const [type, setTypeRaw] = useState(initial);
  const setType = v => {
    setTypeRaw(v);
    const p = new URLSearchParams(params);
    if (v === 'Tất cả') p.delete('loai');else p.set('loai', v);
    setParams(p, {
      replace: true
    });
  };
  const [view, setView] = useState('list');
  const list = useMemo(() => type === 'Tất cả' ? items : items.filter(it => it.type === type), [type]);
  return shell({
    title: 'Tìm tài liệu',
    lead: 'Tra cứu mục lục trực tuyến (OPAC) và tài nguyên số của Thư viện HUMG.',
    crumbs: [{
      label: 'Thư viện',
      to: '/thu-vien'
    }, {
      label: 'Tìm tài liệu'
    }],
    hero: <div className="lib-searchhero">
        <form className="pg-search" onSubmit={e => e.preventDefault()}>
          <Icon name="search" size={18} />
          <input type="search" defaultValue="quản lý tài nguyên nước" aria-label="Từ khóa tìm kiếm" />
          <button type="submit" className="humg-btn humg-btn--primary">Tìm kiếm</button>
        </form>
        <div className="lib-filterbar">
          {[['Loại tài liệu', 'Tất cả'], ['Ngôn ngữ', 'Tất cả'], ['Năm xuất bản', 'Tất cả'], ['Khoa / Viện', 'Tất cả']].map(([lb, val]) => <label key={lb} className="lib-select">
              <span>{lb}</span>
              <select defaultValue={val}>
                <option>{val}</option>
              </select>
            </label>)}
          <button type="button" className="humg-btn humg-btn--ghost lib-morefilter">
            Thêm bộ lọc <Icon name="arrow-right" size={14} />
          </button>
        </div>
      </div>,
    sidebar: <>
        <Panel title="Thu hẹp kết quả" icon="layers" flush>
          <div className="lib-facet">
            <h4>Loại tài liệu</h4>
            <ul>
              {resourceTypeFacets.map(f => <li key={f.key}>
                  <button type="button" className={type === f.key ? 'is-active' : ''} onClick={() => setType(f.key)}>
                    <span>{f.label}</span><em>{f.count}</em>
                  </button>
                </li>)}
            </ul>
            <h4>Năm xuất bản</h4>
            <ul>
              {yearFacets.map(([y, n]) => <li key={y}><label className="lib-check"><input type="checkbox" /> <span>{y}</span><em>{n}</em></label></li>)}
            </ul>
            <h4>Ngôn ngữ</h4>
            <ul>
              {languageFacets.map(([l, n]) => <li key={l}><label className="lib-check"><input type="checkbox" /> <span>{l}</span><em>{n}</em></label></li>)}
            </ul>
          </div>
        </Panel>
        {SUPPORT}
      </>,
    children: <Panel title="Kết quả tìm kiếm" icon="search">
        <div className="lib-resulttop">
          <span>Khoảng <strong>1.256</strong> kết quả cho “quản lý tài nguyên nước”</span>
          <div className="lib-resulttop__right">
            <label className="lib-select lib-select--sm">
              <span>Sắp xếp</span>
              <select defaultValue="Liên quan nhất"><option>Liên quan nhất</option><option>Mới nhất</option><option>Cũ nhất</option></select>
            </label>
            <div className="lib-viewtoggle" role="group" aria-label="Kiểu hiển thị">
              <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="Danh sách"><Icon name="menu" size={15} /></button>
              <button type="button" className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')} aria-label="Lưới"><Icon name="grid" size={15} /></button>
            </div>
          </div>
        </div>

        <Chips options={resourceTypeFacets.map(f => ({
        key: f.key,
        label: f.label,
        count: f.count
      }))} value={type} onChange={setType} />

        <div className={`lib-results ${view === 'grid' ? 'is-grid' : ''}`}>
          {list.map(it => <article key={it.id} className="lib-result">
              <Link to={`/thu-vien/tai-lieu/${it.id}`} className="lib-result__cover humg-ph" data-ratio="3-4"><span>Ảnh bìa</span></Link>
              <div className="lib-result__body">
                <span className="lib-result__type"><Icon name={TYPE_ICON[it.type] || 'file'} size={12} /> {it.type}</span>
                <h3><Link to={`/thu-vien/tai-lieu/${it.id}`}>{it.title}</Link></h3>
                <p className="lib-result__meta">{it.authors} · {it.publisher} · {it.year} · {it.idLabel} {it.idValue}</p>
                <div className="lib-result__foot">
                  <CopyState copies={it.copies} />
                  {it.format && <span className="lib-result__fmt"><Icon name="file" size={12} /> {it.format}</span>}
                </div>
                <div className="lib-actions">
                  <Link to={`/thu-vien/tai-lieu/${it.id}`} className="humg-btn humg-btn--ghost humg-btn--sm">Xem chi tiết</Link>
                  {it.online && <Link to={`/thu-vien/tai-lieu/${it.id}`} className="humg-btn humg-btn--ghost humg-btn--sm"><Icon name="eye" size={13} /> Đọc online</Link>}
                  {it.copies && <button type="button" className="humg-btn humg-btn--primary humg-btn--sm" disabled={it.copies.available === 0}>{it.copies.available ? 'Mượn sách' : 'Đặt mượn'}</button>}
                </div>
              </div>
            </article>)}
        </div>

        <Pagination page={1} total={63} />
      </Panel>
  });
}
