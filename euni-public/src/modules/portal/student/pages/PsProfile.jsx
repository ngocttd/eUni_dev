'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { DataTable } from "../../../../shared/components/ui/page.jsx";
import { PROFILE_SECTIONS, PageHead } from "../shared.jsx";
export function PsProfile() {
  const { psStudent } = useModuleData('portal-student');
  const [sec, setSec] = useState(PROFILE_SECTIONS[0]);
  const s = psStudent;
  return <>
      <PageHead title="Hồ sơ cá nhân" right={<button type="button" className="humg-btn humg-btn--ghost humg-btn--sm">Chỉnh sửa thông tin</button>} />
      <div className="ps-profgrid">
        <aside className="ps-profcard">
          <span className="humg-ph" data-ratio="1-1"><span>Ảnh</span></span>
          <strong>{s.name}</strong>
          <ul>
            <li><span>MSSV</span>{s.mssv}</li>
            <li><span>Email</span>{s.email}</li>
            <li><span>Điện thoại</span>{s.phone}</li>
            <li><span>Khoa</span>{s.faculty}</li>
            <li><span>Chương trình</span>{s.program}</li>
            <li><span>Niên khóa</span>{s.cohort}</li>
          </ul>
          <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm humg-btn--block">Thay ảnh đại diện</button>
        </aside>
        <div className="ps-profmain">
          <div className="ps-tabs ps-tabs--wrap">
            {PROFILE_SECTIONS.map(x => <button key={x} type="button" className={sec === x ? 'is-active' : ''} onClick={() => setSec(x)}>{x}</button>)}
          </div>
          <div className="ps-tabbody">
            {sec === 'Thông tin cá nhân' && <DataTable columns={['Mục', 'Thông tin']} rows={[['Ngày sinh', s.dob], ['Giới tính', s.gender], ['CCCD / Hộ chiếu', s.cccd], ['Quê quán', s.hometown], ['Địa chỉ thường trú', s.address], ['Nơi ở hiện tại', s.currentAddress]]} />}
            {sec === 'Thông tin liên hệ' && <DataTable columns={['Mục', 'Thông tin']} rows={[['Email nhà trường', s.email], ['Email cá nhân', s.personalEmail], ['Số điện thoại', s.phone], ['Địa chỉ báo tin', s.currentAddress], ['Liên hệ khẩn cấp', `${s.emergency.name} (${s.emergency.relation}) · ${s.emergency.phone}`]]} />}
            {sec === 'Thông tin gia đình' && <DataTable columns={['Mục', 'Thông tin']} rows={s.family} />}
            {sec === 'Quá trình học tập' && <DataTable columns={['Năm học', 'Giai đoạn', 'Số TC', 'Điểm TB (hệ 4)', 'Xếp loại']} rows={s.studyHistory} />}
            {sec === 'Giấy tờ – Minh chứng' && <DataTable columns={['Loại giấy tờ', 'Hình thức nộp', 'Trạng thái']} rows={s.documents.map(d => [d[0], d[1], <span key="s" className={`ps-tag ${d[2] === 'Đã xác thực' ? 'ps-tag--done' : 'ps-tag--warn'}`}>{d[2]}</span>])} />}
            {sec === 'Cài đặt bảo mật' && <form className="ps-formgrid" onSubmit={e => e.preventDefault()}>
                <label>Mật khẩu hiện tại<input type="password" /></label>
                <label>Mật khẩu mới<input type="password" /></label>
                <label>Nhập lại mật khẩu mới<input type="password" /></label>
                <label className="ps-formgrid__wide ps-inline"><input type="checkbox" /> Bật xác thực 2 lớp (2FA) qua email</label>
                <button type="submit" className="humg-btn humg-btn--primary">Cập nhật bảo mật</button>
              </form>}
          </div>
        </div>
      </div>
    </>;
}
