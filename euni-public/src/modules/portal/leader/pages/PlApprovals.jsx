'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { APPROVAL_FILTERS, Head, SeverityTag } from "../shared.jsx";
export function PlApprovals({
  initial = 'phe-duyet'
}) {
  const { plApprovals } = useModuleData('portal-leader');
  const [tab, setTab] = useState(initial);
  const [flt, setFlt] = useState('Tất cả');
  const a = plApprovals;
  const list = flt === 'Tất cả' ? a.list : a.list.filter(x => x.status === flt);
  return <>
      <Head title="Phê duyệt & Cảnh báo" sub="Xử lý yêu cầu phê duyệt và theo dõi cảnh báo điều hành" />
      <Panel flush>
        <div className="ps-tabs">
          <button type="button" className={tab === 'phe-duyet' ? 'is-active' : ''} onClick={() => setTab('phe-duyet')}>Phê duyệt</button>
          <button type="button" className={tab === 'canh-bao' ? 'is-active' : ''} onClick={() => setTab('canh-bao')}>Cảnh báo</button>
        </div>
        <div className="ps-tabbody">
          {tab === 'phe-duyet' && <>
              <div className="pl-subfilter">
                {APPROVAL_FILTERS.map(f => <button key={f} type="button" className={flt === f ? 'is-active' : ''} onClick={() => setFlt(f)}>
                    {f} <em>({a.counts[f] ?? 0})</em>
                  </button>)}
              </div>
              <ul className="pl-approval">
                {list.map(x => <li key={x.title}>
                    <span className="pl-approval__ic"><Icon name={x.icon} size={17} /></span>
                    <div className="pl-approval__body">
                      <strong>{x.title}</strong>
                      <span>{x.unit} · {x.time}</span>
                    </div>
                    <div className="pl-approval__act">
                      <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm">Xem</button>
                      {x.status === 'Chờ duyệt' && <>
                        <button type="button" className="humg-btn humg-btn--primary humg-btn--sm">Duyệt</button>
                        <button type="button" className="pl-reject">Từ chối</button>
                      </>}
                      {x.status !== 'Chờ duyệt' && <span className="ps-tag ps-tag--done">{x.status}</span>}
                    </div>
                  </li>)}
              </ul>
              {!list.length && <p className="ps-empty">Không có yêu cầu nào ở trạng thái này.</p>}
              <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm" style={{
            marginTop: 12
          }}>Xem tất cả yêu cầu</button>
            </>}
          {tab === 'canh-bao' && <DataTable columns={['Mức độ', 'Nội dung cảnh báo', 'Đơn vị', 'Thời hạn']} rows={a.alerts.map(r => [<SeverityTag key="s" v={r[0]} />, r[1], r[2], r[3]])} />}
        </div>
      </Panel>
    </>;
}
