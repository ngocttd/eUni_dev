'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Head } from "../shared.jsx";
export function PpChild() {
  const { ppChild } = useModuleData('portal-parent');
  const [tab, setTab] = useState('cn');
  const c = ppChild;
  return <>
      <Head title="Thông tin sinh viên" />
      <Panel flush>
        <div className="ps-tabs">
          <button type="button" className={tab === 'cn' ? 'is-active' : ''} onClick={() => setTab('cn')}>Thông tin cá nhân</button>
          <button type="button" className={tab === 'dt' ? 'is-active' : ''} onClick={() => setTab('dt')}>Thông tin đào tạo</button>
          <button type="button" className={tab === 'gd' ? 'is-active' : ''} onClick={() => setTab('gd')}>Thông tin gia đình</button>
        </div>
        <div className="ps-tabbody ps-profile">
          <div className="ps-profile__photo"><span className="humg-ph" data-ratio="1-1"><span>Ảnh</span></span></div>
          {tab === 'cn' && <DataTable columns={['Mục', 'Thông tin']} rows={[['Họ và tên', c.name], ['MSSV', c.mssv], ['Ngày sinh', c.dob], ['Giới tính', c.gender], ['Dân tộc', c.ethnic], ['CCCD', c.cccd], ['Ngày cấp', c.issued], ['Nơi cấp', c.issuedBy], ['Email nhà trường', c.email], ['Địa chỉ', c.address]]} />}
          {tab === 'dt' && <DataTable columns={['Mục', 'Thông tin']} rows={[['Khoa', c.faculty], ['Ngành', c.major], ['Chương trình', c.program], ['Hệ đào tạo', c.mode], ['Lớp', c.class], ['Khóa', c.cohort], ['Năm học hiện tại', c.year]]} />}
          {tab === 'gd' && <DataTable columns={['Mục', 'Thông tin']} rows={c.family} />}
        </div>
      </Panel>
    </>;
}
