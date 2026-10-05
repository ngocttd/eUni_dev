'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { Panel, FilterBar, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { Head, ProgBar, SUP_SORTS, Stats, Tag, norm } from "../shared.jsx";
export function PgSupervision() {
  const { pgSupervision, pgTerm } = useModuleData('portal-staff');
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('Tất cả');
  const [status, setStatus] = useState('Tất cả');
  const [sort, setSort] = useState(SUP_SORTS[0]);
  const rows = useMemo(() => {
    let r = pgSupervision.list.filter(x => {
      if (kind !== 'Tất cả' && x[2] !== kind) return false;
      if (status !== 'Tất cả' && x[6] !== status) return false;
      if (q && !norm(`${x[0]} ${x[1]} ${x[3]}`).includes(norm(q))) return false;
      return true;
    });
    r = [...r].sort((a, b) => sort === SUP_SORTS[0] ? b[5] - a[5] : sort === SUP_SORTS[1] ? a[5] - b[5] : norm(a[1]).localeCompare(norm(b[1])));
    return r;
  }, [q, kind, status, sort]);
  return <>
      <Head title="Hướng dẫn đồ án / luận văn" sub={`Đồ án, khóa luận, luận văn và luận án đã và đang hướng dẫn · ${pgTerm}`} />
      <Stats items={pgSupervision.stats} four />
      <Panel flush>
        <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo MSSV, họ tên hoặc tên đề tài…" selects={[{
        label: 'Loại',
        value: kind,
        onChange: setKind,
        options: pgSupervision.kinds
      }, {
        label: 'Trạng thái',
        value: status,
        onChange: setStatus,
        options: pgSupervision.statuses
      }]} sort={sort} onSort={setSort} sortOptions={SUP_SORTS} count={rows.length} total={pgSupervision.list.length} onReset={() => {
        setQ('');
        setKind('Tất cả');
        setStatus('Tất cả');
        setSort(SUP_SORTS[0]);
      }} />
        <DataTable columns={['MSSV', 'Học viên / Sinh viên', 'Loại', 'Tên đề tài', 'Bắt đầu', 'Tiến độ', 'Trạng thái', '']} rows={rows.map(r => [r[0], r[1], r[2], r[3], r[4], <ProgBar key="p" pct={r[5]} />, <Tag key="t" v={r[6]} />, <Link key="a" to="/euni/giang-vien/sinh-vien" className="humg-link-more">Chi tiết</Link>])} />
        {!rows.length && <p className="ps-empty">Không có đề tài nào khớp bộ lọc.</p>}
      </Panel>
      <Panel title="Thao tác nhanh" icon="grid">
        <div className="ps-servicegrid">
          <Link to="/euni/giang-vien/huong-dan-do-an/giao-de-tai" className="ps-service"><span className="ps-service__ic"><Icon name="file" size={20} /></span>Giao đề tài mới</Link>
          <Link to="/euni/giang-vien/huong-dan-do-an/duyet-nhat-ky" className="ps-service"><span className="ps-service__ic"><Icon name="check" size={20} /></span>Duyệt nhật ký tiến độ</Link>
          <Link to="/euni/giang-vien/huong-dan-do-an/lich-bao-ve" className="ps-service"><span className="ps-service__ic"><Icon name="calendar" size={20} /></span>Lịch bảo vệ</Link>
          <Link to="/euni/giang-vien/huong-dan-do-an/nhap-diem" className="ps-service"><span className="ps-service__ic"><Icon name="award" size={20} /></span>Nhập điểm hướng dẫn</Link>
        </div>
      </Panel>
    </>;
}
