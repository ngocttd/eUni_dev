'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo, useRef } from "react";
import Icon from "../../../shared/lib/Icon.jsx";
import { Panel, FilterBar, Pagination } from "../../../shared/components/ui/page.jsx";
import { cmsApi } from "../../../lib/api/cmsApi.js";
import { useAction, Notice, confirmDelete } from "../actions.jsx";
import { Head, norm } from "../shared.jsx";

export function CmsMedia() {
  const { cmsMedia, cmsMediaTotal, cmsMediaTabs, cmsMediaCategories } = useModuleData('cms');
  const act = useAction();
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
      <Head title="Media thư viện" sub={`${cmsMediaTotal} tệp · hình ảnh, tài liệu, video, âm thanh`} right={<button type="button" className="humg-btn humg-btn--primary humg-btn--sm" onClick={() => setUploadOpen(v => !v)}>
          <Icon name="image" size={13} /> Tải lên
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
                  <input ref={fileRef} type="file" multiple onChange={e => setFiles([...e.target.files])} />
                </label>
                <label>Danh mục
                  <select value={folder} onChange={e => setFolder(e.target.value)}>
                    {cmsMediaCategories.filter(c => c !== 'Tất cả danh mục').map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
              </div>
              <div className="cms-form__actions">
                <button type="submit" disabled={act.busy || !files.length} className="humg-btn humg-btn--primary humg-btn--sm"><Icon name="image" size={13} /> {act.busy ? 'Đang tải lên…' : `Tải lên${files.length ? ` (${files.length})` : ''}`}</button>
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
                <span className={`cms-media__thumb is-${m.ext === 'pdf' ? 'pdf' : 'img'}`}>
                  {m.ext === 'pdf' ? <Icon name="file" size={26} /> : <Icon name="image" size={22} />}
                  <em>{String(m.ext || '').toUpperCase()}</em>
                </span>
                <figcaption>
                  <strong title={m.name}>{m.name}</strong>
                  <span>{m.date} · {m.size}</span>
                  <button type="button" className="cms-rowbtn is-danger" onClick={() => remove(m)} style={{ marginTop: 6 }}><Icon name="x" size={13} /> Xóa</button>
                </figcaption>
              </figure>)}
          </div>
          {!list.length && <p className="cms-empty">Không tìm thấy tệp phù hợp.</p>}
          <div className="cms-pagefoot">
            <span>Hiển thị 1 – {list.length} trong tổng số {cmsMediaTotal} tệp</span>
            <Pagination page={1} total={Math.max(1, Math.ceil(cmsMediaTotal / 20))} />
          </div>
        </div>
      </Panel>
    </>;
}
