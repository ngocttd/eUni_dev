'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { HeroSearch, Panel, Chips, TileGrid } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { Link } from '../../../../lib/router.jsx';
import { QUICKLINKS, SUPPORT, shell } from "../shared.jsx";
export function StuLibraryPage() {
  const { stuLibrary } = useModuleData('student-hub');
  const [tab, setTab] = useState('Thư viện');
  return shell({
    title: 'Thư viện & E-learning',
    lead: stuLibrary.intro,
    crumbs: [{
      label: 'Sinh viên',
      to: '/sinh-vien'
    }, {
      label: 'Thư viện & E-learning'
    }],
    hero: <HeroSearch placeholder="Tìm sách, học liệu, khóa học…" />,
    sidebar: <>
        {QUICKLINKS}
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Tài nguyên học tập" icon="library">
          <Chips options={stuLibrary.tabs.map(t => ({
          key: t,
          label: t
        }))} value={tab} onChange={setTab} />

          {tab === 'Thư viện' && <>
              <h4 className="stu-subhead">Tài liệu nổi bật</h4>
              <ul className="stu-featlist">
                {stuLibrary.featured.map(f => <li key={f.name}>
                    <span className="stu-feat__ic"><Icon name={f.icon} size={15} /></span>
                    <Link to="/thu-vien/tim-kiem">{f.name}</Link>
                    <em>{f.meta}</em>
                  </li>)}
              </ul>
              <h4 className="stu-subhead">Truy cập nhanh</h4>
              <TileGrid items={stuLibrary.quickAccess} cols={2} />
            </>}

          {tab === 'E-learning' && <>
              <p className="stu-prose">{stuLibrary.elearning}</p>
              <Link to={stuLibrary.elearningTo} className="humg-btn humg-btn--primary">Vào hệ thống E-learning <Icon name="arrow-right" size={15} /></Link>
            </>}

          {tab === 'CSDL trực tuyến' && <>
              <p className="stu-prose">Danh mục cơ sở dữ liệu khoa học trong nước và quốc tế mà sinh viên HUMG được quyền khai thác (một số CSDL yêu cầu truy cập trong mạng trường hoặc VPN).</p>
              <Link to={stuLibrary.databasesTo} className="humg-btn humg-btn--primary">Xem danh mục CSDL <Icon name="arrow-right" size={15} /></Link>
            </>}
        </Panel>
      </>
  });
}
