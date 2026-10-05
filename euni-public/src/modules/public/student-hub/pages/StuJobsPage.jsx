'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { HeroSearch, Panel, Chips, NewsMini } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { QUICKLINKS, SUPPORT, shell } from "../shared.jsx";
export function StuJobsPage() {
  const { stuJobs } = useModuleData('student-hub');
  const [tab, setTab] = useState('Việc làm');
  const list = useMemo(() => {
    if (tab === 'Việc làm') return stuJobs.listings.filter(j => j.kind === 'Việc làm');
    if (tab === 'Thực tập') return stuJobs.listings.filter(j => j.kind === 'Thực tập');
    return [];
  }, [tab]);
  return shell({
    title: 'Việc làm & Khởi nghiệp',
    lead: stuJobs.intro,
    crumbs: [{
      label: 'Sinh viên',
      to: '/sinh-vien'
    }, {
      label: 'Việc làm & Khởi nghiệp'
    }],
    hero: <HeroSearch placeholder="Tìm việc làm, thực tập theo ngành, công ty…" />,
    sidebar: <>
        {QUICKLINKS}
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Cơ hội nghề nghiệp" icon="briefcase" action={<Link to="/doi-song/viec-lam-khoi-nghiep" className="humg-link-more">Xem tất cả <Icon name="arrow-right" size={14} /></Link>}>
          <Chips options={stuJobs.tabs.map(t => ({
          key: t,
          label: t
        }))} value={tab} onChange={setTab} />

          {(tab === 'Việc làm' || tab === 'Thực tập') && <div className="stu-jobs">
              {list.map(j => <Link key={j.id} to={`/doi-song/viec-lam-khoi-nghiep/${j.id}`} className="stu-job">
                  <span className="stu-job__ic"><Icon name="briefcase" size={16} /></span>
                  <div className="stu-job__body">
                    <strong>{j.title}</strong>
                    <em>{j.company} · {j.place}</em>
                  </div>
                  <span className="stu-job__deadline">Hạn: {j.deadline}</span>
                </Link>)}
            </div>}

          {tab === 'Khởi nghiệp' && <ul className="stu-check">
              {stuJobs.startup.map((s, i) => <li key={i}><Icon name="rocket" size={14} /> {s}</li>)}
            </ul>}

          {tab === 'Sự kiện' && <NewsMini items={stuJobs.events.map(e => ({
          date: e.date,
          title: e.title,
          to: '/su-kien'
        }))} />}
        </Panel>
      </>
  });
}
