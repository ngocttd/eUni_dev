'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import Icon from "../../../../shared/lib/Icon.jsx";
import { Panel, Pagination } from "../../../../shared/components/ui/page.jsx";
import { PageHead } from "../shared.jsx";
export function PsNotifications() {
  const { psNotifications } = useModuleData('portal-student');
  const [tab, setTab] = useState('Tất cả');
  const n = psNotifications;
  const list = tab === 'Tất cả' ? n.list : n.list.filter(x => x.cat === tab);
  return <>
      <PageHead title="Thông báo" sub={`${n.total} thông báo`} right={<button type="button" className="humg-btn humg-btn--ghost humg-btn--sm"><Icon name="check" size={13} /> Đánh dấu đã đọc</button>} />
      <Panel flush>
        <div className="ps-tabs ps-tabs--wrap">
          {n.tabs.map(t => <button key={t} type="button" className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>{t}</button>)}
        </div>
        <div className="ps-tabbody">
          <ul className="ps-noti">
            {list.map(x => <li key={x.title} className={x.unread ? 'is-unread' : ''}>
                <span className="ps-noti__ic"><Icon name={x.icon} size={18} /></span>
                <div className="ps-noti__body">
                  <div className="ps-noti__top">
                    <strong>{x.title}</strong>
                    <span className="ps-tag ps-tag--run">{x.cat}</span>
                  </div>
                  <p>{x.desc}</p>
                  <em>{x.date}</em>
                </div>
              </li>)}
          </ul>
          {!list.length && <p className="ps-muted" style={{
          padding: 12
        }}>Không có thông báo trong mục này.</p>}
          <div className="ps-listfoot">
            <span>Hiển thị 1 – {list.length} trong tổng số {n.total} thông báo</span>
            <Pagination page={1} total={3} />
          </div>
        </div>
      </Panel>
    </>;
}
