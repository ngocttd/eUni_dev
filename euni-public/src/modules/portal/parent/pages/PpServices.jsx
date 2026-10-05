'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { useState } from "react";
import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { Head, Tag } from "../shared.jsx";
export function PpServices() {
  const { ppServices } = useModuleData('portal-parent');
  const s = ppServices;
  const [tab, setTab] = useState('dk');
  return <>
      <Head title="Đăng ký dịch vụ" />
      <Panel flush>
        <div className="ps-tabs">
          <button type="button" className={tab === 'dk' ? 'is-active' : ''} onClick={() => setTab('dk')}>Dịch vụ khả dụng</button>
          <button type="button" className={tab === 'ls' ? 'is-active' : ''} onClick={() => setTab('ls')}>Yêu cầu của tôi</button>
        </div>
        <div className="ps-tabbody">
          {tab === 'dk' && <div className="pp-svcgrid">
              {s.catalog.map(x => <div key={x.title} className="pp-svc">
                  <span className="pp-svc__ic"><Icon name={x.icon} size={20} /></span>
                  <strong>{x.title}</strong>
                  <span>Lệ phí: {x.fee}</span>
                  <span>Thời gian: {x.time}</span>
                  <button type="button" className="humg-btn humg-btn--primary humg-btn--sm humg-btn--block">Đăng ký</button>
                </div>)}
            </div>}
          {tab === 'ls' && <DataTable columns={['Mã yêu cầu', 'Dịch vụ', 'Ngày gửi', 'Trạng thái']} rows={s.history.map(r => [r[0], r[1], r[2], <Tag key="s" v={r[3]} />])} />}
        </div>
      </Panel>
    </>;
}
