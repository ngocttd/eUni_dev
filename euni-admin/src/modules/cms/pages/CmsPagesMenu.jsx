'use client'
import { useModuleData, useReloadDatasets } from '@/lib/datasets/useModuleData'
import { useState } from "react";
import { Panel, FilterBar, DataTable } from "../../../shared/components/ui/page.jsx";
import Icon from "../../../shared/lib/Icon.jsx";
import { cmsApi } from "../../../lib/api/cmsApi.js";
import { mediaUrl } from "../../../lib/api/media.js";
import { publicSiteUrl } from "../../../config/apps.js";
import { useAction, Notice, confirmDelete } from "../actions.jsx";
import RichTextEditor from "../RichTextEditor.jsx";
import { Head, I18nBadges, LangPills, MENU_TYPES, RowActions, Toggle, norm, pageTreeItems, slugify } from "../shared.jsx";

/* "system" = trang có sẵn trong code website (route riêng): CMS chỉ quản lý tên, vị trí trong cây, menu.
   Các giao diện còn lại: nội dung soạn ở đây, website hiển thị tại /trang/{slug}. */
const TEMPLATES = [['default', 'Trang nội dung (soạn tại đây)'], ['system', 'Trang hệ thống (nội dung do website)']];
const MENU_TYPE_VALUE = { 'Trang': 'page', 'Liên kết': 'link', 'Chuyên mục': 'category', 'Tiêu đề nhóm': 'heading' };
const GROUP_CODES = ['header', 'footer', 'utility'];
/* Nhóm menu ↔ chỗ hiển thị trên website (euni-public: Header.jsx, Footer.jsx) */
const GROUP_HINT = {
  header: 'Thanh menu đầu trang. Mục gốc có mục con → menu thả xuống; mục gốc không có con → liên kết kèm biểu tượng ở bên phải.',
  footer: 'Chân trang. Mỗi mục gốc là một cột (tiêu đề cột), các mục con là liên kết trong cột.',
  utility: 'Liên kết nhỏ ở dòng cuối chân trang (Sơ đồ trang, Liên hệ…).',
};
const ICONS = ['', 'building', 'graduation', 'flask', 'handshake', 'heart', 'library', 'user', 'users', 'book', 'globe', 'mail', 'phone', 'calendar', 'newspaper', 'compass', 'home'];
const emptyPage = { title: '', titleEn: '', slug: '', parentId: '', template: 'default', order: 1, status: 'published', bodyHtml: '', bodyEn: '' };
const emptyMenu = { label: '', labelEn: '', url: '', type: 'Trang', order: 1, parentId: '', icon: '', isVisible: true, openInNewTab: false };

/** translations.en — giữ các bản dịch khác, bỏ bản EN nếu không còn trường nào */
const withEn = (translations = {}, fields) => {
  const next = { ...translations };
  const en = { ...(next.en || {}) };
  Object.entries(fields).forEach(([k, v]) => { if (v && String(v).trim()) en[k] = String(v).trim(); else delete en[k]; });
  delete en.status;
  if (Object.keys(en).length) next.en = { ...en, status: 'done' }; else delete next.en;
  return next;
};
const pageUrl = p => (p.template === 'system' ? p.path || `/${p.slug}` : `/trang/${p.slug}`);

export function CmsPagesMenu() {
  const { cmsPageTree, cmsMenuGroups, cmsMenus } = useModuleData('cms');
  const reload = useReloadDatasets();
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
    setPv({ title: p.name, titleEn: p.translations?.en?.title || '', slug: p.slug, parentId: p.parentId ?? '', template: p.template || 'default', order: p.sortOrder ?? 1,
      status: p.status || 'published', bodyHtml: p.bodyHtml || '', bodyEn: p.translations?.en?.bodyHtml || '' });
  };
  const newPage = keep => { setPage(null); setPv({ ...emptyPage, order: items.length + 1 }); setPageLang('vi'); if (keep !== true) act.clear(); };
  const isSystem = pv.template === 'system';
  const savePage = async e => {
    e.preventDefault();
    const body = {
      title: pv.title.trim(), slug: pv.slug.trim() || slugify(pv.title), parentId: pv.parentId === '' ? null : Number(pv.parentId),
      template: pv.template, sortOrder: Number(pv.order) || 1, status: pv.status,
      ...(isSystem ? {} : { bodyHtml: pv.bodyHtml }),
      translations: withEn(page?.translations, { title: pv.titleEn, ...(isSystem ? {} : { bodyHtml: pv.bodyEn }) }),
    };
    const ok = await act.run(() => (page ? cmsApi.pages.update(page.id, body) : cmsApi.pages.create(body)), page ? 'Đã lưu trang — website cập nhật ngay' : 'Đã tạo trang');
    if (ok && !page) newPage(true);
  };
  const removePage = () => {
    const kids = items.filter(p => p.parentId === page.id).length;
    if (confirmDelete(`trang "${page.name}"${kids ? ` (có ${kids} trang con — các trang con sẽ thành trang gốc)` : ''}`)) act.run(() => cmsApi.pages.remove(page.id), 'Đã xóa trang').then(ok => ok && newPage(true));
  };
  const uploadImage = async file => {
    const m = await cmsApi.media.upload(file, { folder: 'Trang' });
    await reload();
    return mediaUrl(m.url);
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
  /* sắp theo cây: mục gốc rồi tới các mục con của nó */
  const roots = groupMenus.filter(m => !m.parentId || !groupMenus.some(x => x.id === m.parentId));
  const ordered = roots.flatMap(r => [{ ...r, depth: 0 }, ...groupMenus.filter(c => c.parentId === r.id).map(c => ({ ...c, depth: 1 }))]);
  const menus = ordered.filter(m => !menuQ || norm(`${m.label} ${m.url}`).includes(norm(menuQ)));
  const menuEditing = menuSel != null;
  const pickMenu = m => {
    setMenuSel(m); setMenuLang('vi'); act.clear();
    setMv({ label: m.label, labelEn: m.translations?.en?.label || '', url: m.url, type: m.type, order: m.order, parentId: m.parentId ?? '', icon: m.icon || '', isVisible: m.isVisible, openInNewTab: m.openInNewTab });
  };
  const newMenu = keep => { setMenuSel(null); setMv({ ...emptyMenu, order: roots.length + 1 }); setMenuLang('vi'); if (keep !== true) act.clear(); };
  const saveMenu = async e => {
    e.preventDefault();
    const type = MENU_TYPE_VALUE[mv.type] || 'link';
    const body = {
      groupCode, label: mv.label.trim(), url: type === 'heading' ? null : mv.url.trim(), type, parentId: mv.parentId === '' ? null : Number(mv.parentId),
      icon: mv.icon || null, isVisible: !!mv.isVisible, openInNewTab: !!mv.openInNewTab,
      sortOrder: Number(mv.order) || 1, translations: withEn(menuSel?.translations, { label: mv.labelEn }),
    };
    const ok = await act.run(() => (menuEditing ? cmsApi.menuItems.update(menuSel.id, body) : cmsApi.menuItems.create(body)), menuEditing ? 'Đã lưu mục menu — website cập nhật ngay' : 'Đã thêm mục menu');
    if (ok && !menuEditing) newMenu(true);
  };
  const removeMenu = m => {
    const kids = groupMenus.filter(c => c.parentId === m.id).length;
    return confirmDelete(`mục menu "${m.label}"${kids ? ` (${kids} mục con sẽ không còn hiển thị)` : ''}`) && act.run(() => cmsApi.menuItems.remove(m.id), 'Đã xóa mục menu').then(ok => ok && menuSel?.id === m.id && newMenu(true));
  };
  const toggleMenu = m => act.run(() => cmsApi.menuItems.update(m.id, { isVisible: !m.isVisible }), m.isVisible ? `Đã ẩn “${m.label}” khỏi website` : `Đã hiện “${m.label}” trên website`);
  /* trang có sẵn để chọn nhanh làm liên kết menu */
  const pickPageLink = id => { const p = items.find(x => String(x.id) === id); if (p) setMv(s => ({ ...s, url: pageUrl(p), label: s.label || p.name, type: 'Trang' })); };

  return <>
      <Head title="Quản lý trang & menu" sub="Trang tĩnh và menu điều hướng của website — lưu là website đổi theo ngay" />
      <Notice error={act.error} notice={act.notice} />
      <Panel flush>
        <div className="ps-tabs" role="tablist">
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
                        <Icon name={p.template === 'system' ? 'layers' : 'file'} size={13} /> {p.name}
                        {p.template !== 'system' && p.status !== 'published' && <em className="cms-chip">nháp</em>}
                      </button>
                    </li>)}
                </ul>
                <p className="cms-hint" style={{ padding: '8px 12px', margin: 0 }}><Icon name="layers" size={11} /> trang hệ thống · <Icon name="file" size={11} /> trang nội dung soạn ở CMS</p>
              </div>
              <form className="cms-form cms-split__form" onSubmit={savePage}>
                <h4>{page ? 'Thông tin trang' : 'Thêm trang mới'}</h4>
                <LangPills lang={pageLang} onChange={setPageLang} status={pv.titleEn ? 'Đã dịch' : 'Chưa dịch'} />
                <label>Tiêu đề ({pageLang.toUpperCase()}) <span className="cms-req">*</span>
                  {pageLang === 'en'
                    ? <input type="text" value={pv.titleEn} onChange={setP('titleEn')} placeholder="English page title…" />
                    : <input type="text" required value={pv.title} onChange={setP('title')} placeholder="Nhập tiêu đề trang" />}
                </label>
                <div className="cms-form__two">
                  <label>Giao diện
                    <select value={pv.template} onChange={setP('template')} disabled={page?.template === 'system'}>{TEMPLATES.map(([val, label]) => <option key={val} value={val}>{label}</option>)}</select>
                    {page?.template === 'system' && <span className="cms-hint">Trang có sẵn trong website, không đổi được giao diện.</span>}
                  </label>
                  <label>Trạng thái
                    <select value={pv.status} onChange={setP('status')} disabled={isSystem}>
                      <option value="published">Xuất bản (hiện trên website)</option>
                      <option value="draft">Bản nháp (chưa hiện)</option>
                    </select>
                  </label>
                </div>
                <label>Đường dẫn (slug)<input type="text" value={pv.slug} onChange={setP('slug')} placeholder={slugify(pv.title) || 'tu-dong-tao-tu-tieu-de'} disabled={page?.template === 'system'} />
                  <span className="cms-hint">Địa chỉ trên website: <code>{isSystem ? (page?.path || `/${pv.slug}`) : `/trang/${pv.slug || slugify(pv.title) || '…'}`}</code></span>
                </label>
                <div className="cms-form__two">
                  <label>Trang cha
                    <select value={pv.parentId} onChange={setP('parentId')}>
                      <option value="">-- Trang gốc --</option>
                      {items.filter(p => !page || p.id !== page.id).map(p => <option key={p.id} value={p.id}>{'— '.repeat(p.depth)}{p.name}</option>)}
                    </select>
                  </label>
                  <label>Thứ tự<input type="number" min="0" value={pv.order} onChange={setP('order')} /><span className="cms-hint">Số nhỏ đứng trước trong cùng cấp.</span></label>
                </div>
                {isSystem
                  ? <p className="cms-hint" style={{ margin: 0 }}><Icon name="info" size={12} /> Nội dung trang hệ thống do website hiển thị (vd. danh sách đơn vị lấy từ hệ thống nhân sự). Ở đây chỉ quản lý tên, vị trí trong cây và dùng làm liên kết menu.</p>
                  : <div className="cms-form__block">
                      <span className="cms-form__label">Nội dung ({pageLang.toUpperCase()})</span>
                      <RichTextEditor key={`${page?.id || 'new'}-${pageLang}`} value={pageLang === 'en' ? pv.bodyEn : pv.bodyHtml} onChange={html => setPv(s => ({ ...s, [pageLang === 'en' ? 'bodyEn' : 'bodyHtml']: html }))} onUploadImage={uploadImage}
                        placeholder={pageLang === 'en' ? 'English content (leave empty to show Vietnamese)…' : 'Nhập nội dung trang…'} />
                    </div>}
                <div className="cms-form__actions">
                  <button type="submit" disabled={act.busy} className="humg-btn humg-btn--primary humg-btn--sm">{act.busy ? 'Đang lưu…' : page ? 'Lưu' : 'Tạo trang'}</button>
                  {page && <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={newPage}>Hủy</button>}
                  {page && (page.template === 'system' || page.status === 'published') && <a className="humg-btn humg-btn--ghost humg-btn--sm" href={publicSiteUrl(pageUrl(page))} target="_blank" rel="noopener noreferrer" title="Mở trang trên website ở tab mới"><Icon name="eye" size={13} /> Xem trên website</a>}
                  {page && <button type="button" className="cms-rowbtn is-danger" onClick={removePage} title={`Xóa trang “${page.name}”`}><Icon name="trash" size={13} /> Xóa trang</button>}
                </div>
              </form>
            </div>}
          {tab === 'menu' && <div className="ps-grid2">
              <div>
                <FilterBar search={menuQ} onSearch={setMenuQ} onReset={() => setMenuQ('')} searchPlaceholder="Tìm mục menu theo nhãn hoặc liên kết…" selects={[{
              label: 'Nhóm menu',
              value: menuGroup,
              onChange: g => { setMenuGroup(g); setMenuSel(null); setMv(emptyMenu); setMenuQ(''); },
              options: cmsMenuGroups
            }]} count={menus.length} total={groupMenus.length} />
                <p className="cms-hint" style={{ margin: '0 16px 10px' }}><Icon name="info" size={12} /> {GROUP_HINT[groupCode]}</p>
                <DataTable columns={['Nhãn hiển thị', 'Liên kết', 'Thứ tự', 'Bản dịch', 'Hiển thị', 'Thao tác']} rows={menus.map(m => [
                  <span key="l" className="cms-tree__name cms-menulabel" style={{ paddingLeft: m.depth * 18 }}>{m.depth ? <Icon name="chevron-right" size={12} /> : <Icon name={m.icon || 'menu'} size={13} />} {m.depth ? m.label : <strong>{m.label}</strong>}</span>,
                  m.typeValue === 'heading' ? <span key="u" className="ps-muted">Tiêu đề nhóm</span> : <code key="u" className="cms-url" title={m.url}>{m.url}</code>,
                  String(m.order),
                  <I18nBadges key="i18n" status={m.translations?.en?.label ? 'Đã dịch' : 'Chưa dịch'} />,
                  <button key="v" type="button" className="cms-vistoggle" aria-pressed={m.isVisible} onClick={() => toggleMenu(m)} title={m.isVisible ? `Đang hiện — bấm để ẩn “${m.label}” khỏi website` : `Đang ẩn — bấm để hiện “${m.label}”`}>
                    <span className="cms-switch__track" aria-hidden="true"><span className="cms-switch__dot" /></span>{m.isVisible ? 'Hiện' : 'Ẩn'}
                  </button>,
                  <RowActions key="a" name={m.label} onEdit={() => pickMenu(m)} onDelete={() => removeMenu(m)} />,
                ])} />
                {!menus.length && <p className="cms-empty">Nhóm menu này chưa có mục nào.</p>}
                <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" style={{ margin: 12 }} onClick={newMenu}><Icon name="plus" size={13} /> Thêm mục menu</button>
              </div>
              <Panel title={menuEditing ? 'Chỉnh sửa mục menu' : 'Thêm mục menu'} icon="menu">
                <form className="cms-form" onSubmit={saveMenu}>
                  <p className="cms-hint" style={{ margin: 0 }}>Nhóm: <strong>{menuGroup}</strong> (đổi nhóm ở bộ lọc bên trái).</p>
                  <LangPills lang={menuLang} onChange={setMenuLang} status={mv.labelEn ? 'Đã dịch' : 'Chưa dịch'} />
                  <label>Nhãn hiển thị ({menuLang.toUpperCase()}) <span className="cms-req">*</span>
                    {menuLang === 'en'
                      ? <input type="text" value={mv.labelEn} onChange={setM('labelEn')} placeholder="English menu label…" />
                      : <input type="text" required value={mv.label} onChange={setM('label')} placeholder="Nhập nhãn hiển thị" />}
                  </label>
                  <div className="cms-form__two">
                    <label>Kiểu
                      <select value={mv.type} onChange={setM('type')}>{MENU_TYPES.map(x => <option key={x}>{x}</option>)}</select>
                    </label>
                    <label>Mục cha
                      <select value={mv.parentId} onChange={setM('parentId')}>
                        <option value="">-- Mục gốc --</option>
                        {roots.filter(r => !menuSel || r.id !== menuSel.id).map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                      </select>
                    </label>
                  </div>
                  {mv.type !== 'Tiêu đề nhóm' && <>
                    <label>Liên kết (URL) <span className="cms-req">*</span>
                      <input type="text" required value={mv.url} onChange={setM('url')} placeholder="/duong-dan hoặc https://" />
                    </label>
                    <label>Hoặc chọn nhanh một trang
                      <select value="" onChange={e => pickPageLink(e.target.value)}>
                        <option value="">— chọn trang để điền liên kết —</option>
                        {items.filter(p => p.template === 'system' || p.status === 'published').map(p => <option key={p.id} value={p.id}>{'— '.repeat(p.depth)}{p.name} ({pageUrl(p)})</option>)}
                      </select>
                    </label>
                  </>}
                  <div className="cms-form__two">
                    <label>Biểu tượng
                      <select value={mv.icon} onChange={setM('icon')}>{ICONS.map(i => <option key={i} value={i}>{i || '(không)'}</option>)}</select>
                      <span className="cms-hint">Dùng cho liên kết nằm ngay trên thanh menu đầu trang.</span>
                    </label>
                    <label>Thứ tự
                      <input type="number" min="0" value={mv.order} onChange={setM('order')} />
                      <span className="cms-hint">Số nhỏ đứng trước.</span>
                    </label>
                  </div>
                  <Toggle checked={mv.isVisible} onChange={v => setMv(s => ({ ...s, isVisible: v }))} label="Hiển thị trên website" hint="Tắt để ẩn tạm (ẩn cả các mục con)" />
                  <Toggle checked={mv.openInNewTab} onChange={v => setMv(s => ({ ...s, openInNewTab: v }))} label="Mở trong tab mới" hint="Nên bật với liên kết sang website khác" />
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

