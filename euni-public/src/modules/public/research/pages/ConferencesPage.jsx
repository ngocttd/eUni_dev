'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { LinkList, Panel, Chips, FilterBar, MetaBar } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import { MONTHS_VI, SUPPORT, StatusTag, shell } from "../shared.jsx";
export function ConferencesPage() {
  const { conferences } = useModuleData('research');
  const [tab, setTab] = useState('all');
  const [scope, setScope] = useState('Tất cả');
  const [year, setYear] = useState('Tất cả');
  const years = ['Tất cả', ...Array.from(new Set(conferences.map(c => c.date.slice(-4)))).sort().reverse()];
  const opts = [{
    key: 'all',
    label: 'Tất cả',
    count: conferences.length
  }, {
    key: 'Sắp diễn ra',
    label: 'Sắp diễn ra',
    count: conferences.filter(c => c.status === 'Sắp diễn ra').length
  }, {
    key: 'Đã tổ chức',
    label: 'Đã tổ chức',
    count: conferences.filter(c => c.status === 'Đã tổ chức').length
  }];
  const list = conferences.filter(c => (tab === 'all' || c.status === tab) && (scope === 'Tất cả' || c.scope === scope) && (year === 'Tất cả' || c.date.slice(-4) === year));
  return shell({
    title: 'Hội nghị / Hội thảo khoa học',
    lead: 'Các hội nghị, hội thảo khoa học trong nước và quốc tế do HUMG tổ chức hoặc đồng tổ chức.',
    crumbs: [{
      label: 'Nghiên cứu',
      to: '/nghien-cuu'
    }, {
      label: 'Hội nghị / Hội thảo'
    }],
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={[{
        label: 'Đề tài / Dự án',
        to: '/nghien-cuu/de-tai'
      }, {
        label: 'Công bố khoa học',
        to: '/nghien-cuu/cong-bo'
      }, {
        label: 'Nhóm nghiên cứu',
        to: '/nghien-cuu/nhom-nghien-cuu'
      }, {
        label: 'Tin tức & Sự kiện',
        to: '/tin-tuc'
      }]} />
        {SUPPORT}
      </>,
    children: <Panel title="Danh sách sự kiện khoa học" icon="calendar">
        <Chips options={opts} value={tab} onChange={setTab} />
        <FilterBar selects={[{
        label: 'Phạm vi',
        value: scope,
        onChange: setScope,
        options: ['Tất cả', 'Quốc tế', 'Trong nước']
      }, {
        label: 'Năm',
        value: year,
        onChange: setYear,
        options: years
      }]} count={list.length} total={conferences.length} onReset={() => {
        setTab('all');
        setScope('Tất cả');
        setYear('Tất cả');
      }} />
        <div className="res-conflist">
          {list.map(c => {
          const [d, m, y] = c.date.split('/');
          return <div key={c.slug} className="res-confrow">
                <span className="res-confdate">
                  <strong>{d}</strong>
                  <em>Th{MONTHS_VI.indexOf(m) + 1}/{y}</em>
                </span>
                <div className="res-confrow__body">
                  <Link to={`/nghien-cuu/hoi-nghi-hoi-thao/${c.slug}`}><strong>{c.name}</strong></Link>
                  <MetaBar items={[{
                icon: 'map-pin',
                text: c.place
              }, {
                icon: 'building',
                text: c.organizer
              }, {
                icon: 'globe',
                text: c.scope
              }]} />
                </div>
                <div className="res-confrow__act">
                  {c.status === 'Sắp diễn ra' ? <Link to="/lien-he" className="humg-btn humg-btn--accent humg-btn--sm">Đăng ký tham dự</Link> : <Link to={`/nghien-cuu/hoi-nghi-hoi-thao/${c.slug}`} className="humg-btn humg-btn--ghost humg-btn--sm">Xem chi tiết</Link>}
                  <StatusTag status={c.status} />
                </div>
              </div>;
        })}
        </div>
        {list.length === 0 && <p className="res-lead">Không có sự kiện phù hợp.</p>}
      </Panel>
  });
}
