'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";

import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";
import { PageHead } from "../shared.jsx";
export function PsTuition() {
  const { psTuition } = useModuleData('portal-student');
  const [tab, setTab] = useState('tq');
  const t = psTuition;
  return <>
      <PageHead title="Tài chính" sub={`Cập nhật đến ngày ${t.asOf}`} />
      <Panel flush>
        <div className="ps-tabs">
          <button type="button" className={tab === 'tq' ? 'is-active' : ''} onClick={() => setTab('tq')}>Tổng quan</button>
          <button type="button" className={tab === 'hp' ? 'is-active' : ''} onClick={() => setTab('hp')}>Học phí</button>
          <button type="button" className={tab === 'hb' ? 'is-active' : ''} onClick={() => setTab('hb')}>Học bổng</button>
          <button type="button" className={tab === 'ls' ? 'is-active' : ''} onClick={() => setTab('ls')}>Lịch sử giao dịch</button>
        </div>
        <div className="ps-tabbody">
          {tab === 'tq' && <div className="ps-fingrid">
              <div className="ps-balance">
                <span>Số dư hiện tại</span>
                <strong>{t.balance}</strong>
                <button type="button" className="humg-btn humg-btn--primary humg-btn--block">Thanh toán online</button>
                <em>(Tính đến ngày {t.asOf})</em>
              </div>
              <ul className="ps-kv">
                <li><span>Học kỳ</span><strong>{t.term.name}</strong></li>
                <li><span>Tổng học phí</span><strong>{t.term.total}</strong></li>
                <li><span>Đã thanh toán</span><strong>{t.term.paid}</strong></li>
                <li><span>Còn phải nộp</span><strong className="is-warn">{t.term.due}</strong></li>
                <li><span>Hạn nộp</span><strong>{t.term.deadline}</strong></li>
              </ul>
            </div>}
          {tab === 'hp' && <>
              <h4 className="ps-subhead">Các khoản phải nộp</h4>
              <DataTable columns={['Nội dung', 'Số tiền (VND)', 'Hạn nộp', 'Trạng thái']} rows={t.fees.map(f => [f[0], f[1], f[2], <span key="s" className={`ps-tag ${f[3] === 'Đã thanh toán' ? 'ps-tag--done' : 'ps-tag--warn'}`}>{f[3]}</span>])} />
            </>}
          {tab === 'hb' && <DataTable columns={['Học kỳ', 'Loại học bổng', 'Số tiền', 'Trạng thái']} rows={t.scholarships} />}
          {tab === 'ls' && <DataTable columns={['Ngày', 'Nội dung', 'Số tiền', 'Hình thức', 'Trạng thái']} rows={t.history} />}
        </div>
      </Panel>
    </>;
}
