'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { Head } from "../shared.jsx";
export function PgSyllabus() {
  const { pgSyllabus } = useModuleData('portal-staff');
  const [mod, setMod] = useState(pgSyllabus.modules[0]);
  const [tab, setTab] = useState('dc');
  const i = pgSyllabus.info;
  return <>
      <Head title="Đề cương & Tài liệu học phần" right={<label className="ps-filter"><span>Học phần</span>
          <select value={mod} onChange={e => setMod(e.target.value)}>{pgSyllabus.modules.map(m => <option key={m}>{m}</option>)}</select>
        </label>} />
      <Panel flush>
        <div className="ps-tabs">
          <button type="button" className={tab === 'dc' ? 'is-active' : ''} onClick={() => setTab('dc')}>Đề cương</button>
          <button type="button" className={tab === 'tl' ? 'is-active' : ''} onClick={() => setTab('tl')}>Tài liệu</button>
          <button type="button" className={tab === 'kh' ? 'is-active' : ''} onClick={() => setTab('kh')}>Kế hoạch giảng dạy</button>
        </div>
        <div className="ps-tabbody">
          {tab === 'dc' && <>
              <DataTable columns={['Mục', 'Nội dung']} rows={[['Tên học phần', i.name], ['Số tín chỉ', String(i.credits)], ['Học kỳ', i.term], ['Khoa', i.faculty]]} />
              <div className="ps-payact">
                <Link to="/euni/giang-vien/quan-ly-hoc-phan/de-cuong" className="humg-btn humg-btn--ghost humg-btn--sm"><Icon name="eye" size={13} /> Xem đề cương</Link>
                <Link to="/euni/giang-vien/quan-ly-hoc-phan/de-cuong" className="humg-btn humg-btn--ghost humg-btn--sm">Chỉnh sửa đề cương</Link>
                <Link to="/euni/giang-vien/quan-ly-hoc-phan/danh-gia" className="humg-btn humg-btn--ghost humg-btn--sm">Phương án đánh giá</Link>
              </div>
            </>}
          {tab === 'tl' && <>
              <DataTable columns={['Tài liệu', 'Loại', 'Ngày tải', 'Hành động']} rows={pgSyllabus.files.map(f => [f[0], f[1], f[2], <span key="a" className="ps-rowact"><button type="button" aria-label="Tải xuống"><Icon name="download" size={14} /></button><button type="button" aria-label="Xóa"><Icon name="x" size={14} /></button></span>])} />
              <Link to="/euni/giang-vien/quan-ly-hoc-phan/hoc-lieu-can-thiet" className="humg-btn humg-btn--primary humg-btn--sm" style={{
            marginTop: 12
          }}><Icon name="arrow-right" size={13} /> Tải lên tài liệu mới</Link>
            </>}
          {tab === 'kh' && <DataTable columns={['Thời gian', 'Nội dung', 'Hình thức']} rows={pgSyllabus.plan} />}
        </div>
      </Panel>
    </>;
}
