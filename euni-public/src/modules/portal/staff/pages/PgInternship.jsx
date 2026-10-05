'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { Panel, FilterBar, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { Head, Stats, Tag, norm } from "../shared.jsx";
export function PgInternship() {
  const { pgInternship } = useModuleData('portal-staff');
  const [round, setRound] = useState(pgInternship.rounds[0]);
  const [q, setQ] = useState('');
  const [company, setCompany] = useState('Tất cả');
  const [status, setStatus] = useState('Tất cả');
  const rows = useMemo(() => pgInternship.list.filter(x => {
    if (company !== 'Tất cả' && x[3] !== company) return false;
    if (status !== 'Tất cả' && x[7] !== status) return false;
    if (q && !norm(`${x[0]} ${x[1]} ${x[2]} ${x[3]}`).includes(norm(q))) return false;
    return true;
  }), [q, company, status]);
  return <>
      <Head title="Thực tập doanh nghiệp" sub="Danh sách sinh viên thực tập tại doanh nghiệp do tôi phụ trách" right={<label className="ps-filter"><span>Đợt</span>
          <select value={round} onChange={e => setRound(e.target.value)}>{pgInternship.rounds.map(r => <option key={r}>{r}</option>)}</select>
        </label>} />
      <Stats items={pgInternship.stats} four />
      <Panel flush>
        <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo MSSV, họ tên, lớp hoặc doanh nghiệp…" selects={[{
        label: 'Doanh nghiệp',
        value: company,
        onChange: setCompany,
        options: pgInternship.companies
      }, {
        label: 'Trạng thái',
        value: status,
        onChange: setStatus,
        options: pgInternship.statuses
      }]} count={rows.length} total={pgInternship.list.length} onReset={() => {
        setQ('');
        setCompany('Tất cả');
        setStatus('Tất cả');
      }} />
        <DataTable columns={['MSSV', 'Họ và tên', 'Lớp', 'Doanh nghiệp', 'Vị trí', 'Thời gian', 'Cán bộ hướng dẫn (DN)', 'Trạng thái']} rows={rows.map(r => [r[0], r[1], r[2], r[3], r[4], r[5], r[6], <Tag key="t" v={r[7]} />])} />
        {!rows.length && <p className="ps-empty">Không có sinh viên nào khớp bộ lọc.</p>}
      </Panel>
      <Panel title="Thao tác nhanh" icon="grid">
        <div className="ps-servicegrid">
          <Link to="/euni/giang-vien/thuc-tap-doanh-nghiep/tao-dot" className="ps-service"><span className="ps-service__ic"><Icon name="file" size={20} /></span>Tạo đợt thực tập</Link>
          <Link to="/euni/giang-vien/thuc-tap-doanh-nghiep/xac-nhan-dn" className="ps-service"><span className="ps-service__ic"><Icon name="check" size={20} /></span>Xác nhận tiếp nhận của DN</Link>
          <Link to="/euni/giang-vien/thuc-tap-doanh-nghiep/bieu-mau" className="ps-service"><span className="ps-service__ic"><Icon name="layers" size={20} /></span>Biểu mẫu thực tập</Link>
          <Link to="/euni/giang-vien/thuc-tap-doanh-nghiep/nhap-diem" className="ps-service"><span className="ps-service__ic"><Icon name="award" size={20} /></span>Nhập điểm thực tập</Link>
        </div>
      </Panel>
    </>;
}
