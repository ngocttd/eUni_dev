'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { HeroSearch, LinkList, Panel, StatRow, Chips, Pagination } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, shell } from "../shared.jsx";
export function ProgramListPage() {
  const { programs, programTypes } = useModuleData('education');
  const [type, setType] = useState('Tất cả');
  const list = useMemo(() => type === 'Tất cả' ? programs : programs.filter(p => p.type === type), [type]);
  const opts = programTypes.map(t => ({
    key: t,
    label: t,
    count: t === 'Tất cả' ? programs.length : programs.filter(p => p.type === t).length
  }));
  return shell({
    title: 'Chương trình đào tạo',
    lead: 'Danh mục các chương trình đào tạo đại học, chất lượng cao và liên kết quốc tế của HUMG.',
    crumbs: [{
      label: 'Học tập',
      to: '/hoc-tap'
    }, {
      label: 'Chương trình đào tạo'
    }],
    hero: <HeroSearch placeholder="Tìm ngành / chương trình đào tạo…" />,
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={[{
        label: 'Chuẩn đầu ra',
        to: '/hoc-tap/chuan-dau-ra'
      }, {
        label: 'Quy chế đào tạo',
        to: '/hoc-tap/thong-tin-chung'
      }, {
        label: 'Học phí & Học bổng',
        to: '/hoc-tap/hoc-phi-hoc-bong'
      }, {
        label: 'Hướng dẫn đăng ký học phần',
        to: '/hoc-tap/huong-dan'
      }]} />
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Thống kê" icon="award">
          <StatRow items={[{
          value: '52',
          label: 'Chương trình đào tạo'
        }, {
          value: '12',
          label: 'Ngành trình độ đại học'
        }, {
          value: '15',
          label: 'CTĐT chất lượng cao'
        }, {
          value: '06',
          label: 'CTĐT quốc tế'
        }]} />
        </Panel>
        <Panel title={`Danh sách chương trình (${list.length})`} icon="book">
          <Chips options={opts} value={type} onChange={setType} />
          <div className="edu-programs">
            {list.map(p => <Link key={p.id} to={`/hoc-tap/chuong-trinh-dao-tao/${p.id}`} className="edu-program">
                <span className="edu-program__code">{p.code}</span>
                <span className="edu-program__body">
                  <strong>{p.name}</strong>
                  <em>{p.level} · {p.faculty}</em>
                </span>
                <span className={`edu-program__tag ${p.type !== 'Chương trình chuẩn' ? 'is-special' : ''}`}>{p.type}</span>
                <Icon name="arrow-right" size={16} />
              </Link>)}
          </div>
        </Panel>
        <Pagination page={1} total={5} />
      </>
  });
}
