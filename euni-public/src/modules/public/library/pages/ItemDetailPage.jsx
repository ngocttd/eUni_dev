'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams, Link } from '../../../../lib/router.jsx';

import { useState } from "react";
import { MetaBar, Panel, DataTable, NewsMini } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { CopyState, TYPE_ICON, shell } from "../shared.jsx";
export function ItemDetailPage() {
  const { getItem, items } = useModuleData('library');
  const {
    id
  } = useParams();
  const it = getItem(id) || items[0];
  const isJournal = it.type === 'Tạp chí';
  const baseTabs = isJournal ? ['Tóm tắt', 'Thông tin chi tiết', 'Trích dẫn', 'Tài liệu liên quan'] : ['Mô tả', 'Thông tin chi tiết', ...(it.toc ? ['Mục lục'] : []), 'Tài liệu liên quan'];
  const [tab, setTab] = useState(baseTabs[0]);
  const related = (it.related || []).map(getItem).filter(Boolean);
  const detailRows = [['Loại tài liệu', it.type], ['Tác giả', it.authors], ['Nhà xuất bản / Nguồn', it.publisher], ['Năm', String(it.year)], [it.idLabel, it.idValue], ['Số trang', String(it.pages)], ['Ngôn ngữ', it.language], ['Khoa / Viện', it.faculty], it.doi ? ['DOI', it.doi] : null, it.format ? ['Định dạng số', it.format] : null].filter(Boolean);
  return shell({
    title: it.title,
    crumbs: [{
      label: 'Thư viện',
      to: '/thu-vien'
    }, {
      label: 'Tìm tài liệu',
      to: '/thu-vien/tim-kiem'
    }, {
      label: 'Chi tiết tài liệu'
    }],
    hero: <MetaBar items={[{
      icon: TYPE_ICON[it.type] || 'file',
      text: it.type
    }, {
      icon: 'calendar',
      text: String(it.year)
    }, {
      icon: 'file',
      text: `${it.idLabel} ${it.idValue}`
    }]} />,
    sidebar: <>
        {isJournal ? <Panel title="Thông tin bài báo" icon="grid" flush>
            <DataTable columns={['Mục', 'Chi tiết']} rows={[['Tác giả', it.authors], ['Cơ quan', it.org || it.faculty], ['Ngôn ngữ', it.language], ['Năm xuất bản', String(it.year)], ['Số trang', String(it.pages)], ['DOI', it.doi || '—']]} />
          </Panel> : <Panel title="Thông tin mượn" icon="grid" flush>
            <DataTable columns={['Mục', 'Chi tiết']} rows={[['Vị trí', it.copies?.location || '—'], ['Ký hiệu xếp giá', it.copies?.callNumber || '—'], ['Tổng số bản', it.copies ? String(it.copies.total) : '—'], ['Bản sẵn sàng', it.copies ? String(it.copies.available) : '—']]} />
          </Panel>}
        <Panel title="Quy định mượn" icon="shield">
          <ul className="lib-check">
            <li><Icon name="check" size={14} /> Thời gian mượn 14 ngày (SV) / 30 ngày (CB–GV).</li>
            <li><Icon name="check" size={14} /> Gia hạn tối đa 02 lần nếu không có người đặt.</li>
            <li><Icon name="check" size={14} /> Phí quá hạn 1.000 đ/ngày/cuốn.</li>
          </ul>
        </Panel>
        {related.length > 0 && <Panel title="Tài liệu liên quan" icon="layers">
            <NewsMini items={related.map(r => ({
          date: r.type,
          title: r.title,
          to: `/thu-vien/tai-lieu/${r.id}`
        }))} />
          </Panel>}
      </>,
    children: <>
        <div className="lib-detailhead">
          <div className="lib-detailhead__cover humg-ph" data-ratio="3-4"><span>Ảnh bìa</span></div>
          <div className="lib-detailhead__body">
            <span className="lib-result__type"><Icon name={TYPE_ICON[it.type] || 'file'} size={12} /> {it.type}</span>
            <h2>{it.title}</h2>
            <p className="lib-detailhead__by">{it.authors}</p>
            <p className="lib-detailhead__pub">{it.publisher} · {it.year} · {it.idLabel} {it.idValue}</p>
            <div className="lib-chiprow">{it.tags.map(t => <span key={t}>{t}</span>)}</div>
            {!isJournal && <div className="lib-detailhead__avail"><CopyState copies={it.copies} />{it.copies && <span className="lib-muted"> · {it.copies.location}</span>}</div>}
            <div className="lib-actions lib-actions--lg">
              {it.online && <button type="button" className="humg-btn humg-btn--primary"><Icon name="eye" size={15} /> Đọc online{isJournal ? ' (PDF)' : ''}</button>}
              {it.copies && <button type="button" className="humg-btn humg-btn--accent" disabled={it.copies.available === 0}>{it.copies.available ? 'Mượn sách' : 'Đặt mượn'}</button>}
              <button type="button" className="humg-btn humg-btn--ghost"><Icon name="heart" size={14} /> Yêu thích</button>
              <button type="button" className="humg-btn humg-btn--ghost"><Icon name="external" size={14} /> Trích dẫn</button>
            </div>
          </div>
        </div>

        <Panel title="Chi tiết" icon="book">
          <div className="lib-tabs" role="tablist">
            {baseTabs.map(t => <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>{t}</button>)}
          </div>

          {(tab === 'Mô tả' || tab === 'Tóm tắt') && <p className="lib-prose">{it.abstract}</p>}

          {tab === 'Thông tin chi tiết' && <DataTable columns={['Trường', 'Giá trị']} rows={detailRows} />}

          {tab === 'Mục lục' && it.toc && <ul className="lib-toc">{it.toc.map((c, i) => <li key={i}><Icon name="chevron-right" size={12} /> {c}</li>)}</ul>}

          {tab === 'Trích dẫn' && <div className="lib-cite">
              <h4>APA</h4>
              <p>{it.authors} ({it.year}). <em>{it.title}</em>. {it.publisher}.</p>
              <h4>IEEE</h4>
              <p>{it.authors}, “{it.title},” {it.publisher}, {it.year}.</p>
              <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm"><Icon name="download" size={13} /> Tải tệp .ris (Zotero/EndNote)</button>
            </div>}

          {tab === 'Tài liệu liên quan' && (related.length > 0 ? <ul className="lib-favlist">
                {related.map(r => <li key={r.id}>
                    <span className="lib-fav__ic"><Icon name={TYPE_ICON[r.type] || 'file'} size={15} /></span>
                    <Link to={`/thu-vien/tai-lieu/${r.id}`}>{r.title}</Link>
                    <em>{r.type} · {r.year}</em>
                  </li>)}
              </ul> : <p className="lib-muted">Chưa có tài liệu liên quan.</p>)}
        </Panel>
      </>
  });
}
