'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { LinkList, Panel, FilterBar } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, rnorm, shell } from "../shared.jsx";
export function ResearchGroupsPage() {
  const { researchGroups } = useModuleData('research');
  const [q, setQ] = useState('');
  const [field, setField] = useState('Tất cả');
  const [sort, setSort] = useState('Thành lập mới nhất');
  const fields = ['Tất cả', ...Array.from(new Set(researchGroups.map(g => g.field)))];
  const reset = () => {
    setQ('');
    setField('Tất cả');
    setSort('Thành lập mới nhất');
  };
  const list = useMemo(() => {
    let r = researchGroups.filter(g => (field === 'Tất cả' || g.field === field) && (!q || rnorm(`${g.name} ${g.focus} ${g.leader}`).includes(rnorm(q))));
    if (sort === 'Thành lập mới nhất') r = [...r].sort((a, b) => b.established - a.established);else if (sort === 'Nhiều thành viên') r = [...r].sort((a, b) => b.members - a.members);else r = [...r].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    return r;
  }, [q, field, sort]);
  return shell({
    title: 'Nhóm nghiên cứu',
    lead: 'Các nhóm nghiên cứu và nhóm nghiên cứu mạnh của Trường Đại học Mỏ - Địa chất.',
    crumbs: [{
      label: 'Nghiên cứu',
      to: '/nghien-cuu'
    }, {
      label: 'Nhóm nghiên cứu'
    }],
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={[{
        label: 'Danh sách chuyên gia',
        to: '/nghien-cuu/chuyen-gia'
      }, {
        label: 'Đề tài / Dự án',
        to: '/nghien-cuu/de-tai'
      }, {
        label: 'Phòng thí nghiệm',
        to: '/nghien-cuu/phong-thi-nghiem'
      }]} />
        {SUPPORT}
      </>,
    children: <Panel title="Danh sách nhóm nghiên cứu" icon="target">
        <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo tên nhóm, hướng nghiên cứu, trưởng nhóm…" selects={[{
        label: 'Lĩnh vực',
        value: field,
        onChange: setField,
        options: fields
      }]} sort={sort} onSort={setSort} sortOptions={['Thành lập mới nhất', 'Nhiều thành viên', 'Tên A → Z']} count={list.length} total={researchGroups.length} onReset={reset} />
        <div className="res-groupgrid">
          {list.map(g => <Link key={g.id} to={`/nghien-cuu/nhom-nghien-cuu/${g.id}`} className="res-groupcard">
              <span className="res-groupcard__cover humg-ph" data-ratio="16-9"><span>{g.name}</span></span>
              <span className="res-groupcard__body">
                <strong>{g.name}</strong>
                <em>{g.field}</em>
                <span className="res-groupcard__meta"><Icon name="user" size={12} /> {g.leader}</span>
                <span className="res-groupcard__meta"><Icon name="users" size={12} /> {g.members} thành viên · Thành lập {g.established}</span>
              </span>
              <span className="res-groupcard__go">Xem chi tiết <Icon name="arrow-right" size={13} /></span>
            </Link>)}
        </div>
        {list.length === 0 && <p className="res-lead">Không tìm thấy nhóm nghiên cứu phù hợp.</p>}
      </Panel>
  });
}
