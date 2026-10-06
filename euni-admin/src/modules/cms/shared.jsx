'use client'
import { cmsBannerPositions, cmsI18nStatuses } from '../../config/static/cms.js'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useMemo, useState } from 'react';
import { Link, useParams } from '../../lib/router.jsx';
import Icon from '../../shared/lib/Icon.jsx';
import { Panel, DataTable, FilterBar, Pagination } from '../../shared/components/ui/page.jsx';
import './portal-student.css';
import './cms.css';

export const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
export const slugify = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export function findCat(list, name) {
  for (const c of list) {
    if (c.name === name) return c;
    if (c.children) {
      const hit = findCat(c.children, name);
      if (hit) return hit;
    }
  }
  return null;
}

/* ============================ Helpers ============================ */
export function Head({
  title,
  sub,
  right
}) {
  return <div className="ps-head">
      <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      {right && <div className="ps-head__right">{right}</div>}
    </div>;
}
export function Tag({
  v
}) {
  const s = norm(v);
  const cls = /da xuat ban|hien thi|hoat dong|thanh cong/.test(s) ? 'is-done' : /ban nhap/.test(s) ? 'is-draft' : /cho duyet|hen gio/.test(s) ? 'is-wait' : 'is-off';
  return <span className={`cms-tag ${cls}`}>{v}</span>;
}
/** Nút Sửa / Xóa trên mỗi dòng. `name` (tên bản ghi) để nhãn đọc màn hình và tooltip nói rõ đang thao tác trên dòng nào. */
export function RowActions({
  editTo,
  onEdit,
  onDelete,
  name = '',
  deleteLabel = 'Xóa'
}) {
  const soon = !editTo && !onEdit;
  const what = name ? ` “${name}”` : '';
  return <span className="cms-rowact">
      {editTo ? <Link to={editTo} className="cms-rowbtn" title={`Sửa${what}`} aria-label={`Sửa${what}`}><Icon name="edit" size={13} /> Sửa</Link> : <button type="button" className="cms-rowbtn" onClick={onEdit} disabled={soon} title={soon ? 'Chức năng đang được phát triển' : `Sửa${what}`} aria-label={`Sửa${what}`}>
            <Icon name="edit" size={13} /> Sửa
          </button>}
      <button type="button" className="cms-rowbtn is-danger" onClick={onDelete} disabled={!onDelete} title={onDelete ? `${deleteLabel}${what}` : 'Chức năng đang được phát triển'} aria-label={`${deleteLabel}${what}`}><Icon name="trash" size={13} /> {deleteLabel}</button>
    </span>;
}
/** Công tắc Hiển thị/Ẩn dùng trong bảng: nhìn là biết bấm được và bấm sẽ đổi gì */
export function VisibilityToggle({
  visible,
  onToggle,
  name = ''
}) {
  const what = name ? ` “${name}”` : '';
  return <button type="button" className="cms-vistoggle" aria-pressed={!!visible} onClick={onToggle} title={visible ? `Đang hiển thị trên website — bấm để ẩn${what}` : `Đang ẩn — bấm để hiển thị${what} trên website`}>
      <span className="cms-switch__track" aria-hidden="true"><span className="cms-switch__dot" /></span>
      {visible ? 'Hiển thị' : 'Ẩn'}
    </button>;
}

/* ============================ Đa ngôn ngữ nội dung (VI / EN) ============================
   LangPills   — bộ chuyển bản dịch đang biên tập, dùng trong Bài viết / Trang / Menu.
   I18nBadges  — 2 chấm trạng thái VI (luôn "đã có") + EN trong danh sách bài viết.
   Đây là điểm khác biệt quan trọng: đây là ngôn ngữ CỦA NỘI DUNG đang biên tập,
   không phải ngôn ngữ giao diện CMS (đổi ở nút VI/EN trên thanh topbar). */
export function LangPills({
  lang,
  onChange,
  status
}) {
  const { cmsLanguages } = useModuleData('cms');
  return <div className="cms-langtabs">
      {cmsLanguages.map(l => <button key={l.code} type="button" className={lang === l.code ? 'is-active' : ''} onClick={() => onChange(l.code)}>
          <span aria-hidden="true">{l.flag}</span> {l.label}
          {l.isSource ? <em className="cms-langtabs__src">Bản gốc</em> : status && <em className={`cms-langtabs__stt is-${norm(status).replace(/ /g, '-')}`}>{status}</em>}
        </button>)}
    </div>;
}
export function I18nBadges({
  status
}) {
  const cls = status === 'Đã dịch' ? 'is-done' : status === 'Đang dịch' ? 'is-wait' : 'is-off';
  return <span className="cms-i18n">
      <span className="cms-i18n__dot is-done" title="Tiếng Việt · Bản gốc">VI</span>
      <span className={`cms-i18n__dot ${cls}`} title={`Tiếng Anh · ${status}`}>EN</span>
    </span>;
}
export function Toggle({
  checked,
  onChange,
  label,
  hint
}) {
  return <label className="cms-switch">
      <input type="checkbox" role="switch" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="cms-switch__track" aria-hidden="true"><span className="cms-switch__dot" /></span>
      {label && <span className="cms-switch__label">{label}{hint && <span className="cms-switch__hint">{hint}</span>}</span>}
    </label>;
}
export const DONUT_COLORS = ['#0a3d91', '#1976d2', '#f59e0b', '#94a3b8'];
export function Donut({
  total,
  parts
}) {
  let acc = 0;
  const stops = parts.map((p, i) => {
    const from = acc / total * 100;
    acc += p.value;
    const to = acc / total * 100;
    return `${DONUT_COLORS[i % DONUT_COLORS.length]} ${from}% ${to}%`;
  }).join(', ');
  return <div className="cms-donut">
      <span className="cms-donut__ring" style={{
      background: `conic-gradient(${stops})`
    }}>
        <span className="cms-donut__hole"><strong>{total}</strong><em>Tổng</em></span>
      </span>
      <ul className="cms-legend">
        {parts.map((p, i) => <li key={p.label}>
            <span className="cms-legend__dot" style={{
          background: DONUT_COLORS[i % DONUT_COLORS.length]
        }} />
            {p.label} · <strong>{p.value}</strong> ({p.pct}%)
          </li>)}
      </ul>
    </div>;
}
export function Spark({
  data
}) {
  const max = Math.max(...data.flatMap(d => [d.published, d.draft]));
  return <div className="cms-spark">
      <div className="cms-spark__plot">
        {data.map(d => <div key={d.day} className="cms-spark__group">
            <span className="cms-spark__bar is-pub" style={{
          height: `${d.published / max * 100}%`
        }} title={`Đã xuất bản: ${d.published}`} />
            <span className="cms-spark__bar is-draft" style={{
          height: `${d.draft / max * 100}%`
        }} title={`Bản nháp: ${d.draft}`} />
            <em>{d.day}</em>
          </div>)}
      </div>
      <div className="cms-spark__legend">
        <span><i className="is-pub" /> Đã xuất bản</span>
        <span><i className="is-draft" /> Bản nháp</span>
      </div>
    </div>;
}
export const PAGE_SIZE = 8;

/* ---------- Bài viết ---------- */
export
const I18N_FILTERS = ['Tất cả ngôn ngữ', ...cmsI18nStatuses];
export /* ---------- Danh mục ---------- */
function catRows(list, onEdit, onDelete, depth = 0) {
  return list.flatMap(c => [[<span key="n" className="cms-tree__name" style={{
    paddingLeft: depth * 22
  }}>
        <Icon name={c.children ? 'layers' : 'file'} size={13} /> {c.name}
      </span>, String(c.posts), <Tag key="t" v={c.status} />, <RowActions key="a" name={c.name} onEdit={() => onEdit(c)} onDelete={() => onDelete(c)} />], ...(c.children ? catRows(c.children, onEdit, onDelete, depth + 1) : [])]);
}
export /* ---------- Trang & menu ---------- */
function pageTreeItems(list, depth = 0) {
  return list.flatMap(p => [{
    ...p,
    children: undefined,
    depth
  }, ...(p.children ? pageTreeItems(p.children, depth + 1) : [])]);
}
export const MENU_TYPES = ['Trang', 'Liên kết', 'Chuyên mục'];
/* Bản Anh mẫu cho demo (chỉ 1 trang / 1 mục menu có sẵn — phần còn lại coi như chưa dịch) */
export const PAGE_TITLE_EN_SEED = {
  'Đơn vị': 'Units'
};
export const MENU_LABEL_EN_SEED = {
  'Trang chủ': 'Home'
};
export /* ============================ Banner / Slider ============================ */
const BANNER_POS = cmsBannerPositions.filter(p => p !== 'Tất cả vị trí');
