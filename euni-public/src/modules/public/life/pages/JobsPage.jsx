'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { Panel, LinkList, StatRow, Chips, FilterBar, DataTable, NewsMini, TileGrid } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, lnorm, shell } from "../shared.jsx";
export function JobsPage() {
  const { jobs } = useModuleData('life');
  const TABS = ['Việc làm', 'Thực tập', 'Khởi nghiệp', 'Tin tức'];
  const [tab, setTab] = useState('Việc làm');
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('Tất cả');
  const kinds = ['Tất cả', ...Array.from(new Set(jobs.listings.map(j => j.type)))];
  const list = useMemo(() => jobs.listings.filter(j => (kind === 'Tất cả' || j.type === kind) && (!q || lnorm(`${j.title} ${j.company} ${j.place}`).includes(lnorm(q)))), [q, kind]);
  return shell({
    title: 'Việc làm – Khởi nghiệp',
    lead: jobs.intro,
    crumbs: [{
      label: 'Đời sống',
      to: '/doi-song'
    }, {
      label: 'Việc làm – Khởi nghiệp'
    }],
    sidebar: <>
        <Panel title="Gợi ý dành cho bạn" icon="briefcase">
          <ul className="life-mini">
            {jobs.listings.slice(0, 3).map(j => <li key={j.id}>
                <strong><Link to={`/doi-song/viec-lam-khoi-nghiep/${j.id}`}>{j.title}</Link></strong>
                <em>{j.company} · {j.place}</em>
              </li>)}
          </ul>
        </Panel>
        <LinkList title="Tài nguyên nghề nghiệp" items={[{
        label: 'Kỹ năng tìm việc',
        to: '/doi-song/ho-tro-sinh-vien'
      }, {
        label: 'Viết CV chuyên nghiệp',
        to: '/doi-song/ho-tro-sinh-vien'
      }, {
        label: 'Phỏng vấn thành công',
        to: '/doi-song/ho-tro-sinh-vien'
      }]} />
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Việc làm & Khởi nghiệp trong những con số" icon="award"><StatRow items={jobs.stats} /></Panel>
        <Panel title="Cơ hội việc làm & khởi nghiệp" icon="briefcase">
          <Chips options={TABS.map(t => ({
          key: t,
          label: t
        }))} value={tab} onChange={setTab} />

          {(tab === 'Việc làm' || tab === 'Thực tập') && <>
              <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo vị trí, công ty, địa điểm…" selects={[{
            label: 'Hình thức',
            value: kind,
            onChange: setKind,
            options: kinds
          }]} count={list.length} total={jobs.listings.length} onReset={() => {
            setQ('');
            setKind('Tất cả');
          }} />
              <DataTable columns={['Vị trí tuyển dụng', 'Công ty', 'Hình thức', 'Địa điểm', 'Mức lương', 'Hạn nộp', '']} rows={list.map(j => [<Link key="t" to={`/doi-song/viec-lam-khoi-nghiep/${j.id}`}>{j.title}</Link>, j.company, j.type, j.place, j.salary, <span key="d" className="life-job__deadline">{j.deadline}</span>, <Link key="a" to={`/doi-song/viec-lam-khoi-nghiep/${j.id}`} className="humg-link-more">Chi tiết</Link>])} />
              {list.length === 0 && <p className="life-note">Không có tin phù hợp.</p>}
            </>}

          {tab === 'Khởi nghiệp' && <ul className="life-check">
              <li><Icon name="rocket" size={14} /> Vườn ươm khởi nghiệp HUMG: không gian làm việc chung, cố vấn và kết nối vốn.</li>
              <li><Icon name="rocket" size={14} /> Cuộc thi Startup HUMG thường niên và các chương trình tăng tốc khởi nghiệp.</li>
              <li><Icon name="rocket" size={14} /> Khóa học tinh thần doanh nhân, thiết kế mô hình kinh doanh và gọi vốn.</li>
            </ul>}

          {tab === 'Tin tức' && <NewsMini items={[{
          date: '20/05/2026',
          title: 'Ngày hội việc làm & Kết nối doanh nghiệp 2026',
          to: '/su-kien'
        }, {
          date: 'Hằng quý',
          title: 'Talkshow định hướng nghề nghiệp theo nhóm ngành',
          to: '/su-kien'
        }]} />}
        </Panel>
        <Panel title="Dịch vụ hỗ trợ nghề nghiệp" icon="grid">
          <TileGrid items={jobs.services} cols={2} />
        </Panel>
      </>
  });
}
