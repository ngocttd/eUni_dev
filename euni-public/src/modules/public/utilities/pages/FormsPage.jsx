'use client'
import { forms } from '../../../../config/static/utilities.js'
import { useState, useMemo } from "react";

import { PageShell, LinkList, SupportCard, Panel, FilterBar, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { EDU_NAV, allForms, fileType, norm } from "../shared.jsx";
export function FormsPage() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Tất cả');
  const [ft, setFt] = useState('Tất cả');
  const [sort, setSort] = useState('Liên quan');
  const cats = ['Tất cả', ...forms.categories.map(c => c.name)];
  const fileTypes = ['Tất cả', ...Array.from(new Set(allForms.map(d => fileType(d.meta)))).sort()];
  const reset = () => {
    setQ('');
    setCat('Tất cả');
    setFt('Tất cả');
    setSort('Liên quan');
  };
  const list = useMemo(() => {
    let r = allForms.filter(d => (cat === 'Tất cả' || d.category === cat) && (ft === 'Tất cả' || fileType(d.meta) === ft) && (!q || norm(d.name).includes(norm(q))));
    if (sort === 'Tên A → Z') r = [...r].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    return r;
  }, [q, cat, ft, sort]);
  return <PageShell sectionNav={EDU_NAV} accent="#0284c7" eyebrow="Học tập" title="Biểu mẫu – Tra cứu" lead="Kho biểu mẫu dùng chung trong đào tạo, học phí – học bổng, công tác sinh viên, nghiên cứu khoa học và hành chính." crumbs={[{
    label: 'Học tập',
    to: '/hoc-tap'
  }, {
    label: 'Biểu mẫu'
  }]} sidebar={<>
          <LinkList title="Nhóm biểu mẫu" items={forms.categories.map(c => ({
      label: `${c.name} (${c.docs.length})`,
      to: '#'
    }))} />
          <SupportCard title="Cần hỗ trợ?" lead="Không tìm thấy biểu mẫu bạn cần?" phone="024.3838.2222" email="daotao@humg.edu.vn" cta={{
      label: 'Liên hệ Phòng Đào tạo',
      to: '/lien-he'
    }} />
        </>}>
      <Panel title="Kho biểu mẫu" icon="file">
        <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm biểu mẫu theo tên…" selects={[{
        label: 'Nhóm biểu mẫu',
        value: cat,
        onChange: setCat,
        options: cats
      }, {
        label: 'Định dạng',
        value: ft,
        onChange: setFt,
        options: fileTypes
      }]} sort={sort} onSort={setSort} sortOptions={['Liên quan', 'Tên A → Z']} count={list.length} total={allForms.length} onReset={reset} />
        <DataTable columns={['Tên biểu mẫu', 'Nhóm', 'Tải về']} rows={list.map(d => [d.name, <span key="c" className="util-muted">{d.category}</span>, <a key="dl" href="#" className="util-dl" aria-label={`Tải ${d.name}`}><Icon name="download" size={15} /> {d.meta}</a>])} />
        {list.length === 0 && <p className="util-muted">Không tìm thấy biểu mẫu phù hợp.</p>}
      </Panel>
    </PageShell>;
}
