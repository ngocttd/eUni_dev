'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { LinkList, Panel, StatRow, FilterBar } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, StatusTag, projectPct, rnorm, shell } from "../shared.jsx";
export function ProjectListPage() {
  const { projects, projectLevels } = useModuleData('research');
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('Tất cả');
  const [status, setStatus] = useState('Tất cả');
  const [field, setField] = useState('Tất cả');
  const [sort, setSort] = useState('Mới nhất');
  const statuses = ['Tất cả', ...Array.from(new Set(projects.map(p => p.status)))];
  const fields = ['Tất cả', ...Array.from(new Set(projects.map(p => p.field)))];
  const reset = () => {
    setQ('');
    setLevel('Tất cả');
    setStatus('Tất cả');
    setField('Tất cả');
    setSort('Mới nhất');
  };
  const list = useMemo(() => {
    let r = projects.filter(p => (level === 'Tất cả' || p.level === level) && (status === 'Tất cả' || p.status === status) && (field === 'Tất cả' || p.field === field) && (!q || rnorm(`${p.title} ${p.code} ${p.leader}`).includes(rnorm(q))));
    if (sort === 'Mới nhất') r = [...r].sort((a, b) => b.startYear - a.startYear);else if (sort === 'Cũ nhất') r = [...r].sort((a, b) => a.startYear - b.startYear);else r = [...r].sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    return r;
  }, [q, level, status, field, sort]);
  return shell({
    title: 'Đề tài / Dự án',
    lead: 'Danh sách đề tài, dự án khoa học công nghệ các cấp của Trường Đại học Mỏ - Địa chất.',
    crumbs: [{
      label: 'Nghiên cứu',
      to: '/nghien-cuu'
    }, {
      label: 'Đề tài / Dự án'
    }],
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={[{
        label: 'Công bố khoa học',
        to: '/nghien-cuu/cong-bo'
      }, {
        label: 'Danh sách chuyên gia',
        to: '/nghien-cuu/chuyen-gia'
      }, {
        label: 'Nhóm nghiên cứu',
        to: '/nghien-cuu/nhom-nghien-cuu'
      }, {
        label: 'Mẫu thuyết minh đề tài',
        to: '/hoc-tap/bieu-mau'
      }]} />
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Thống kê" icon="award">
          <StatRow items={[{
          value: '142',
          label: 'Tổng số đề tài'
        }, {
          value: '48',
          label: 'Đang thực hiện'
        }, {
          value: '76',
          label: 'Đã nghiệm thu'
        }, {
          value: '18',
          label: 'Cấp Nhà nước / Bộ'
        }]} />
        </Panel>
        <Panel title="Danh sách đề tài" icon="flask">
          <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo tên, mã số, chủ nhiệm…" selects={[{
          label: 'Cấp đề tài',
          value: level,
          onChange: setLevel,
          options: projectLevels
        }, {
          label: 'Trạng thái',
          value: status,
          onChange: setStatus,
          options: statuses
        }, {
          label: 'Lĩnh vực',
          value: field,
          onChange: setField,
          options: fields
        }]} sort={sort} onSort={setSort} sortOptions={['Mới nhất', 'Cũ nhất', 'Tên A → Z']} count={list.length} total={projects.length} onReset={reset} />
          <div className="res-cards">
            {list.map(p => {
            const pct = projectPct(p);
            return <Link key={p.id} to={`/nghien-cuu/de-tai/${p.id}`} className="res-card">
                  <span className="res-card__ic"><Icon name="flask" size={18} /></span>
                  <div className="res-card__body">
                    <div className="res-card__top">
                      <strong>{p.title}</strong>
                      <StatusTag status={p.status} />
                    </div>
                    <p className="res-card__meta">Mã số: {p.code} · {p.level} · {p.field}</p>
                    <p className="res-card__meta">Chủ nhiệm: {p.leader} · {p.startYear}–{p.endYear}{p.budget ? ` · Kinh phí: ${p.budget}` : ''}</p>
                    <div className="res-progress">
                      <span className="res-progress__track"><span style={{
                      width: `${pct}%`
                    }} /></span>
                      <span className="res-progress__val">{pct}%</span>
                    </div>
                  </div>
                </Link>;
          })}
          </div>
          {list.length === 0 && <p className="res-lead">Không tìm thấy đề tài phù hợp.</p>}
        </Panel>
      </>
  });
}
