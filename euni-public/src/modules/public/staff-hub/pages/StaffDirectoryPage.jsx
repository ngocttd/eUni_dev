'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { Panel, FilterBar, DataTable } from "../../../../shared/components/ui/page.jsx";
import { QUICKLINKS, SUPPORT, norm, shell } from "../shared.jsx";
export function StaffDirectoryPage() {
  const { staffDirectory } = useModuleData('staff-hub');
  const [uq, setUq] = useState('');
  const units = useMemo(() => staffDirectory.units.filter(u => !uq || norm(`${u.unit} ${u.head}`).includes(norm(uq))), [uq]);
  return shell({
    title: 'Danh bạ đơn vị & Phòng họp',
    lead: 'Tra cứu số máy, hộp thư của các đơn vị trong Trường và đăng ký sử dụng phòng họp.',
    crumbs: [{
      label: 'Giảng viên / Cán bộ',
      to: '/giang-vien'
    }, {
      label: 'Danh bạ đơn vị & Phòng họp'
    }],
    sidebar: <>
        {QUICKLINKS}
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Danh bạ đơn vị" icon="users">
          <FilterBar search={uq} onSearch={setUq} searchPlaceholder="Tìm theo tên đơn vị hoặc người phụ trách…" count={units.length} total={staffDirectory.units.length} onReset={() => setUq('')} />
          <DataTable columns={['Đơn vị', 'Người phụ trách', 'Số máy', 'Hộp thư']} rows={units.map(u => [u.unit, u.head, u.phone, u.email])} />
          {units.length === 0 && <p className="stf-muted">Không tìm thấy đơn vị phù hợp.</p>}
        </Panel>
        <Panel title="Phòng họp" icon="building">
          <DataTable columns={['Phòng', 'Vị trí', 'Sức chứa', 'Thiết bị', 'Trạng thái']} rows={staffDirectory.rooms.map(r => [r.name, r.location, `${r.capacity} chỗ`, r.equipment, <span key="s" className={`stf-tag ${r.free ? '' : 'is-busy'}`}>{r.status}</span>])} />
          <p className="stf-muted">Đăng ký sử dụng phòng họp qua My eUni hoặc liên hệ Phòng Hành chính – Tổng hợp (máy lẻ 101).</p>
        </Panel>
      </>
  });
}
