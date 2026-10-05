'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { Panel, StatRow, FilterBar } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, degreeOf, rnorm, shell } from "../shared.jsx";
export function ExpertListPage() {
  const { experts, strongFields, expertStats } = useModuleData('research');
  const [q, setQ] = useState('');
  const [fac, setFac] = useState('Tất cả');
  const [deg, setDeg] = useState('Tất cả');
  const [sort, setSort] = useState('h-index');
  const facs = ['Tất cả', ...Array.from(new Set(experts.map(e => e.faculty)))];
  const degs = ['Tất cả', 'GS.TS', 'PGS.TS', 'TS', 'ThS'];
  const reset = () => {
    setQ('');
    setFac('Tất cả');
    setDeg('Tất cả');
    setSort('h-index');
  };
  const list = useMemo(() => {
    let r = experts.filter(e => (fac === 'Tất cả' || e.faculty === fac) && (deg === 'Tất cả' || degreeOf(e.name) === deg) && (!q || rnorm(`${e.name} ${e.position} ${e.faculty} ${e.fields.join(' ')}`).includes(rnorm(q))));
    if (sort === 'h-index') r = [...r].sort((a, b) => b.hIndex - a.hIndex);else if (sort === 'Số công bố') r = [...r].sort((a, b) => b.pubs - a.pubs);else r = [...r].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    return r;
  }, [q, fac, deg, sort]);
  return shell({
    title: 'Danh sách chuyên gia',
    lead: 'Đội ngũ chuyên gia, nhà khoa học của HUMG theo lĩnh vực nghiên cứu.',
    crumbs: [{
      label: 'Nghiên cứu',
      to: '/nghien-cuu'
    }, {
      label: 'Danh sách chuyên gia'
    }],
    sidebar: <>
        <Panel title="Lĩnh vực nghiên cứu mạnh" icon="target">
          <div className="res-pct">
            {strongFields.map(f => <div key={f.label} className="res-pct__row">
                <span className="res-pct__label">{f.label}</span>
                <span className="res-pct__track"><span style={{
                width: `${f.value / 56 * 100}%`
              }} /></span>
                <span className="res-pct__val">{f.value}</span>
              </div>)}
          </div>
        </Panel>
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Thống kê chuyên gia" icon="award"><StatRow items={expertStats} /></Panel>
        <Panel title="Chuyên gia" icon="users">
          <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo tên, chuyên môn, đơn vị…" selects={[{
          label: 'Đơn vị',
          value: fac,
          onChange: setFac,
          options: facs
        }, {
          label: 'Học hàm / học vị',
          value: deg,
          onChange: setDeg,
          options: degs
        }]} sort={sort} onSort={setSort} sortOptions={['h-index', 'Số công bố', 'Tên A → Z']} count={list.length} total={experts.length} onReset={reset} />
          <div className="res-experts">
            {list.map(e => <Link key={e.id} to={`/nghien-cuu/chuyen-gia/${e.id}`} className="res-expert">
                <span className="res-expert__photo humg-ph" data-ratio="1-1"><span>Ảnh</span></span>
                <div className="res-expert__body">
                  <strong>{e.name}</strong>
                  <span className="res-expert__pos">{e.position}</span>
                  <span className="res-expert__fac">{e.faculty}</span>
                  <div className="res-expert__fields">{e.fields.map(f => <span key={f}>{f}</span>)}</div>
                  <div className="res-expert__meta">
                    <span><Icon name="newspaper" size={12} /> {e.pubs} công bố</span>
                    <span><Icon name="flask" size={12} /> {e.projects} đề tài</span>
                    <span><Icon name="award" size={12} /> h-index {e.hIndex}</span>
                  </div>
                </div>
              </Link>)}
          </div>
          {list.length === 0 && <p className="res-lead">Không tìm thấy chuyên gia phù hợp.</p>}
        </Panel>
      </>
  });
}
