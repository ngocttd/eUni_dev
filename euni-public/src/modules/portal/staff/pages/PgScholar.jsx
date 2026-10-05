'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";
import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";

import Icon from "../../../../shared/lib/Icon.jsx";
import { Head, Tag } from "../shared.jsx";
export function PgScholar() {
  const { pgScholar } = useModuleData('portal-staff');
  const [tab, setTab] = useState('bb');
  return <>
      <Head title="CSDL khoa học của tôi" sub="Công bố, đề tài, hội thảo và sách đã khai báo" />
      <Panel flush>
        <div className="ps-tabs">
          <button type="button" className={tab === 'bb' ? 'is-active' : ''} onClick={() => setTab('bb')}>Bài báo</button>
          <button type="button" className={tab === 'dt' ? 'is-active' : ''} onClick={() => setTab('dt')}>Đề tài</button>
        </div>
        <div className="ps-tabbody">
          {tab === 'bb' && <ul className="ps-publist">
              {pgScholar.papers.map(p => <li key={p.title}>
                  <strong>{p.title}</strong>
                  <em>{p.authors} · {p.venue} · {p.year}</em>
                  <span className="ps-rowact"><button type="button" aria-label="Xem"><Icon name="eye" size={14} /></button><button type="button" aria-label="Tải xuống"><Icon name="download" size={14} /></button></span>
                </li>)}
            </ul>}
          {tab === 'dt' && <DataTable columns={['Mã đề tài', 'Tên đề tài', 'Vai trò', 'Thời gian', 'Trạng thái']} rows={pgScholar.projectsMine.map(r => [r[0], r[1], r[2], r[3], <Tag key="t" v={r[4]} />])} />}
        </div>
      </Panel>
    </>;
}
