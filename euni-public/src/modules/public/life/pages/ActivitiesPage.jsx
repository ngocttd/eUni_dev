'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { useState, useMemo } from "react";
import { LinkList, Panel, Chips, FilterBar, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import { SUPPORT, datePast, lnorm, shell } from "../shared.jsx";
export function ActivitiesPage() {
  const { activities } = useModuleData('life');
  const tags = ['Tất cả', ...Array.from(new Set(activities.map(a => a.tag)))];
  const [tag, setTag] = useState('Tất cả');
  const [type, setType] = useState('Tất cả');
  const [q, setQ] = useState('');
  const list = useMemo(() => activities.filter(a => (tag === 'Tất cả' || a.tag === tag) && (type === 'Tất cả' || a.tag === type) && (!q || lnorm(`${a.title} ${a.place} ${a.organizer}`).includes(lnorm(q)))), [tag, type, q]);
  return shell({
    title: 'Hoạt động sinh viên',
    lead: 'Sự kiện, phong trào, cuộc thi và hoạt động trải nghiệm của sinh viên HUMG.',
    crumbs: [{
      label: 'Đời sống',
      to: '/doi-song'
    }, {
      label: 'Hoạt động sinh viên'
    }],
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={[{
        label: 'Câu lạc bộ sinh viên',
        to: '/doi-song/cau-lac-bo'
      }, {
        label: 'Đoàn – Hội',
        to: '/doi-song/doan-hoi'
      }, {
        label: 'Thể thao – Văn hóa',
        to: '/doi-song/the-thao-van-hoa'
      }]} />
        {SUPPORT}
      </>,
    children: <Panel title="Danh sách hoạt động" icon="calendar">
        <Chips options={tags.map(t => ({
        key: t,
        label: t
      }))} value={tag} onChange={setTag} />
        <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm hoạt động theo tên, đơn vị tổ chức…" selects={[{
        label: 'Loại hoạt động',
        value: type,
        onChange: setType,
        options: tags
      }]} count={list.length} total={activities.length} onReset={() => {
        setTag('Tất cả');
        setType('Tất cả');
        setQ('');
      }} />
        <DataTable columns={['#', 'Tên hoạt động', 'Loại', 'Thời gian', 'Đơn vị tổ chức', 'Trạng thái', '']} rows={list.map((a, i) => [String(i + 1), <Link key="t" to={`/doi-song/hoat-dong-sinh-vien/${a.slug}`}>{a.title}</Link>, a.tag, a.date, a.organizer, <span key="s" className={`life-tag ${datePast(a.date) ? 'is-done' : 'is-open'}`}>{datePast(a.date) ? 'Đã kết thúc' : 'Sắp diễn ra'}</span>, <Link key="a" to={`/doi-song/hoat-dong-sinh-vien/${a.slug}`} className="humg-link-more">Chi tiết</Link>])} />
        {list.length === 0 && <p className="life-note">Không có hoạt động phù hợp.</p>}
      </Panel>
  });
}
