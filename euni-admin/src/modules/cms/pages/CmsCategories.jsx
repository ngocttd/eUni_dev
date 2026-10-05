'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";
import Icon from "../../../shared/lib/Icon.jsx";
import { Panel, DataTable } from "../../../shared/components/ui/page.jsx";
import { cmsApi } from "../../../lib/api/cmsApi.js";
import { useAction, Notice, confirmDelete } from "../actions.jsx";
import { Head, catRows, slugify } from "../shared.jsx";

const flat = list => list.flatMap(c => [c, ...(c.children ? flat(c.children) : [])]);
const empty = { name: '', slug: '', parentId: '', isActive: 'true', sortOrder: 1, description: '' };

export function CmsCategories() {
  const { cmsCategories } = useModuleData('cms');
  const act = useAction();
  const [sel, setSel] = useState(null); // null = thêm mới · object = danh mục đang sửa
  const [v, setV] = useState(empty);
  const all = useMemo(() => flat(cmsCategories), [cmsCategories]);
  const editing = sel != null;
  const set = k => e => setV(s => ({ ...s, [k]: e.target.value }));

  const edit = c => {
    setSel(c);
    setV({ name: c.name, slug: c.slug || '', parentId: c.parentId ?? '', isActive: String(c.status === 'Hiển thị'), sortOrder: c.sortOrder ?? 1, description: c.description || '' });
    act.clear();
  };
  const reset = () => { setSel(null); setV(empty); act.clear(); };
  const remove = c => {
    const warn = c.posts ? ` (đang có ${c.posts} bài viết — các bài này sẽ không còn danh mục)` : '';
    if (confirmDelete(`danh mục "${c.name}"${warn}`)) act.run(() => cmsApi.categories.remove(c.id), 'Đã xóa danh mục').then(ok => ok && sel?.id === c.id && reset());
  };
  const submit = async e => {
    e.preventDefault();
    const body = {
      name: v.name.trim(), slug: (v.slug || slugify(v.name)).trim(), parentId: v.parentId === '' ? null : Number(v.parentId),
      isActive: v.isActive === 'true', sortOrder: Number(v.sortOrder) || 1, description: v.description || null
    };
    const ok = await act.run(() => (editing ? cmsApi.categories.update(sel.id, body) : cmsApi.categories.create(body)), editing ? 'Đã lưu danh mục' : 'Đã tạo danh mục');
    if (ok) { setSel(null); setV(empty); }
  };

  const rows = catRows(cmsCategories, edit, remove);
  return <>
      <Head title="Quản lý danh mục" sub="Cấu trúc chuyên mục nội dung của cổng thông tin" right={<button type="button" className="humg-btn humg-btn--primary humg-btn--sm" onClick={reset}>
          <Icon name="layers" size={13} /> Thêm danh mục
        </button>} />
      <Notice error={act.error} notice={act.notice} />
      <div className="ps-grid2">
        <Panel flush>
          <div className="cms-tree">
            <DataTable columns={['Tên danh mục', 'Bài viết', 'Trạng thái', 'Thao tác']} rows={rows} />
          </div>
          <div className="cms-pagefoot"><span>Hiển thị 1 – {rows.length} trong tổng số {rows.length} danh mục</span></div>
        </Panel>
        <Panel title={editing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'} icon="layers">
          <form className="cms-form" onSubmit={submit}>
            <label>Tên danh mục <span className="cms-req">*</span>
              <input type="text" required value={v.name} onChange={set('name')} placeholder="Nhập tên danh mục" />
            </label>
            <label>Đường dẫn (Slug) <span className="cms-req">*</span>
              <input type="text" value={v.slug} onChange={set('slug')} placeholder={slugify(v.name) || 'tu-dong-tao-tu-ten'} />
            </label>
            <label>Danh mục cha
              <select value={v.parentId} onChange={set('parentId')}>
                <option value="">-- Danh mục gốc --</option>
                {all.filter(c => !sel || c.id !== sel.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <div className="cms-form__two">
              <label>Trạng thái
                <select value={v.isActive} onChange={set('isActive')}>
                  <option value="true">Hiển thị</option>
                  <option value="false">Ẩn</option>
                </select>
              </label>
              <label>Thứ tự hiển thị
                <input type="number" value={v.sortOrder} onChange={set('sortOrder')} />
              </label>
            </div>
            <label>Mô tả
              <textarea rows="3" value={v.description} onChange={set('description')} placeholder="Mô tả ngắn về danh mục (tùy chọn)" />
            </label>
            <div className="cms-form__actions">
              <button type="submit" disabled={act.busy} className="humg-btn humg-btn--primary humg-btn--sm">
                {act.busy ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Tạo danh mục'}
              </button>
              {editing && <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={reset}>Hủy</button>}
            </div>
          </form>
        </Panel>
      </div>
    </>;
}
