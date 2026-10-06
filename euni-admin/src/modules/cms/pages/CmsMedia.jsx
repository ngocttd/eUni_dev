'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo, useRef } from "react";

/* Ảnh xem trước; tệp không phải ảnh hoặc ảnh lỗi thì hiện icon theo loại */
function Thumb({ m }) {
  const [broken, setBroken] = useState(false);
  const isImg = /^(png|jpe?g|gif|webp|svg)$/i.test(m.ext || '');
  return <span className={`cms-media__thumb is-${m.ext === 'pdf' ? 'pdf' : 'img'}`}>
      {isImg && m.url && !broken ? <img src={mediaUrl(m.url)} alt="" loading="lazy" onError={() => setBroken(true)} /> : m.ext === 'pdf' ? <Icon name="file" size={26} /> : <Icon name="image" size={22} />}
      <em>{String(m.ext || '').toUpperCase()}</em>
    </span>;
}
import Icon from "../../../shared/lib/Icon.jsx";
import { Panel, FilterBar } from "../../../shared/components/ui/page.jsx";
import { mediaUrl } from "../../../lib/api/media.js";
import { cmsApi } from "../../../lib/api/cmsApi.js";
import { useAction, Notice, confirmDelete } from "../actions.jsx";
import { Head, norm } from "../shared.jsx";

export function CmsMedia() {
  const { cmsMedia, cmsMediaTotal, cmsMediaTabs, cmsMediaCategories } = useModuleData('cms');
  const act = useAction();
  const [copied, setCopied] = useState(null);
  const copyLink = async m => {
    const url = mediaUrl(m.url);
    try { await navigator.clipboard.writeText(url); setCopied(m.id); setTimeout(() => setCopied(null), 1500); } catch { window.prompt('Sao chép đường dẫn:', url); }
  };
  const fileRef = useRef(null);
  const [tab, setTab] = useState('Tất cả');
  const [cat, setCat] = useState('Tất cả danh mục');
  const [q, setQ] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folder, setFolder] = useState(cmsMediaCategories[1]);
  const [files, setFiles] = useState([]);
  const list = useMemo(() => cmsMedia.filter(m => {
    if (tab !== 'Tất cả' && m.kind !== tab) return false;
    if (q && !norm(m.name).includes(norm(q))) return false;
    return true;
  }), [cmsMedia, tab, q]);

  const upload = async e => {
    e.preventDefault();
    if (!files.length) return;
    const ok = await act.run(async () => { for (const f of files) await cmsApi.media.upload(f, { folder }); }, `Đã tải lên ${files.length} tệp`);
    if (ok) { setFiles([]); if (fileRef.current) fileRef.current.value = ''; setUploadOpen(false); }
  };
  const remove = m => confirmDelete(`tệp "${m.name}"`) && act.run(() => cmsApi.media.remove(m.id), 'Đã xóa tệp');

  return <>
      <Head title="Media thư viện" sub={`${cmsMediaTotal} tệp · hình ảnh, tài liệu, video, âm thanh`} right={<button type="button" className="humg-btn humg-btn--primary humg-btn--sm" onClick={() => setUploadOpen(v => !v)} aria-expanded={uploadOpen}>
          <Icon name="upload" size={13} /> {uploadOpen ? 'Đóng khung tải lên' : 'Tải lên'}
        </button>} />
      <Notice error={act.error} notice={act.notice} />
      <Panel flush>
        <div className="ps-tabs">
          {cmsMediaTabs.map(t => <button key={t} type="button" className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>{t}</button>)}
        </div>
        <div className="ps-tabbody">
          {uploadOpen && <form className="cms-form cms-uploadpanel" onSubmit={upload}>
              <div className="cms-form__two">
                <label>Chọn tệp
                  <span className="cms-file">
                    <input ref={fileRef} type="file" multiple onChange={e => setFiles([...e.target.files])} />
                    <span className="cms-file__btn"><Icon name="upload" size={13} /> Chọn tệp</span>
                    <span>{files.length ? files.length === 1 ? files[0].name : `${files.length} tệp đã chọn` : 'Ảnh, PDF, video, âm thanh — chọn được nhiều tệp'}</span>
                  </span>
                </label>
                <label>Danh mục
                  <select value={folder} onChange={e => setFolder(e.target.value)}>
                    {cmsMediaCategories.filter(c => c !== 'Tất cả danh mục').map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
              </div>
              <div className="cms-form__actions">
                <button type="submit" disabled={act.busy || !files.length} className="humg-btn humg-btn--primary humg-btn--sm"><Icon name="upload" size={13} /> {act.busy ? 'Đang tải lên…' : `Tải lên${files.length ? ` (${files.length})` : ''}`}</button>
                <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={() => setUploadOpen(false)}>Hủy</button>
              </div>
            </form>}
          <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm kiếm tệp…" selects={[{
          label: 'Danh mục',
          value: cat,
          onChange: setCat,
          options: cmsMediaCategories
        }]} count={list.length} total={cmsMediaTotal} onReset={() => {
          setQ('');
          setCat('Tất cả danh mục');
        }} />
          <div className="cms-media">
            {list.map(m => <figure key={m.id} className="cms-media__item">
                <Thumb m={m} />
                <figcaption>
                  <strong title={m.name}>{m.name}</strong>
                  <span>{m.date} · {m.size}</span>
                  <span className="cms-rowact" style={{ marginTop: 6 }}>
                    <button type="button" className="cms-rowbtn" onClick={() => copyLink(m)} title={`Sao chép đường dẫn của ${m.name} để dán vào bài viết`} aria-label={`Sao chép đường dẫn ${m.name}`}><Icon name="copy" size={13} /> {copied === m.id ? 'Đã chép' : 'Chép link'}</button>
                    <button type="button" className="cms-rowbtn is-danger" onClick={() => remove(m)} title={`Xóa ${m.name}`} aria-label={`Xóa ${m.name}`}><Icon name="trash" size={13} /> Xóa</button>
                  </span>
                </figcaption>
              </figure>)}
          </div>
          {!list.length && <p className="cms-empty">Không tìm thấy tệp phù hợp.</p>}
          <div className="cms-pagefoot">
            <span>Hiển thị {list.length} trong tổng số {cmsMediaTotal} tệp</span>
          </div>
        </div>
      </Panel>
    </>;
}
