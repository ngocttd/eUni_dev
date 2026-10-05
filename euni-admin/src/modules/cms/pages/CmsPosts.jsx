'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { useState, useMemo } from "react";
import { Link } from '../../../lib/router.jsx';
import Icon from "../../../shared/lib/Icon.jsx";
import { Panel, FilterBar, DataTable, Pagination } from "../../../shared/components/ui/page.jsx";
import { cmsApi } from "../../../lib/api/cmsApi.js";
import { useAction, Notice, confirmDelete } from "../actions.jsx";
import { TrashPanel } from "../workflow.jsx";
import { Head, I18N_FILTERS, I18nBadges, PAGE_SIZE, Tag, norm } from "../shared.jsx";

/* Danh sách chỉ gồm bài user được xem (server lọc theo grant). Nút Sửa/Xóa theo allowedActions của từng bài. */
export function CmsPosts({
  preset
}) {
  const { cmsContentShortcuts, cmsPosts, cmsPostI18n, cmsPostCategories, cmsPostStatuses, cmsCan } = useModuleData('cms');
  const meta = preset ? cmsContentShortcuts[preset] : null;
  const [view, setView] = useState('list');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(meta ? meta.category : 'Tất cả danh mục');
  const [status, setStatus] = useState('Tất cả trạng thái');
  const [i18n, setI18n] = useState(I18N_FILTERS[0]);
  const [page, setPage] = useState(1);
  const act = useAction();
  const remove = p => confirmDelete(`bài viết "${p.title}" (chuyển vào thùng rác)`) && act.run(() => cmsApi.contents.remove(p.id), 'Đã chuyển bài viết vào thùng rác');
  const filtered = useMemo(() => cmsPosts.filter(p => {
    if (cat !== 'Tất cả danh mục' && p.category !== cat) return false;
    if (status !== 'Tất cả trạng thái' && p.status !== status) return false;
    if (i18n !== I18N_FILTERS[0] && (cmsPostI18n[p.id] || 'Chưa dịch') !== i18n) return false;
    if (q && !norm(`${p.title} ${p.author}`).includes(norm(q))) return false;
    return true;
  }), [cmsPosts, cmsPostI18n, q, cat, status, i18n]);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const reset = () => {
    setQ('');
    if (!meta) setCat('Tất cả danh mục');
    setStatus('Tất cả trạng thái');
    setI18n(I18N_FILTERS[0]);
    setPage(1);
  };
  return <>
      <Head title={meta ? `Bài viết · ${meta.title}` : 'Quản lý bài viết'} sub={meta ? `Lối tắt lọc nhanh theo chuyên mục ${meta.title}` : 'Soạn → gửi duyệt → xuất bản / hẹn giờ · danh sách theo phạm vi bạn được cấp quyền'} right={<>
          <span className="cms-tabs-inline">
            <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')}>Danh sách</button>
            <button type="button" className={view === 'trash' ? 'is-active' : ''} onClick={() => setView('trash')}><Icon name="x" size={12} /> Thùng rác</button>
          </span>
          {cmsCan.news?.edit && <Link to="/cms/bai-viet/moi" className="humg-btn humg-btn--primary humg-btn--sm"><Icon name="file" size={13} /> Thêm bài viết</Link>}
        </>} />
      <Notice error={act.error} notice={act.notice} />
      {view === 'trash' ? <Panel flush><TrashPanel api={cmsApi.contents} /></Panel> : <Panel flush>
        <FilterBar search={q} onSearch={v => {
        setQ(v);
        setPage(1);
      }} searchPlaceholder="Tìm kiếm tiêu đề, tác giả…" selects={[...(meta ? [] : [{
        label: 'Danh mục',
        value: cat,
        onChange: v => {
          setCat(v);
          setPage(1);
        },
        options: cmsPostCategories
      }]), {
        label: 'Trạng thái',
        value: status,
        onChange: v => {
          setStatus(v);
          setPage(1);
        },
        options: cmsPostStatuses
      }, {
        label: 'Bản dịch EN',
        value: i18n,
        onChange: v => {
          setI18n(v);
          setPage(1);
        },
        options: I18N_FILTERS
      }]} count={pageRows.length} total={filtered.length} onReset={reset} />
        <DataTable columns={['#', 'Tiêu đề', 'Danh mục', 'Đơn vị', 'Tác giả', 'Trạng thái', 'Ngôn ngữ', 'Cập nhật', 'Thao tác']} rows={pageRows.map((p, i) => [
          String((page - 1) * PAGE_SIZE + i + 1),
          <span key="t">{p.title}{p.hasPendingRevision && <em className="cms-chip" title="Có bản sửa đổi chờ duyệt">sửa đổi chờ duyệt</em>}</span>,
          p.category, p.unit, p.author, <Tag key="s" v={p.status} />, <I18nBadges key="i18n" status={cmsPostI18n[p.id] || 'Chưa dịch'} />, p.date,
          <span key="a" className="cms-rowact">
            <Link to={`/cms/bai-viet/moi/${p.id}`} className="cms-rowbtn"><Icon name={p.actions.includes('edit') ? 'file' : 'eye'} size={13} /> {p.actions.includes('edit') ? 'Sửa' : 'Xem'}</Link>
            {p.actions.includes('delete') && <button type="button" className="cms-rowbtn is-danger" onClick={() => remove(p)}><Icon name="x" size={13} /> Xóa</button>}
          </span>,
        ])} />
        {!pageRows.length && <p className="cms-empty">Không có bài viết nào khớp bộ lọc.</p>}
        <div className="cms-pagefoot">
          <span>Hiển thị {pageRows.length ? (page - 1) * PAGE_SIZE + 1 : 0} – {(page - 1) * PAGE_SIZE + pageRows.length} trong tổng số {filtered.length} bài viết</span>
          <Pagination page={page} total={pages} onChange={setPage} />
        </div>
      </Panel>}
    </>;
}
