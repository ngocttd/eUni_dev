'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { LinkList, Panel, FilterBar, DataTable, TileGrid } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, norm, shell } from "../shared.jsx";
export function StfTeachingPage() {
  const { stfTeaching } = useModuleData('staff-hub');
  const [term, setTerm] = useState(stfTeaching.terms[0]);
  const [group, setGroup] = useState('Tất cả');
  const [q, setQ] = useState('');
  const reset = () => {
    setTerm(stfTeaching.terms[0]);
    setGroup('Tất cả');
    setQ('');
  };
  const rows = useMemo(() => stfTeaching.schedule.filter(s => s.term === term && (group === 'Tất cả' || s.group === group) && (!q || norm(`${s.course} ${s.group} ${s.room}`).includes(norm(q)))), [term, group, q]);
  return shell({
    title: 'Giảng dạy & Đào tạo',
    lead: stfTeaching.intro,
    crumbs: [{
      label: 'Giảng viên / Cán bộ',
      to: '/giang-vien'
    }, {
      label: 'Giảng dạy & Đào tạo'
    }],
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={stfTeaching.quickLinks} />
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Lịch giảng dạy theo lớp học phần" icon="calendar" action={<Link to="/hoc-tap/lich-hoc?vaitro=giang-vien" className="humg-link-more">Công cụ tra cứu đầy đủ <Icon name="arrow-right" size={14} /></Link>}>
          <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo học phần, lớp, phòng…" selects={[{
          label: 'Học kỳ',
          value: term,
          onChange: setTerm,
          options: stfTeaching.terms
        }, {
          label: 'Lớp học phần',
          value: group,
          onChange: setGroup,
          options: stfTeaching.groups
        }]} count={rows.length} total={stfTeaching.schedule.filter(s => s.term === term).length} onReset={reset} />
          <DataTable columns={['Thứ', 'Tiết', 'Học phần', 'TC', 'Lớp học phần', 'Phòng', 'Tuần']} rows={rows.map(s => [s.day, s.period, s.course, String(s.credits), s.group, s.room, s.weeks])} />
          {rows.length === 0 && <p className="stf-muted">Không có lịch phù hợp bộ lọc.</p>}
          <p className="stf-note" style={{
          marginTop: 12
        }}>
            <Icon name="calendar" size={13} /> Lịch giảng dạy cá nhân, thay đổi phòng và lịch coi thi được cập nhật trên My eUni Giảng viên.
          </p>
        </Panel>
        <Panel title="Nội dung & quy định giảng dạy" icon="book"><TileGrid items={stfTeaching.resources} cols={3} /></Panel>
      </>
  });
}
