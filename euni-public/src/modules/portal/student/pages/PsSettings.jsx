'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { useState } from "react";
import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import { PageHead } from "../shared.jsx";
export function PsSettings() {
  const { psSettings } = useModuleData('portal-student');
  const s = psSettings;
  const [prefs, setPrefs] = useState(() => Object.fromEntries(s.prefs.map(p => [p.key, p.on])));
  return <>
      <PageHead title="Cài đặt tài khoản" />
      <Panel title="Thông tin tài khoản" icon="user">
        <DataTable columns={['Mục', 'Thông tin']} rows={s.account} />
      </Panel>
      <Panel title="Tùy chọn thông báo" icon="bell">
        <ul className="ps-prefs">
          {s.prefs.map(p => <li key={p.key}>
              <span>{p.label}</span>
              <button type="button" className={`ps-toggle ${prefs[p.key] ? 'is-on' : ''}`} aria-pressed={prefs[p.key]} onClick={() => setPrefs(v => ({
            ...v,
            [p.key]: !v[p.key]
          }))}><i /></button>
            </li>)}
        </ul>
      </Panel>
      <Panel title="Đổi mật khẩu" icon="lock">
        <form className="ps-formgrid" onSubmit={e => e.preventDefault()}>
          <label>Mật khẩu hiện tại<input type="password" /></label>
          <label>Mật khẩu mới<input type="password" /></label>
          <label>Nhập lại mật khẩu mới<input type="password" /></label>
          <button type="submit" className="humg-btn humg-btn--primary">Cập nhật</button>
        </form>
      </Panel>
      <Panel title="Phiên đăng nhập gần đây" icon="shield">
        <DataTable columns={['Thiết bị', 'Vị trí', 'Thời gian', 'Trạng thái']} rows={s.sessions} />
      </Panel>
    </>;
}
