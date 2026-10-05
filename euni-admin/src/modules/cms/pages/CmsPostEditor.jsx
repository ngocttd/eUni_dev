'use client'
import { cmsI18nStatuses } from '../../../config/static/cms.js'
import { useModuleData, useReloadDatasets } from '@/lib/datasets/useModuleData'
import { useParams, useNavigate, Link } from '../../../lib/router.jsx';
import { useMemo, useState } from "react";
import Icon from "../../../shared/lib/Icon.jsx";
import { Panel } from "../../../shared/components/ui/page.jsx";
import { cmsApi } from "../../../lib/api/cmsApi.js";
import { externalUrl } from "../../../config/apps.js";
import { TR_VALUE } from "../../../lib/datasets/loaders.js";
import { bodyToHtml, toLocalInput, fromLocalInput } from "../../../lib/datasets/format.js";
import { mediaUrl } from "../../../lib/api/media.js";
import RichTextEditor from "../RichTextEditor.jsx";
import MediaPicker from "../MediaPicker.jsx";
import { useAction, Notice } from "../actions.jsx";
import { WorkflowBar, HistoryPanel } from "../workflow.jsx";
import { Head, LangPills, Toggle, slugify } from "../shared.jsx";

const TR_LABEL = { done: 'Đã dịch', in_progress: 'Đang dịch', missing: 'Chưa dịch' };
const flatCats = list => list.flatMap(c => [{ id: c.id, name: c.name }, ...(c.children ? flatCats(c.children) : [])]);

const viFields = raw => ({
  title: raw?.title || '',
  excerpt: raw?.excerpt || '',
  content: bodyToHtml(raw?.contentBody),
  seoTitle: raw?.metaTitle || '',
  seoDesc: raw?.metaDescription || '',
  seoKeywords: raw?.metaKeywords || ''
});
const enFields = en => ({
  title: en?.title || '',
  excerpt: en?.excerpt || '',
  content: bodyToHtml(en?.contentBody),
  seoTitle: en?.metaTitle || '',
  seoDesc: en?.metaDescription || '',
  seoKeywords: en?.metaKeywords || ''
});

export function CmsPostEditor() {
  const { cmsPosts, cmsCategories, cmsEditorTabs, cmsUser, cmsMedia, cmsOrgUnits, cmsContext } = useModuleData('cms');
  const reload = useReloadDatasets();
  const { id } = useParams();
  const navigate = useNavigate();
  const act = useAction();
  const post = id ? cmsPosts.find(p => String(p.id) === String(id)) : null;
  const raw = post?.raw;
  const editing = !!post;
  const actions = raw?.allowedActions || [];
  const readOnly = editing && !actions.includes('edit');
  const tabs = editing ? [...cmsEditorTabs, 'Lịch sử'] : cmsEditorTabs;
  const cats = useMemo(() => flatCats(cmsCategories), [cmsCategories]);

  const [tab, setTab] = useState(cmsEditorTabs[0]);
  const [categoryId, setCategoryId] = useState(raw?.categoryId ?? cats[0]?.id ?? '');
  const [slug, setSlug] = useState(raw?.slug || '');
  const [ownerUnitCode, setOwnerUnitCode] = useState(raw?.ownerUnitCode || cmsContext.user?.units?.[0] || '');
  const [showHome, setShowHome] = useState(!!raw?.showOnHome);
  const [featured, setFeatured] = useState(!!raw?.isFeatured);
  const [publishAt, setPublishAt] = useState(toLocalInput(raw?.publishAt));
  const [expireAt, setExpireAt] = useState(toLocalInput(raw?.expireAt));
  const [author, setAuthor] = useState(raw?.authorName || cmsUser.name);
  const [source, setSource] = useState(raw?.source || '');
  const [unit, setUnit] = useState(raw?.unit || '');
  const [tags, setTags] = useState((raw?.tags || []).join(', '));
  const [attachments, setAttachments] = useState(raw?.attachments || []);
  const [featuredImageId, setFeaturedImageId] = useState(raw?.featuredImageId ?? null);
  const [picked, setPicked] = useState(null);
  const [picker, setPicker] = useState(false);
  const featured_ = featuredImageId == null ? null : picked && picked.id === featuredImageId ? picked : (() => { const m = cmsMedia.find(x => x.id === featuredImageId); return m ? { id: m.id, name: m.name, url: m.url } : null; })();
  const [newAtt, setNewAtt] = useState({ title: '', meta: '' });

  /* Nội dung song ngữ: VI = bản gốc, EN = bản dịch. Danh mục, slug, lịch xuất bản, tệp dùng chung. */
  const [contentLang, setContentLang] = useState('vi');
  const [fields, setFields] = useState({ vi: viFields(raw), en: enFields(raw?.translations?.en) });
  const [enStatus, setEnStatus] = useState(TR_LABEL[raw?.translations?.en?.status] || 'Chưa dịch');
  const cur = fields[contentLang];
  const setCur = patch => setFields(f => ({ ...f, [contentLang]: { ...f[contentLang], ...patch } }));
  const copyFromVi = () => {
    setFields(f => ({ ...f, en: { ...f.vi } }));
    setEnStatus(s => (s === 'Chưa dịch' ? 'Đang dịch' : s));
  };
  const effSlug = slug || slugify(fields.vi.title);

  /**
   * Lưu nội dung (không đổi trạng thái — trạng thái đổi qua thanh workflow).
   * Bài đang xuất bản mà bạn không có quyền xuất bản → server lưu thành "bản sửa đổi chờ duyệt" (202).
   * then: 'submit' = lưu xong gửi duyệt luôn.
   */
  const save = async then => {
    if (!fields.vi.title.trim()) { act.run(async () => { throw new Error('Vui lòng nhập tiêu đề (Tiếng Việt).'); }); return; }
    const en = fields.en;
    const hasEn = enStatus !== 'Chưa dịch' || en.title.trim();
    const translations = { ...(raw?.translations || {}) };
    if (hasEn) {
      translations.en = {
        title: en.title, excerpt: en.excerpt, contentBody: en.content,
        metaTitle: en.seoTitle, metaDescription: en.seoDesc, metaKeywords: en.seoKeywords, status: TR_VALUE[enStatus]
      };
    } else delete translations.en;
    const vi = fields.vi;
    const body = {
      title: vi.title.trim(), slug: effSlug, categoryId: categoryId === '' ? null : Number(categoryId), excerpt: vi.excerpt,
      contentBody: vi.content, metaTitle: vi.seoTitle, metaDescription: vi.seoDesc, metaKeywords: vi.seoKeywords,
      showOnHome: showHome, isFeatured: featured, ownerUnitCode: ownerUnitCode || undefined,
      publishAt: fromLocalInput(publishAt), expireAt: fromLocalInput(expireAt),
      authorName: author, source: source || null, unit: unit || null, featuredImageId,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean), attachments, translations,
      ...(editing ? { version: raw.version } : {})
    };
    let saved = null;
    const ok = await act.run(async () => {
      saved = editing ? await cmsApi.contents.update(post.id, body) : await cmsApi.contents.create(body);
      if (then === 'submit' && saved?.allowedActions?.includes('submit')) saved = await cmsApi.contents.workflow(saved.id, 'submit');
      return saved;
    }, r => r?.message || (then === 'submit' ? 'Đã lưu và gửi duyệt' : editing ? 'Đã lưu bài viết' : 'Đã tạo bản nháp'));
    if (ok && !editing && saved?.id) navigate(`/cms/bai-viet/moi/${saved.id}`, { replace: true });
  };

  /* Tải ảnh lên Media thư viện từ trình soạn thảo → trả URL để chèn vào bài */
  const uploadImage = async file => {
    const m = await cmsApi.media.upload(file, { folder: 'Tin tức' });
    await reload();
    return mediaUrl(m.url);
  };

  const preview = () => {
    const url = externalUrl(`/tin-tuc/${effSlug}`);
    if (url) window.open(url, '_blank', 'noopener');
  };
  const addAttachment = () => {
    if (!newAtt.title.trim()) return;
    setAttachments(a => [...a, { title: newAtt.title.trim(), meta: newAtt.meta.trim() || null, url: null }]);
    setNewAtt({ title: '', meta: '' });
  };

  return <>
      <Head title={editing ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'} sub={editing ? `CMS-03 · ${post.title}` : 'CMS-03 · Biên tập nội dung'} right={<Link to="/cms/bai-viet" className="humg-btn humg-btn--ghost humg-btn--sm"><Icon name="external" size={13} /> Về danh sách</Link>} />
      {id && !post && <p className="cms-empty" role="alert">Không tìm thấy bài viết #{id}.</p>}
      <Notice error={act.error} notice={act.notice} />
      <Panel flush key={id || 'new'}>
        <div className="cms-langbar">
          <LangPills lang={contentLang} onChange={setContentLang} status={enStatus} />
          <span className="cms-langbar__hint">Danh mục, đường dẫn, ảnh & lịch xuất bản dùng chung cho mọi ngôn ngữ</span>
        </div>
        {contentLang === 'en' && <div className="cms-langnote">
            <Icon name="globe" size={15} />
            <p>Đang biên tập <strong>bản Tiếng Anh</strong>. Nếu chưa hoàn tất, website và My eUni Portal sẽ tự hiển thị bản Tiếng Việt cho người dùng chọn EN.</p>
            <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={copyFromVi}>
              <Icon name="download" size={13} /> Sao chép nội dung từ bản Tiếng Việt
            </button>
          </div>}
        {editing && <div style={{ padding: '12px 16px 0' }}><WorkflowBar api={cmsApi.contents} record={raw} noun="bài viết" /></div>}
        {readOnly && <p className="cms-banner is-info" style={{ margin: '0 16px 12px' }}><Icon name="eye" size={14} /> Bạn chỉ có quyền xem bài viết này{raw.status === 'pending_review' ? ' (đang chờ duyệt)' : ''}.</p>}
        <div className="ps-tabs">
          {tabs.map(t => <button key={t} type="button" className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>{t}</button>)}
        </div>
        <div className="ps-tabbody">
          <div className="cms-editor">
            <div className="cms-editor__main">
              {tab === 'Thông tin chung' && <div className="cms-form">
                  <label>Tiêu đề ({contentLang.toUpperCase()}) <span className="cms-req">*</span>
                    <input type="text" value={cur.title} onChange={e => setCur({ title: e.target.value })} placeholder={contentLang === 'en' ? 'English title…' : undefined} />
                  </label>
                  <div className="cms-form__two">
                    <label>Danh mục <span className="cms-req">*</span>
                      <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                        {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </label>
                    <label>Đường dẫn (Slug)
                      <input type="text" value={slug} onChange={e => setSlug(e.target.value)} placeholder={slugify(fields.vi.title) || 'tu-dong-tao-tu-tieu-de'} />
                    </label>
                  </div>
                  <label>Tóm tắt ({contentLang.toUpperCase()})
                    <textarea rows="3" value={cur.excerpt} onChange={e => setCur({ excerpt: e.target.value })} placeholder={contentLang === 'en' ? 'English excerpt…' : undefined} />
                  </label>
                </div>}
              {tab === 'Nội dung' && <div className="cms-form">
                  <RichTextEditor key={contentLang} value={cur.content} onChange={html => setCur({ content: html })} onUploadImage={uploadImage} placeholder={contentLang === 'en' ? 'Enter the English content here…' : 'Nhập nội dung bài viết…'} />
                </div>}
              {tab === 'SEO' && <div className="cms-form">
                  <label>Tiêu đề SEO<input type="text" value={cur.seoTitle} onChange={e => setCur({ seoTitle: e.target.value })} /></label>
                  <label>Mô tả SEO (Meta description)<textarea rows="3" value={cur.seoDesc} onChange={e => setCur({ seoDesc: e.target.value })} /></label>
                  <label>Từ khóa<input type="text" value={cur.seoKeywords} onChange={e => setCur({ seoKeywords: e.target.value })} /></label>
                  <div className="cms-seopreview">
                    <strong>{cur.seoTitle || '(chưa có tiêu đề SEO)'}</strong>
                    <span>https://humg.edu.vn/{contentLang === 'en' ? 'en/' : ''}tin-tuc/{effSlug}</span>
                    <p>{cur.seoDesc}</p>
                  </div>
                </div>}
              {tab === 'Hình ảnh & File' && <div className="cms-form">
                  <label>Ảnh đại diện</label>
                  <div className="cms-uploadbox">
                    {featured_ ? <span className="cms-thumbpreview"><img src={mediaUrl(featured_.url)} alt={featured_.name} onError={e => { e.currentTarget.style.visibility = 'hidden' }} /><span className="ps-muted" style={{ fontSize: 12 }}>{featured_.name}</span></span> : <span className="humg-ph" data-ratio="16-9"><span>Chưa chọn ảnh</span></span>}
                    <span className="cms-uploadbox__act">
                      <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={() => setPicker(true)}><Icon name="image" size={13} /> Chọn ảnh</button>
                      {featuredImageId && <button type="button" className="cms-rowbtn is-danger" onClick={() => setFeaturedImageId(null)}><Icon name="x" size={13} /> Gỡ ảnh</button>}
                    </span>
                  </div>
                  <label>Tệp đính kèm</label>
                  {attachments.length === 0 && <p className="ps-muted" style={{ margin: 0, fontSize: 12 }}>Chưa có tệp đính kèm.</p>}
                  {attachments.map((a, i) => <div key={i} className="cms-filelist">
                      <span><Icon name="file" size={14} /> {a.title}{a.meta ? ` · ${a.meta}` : ''}</span>
                      <button type="button" className="cms-rowbtn is-danger" onClick={() => setAttachments(list => list.filter((_, j) => j !== i))}><Icon name="x" size={13} /> Gỡ</button>
                    </div>)}
                  <div className="cms-form__two">
                    <label>Tên tệp / tài liệu<input type="text" value={newAtt.title} onChange={e => setNewAtt(s => ({ ...s, title: e.target.value }))} placeholder="VD: Chương trình hội thảo" /></label>
                    <label>Thông tin thêm<input type="text" value={newAtt.meta} onChange={e => setNewAtt(s => ({ ...s, meta: e.target.value }))} placeholder="PDF · 820 KB" /></label>
                  </div>
                  <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={addAttachment}><Icon name="file" size={13} /> Thêm tệp đính kèm</button>
                </div>}
              {tab === 'Lịch sử' && editing && <HistoryPanel api={cmsApi.contents} record={raw} canRestore={!readOnly} />}
              {tab === 'Khác' && <div className="cms-form">
                  <label>Đơn vị sở hữu (quyết định ai được sửa / duyệt theo phân quyền đơn vị)
                    <select value={ownerUnitCode} onChange={e => setOwnerUnitCode(e.target.value)}>
                      {cmsOrgUnits.filter(u => u.kind !== 'class').map(u => <option key={u.code} value={u.code}>{'— '.repeat(u.depth)}{u.name}</option>)}
                    </select>
                  </label>
                  <div className="cms-form__two">
                    <label>Tác giả hiển thị<input type="text" value={author} onChange={e => setAuthor(e.target.value)} /></label>
                    <label>Nguồn / Trích dẫn<input type="text" value={source} onChange={e => setSource(e.target.value)} placeholder="VD: Phòng Truyền thông" /></label>
                  </div>
                  <div className="cms-form__two">
                    <label>Đơn vị đăng<input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="VD: Phòng Đào tạo" /></label>
                    <label>Thẻ (tags, cách nhau bằng dấu phẩy)<input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="trắc địa, GIS, hội thảo" /></label>
                  </div>
                </div>}
            </div>

            <aside className="cms-editor__side">
              <div className="cms-side-card">
                <h4>Hiển thị & lịch đăng</h4>
                <Toggle checked={showHome} onChange={setShowHome} label="Hiển thị trang chủ" />
                <Toggle checked={featured} onChange={setFeatured} label="Bài viết nổi bật" />
                <label>Thời gian đăng (hẹn giờ)<input type="datetime-local" value={publishAt} onChange={e => setPublishAt(e.target.value)} /></label>
                <label>Thời gian hết hạn<input type="datetime-local" value={expireAt} onChange={e => setExpireAt(e.target.value)} /></label>
              </div>
              <div className="cms-side-card">
                <h4>Bản dịch</h4>
                <p className="cms-langtabs__note">Tiếng Việt luôn là bản gốc. Chọn trạng thái cho các bản dịch phụ.</p>
                <label>Tiếng Anh (EN)
                  <select value={enStatus} onChange={e => setEnStatus(e.target.value)}>
                    {cmsI18nStatuses.map(s => <option key={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              <div className="cms-side-actions">
                {!readOnly && <button type="button" disabled={act.busy} className="humg-btn humg-btn--primary humg-btn--block" onClick={() => save()}>{act.busy ? 'Đang lưu…' : editing ? (raw.status === 'published' && !actions.includes('unpublish') ? 'Gửi bản sửa đổi' : 'Lưu') : 'Lưu bản nháp'}</button>}
                {!readOnly && (!editing || actions.includes('submit')) && <button type="button" disabled={act.busy} className="humg-btn humg-btn--ghost humg-btn--block humg-btn--sm" onClick={() => save('submit')}>Lưu & gửi duyệt</button>}
                <button type="button" className="humg-btn humg-btn--ghost humg-btn--block humg-btn--sm" onClick={preview}><Icon name="eye" size={13} /> Xem trên website</button>
              </div>
            </aside>
          </div>
        </div>
      </Panel>
      {picker && <MediaPicker onClose={() => setPicker(false)} onPick={m => { setFeaturedImageId(m.id); setPicked(m); setPicker(false); }} />}
    </>;
}
