'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams } from '../../../../lib/router.jsx';

import { useState } from "react";
import { MetaBar, Panel, DocList, NewsMini, StatRow, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function ProjectDetailPage() {
  const { getProject, projects } = useModuleData('research');
  const {
    id
  } = useParams();
  const p = getProject(id) || projects[0];
  const [tab, setTab] = useState('tong-quan');
  const tabs = [{
    key: 'tong-quan',
    label: 'Tổng quan'
  }, {
    key: 'muc-tieu',
    label: 'Mục tiêu – Nội dung'
  }, {
    key: 'ket-qua',
    label: 'Kết quả'
  }, {
    key: 'san-pham',
    label: 'Sản phẩm'
  }, {
    key: 'thanh-vien',
    label: 'Thành viên'
  }];
  return shell({
    title: p.title,
    crumbs: [{
      label: 'Nghiên cứu',
      to: '/nghien-cuu'
    }, {
      label: 'Đề tài / Dự án',
      to: '/nghien-cuu/de-tai'
    }, {
      label: p.code
    }],
    hero: <MetaBar items={[{
      icon: 'grid',
      text: `Mã số: ${p.code}`
    }, {
      icon: 'award',
      text: p.level
    }, {
      icon: 'user',
      text: p.leader
    }]} />,
    sidebar: <>
        <Panel title="Văn bản, tài liệu" icon="file"><DocList items={p.docs} /></Panel>
        <Panel title="Đề tài khác" icon="flask">
          <NewsMini items={projects.filter(x => x.id !== p.id).slice(0, 4).map(x => ({
          date: x.code,
          title: x.title,
          to: `/nghien-cuu/de-tai/${x.id}`
        }))} />
        </Panel>
      </>,
    children: <>
        <Panel>
          <StatRow items={[{
          value: p.level,
          label: 'Cấp đề tài'
        }, {
          value: `${p.startYear}–${p.endYear}`,
          label: 'Thời gian'
        }, {
          value: p.budget,
          label: 'Kinh phí'
        }, {
          value: p.status,
          label: 'Trạng thái'
        }]} />
        </Panel>
        <Panel flush>
          <div className="res-tabs">
            {tabs.map(t => <button key={t.key} type="button" className={t.key === tab ? 'is-active' : ''} onClick={() => setTab(t.key)}>{t.label}</button>)}
          </div>
          <div className="res-tabbody">
            {tab === 'tong-quan' && <>
                <p className="res-lead">{p.summary}</p>
                <DataTable columns={['Mục', 'Chi tiết']} rows={[['Chủ nhiệm', p.leader], ['Cơ quan chủ trì', p.org], ['Lĩnh vực', p.field], ['Thời gian thực hiện', `${p.startYear} – ${p.endYear}`], ['Kinh phí', p.budget]]} />
              </>}
            {tab === 'muc-tieu' && <ul className="res-check">{p.objectives.map((o, i) => <li key={i}><Icon name="check" size={14} /> {o}</li>)}</ul>}
            {tab === 'ket-qua' && <ul className="res-check">{p.results.map((o, i) => <li key={i}><Icon name="check" size={14} /> {o}</li>)}</ul>}
            {tab === 'san-pham' && <ul className="res-check">{p.products.map((o, i) => <li key={i}><Icon name="award" size={14} /> {o}</li>)}</ul>}
            {tab === 'thanh-vien' && <div className="res-members">
                {p.members.map(m => <div key={m.name} className="res-member">
                    <span className="res-member__ic"><Icon name="user" size={15} /></span>
                    <span><strong>{m.name}</strong><em>{m.role}</em></span>
                  </div>)}
              </div>}
          </div>
        </Panel>
      </>
  });
}
