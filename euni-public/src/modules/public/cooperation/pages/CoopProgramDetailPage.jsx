'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useParams } from '../../../../lib/router.jsx';

import { useState } from "react";
import { MetaBar, Panel, DocList, NewsMini, StatRow, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function CoopProgramDetailPage() {
  const { getCoopProgram, coopPrograms } = useModuleData('cooperation');
  const {
    id
  } = useParams();
  const p = getCoopProgram(id) || coopPrograms[0];
  const [tab, setTab] = useState('tong-quan');
  const tabs = [{
    key: 'tong-quan',
    label: 'Tổng quan'
  }, {
    key: 'muc-tieu',
    label: 'Mục tiêu'
  }, {
    key: 'ket-qua',
    label: 'Kết quả'
  }];
  return shell({
    title: p.title,
    crumbs: [{
      label: 'Hợp tác',
      to: '/hop-tac'
    }, {
      label: 'Chương trình / Dự án',
      to: '/hop-tac/chuong-trinh-du-an'
    }, {
      label: p.title
    }],
    hero: <MetaBar items={[{
      icon: 'handshake',
      text: p.partner
    }, {
      icon: 'layers',
      text: p.type
    }, {
      icon: 'calendar',
      text: `${p.startYear} – ${p.endYear}`
    }]} />,
    sidebar: <>
        <Panel title="Tài liệu" icon="file"><DocList items={p.docs} /></Panel>
        <Panel title="Chương trình khác" icon="layers">
          <NewsMini items={coopPrograms.filter(x => x.id !== p.id).slice(0, 4).map(x => ({
          date: x.type,
          title: x.title,
          to: `/hop-tac/chuong-trinh-du-an/${x.id}`
        }))} />
        </Panel>
      </>,
    children: <>
        <Panel>
          <StatRow items={[{
          value: p.type,
          label: 'Loại hình'
        }, {
          value: p.scope,
          label: 'Phạm vi'
        }, {
          value: `${p.startYear}–${p.endYear}`,
          label: 'Thời gian'
        }, {
          value: p.status,
          label: 'Trạng thái'
        }]} />
        </Panel>
        <Panel flush>
          <div className="coop-tabs">
            {tabs.map(t => <button key={t.key} type="button" className={t.key === tab ? 'is-active' : ''} onClick={() => setTab(t.key)}>{t.label}</button>)}
          </div>
          <div className="coop-tabbody">
            {tab === 'tong-quan' && <>
                <p className="coop-lead">{p.summary}</p>
                <DataTable columns={['Mục', 'Chi tiết']} rows={[['Đối tác', p.partner], ['Lĩnh vực', p.field], ['Phạm vi', p.scope], ['Thời gian', `${p.startYear} – ${p.endYear}`]]} />
              </>}
            {tab === 'muc-tieu' && <ul className="coop-check">{p.objectives.map((o, i) => <li key={i}><Icon name="check" size={14} /> {o}</li>)}</ul>}
            {tab === 'ket-qua' && <ul className="coop-check">{p.results.map((o, i) => <li key={i}><Icon name="award" size={14} /> {o}</li>)}</ul>}
          </div>
        </Panel>
      </>
  });
}
