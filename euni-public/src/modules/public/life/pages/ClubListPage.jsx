'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { HeroSearch, LinkList, Panel, Chips } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, shell } from "../shared.jsx";
export function ClubListPage() {
  const { clubs, clubCategories } = useModuleData('life');
  const [cat, setCat] = useState('Tất cả');
  const list = useMemo(() => cat === 'Tất cả' ? clubs : clubs.filter(c => c.category === cat), [cat]);
  return shell({
    title: 'Câu lạc bộ sinh viên',
    lead: 'Hơn 200 câu lạc bộ, đội, nhóm học thuật, thể thao, văn hóa – nghệ thuật và tình nguyện.',
    crumbs: [{
      label: 'Đời sống',
      to: '/doi-song'
    }, {
      label: 'Câu lạc bộ sinh viên'
    }],
    hero: <HeroSearch placeholder="Tìm câu lạc bộ theo tên, lĩnh vực…" />,
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={[{
        label: 'Hoạt động sinh viên',
        to: '/doi-song/hoat-dong-sinh-vien'
      }, {
        label: 'Đoàn – Hội',
        to: '/doi-song/doan-hoi'
      }, {
        label: 'Đăng ký thành lập CLB',
        to: '/hoc-tap/bieu-mau'
      }]} />
        {SUPPORT}
      </>,
    children: <Panel title={`Danh sách CLB (${list.length})`} icon="target">
        <Chips options={clubCategories.map(c => ({
        key: c,
        label: c
      }))} value={cat} onChange={setCat} />
        <div className="life-clubs">
          {list.map(c => <Link key={c.id} to={`/doi-song/cau-lac-bo/${c.id}`} className="life-club">
              <span className="life-club__cover humg-ph" data-ratio="16-9"><span>{c.name}</span></span>
              <span className="life-club__cat">{c.category}</span>
              <div className="life-club__body">
                <strong>{c.name}</strong>
                <p>{c.desc}</p>
                <span className="life-club__meta"><Icon name="users" size={12} /> {c.members} thành viên · Thành lập {c.founded}</span>
              </div>
            </Link>)}
        </div>
      </Panel>
  });
}
