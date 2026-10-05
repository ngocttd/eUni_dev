'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { LinkList, Panel, StatRow, FilterBar, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import { SUPPORT, rnorm, shell } from "../shared.jsx";
export function PublicationListPage() {
  const { publications, publicationTypes } = useModuleData('research');
  const [q, setQ] = useState('');
  const [type, setType] = useState('Tất cả');
  const [year, setYear] = useState('Tất cả');
  const [sort, setSort] = useState('Mới nhất');
  const years = ['Tất cả', ...Array.from(new Set(publications.map(p => String(p.year)))).sort().reverse()];
  const reset = () => {
    setQ('');
    setType('Tất cả');
    setYear('Tất cả');
    setSort('Mới nhất');
  };
  const list = useMemo(() => {
    let r = publications.filter(p => (type === 'Tất cả' || p.type === type) && (year === 'Tất cả' || String(p.year) === year) && (!q || rnorm(`${p.title} ${p.authors} ${p.journal}`).includes(rnorm(q))));
    if (sort === 'Mới nhất') r = [...r].sort((a, b) => b.year - a.year);else if (sort === 'Cũ nhất') r = [...r].sort((a, b) => a.year - b.year);else r = [...r].sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    return r;
  }, [q, type, year, sort]);
  return shell({
    title: 'Công bố khoa học',
    lead: 'Danh mục bài báo, công trình khoa học của cán bộ, giảng viên và nghiên cứu sinh HUMG.',
    crumbs: [{
      label: 'Nghiên cứu',
      to: '/nghien-cuu'
    }, {
      label: 'Công bố khoa học'
    }],
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={[{
        label: 'Đề tài / Dự án',
        to: '/nghien-cuu/de-tai'
      }, {
        label: 'Danh sách chuyên gia',
        to: '/nghien-cuu/chuyen-gia'
      }, {
        label: 'Nhóm nghiên cứu',
        to: '/nghien-cuu/nhom-nghien-cuu'
      }, {
        label: 'Tòa soạn Tạp chí KHKT Mỏ - Địa chất',
        to: '/gioi-thieu/don-vi-truc-thuoc/tap-chi-khoa-hoc'
      }]} />
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Thống kê" icon="award">
          <StatRow items={[{
          value: '1.247',
          label: 'Tổng công bố'
        }, {
          value: '652',
          label: 'Quốc tế (ISI/Scopus)'
        }, {
          value: '325',
          label: 'Trong nước'
        }, {
          value: '270',
          label: 'Hội nghị / khác'
        }]} />
        </Panel>
        <Panel title="Danh sách công bố" icon="newspaper">
          <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo tiêu đề, tác giả, tạp chí…" selects={[{
          label: 'Loại công bố',
          value: type,
          onChange: setType,
          options: publicationTypes
        }, {
          label: 'Năm',
          value: year,
          onChange: setYear,
          options: years
        }]} sort={sort} onSort={setSort} sortOptions={['Mới nhất', 'Cũ nhất', 'Tên A → Z']} count={list.length} total={publications.length} onReset={reset} />
          <DataTable columns={['#', 'Tên công bố', 'Tác giả', 'Tạp chí / Hội nghị', 'Năm', 'CSDL']} rows={list.map((p, i) => [String(i + 1), <Link key="t" to={`/nghien-cuu/cong-bo/${p.id}`}>{p.title}{p.quartile !== '—' && <span className="res-q res-q--sm">{p.quartile}</span>}</Link>, p.authors, p.journal, String(p.year), p.quartile !== '—' ? 'Scopus / WoS' : 'Trong nước'])} />
          {list.length === 0 && <p className="res-lead">Không tìm thấy công bố phù hợp.</p>}
        </Panel>
      </>
  });
}
