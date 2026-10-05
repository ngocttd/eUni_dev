'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel, StatRow, Chips } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function AchievementsPage() {
  const { achievements, numbers } = useModuleData('about');
  const [tab, setTab] = useState('all');
  const opts = [{
    key: 'all',
    label: 'Tất cả'
  }, ...achievements.map(g => ({
    key: g.key,
    label: g.label
  }))];
  const groups = tab === 'all' ? achievements : achievements.filter(g => g.key === tab);
  return shell({
    title: 'Thành tựu & con số nổi bật',
    lead: 'Những dấu ấn tiêu biểu của Trường Đại học Mỏ - Địa chất trong đào tạo, nghiên cứu, hợp tác và các giải thưởng.',
    crumbs: [{
      label: 'Giới thiệu HUMG',
      to: '/gioi-thieu'
    }, {
      label: 'Thành tựu & con số nổi bật'
    }],
    children: <>
        <Panel title="HUMG qua các con số" icon="award" action={<Link to="/gioi-thieu/con-so" className="humg-link-more">Xem chi tiết <Icon name="arrow-right" size={14} /></Link>}>
          <StatRow items={numbers.big} />
        </Panel>
        <Chips options={opts} value={tab} onChange={setTab} />
        {groups.map(g => <Panel key={g.key} title={g.label} icon="award">
            <ul className="about-achi">
              {g.items.map((it, i) => <li key={i}>
                  <span className="about-achi__ic"><Icon name="check" size={15} /></span>
                  <span><strong>{it.title}</strong><em>{it.meta}</em></span>
                  <span className="about-achi__year">{it.year}</span>
                </li>)}
            </ul>
          </Panel>)}
      </>
  });
}
