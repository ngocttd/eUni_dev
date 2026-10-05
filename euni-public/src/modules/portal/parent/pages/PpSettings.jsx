'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";
import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";

import Icon from "../../../../shared/lib/Icon.jsx";
import { Head } from "../shared.jsx";
export function PpSettings() {
  const { ppParent, ppLinks } = useModuleData('portal-parent');
  const [tab, setTab] = useState('tk');
  return <>
      <Head title="Cài đặt tài khoản" />
      <Panel flush>
        <div className="ps-tabs">
          <button type="button" className={tab === 'tk' ? 'is-active' : ''} onClick={() => setTab('tk')}>Thông tin tài khoản</button>
          <button type="button" className={tab === 'mk' ? 'is-active' : ''} onClick={() => setTab('mk')}>Đổi mật khẩu</button>
          <button type="button" className={tab === 'lk' ? 'is-active' : ''} onClick={() => setTab('lk')}>Quản lý liên kết</button>
        </div>
        <div className="ps-tabbody">
          {tab === 'tk' && <DataTable columns={['Mục', 'Thông tin']} rows={[['Họ và tên', ppParent.name], ['Quan hệ với sinh viên', ppParent.relation], ['Email', ppParent.email], ['Số điện thoại', ppParent.phone], ['Địa chỉ', ppParent.address]]} />}
          {tab === 'mk' && <form className="ps-formgrid" onSubmit={e => e.preventDefault()}>
              <label>Mật khẩu hiện tại<input type="password" /></label>
              <label>Mật khẩu mới<input type="password" /></label>
              <label>Nhập lại mật khẩu mới<input type="password" /></label>
              <button type="submit" className="humg-btn humg-btn--primary">Cập nhật</button>
            </form>}
          {tab === 'lk' && <>
              <DataTable columns={['STT', 'Họ và tên', 'MSSV', 'Lớp', 'Quan hệ']} rows={ppLinks} />
              <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" style={{
            marginTop: 12
          }}><Icon name="arrow-right" size={13} /> Thêm học sinh</button>
            </>}
        </div>
      </Panel>
    </>;
}
