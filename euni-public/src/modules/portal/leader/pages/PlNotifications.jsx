'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { useState } from "react";
import Icon from "../../../../shared/lib/Icon.jsx";
import { Panel } from "../../../../shared/components/ui/page.jsx";
import { Head } from "../shared.jsx";
export function PlNotifications() {
  const { plNotifications } = useModuleData('portal-leader');
  const n = plNotifications;
  const [tab, setTab] = useState('Tất cả');
  const list = tab === 'Tất cả' ? n.list : n.list.filter(x => x.kind === tab || tab === 'Thông báo cá nhân' && x.kind === 'Thông báo cá nhân');
  return <>
      <Head title="Trung tâm thông báo" right={<button type="button" className="humg-btn humg-btn--ghost humg-btn--sm"><Icon name="check" size={13} /> Đánh dấu đã đọc</button>} />
      <Panel flush>
        <div className="ps-tabs ps-tabs--wrap">
          {n.tabs.map(t => <button key={t} type="button" className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>{t}</button>)}
        </div>
        <div className="ps-tabbody">
          <ul className="ps-noti">
            {list.map(x => <li key={x.title}>
                <span className="ps-noti__ic"><Icon name={x.icon} size={18} /></span>
                <div className="ps-noti__body">
                  <div className="ps-noti__top"><strong>{x.title}</strong><span className="ps-tag ps-tag--run">{x.kind}</span></div>
                  <p>{x.unit}</p>
                  <em>{x.time}</em>
                </div>
              </li>)}
          </ul>
          {!list.length && <p className="ps-muted" style={{
          padding: 12
        }}>Không có thông báo trong mục này.</p>}
          <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" style={{
          margin: 12
        }}>Xem tất cả thông báo</button>
        </div>
      </Panel>
    </>;
}
