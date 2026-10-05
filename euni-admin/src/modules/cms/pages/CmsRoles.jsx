'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";
import Icon from "../../../shared/lib/Icon.jsx";
import { Panel, DataTable } from "../../../shared/components/ui/page.jsx";
import { cmsApi } from "../../../lib/api/cmsApi.js";
import { useAction, Notice, confirmDelete } from "../actions.jsx";
import { Head } from "../shared.jsx";

export function CmsRoles() {
  const { cmsPermissionMatrix: m, cmsRoles } = useModuleData('cms');
  const act = useAction();
  const [sel, setSel] = useState(null); // null = thêm mới · role = đang sửa
  const [v, setV] = useState({ name: '', desc: '', copyFrom: cmsRoles[cmsRoles.length - 1]?.code || '' });
  const [edits, setEdits] = useState(null); // ma trận đang chỉnh (null = chưa thay đổi)
  const editing = sel != null;
  const rows = edits ?? m.rows;
  const set = k => e => setV(s => ({ ...s, [k]: e.target.value }));

  const pick = r => { setSel(r); setV({ name: r.role, desc: r.desc, copyFrom: r.code }); act.clear(); };
  const reset = keep => { setSel(null); setV({ name: '', desc: '', copyFrom: cmsRoles[cmsRoles.length - 1]?.code || '' }); if (keep !== true) act.clear(); };
  const submit = async e => {
    e.preventDefault();
    const ok = await act.run(() => (editing
      ? cmsApi.roles.update(sel.id, { name: v.name.trim(), description: v.desc })
      : cmsApi.roles.create({ name: v.name.trim(), description: v.desc, copyFrom: v.copyFrom })), editing ? 'Đã lưu vai trò' : 'Đã tạo vai trò');
    if (ok) reset(true);
  };
  const remove = () => confirmDelete(`vai trò "${sel.role}"`) && act.run(() => cmsApi.roles.remove(sel.id), 'Đã xóa vai trò').then(ok => ok && reset(true));

  const toggle = (ri, ci) => {
    if (m.roleCodes[ci] === 'super_admin') return; // Super Admin luôn toàn quyền
    const next = rows.map((row, i) => (i === ri ? { ...row, perms: row.perms.map((p, j) => (j === ci ? !p : p)) } : row));
    setEdits(next);
  };
  const saveMatrix = () => act.run(() => cmsApi.roles.savePermissionMatrix({ roles: m.roleCodes, rows }), 'Đã lưu phân quyền').then(ok => ok && setEdits(null));

  return <>
      <Head title="Vai trò & Phân quyền" sub="Nhóm quyền và ma trận phân quyền theo chức năng" right={<button type="button" className="humg-btn humg-btn--primary humg-btn--sm" onClick={reset}>
          <Icon name="shield" size={13} /> Thêm vai trò
        </button>} />
      <Notice error={act.error} notice={act.notice} />
      <div className="cms-rolecards">
        {cmsRoles.map(r => <button key={r.code} type="button" className={`cms-rolecard${editing && sel.code === r.code ? ' is-active' : ''}`} onClick={() => pick(r)}>
            <div className="cms-rolecard__top"><strong>{r.role}</strong><span>{r.users} tài khoản</span></div>
            <p>{r.desc}</p>
          </button>)}
      </div>

      <Panel title={editing ? `Chỉnh sửa vai trò · ${sel.role}` : 'Thêm vai trò mới'} icon="shield">
        <form className="cms-form" onSubmit={submit}>
          <div className="cms-form__two">
            <label>Tên vai trò <span className="cms-req">*</span>
              <input type="text" required value={v.name} onChange={set('name')} placeholder="VD: Biên tập viên khoa" />
            </label>
            {!editing && <label>Sao chép quyền từ
              <select value={v.copyFrom} onChange={set('copyFrom')}>
                {cmsRoles.map(r => <option key={r.code} value={r.code}>{r.role}</option>)}
              </select>
            </label>}
          </div>
          <label>Mô tả <span className="cms-req">*</span>
            <textarea rows="2" required value={v.desc} onChange={set('desc')} placeholder="Mô tả phạm vi quyền của vai trò" />
          </label>
          <div className="cms-form__actions">
            <button type="submit" disabled={act.busy} className="humg-btn humg-btn--primary humg-btn--sm">
              {editing ? 'Lưu thay đổi' : 'Tạo vai trò'}
            </button>
            {editing && <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={reset}>Hủy</button>}
            {editing && !sel.isSystem && <button type="button" className="cms-rowbtn is-danger" onClick={remove}><Icon name="x" size={13} /> Xóa vai trò</button>}
          </div>
          {editing && sel.isSystem && <p className="ps-muted" style={{ margin: 0, fontSize: 12 }}>Vai trò hệ thống: có thể đổi mô tả nhưng không thể xóa.</p>}
        </form>
      </Panel>

      <Panel title="Ma trận phân quyền" icon="shield" flush>
        <DataTable columns={['Chức năng', ...m.roles]} rows={rows.map((row, ri) => [row.module, ...row.perms.map((ok, ci) => <button key={ci} type="button" onClick={() => toggle(ri, ci)} disabled={m.roleCodes[ci] === 'super_admin'} className={`cms-perm ${ok ? 'is-on' : 'is-off'}`} title={m.roleCodes[ci] === 'super_admin' ? 'Super Admin luôn toàn quyền' : 'Bấm để bật/tắt'} style={{ cursor: m.roleCodes[ci] === 'super_admin' ? 'default' : 'pointer', border: 0, background: 'transparent' }}>
                <Icon name={ok ? 'check' : 'x'} size={13} />
              </button>)])} />
        <div className="cms-form__actions" style={{ padding: '14px 16px' }}>
          <button type="button" disabled={act.busy || !edits} className="humg-btn humg-btn--primary humg-btn--sm" onClick={saveMatrix}>{act.busy ? 'Đang lưu…' : 'Lưu phân quyền'}</button>
          {edits && <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={() => setEdits(null)}>Hoàn tác thay đổi</button>}
        </div>
      </Panel>
    </>;
}
