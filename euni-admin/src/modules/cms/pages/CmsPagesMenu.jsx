'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";
import { Panel, FilterBar, DataTable } from "../../../shared/components/ui/page.jsx";
import Icon from "../../../shared/lib/Icon.jsx";
import { cmsApi } from "../../../lib/api/cmsApi.js";
import { useAction, Notice, confirmDelete } from "../actions.jsx";
import { Head, I18nBadges, LangPills, MENU_TYPES, RowActions, norm, pageTreeItems, slugify } from "../shared.jsx";

const TEMPLATES = [['default', 'Mặc định'], ['list', 'Trang danh sách'], ['detail', 'Trang chi tiết'], ['contact', 'Trang liên hệ']];
const MENU_TYPE_VALUE = { 'Trang': 'page', 'Liên kết': 'link', 'Chuyên mục': 'category' };
const GROUP_CODES = ['header', 'footer', 'utility'];
const emptyPage = { title: '', titleEn: '', slug: '', parentId: '', template: 'default', order: 1 };
const emptyMenu = { label: '', labelEn: '', url: '', type: 'Trang', order: 1 };

/** translations.en.{field} — giữ các bản dịch khác, bỏ bản EN nếu để trống */
const withEn = (translations = {}, field, value) => {
  const next = { ...translations };
  if (value && value.trim()) next.en = { ...(next.en || {}), [field]: value.trim(), status: 'done' }; else delete next.en;
  return next;
};

export function CmsPagesMenu() {
  const { cmsPageTree, cmsPageDefaults, cmsMenuGroups, cmsMenus } = useModuleData('cms');
  const act = useAction();
  const [tab, setTab] = useState('trang');
  const items = pageTreeItems(cmsPageTree);

  /* ---- Cây trang ---- */
  const [page, setPage] = useState(null); // null = thêm trang mới
  const [pv, setPv] = useState(emptyPage);
  const [pageLang, setPageLang] = useState('vi');
  const setP = k => e => setPv(s => ({ ...s, [k]: e.target.value }));
  const pickPage = p => {
    setPage(p); setPageLang('vi'); act.clear();
    setPv({ title: p.name, titleEn: p.translations?.en?.title || '', slug: p.slug, parentId: p.parentId ?? '', template: p.template || 'default', order: p.sortOrder ?? 1 });
  };
  const newPage = keep => { setPage(null); setPv({ ...emptyPage, order: items.length + 1 }); setPageLang('vi'); if (keep !== true) act.clear(); };
  const savePage = async e => {
    e.preventDefault();
    const body = {
      title: pv.title.trim(), slug: pv.slug.trim() || slugify(pv.title), parentId: pv.parentId === '' ? null : Number(pv.parentId),
      template: pv.template, sortOrder: Number(pv.order) || 1, translations: withEn(page?.translations, 'title', pv.titleEn),
    };
    const ok = await act.run(() => (page ? cmsApi.pages.update(page.id, body) : cmsApi.pages.create(body)), page ? 'Đã lưu trang' : 'Đã tạo trang');
    if (ok && !page) newPage(true);
  };
  const removePage = () => {
    const kids = items.filter(p => p.parentId === page.id).length;
    if (confirmDelete(`trang "${page.name}"${kids ? ` (có ${kids} trang con — các trang con sẽ thành trang gốc)` : ''}`)) act.run(() => cmsApi.pages.remove(page.id), 'Đã xóa trang').then(ok => ok && newPage(true));
  };

  /* ---- Menu ---- */
  const [menuGroup, setMenuGroup] = useState(cmsMenuGroups[0]);
  const groupCode = GROUP_CODES[cmsMenuGroups.indexOf(menuGroup)] || 'header';
  const [menuSel, setMenuSel] = useState(null); // null = thêm mới
  const [mv, setMv] = useState(emptyMenu);
  const [menuLang, setMenuLang] = useState('vi');
  const setM = k => e => setMv(s => ({ ...s, [k]: e.target.value }));
  const [menuQ, setMenuQ] = useState('');
  const groupMenus = cmsMenus.filter(m => m.groupCode === groupCode);
  const menus = groupMenus.filter(m => !menuQ || norm(`${m.label} ${m.url}`).includes(norm(menuQ)));
  const menuEditing = menuSel != null;
  const pickMenu = m => { setMenuSel(m); setMenuLang('vi'); act.clear(); setMv({ label: m.label, labelEn: m.translations?.en?.label || '', url: m.url, type: m.type, order: m.order }); };
  const newMenu = keep => { setMenuSel(null); setMv({ ...emptyMenu, order: menus.length + 1 }); setMenuLang('vi'); if (keep !== true) act.clear(); };
  const saveMenu = async e => {
    e.preventDefault();
    const body = {
      groupCode, label: mv.label.trim(), url: mv.url.trim(), type: MENU_TYPE_VALUE[mv.type] || 'link',
      sortOrder: Number(mv.order) || 1, translations: withEn(menuSel?.translations, 'label', mv.labelEn),
    };
    const ok = await act.run(() => (menuEditing ? cmsApi.menuItems.update(menuSel.id, body) : cmsApi.menuItems.create(body)), menuEditing ? 'Đã lưu mục menu' : 'Đã thêm mục menu');
    if (ok && !menuEditing) newMenu(true);
  };
  const removeMenu = m => confirmDelete(`mục menu "${m.label}"`) && act.run(() => cmsApi.menuItems.remove(m.id), 'Đã xóa mục menu').then(ok => ok && menuSel?.id === m.id && newMenu(true));

  const d = cmsPageDefaults;
  return <>
      <Head title="Quản lý trang & menu" sub="Cấu trúc trang tĩnh và hệ thống menu điều hướng" />
      <Notice error={act.error} notice={act.notice} />
      <Panel flush>
        <div className="ps-tabs">
          <button type="button" role="tab" aria-selected={tab === 'trang'} className={tab === 'trang' ? 'is-active' : ''} onClick={() => setTab('trang')}>Cây trang</button>
          <button type="button" role="tab" aria-selected={tab === 'menu'} className={tab === 'menu' ? 'is-active' : ''} onClick={() => setTab('menu')}>Menu</button>
        </div>
        <div className="ps-tabbody">
          {tab === 'trang' && <div className="cms-split">
              <div className="cms-split__tree">
                <div className="cms-split__head">
                  <span>Cây trang</span>
                  <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={newPage} title="Mở biểu mẫu thêm trang mới"><Icon name="plus" size={13} /> Thêm trang</button>
                </div>
                <ul className="cms-pagetree">
                  {items.map(p => <li key={p.id}>
                      <button type="button" className={page?.id === p.id ? 'is-active' : ''} style={{ paddingLeft: 10 + p.depth * 18 }} onClick={() => pickPage(p)} title={`Bấm để sửa trang “${p.name}”`} aria-current={page?.id === p.id ? 'true' : undefined}>
                        <Icon name="file" size={13} /> {p.name}
                      </button>
                    </li>)}
                </ul>
              </div>
              <form className="cms-form cms-split__form" onSubmit={savePage}>
                <h4>{page ? 'Thông tin trang' : 'Thêm trang mới'}</h4>
                <LangPills lang={pageLang} onChange={setPageLang} status={pv.titleEn ? 'Đã dịch' : 'Chưa dịch'} />
                <label>Tiêu đề ({pageLang.toUpperCase()}) <span className="cms-req">*</span>
                  {pageLang === 'en'
                    ? <input type="text" value={pv.titleEn} onChange={setP('titleEn')} placeholder="English page title…" />
                    : <input type="text" required value={pv.title} onChange={setP('title')} placeholder="Nhập tiêu đề trang" />}
                </label>
                <label>Đường dẫn (Slug)<input type="text" value={pv.slug} onChange={setP('slug')} placeholder={slugify(pv.title) || d.slug} /></label>
                <label>Trang cha
                  <select value={pv.parentId} onChange={setP('parentId')}>
                    <option value="">-- Trang gốc --</option>
                    {items.filter(p => !page || p.id !== page.id).map(p => <option key={p.id} value={p.id}>{'— '.repeat(p.depth)}{p.name}</option>)}
                  </select>
                </label>
                <div className="cms-form__two">
                  <label>Giao diện
                    <select value={pv.template} onChange={setP('template')}>{TEMPLATES.map(([val, label]) => <option key={val} value={val}>{label}</option>)}</select>
                  </label>
                  <label>Thứ tự<input type="number" min="0" value={pv.order} onChange={setP('order')} /><span className="cms-hint">Số nhỏ đứng trước trong cùng cấp.</span></label>
                </div>
                <div className="cms-form__actions">
                  <button type="submit" disabled={act.busy} className="humg-btn humg-btn--primary humg-btn--sm">{act.busy ? 'Đang lưu…' : page ? 'Lưu' : 'Tạo trang'}</button>
                  {page && <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={newPage}>Hủy</button>}
                  {page && <button type="button" className="cms-rowbtn is-danger" onClick={removePage} title={`Xóa trang “${page.name}”`}><Icon name="trash" size={13} /> Xóa trang</button>}
                </div>
              </form>
            </div>}
          {tab === 'menu' && <div className="ps-grid2">
              <div>
                <FilterBar search={menuQ} onSearch={setMenuQ} onReset={() => setMenuQ('')} searchPlaceholder="Tìm mục menu theo nhãn hoặc liên kết…" selects={[{
              label: 'Nhóm menu',
              value: menuGroup,
              onChange: g => { setMenuGroup(g); setMenuSel(null); setMv(emptyMenu); },
              options: cmsMenuGroups
            }]} count={menus.length} total={groupMenus.length} />
                <DataTable columns={['Thứ tự', 'Nhãn hiển thị', 'Liên kết', 'Kiểu', 'Ngôn ngữ', 'Thao tác']} rows={menus.map(m => [String(m.order), m.label, m.url, m.type, <I18nBadges key="i18n" status={m.translations?.en?.label ? 'Đã dịch' : 'Chưa dịch'} />, <RowActions key="a" name={m.label} onEdit={() => pickMenu(m)} onDelete={() => removeMenu(m)} />])} />
                {!menus.length && <p className="cms-empty">Nhóm menu này chưa có mục nào.</p>}
                <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" style={{ marginTop: 12 }} onClick={newMenu}><Icon name="plus" size={13} /> Thêm mục menu</button>
              </div>
              <Panel title={menuEditing ? 'Chỉnh sửa mục menu' : 'Thêm mục menu'} icon="menu">
                <form className="cms-form" onSubmit={saveMenu}>
                  <LangPills lang={menuLang} onChange={setMenuLang} status={mv.labelEn ? 'Đã dịch' : 'Chưa dịch'} />
                  <label>Nhãn hiển thị ({menuLang.toUpperCase()}) <span className="cms-req">*</span>
                    {menuLang === 'en'
                      ? <input type="text" value={mv.labelEn} onChange={setM('labelEn')} placeholder="English menu label…" />
                      : <input type="text" required value={mv.label} onChange={setM('label')} placeholder="Nhập nhãn hiển thị" />}
                  </label>
                  <label>Liên kết (URL) <span className="cms-req">*</span>
                    <input type="text" required value={mv.url} onChange={setM('url')} placeholder="/duong-dan hoặc https://" />
                  </label>
                  <div className="cms-form__two">
                    <label>Kiểu
                      <select value={mv.type} onChange={setM('type')}>{MENU_TYPES.map(x => <option key={x}>{x}</option>)}</select>
                    </label>
                    <label>Thứ tự
                      <input type="number" value={mv.order} onChange={setM('order')} />
                    </label>
                  </div>
                  <p className="ps-muted" style={{ margin: 0, fontSize: 12 }}>Nhóm menu: <strong>{menuGroup}</strong> (đổi nhóm ở bộ lọc bên trái).</p>
                  <div className="cms-form__actions">
                    <button type="submit" disabled={act.busy} className="humg-btn humg-btn--primary humg-btn--sm">
                      {act.busy ? 'Đang lưu…' : menuEditing ? 'Lưu thay đổi' : 'Thêm vào menu'}
                    </button>
                    {menuEditing && <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={newMenu}>Hủy</button>}
                  </div>
                </form>
              </Panel>
            </div>}
        </div>
      </Panel>
    </>;
}
