'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { Panel, FilterBar, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { QUICKLINKS, SUPPORT, norm, shell, yearOf } from "../shared.jsx";
export function StfRegulationsPage() {
  const { stfRegulations } = useModuleData('staff-hub');
  const [q, setQ] = useState('');
  const [type, setType] = useState('Tất cả');
  const [year, setYear] = useState('Tất cả');
  const [sort, setSort] = useState('Mới nhất');
  const years = ['Tất cả', ...Array.from(new Set(stfRegulations.docs.map(d => yearOf(d.date)))).sort().reverse()];
  const reset = () => {
    setQ('');
    setType('Tất cả');
    setYear('Tất cả');
    setSort('Mới nhất');
  };
  const list = useMemo(() => {
    let r = stfRegulations.docs.filter(d => (type === 'Tất cả' || d.type === type) && (year === 'Tất cả' || yearOf(d.date) === year) && (!q || norm(d.title).includes(norm(q))));
    const toTs = d => Number(d.date.split('/').reverse().join(''));
    if (sort === 'Mới nhất') r = [...r].sort((a, b) => toTs(b) - toTs(a));else if (sort === 'Cũ nhất') r = [...r].sort((a, b) => toTs(a) - toTs(b));else r = [...r].sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    return r;
  }, [q, type, year, sort]);
  return shell({
    title: 'Quy định – Quy chế',
    lead: stfRegulations.intro,
    crumbs: [{
      label: 'Giảng viên / Cán bộ',
      to: '/giang-vien'
    }, {
      label: 'Quy định – Quy chế'
    }],
    sidebar: <>
        {QUICKLINKS}
        {SUPPORT}
      </>,
    children: <Panel title="Văn bản quy định – quy chế" icon="shield">
        <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo tiêu đề văn bản…" selects={[{
        label: 'Loại văn bản',
        value: type,
        onChange: setType,
        options: stfRegulations.categories
      }, {
        label: 'Năm ban hành',
        value: year,
        onChange: setYear,
        options: years
      }]} sort={sort} onSort={setSort} sortOptions={['Mới nhất', 'Cũ nhất', 'Tên A → Z']} count={list.length} total={stfRegulations.docs.length} onReset={reset} />
        <DataTable columns={['Tiêu đề', 'Loại văn bản', 'Ngày ban hành', 'File']} rows={list.map(d => [d.title, <span key="t" className="stf-tag">{d.type}</span>, d.date, <a key="f" href="#" className="stf-dl" aria-label={`Tải ${d.title}`}><Icon name="download" size={15} /> PDF</a>])} />
        {list.length === 0 && <p className="stf-muted">Không tìm thấy văn bản phù hợp.</p>}
      </Panel>
  });
}
