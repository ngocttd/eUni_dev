'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useRef, useState } from "react";
import { Panel, DataTable } from "../../../shared/components/ui/page.jsx";
import Icon from "../../../shared/lib/Icon.jsx";
import { cmsApi } from "../../../lib/api/cmsApi.js";
import { useAction, Notice, confirmDelete } from "../actions.jsx";
import { Head, Tag } from "../shared.jsx";

export function CmsBackup() {
  const { cmsBackups, cmsBackupInfo } = useModuleData('cms');
  const act = useAction();
  const fileRef = useRef(null);
  const restorable = cmsBackups.filter(b => b.hasData);
  const [pick, setPick] = useState('');
  const [file, setFile] = useState(null);
  const selected = pick || restorable[0]?.id || '';

  const create = () => act.run(() => cmsApi.backups.create(), 'Đã tạo bản sao lưu');
  const remove = b => confirmDelete(`bản sao lưu ${b.time}`) && act.run(() => cmsApi.backups.remove(b.id), 'Đã xóa bản sao lưu');
  const download = b => act.run(() => cmsApi.backups.download(b.id), 'Đã tải tệp sao lưu');
  const restore = e => {
    e.preventDefault();
    if (!file && !selected) return;
    const what = file ? `tệp "${file.name}"` : `bản sao lưu ${cmsBackups.find(b => String(b.id) === String(selected))?.time}`;
    if (!window.confirm(`Phục hồi từ ${what}? Toàn bộ dữ liệu CMS hiện tại sẽ bị ghi đè.`)) return;
    act.run(() => (file ? cmsApi.backups.restoreFile(file) : cmsApi.backups.restore(selected)), 'Đã phục hồi dữ liệu').then(ok => {
      if (ok) { setFile(null); if (fileRef.current) fileRef.current.value = ''; }
    });
  };

  return <>
      <Head title="Sao lưu & Phục hồi" sub="Tạo bản sao lưu toàn bộ dữ liệu và phục hồi khi cần" />
      <Notice error={act.error} notice={act.notice} />
      <div className="ps-grid2">
        <div className="cms-col">
          <Panel title="Sao lưu dữ liệu" icon="download">
            <p className="ps-muted" style={{ marginBottom: 12 }}>
              Tạo bản sao lưu toàn bộ dữ liệu (bài viết, danh mục, người dùng, media, cấu hình).
            </p>
            <button type="button" disabled={act.busy} className="humg-btn humg-btn--primary" onClick={create}><Icon name="download" size={14} /> {act.busy ? 'Đang xử lý…' : 'Tạo sao lưu ngay'}</button>
          </Panel>
          <Panel title="Lịch sử sao lưu" icon="clock" flush>
            <DataTable columns={['Thời gian', 'Dung lượng', 'Người tạo', 'Trạng thái', 'Thao tác']} rows={cmsBackups.map(b => [b.time, b.size, b.by, <Tag key="t" v={b.status} />, <span key="a" className="cms-rowact">
                  <button type="button" className="cms-rowbtn" disabled={!b.hasData || act.busy} onClick={() => download(b)} title={b.hasData ? 'Tải tệp sao lưu về máy' : 'Bản sao lưu cũ không còn dữ liệu để tải'}><Icon name="download" size={13} /> Tải</button>
                  <button type="button" className="cms-rowbtn is-danger" onClick={() => remove(b)}><Icon name="x" size={13} /> Xóa</button>
                </span>])} />
          </Panel>
        </div>
        <div className="cms-col">
          <Panel title="Phục hồi dữ liệu" icon="rocket">
            <form className="cms-form" onSubmit={restore}>
              <label>Chọn từ bản sao lưu đã có
                <select value={selected} onChange={e => setPick(e.target.value)} disabled={!restorable.length || !!file}>
                  {restorable.length ? restorable.map(b => <option key={b.id} value={b.id}>{b.time} · {b.size}</option>) : <option value="">Chưa có bản sao lưu nào có dữ liệu</option>}
                </select>
              </label>
              <label>Hoặc tải lên tệp sao lưu (.json)
                <input ref={fileRef} type="file" accept=".json,application/json" onChange={e => setFile(e.target.files?.[0] || null)} />
              </label>
              <div className="cms-warn"><Icon name="shield" size={14} /> Việc phục hồi sẽ ghi đè toàn bộ dữ liệu hiện tại. Hãy tạo bản sao lưu mới trước khi thực hiện.</div>
              <button type="submit" disabled={act.busy || (!file && !selected)} className="humg-btn humg-btn--primary">{act.busy ? 'Đang xử lý…' : 'Phục hồi ngay'}</button>
            </form>
          </Panel>
          <Panel title="Thông tin" icon="bell">
            <ul className="ps-check">
              {cmsBackupInfo.map(t => <li key={t}><Icon name="check" size={14} /> {t}</li>)}
            </ul>
          </Panel>
        </div>
      </div>
    </>;
}
