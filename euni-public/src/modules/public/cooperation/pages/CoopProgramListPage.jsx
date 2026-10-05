'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { LinkList, Panel, StatRow, FilterBar, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import { SUPPORT, StatusTag, cnorm, shell } from "../shared.jsx";
export function CoopProgramListPage() {
  const { coopPrograms, coopProgramTypes } = useModuleData('cooperation');
  const [q, setQ] = useState('');
  const [type, setType] = useState('Tất cả');
  const [status, setStatus] = useState('Tất cả');
  const statuses = ['Tất cả', ...Array.from(new Set(coopPrograms.map(p => p.status)))];
  const list = useMemo(() => coopPrograms.filter(p => (type === 'Tất cả' || p.type === type) && (status === 'Tất cả' || p.status === status) && (!q || cnorm(`${p.title} ${p.partner} ${p.field}`).includes(cnorm(q)))), [q, type, status]);
  return shell({
    title: 'Chương trình / Dự án hợp tác',
    lead: 'Các chương trình liên kết đào tạo, nghiên cứu chung, trao đổi và dự án tài trợ với đối tác trong và ngoài nước.',
    crumbs: [{
      label: 'Hợp tác',
      to: '/hop-tac'
    }, {
      label: 'Chương trình / Dự án'
    }],
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={[{
        label: 'Danh sách đối tác',
        to: '/hop-tac/doi-tac'
      }, {
        label: 'Chương trình trao đổi',
        to: '/hop-tac/trao-doi'
      }, {
        label: 'Mẫu đề xuất hợp tác',
        to: '/hoc-tap/bieu-mau'
      }]} />
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Thống kê" icon="award">
          <StatRow items={[{
          value: String(coopPrograms.length),
          label: 'Chương trình / dự án'
        }, {
          value: '24',
          label: 'Liên kết đào tạo'
        }, {
          value: '46',
          label: 'Quốc gia'
        }, {
          value: '350+',
          label: 'Lượt trao đổi / năm'
        }]} />
        </Panel>
        <Panel title="Danh sách chương trình / dự án" icon="layers">
          <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo tên chương trình, đối tác, lĩnh vực…" selects={[{
          label: 'Loại',
          value: type,
          onChange: setType,
          options: coopProgramTypes
        }, {
          label: 'Trạng thái',
          value: status,
          onChange: setStatus,
          options: statuses
        }]} count={list.length} total={coopPrograms.length} onReset={() => {
          setQ('');
          setType('Tất cả');
          setStatus('Tất cả');
        }} />
          <DataTable columns={['#', 'Tên chương trình / dự án', 'Đối tác', 'Thời gian', 'Trạng thái', '']} rows={list.map((p, i) => [String(i + 1), <Link key="t" to={`/hop-tac/chuong-trinh-du-an/${p.id}`}>{p.title}</Link>, p.partner, `${p.startYear}–${p.endYear}`, <StatusTag key="s" status={p.status} />, <Link key="a" to={`/hop-tac/chuong-trinh-du-an/${p.id}`} className="humg-link-more">Chi tiết</Link>])} />
          {list.length === 0 && <p className="coop-note">Không tìm thấy chương trình phù hợp.</p>}
        </Panel>
      </>
  });
}
