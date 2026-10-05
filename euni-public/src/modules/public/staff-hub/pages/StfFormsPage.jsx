'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { Panel, FilterBar, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { QUICKLINKS, SUPPORT, fileType, norm, shell } from "../shared.jsx";
export function StfFormsPage() {
  const { stfForms } = useModuleData('staff-hub');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Tất cả');
  const [ft, setFt] = useState('Tất cả');
  const [sort, setSort] = useState('Liên quan');
  const fileTypes = ['Tất cả', ...Array.from(new Set(stfForms.list.map(f => fileType(f.meta)))).sort()];
  const reset = () => {
    setQ('');
    setCat('Tất cả');
    setFt('Tất cả');
    setSort('Liên quan');
  };
  const list = useMemo(() => {
    let r = stfForms.list.filter(f => (cat === 'Tất cả' || f.category === cat) && (ft === 'Tất cả' || fileType(f.meta) === ft) && (!q || norm(f.name).includes(norm(q)) || norm(f.desc).includes(norm(q))));
    if (sort === 'Tên A → Z') r = [...r].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    return r;
  }, [q, cat, ft, sort]);
  return shell({
    title: 'Biểu mẫu chung',
    lead: stfForms.intro,
    crumbs: [{
      label: 'Giảng viên / Cán bộ',
      to: '/giang-vien'
    }, {
      label: 'Biểu mẫu chung'
    }],
    sidebar: <>
        {QUICKLINKS}
        {SUPPORT}
      </>,
    children: <Panel title="Danh mục biểu mẫu" icon="layers">
        <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo tên hoặc mô tả biểu mẫu…" selects={[{
        label: 'Nhóm biểu mẫu',
        value: cat,
        onChange: setCat,
        options: stfForms.categories
      }, {
        label: 'Định dạng',
        value: ft,
        onChange: setFt,
        options: fileTypes
      }]} sort={sort} onSort={setSort} sortOptions={['Liên quan', 'Tên A → Z']} count={list.length} total={stfForms.list.length} onReset={reset} />
        <DataTable columns={['Biểu mẫu', 'Mô tả', 'Tải về']} rows={list.map(f => [f.name, <span key="d" className="stf-muted">{f.desc}</span>, <a key="dl" href="#" className="stf-dl" aria-label={`Tải ${f.name}`}><Icon name="download" size={15} /> {f.meta}</a>])} />
        {list.length === 0 && <p className="stf-muted">Không tìm thấy biểu mẫu phù hợp.</p>}
      </Panel>
  });
}
