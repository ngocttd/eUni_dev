'use client'
import { cmsUserRoles, cmsUserStatuses } from '../../../config/static/cms.js'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";
import Icon from "../../../shared/lib/Icon.jsx";
import { Panel, FilterBar, DataTable, Pagination } from "../../../shared/components/ui/page.jsx";
import { cmsApi } from "../../../lib/api/cmsApi.js";
import { useAction, Notice, confirmDelete } from "../actions.jsx";
import { Head, RowActions, Tag, USER_STATES, norm } from "../shared.jsx";

const empty = { name: '', email: '', roleCode: '', status: 'Hoạt động' };

export function CmsUsers() {
  const { cmsUsers, cmsUserTotal, cmsRoles } = useModuleData('cms');
  const act = useAction();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('Tất cả vai trò');
  const [status, setStatus] = useState('Tất cả trạng thái');
  const [sel, setSel] = useState(null); // null = thêm mới · user = đang sửa
  const [v, setV] = useState({ ...empty, roleCode: cmsRoles.find(r => r.code === 'author')?.code || cmsRoles[0]?.code || '' });
  const list = useMemo(() => cmsUsers.filter(u => {
    if (role !== 'Tất cả vai trò' && u.role !== role) return false;
    if (status !== 'Tất cả trạng thái' && u.status !== status) return false;
    if (q && !norm(`${u.name} ${u.email}`).includes(norm(q))) return false;
    return true;
  }), [cmsUsers, q, role, status]);
  const editing = sel != null;
  const set = k => e => setV(s => ({ ...s, [k]: e.target.value }));
  const blank = () => ({ ...empty, roleCode: cmsRoles.find(r => r.code === 'author')?.code || cmsRoles[0]?.code || '' });

  const edit = u => { setSel(u); setV({ name: u.name, email: u.email, roleCode: u.roleCode, status: u.status }); act.clear(); };
  const reset = keep => { setSel(null); setV(blank()); if (keep !== true) act.clear(); };
  const remove = u => confirmDelete(`người dùng "${u.name}"`) && act.run(() => cmsApi.users.remove(u.id), 'Đã xóa người dùng').then(ok => ok && sel?.id === u.id && reset(true));
  const submit = async e => {
    e.preventDefault();
    const body = { fullName: v.name.trim(), email: v.email.trim(), roleCode: v.roleCode, status: v.status === 'Hoạt động' ? 1 : 0 };
    const ok = await act.run(() => (editing ? cmsApi.users.update(sel.id, body) : cmsApi.users.create(body)), editing ? 'Đã lưu người dùng' : 'Đã tạo người dùng');
    if (ok) reset(true);
  };

  return <>
      <Head title="Quản lý người dùng" sub={`${cmsUserTotal} tài khoản quản trị / biên tập`} right={<button type="button" className="humg-btn humg-btn--primary humg-btn--sm" onClick={reset}>
          <Icon name="users" size={13} /> Thêm người dùng
        </button>} />
      <Notice error={act.error} notice={act.notice} />
      <div className="ps-grid2">
        <Panel flush>
          <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm kiếm theo tên, email…" selects={[{
          label: 'Vai trò',
          value: role,
          onChange: setRole,
          options: cmsUserRoles
        }, {
          label: 'Trạng thái',
          value: status,
          onChange: setStatus,
          options: cmsUserStatuses
        }]} count={list.length} total={cmsUserTotal} onReset={() => {
          setQ('');
          setRole('Tất cả vai trò');
          setStatus('Tất cả trạng thái');
        }} />
          <DataTable columns={['#', 'Họ và tên', 'Email', 'Vai trò', 'Trạng thái', 'Đăng nhập cuối', 'Thao tác']} rows={list.map((u, i) => [String(i + 1), u.name, u.email, u.role, <Tag key="t" v={u.status} />, u.last, <RowActions key="a" onEdit={() => edit(u)} onDelete={() => remove(u)} />])} />
          {!list.length && <p className="cms-empty">Không có người dùng nào khớp bộ lọc.</p>}
          <div className="cms-pagefoot">
            <span>Hiển thị 1 – {list.length} trong tổng số {cmsUserTotal} người dùng</span>
            <Pagination page={1} total={Math.max(1, Math.ceil(cmsUserTotal / 20))} />
          </div>
        </Panel>
        <Panel title={editing ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'} icon="users">
          <form className="cms-form" onSubmit={submit}>
            <label>Họ và tên <span className="cms-req">*</span>
              <input type="text" required value={v.name} onChange={set('name')} placeholder="Nhập họ và tên" />
            </label>
            <label>Email <span className="cms-req">*</span>
              <input type="email" required value={v.email} onChange={set('email')} placeholder="ten@humg.edu.vn" />
            </label>
            <div className="cms-form__two">
              <label>Vai trò
                <select value={v.roleCode} onChange={set('roleCode')}>
                  {cmsRoles.map(r => <option key={r.code} value={r.code}>{r.role}</option>)}
                </select>
              </label>
              <label>Trạng thái
                <select value={v.status} onChange={set('status')}>
                  {USER_STATES.map(x => <option key={x}>{x}</option>)}
                </select>
              </label>
            </div>
            {!editing && <p className="ps-muted" style={{ margin: 0, fontSize: 12 }}>
                Mật khẩu khởi tạo sẽ được gửi tới email của người dùng.
              </p>}
            <div className="cms-form__actions">
              <button type="submit" disabled={act.busy} className="humg-btn humg-btn--primary humg-btn--sm">
                {act.busy ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Tạo người dùng'}
              </button>
              {editing && <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" onClick={reset}>Hủy</button>}
            </div>
          </form>
        </Panel>
      </div>
    </>;
}
