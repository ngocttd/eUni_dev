'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Head, Tag } from "../shared.jsx";
export function PpTuition() {
  const { ppTuition } = useModuleData('portal-parent');
  const [tab, setTab] = useState('tq');
  const t = ppTuition;
  return <>
      <Head title="Học phí & Thanh toán" />
      <Panel flush>
        <div className="ps-tabs">
          <button type="button" className={tab === 'tq' ? 'is-active' : ''} onClick={() => setTab('tq')}>Tổng quan</button>
          <button type="button" className={tab === 'ls' ? 'is-active' : ''} onClick={() => setTab('ls')}>Lịch sử thanh toán</button>
          <button type="button" className={tab === 'hd' ? 'is-active' : ''} onClick={() => setTab('hd')}>Hóa đơn</button>
        </div>
        <div className="ps-tabbody">
          {tab === 'tq' && <>
              <h4 className="ps-subhead">Tổng quan học phí</h4>
              <div className="ps-stats pp-stats4">
                <div className="ps-stat"><strong>{t.overview.total}</strong><span>Tổng học phí phải đóng</span></div>
                <div className="ps-stat"><strong>{t.overview.paid}</strong><span>Đã thanh toán</span></div>
                <div className="ps-stat"><strong>{t.overview.due}</strong><span>Còn phải nộp</span></div>
                <div className="ps-stat"><strong><Tag v={t.overview.status} /></strong><span>Trạng thái</span></div>
              </div>
              <h4 className="ps-subhead">{t.detailTitle}</h4>
              <DataTable columns={['Khoản thu', 'Số tiền (VNĐ)', 'Trạng thái']} rows={[...t.fees.map(f => [f[0], f[1], f[2] === '–' ? '–' : <Tag key="s" v={f[2]} />]), [<strong key="t">{t.totalRow[0]}</strong>, <strong key="v">{t.totalRow[1]}</strong>, <Tag key="s" v={t.totalRow[2]} />]]} />
            </>}
          {tab === 'ls' && <DataTable columns={['Ngày', 'Nội dung', 'Số tiền', 'Hình thức', 'Trạng thái']} rows={t.history.map(r => [...r.slice(0, 4), <Tag key="s" v={r[4]} />])} />}
          {tab === 'hd' && <DataTable columns={['Số hóa đơn', 'Nội dung', 'Số tiền', 'Ngày xuất', 'Trạng thái']} rows={t.invoices.map(r => [...r.slice(0, 4), <Tag key="s" v={r[4]} />])} />}
        </div>
      </Panel>
    </>;
}
