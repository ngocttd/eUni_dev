'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { useState } from "react";
import { DataTable } from "../../../../shared/components/ui/page.jsx";
import { Head } from "../shared.jsx";
export function PgProfile() {
  const { pgProfile, pgStaff } = useModuleData('portal-staff');
  const p = pgProfile;
  const [sec, setSec] = useState(p.sections[0]);
  return <>
      <Head title="Hồ sơ cá nhân" right={<button type="button" className="humg-btn humg-btn--ghost humg-btn--sm">Đề nghị cập nhật</button>} />
      <div className="ps-profgrid">
        <aside className="ps-profcard">
          <span className="humg-ph" data-ratio="1-1"><span>Ảnh</span></span>
          <strong>{pgStaff.displayName}</strong>
          <ul>
            <li><span>Mã CB</span>{pgStaff.code}</li>
            <li><span>Email</span>{pgStaff.email}</li>
            <li><span>Điện thoại</span>{pgStaff.phone}</li>
            <li><span>Đơn vị</span>{pgStaff.faculty}</li>
            <li><span>Bộ môn</span>{pgStaff.department}</li>
            <li><span>Chức danh</span>{pgStaff.title}</li>
          </ul>
        </aside>
        <div className="ps-profmain">
          <div className="ps-tabs ps-tabs--wrap">
            {p.sections.map(x => <button key={x} type="button" className={sec === x ? 'is-active' : ''} onClick={() => setSec(x)}>{x}</button>)}
          </div>
          <div className="ps-tabbody">
            {sec === 'Thông tin cá nhân' && <DataTable columns={['Mục', 'Thông tin']} rows={p.personal} />}
            {sec === 'Thông tin công tác' && <DataTable columns={['Mục', 'Thông tin']} rows={p.work} />}
            {sec === 'Trình độ – Học hàm' && <DataTable columns={['Văn bằng / Học vị', 'Nơi đào tạo', 'Năm']} rows={p.degrees} />}
            {sec === 'Quá trình công tác' && <DataTable columns={['Thời gian', 'Chức danh', 'Đơn vị']} rows={p.history} />}
            {sec === 'Giấy tờ – Minh chứng' && <DataTable columns={['Loại giấy tờ', 'Hình thức nộp', 'Trạng thái']} rows={p.documents.map(d => [d[0], d[1], <span key="s" className={`ps-tag ${d[2] === 'Đã xác thực' ? 'ps-tag--done' : 'ps-tag--warn'}`}>{d[2]}</span>])} />}
            {sec === 'Cài đặt bảo mật' && <form className="ps-formgrid" onSubmit={e => e.preventDefault()}>
                <label>Mật khẩu hiện tại<input type="password" /></label>
                <label>Mật khẩu mới<input type="password" /></label>
                <label>Nhập lại mật khẩu mới<input type="password" /></label>
                <label className="ps-formgrid__wide ps-inline"><input type="checkbox" defaultChecked /> Bật xác thực 2 lớp (2FA)</label>
                <button type="submit" className="humg-btn humg-btn--primary">Cập nhật bảo mật</button>
              </form>}
          </div>
        </div>
      </div>
    </>;
}
