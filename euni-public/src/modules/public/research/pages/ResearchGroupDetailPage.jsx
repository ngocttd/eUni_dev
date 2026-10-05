'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams } from '../../../../lib/router.jsx';

import { MetaBar, LinkList, Panel, NewsMini } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { GENERIC_ACHI, GENERIC_FOCUS, GENERIC_MEMBERS, shell } from "../shared.jsx";
export function ResearchGroupDetailPage() {
  const { getGroup, researchGroups } = useModuleData('research');
  const {
    id
  } = useParams();
  const g = getGroup(id) || researchGroups[0];
  return shell({
    title: g.name,
    crumbs: [{
      label: 'Nghiên cứu',
      to: '/nghien-cuu'
    }, {
      label: 'Nhóm nghiên cứu',
      to: '/nghien-cuu/nhom-nghien-cuu'
    }, {
      label: g.name
    }],
    hero: <MetaBar items={[{
      icon: 'user',
      text: `Trưởng nhóm: ${g.leader}`
    }, {
      icon: 'users',
      text: `${g.members} thành viên`
    }, {
      icon: 'calendar',
      text: `Thành lập ${g.established}`
    }]} />,
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={[{
        label: 'Danh sách chuyên gia',
        to: '/nghien-cuu/chuyen-gia'
      }, {
        label: 'Đề tài / Dự án',
        to: '/nghien-cuu/de-tai'
      }, {
        label: 'Công bố khoa học',
        to: '/nghien-cuu/cong-bo'
      }]} />
        <Panel title="Nhóm khác" icon="target">
          <NewsMini items={researchGroups.filter(x => x.id !== g.id).slice(0, 4).map(x => ({
          date: x.field,
          title: x.name,
          to: `/nghien-cuu/nhom-nghien-cuu/${x.id}`
        }))} />
        </Panel>
      </>,
    children: <>
        <Panel title="Giới thiệu" icon="target">
          <p style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.75
        }}>{g.focus} Nhóm thuộc lĩnh vực <strong>{g.field}</strong>, do {g.leader} làm trưởng nhóm, được thành lập năm {g.established}.</p>
        </Panel>
        <Panel title="Hướng nghiên cứu trọng tâm" icon="layers">
          <ul className="res-check">{GENERIC_FOCUS.map((x, i) => <li key={i}><Icon name="check" size={14} /> {x}</li>)}</ul>
        </Panel>
        <Panel title="Thành viên" icon="users">
          <div className="res-members">
            {GENERIC_MEMBERS.map(m => <div key={m.name} className="res-member">
                <span className="res-member__ic"><Icon name="user" size={15} /></span>
                <span><strong>{m.name}</strong><em>{m.role}</em></span>
              </div>)}
          </div>
        </Panel>
        <Panel title="Thành tựu tiêu biểu" icon="award">
          <ul className="res-check">{GENERIC_ACHI.map((x, i) => <li key={i}><Icon name="award" size={14} /> {x}</li>)}</ul>
        </Panel>
      </>
  });
}
