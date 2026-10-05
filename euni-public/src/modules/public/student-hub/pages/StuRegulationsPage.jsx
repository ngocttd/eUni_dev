'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { Panel, FilterBar, DocList } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { QUICKLINKS, SUPPORT, norm, shell } from "../shared.jsx";
export function StuRegulationsPage() {
  const { stuRegulations } = useModuleData('student-hub');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Tất cả');
  const [sort, setSort] = useState('Liên quan');
  const reset = () => {
    setQ('');
    setCat('Tất cả');
    setSort('Liên quan');
  };
  const list = useMemo(() => {
    let r = stuRegulations.docs.filter(d => (cat === 'Tất cả' || d.category === cat) && (!q || norm(d.name).includes(norm(q))));
    if (sort === 'Tên A → Z') r = [...r].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    return r;
  }, [q, cat, sort]);
  return shell({
    title: 'Quy chế sinh viên',
    lead: stuRegulations.intro,
    crumbs: [{
      label: 'Sinh viên',
      to: '/sinh-vien'
    }, {
      label: 'Quy chế sinh viên'
    }],
    sidebar: <>
        {QUICKLINKS}
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Văn bản quy chế – quy định" icon="shield">
          <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo tên văn bản…" selects={[{
          label: 'Nhóm quy chế',
          value: cat,
          onChange: setCat,
          options: stuRegulations.categories
        }]} sort={sort} onSort={setSort} sortOptions={['Liên quan', 'Tên A → Z']} count={list.length} total={stuRegulations.docs.length} onReset={reset} />
          <DocList items={list.map(d => ({
          name: d.name,
          meta: d.meta
        }))} />
          {list.length === 0 && <p className="stu-muted">Không tìm thấy văn bản phù hợp.</p>}
        </Panel>
        <Panel title="Lưu ý" icon="bell">
          <p className="stu-note"><Icon name="shield" size={14} /> {stuRegulations.note}</p>
        </Panel>
      </>
  });
}
