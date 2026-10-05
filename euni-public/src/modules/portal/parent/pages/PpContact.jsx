'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";
import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";

import Icon from "../../../../shared/lib/Icon.jsx";
import { Head, Tag } from "../shared.jsx";
export function PpContact() {
  const { ppRequestTypes, ppRequestHistory, ppContactInfo, ppWorkingHours } = useModuleData('portal-parent');
  const [tab, setTab] = useState('gui');
  return <>
      <Head title="Liên hệ nhà trường" />
      <div className="pp-contactgrid">
        <Panel flush>
          <div className="ps-tabs">
            <button type="button" className={tab === 'gui' ? 'is-active' : ''} onClick={() => setTab('gui')}>Gửi yêu cầu</button>
            <button type="button" className={tab === 'ls' ? 'is-active' : ''} onClick={() => setTab('ls')}>Lịch sử yêu cầu</button>
          </div>
          <div className="ps-tabbody">
            {tab === 'gui' && <form className="ps-formgrid" onSubmit={e => e.preventDefault()}>
                <label className="ps-formgrid__wide">Loại yêu cầu
                  <select>{ppRequestTypes.map(r => <option key={r}>{r}</option>)}</select>
                </label>
                <label className="ps-formgrid__wide">Tiêu đề<input type="text" placeholder="Nhập tiêu đề yêu cầu" /></label>
                <label className="ps-formgrid__wide">Nội dung<textarea rows="5" placeholder="Nhập nội dung chi tiết yêu cầu…" /></label>
                <label className="ps-formgrid__wide">Tệp đính kèm
                  <input type="file" />
                  <em className="pp-hint">Định dạng: PDF, JPG, PNG (Tối đa 5MB)</em>
                </label>
                <div className="pp-formact">
                  <button type="button" className="humg-btn humg-btn--ghost">Hủy bỏ</button>
                  <button type="submit" className="humg-btn humg-btn--primary">Gửi yêu cầu</button>
                </div>
              </form>}
            {tab === 'ls' && <DataTable columns={['Mã yêu cầu', 'Tiêu đề', 'Đơn vị xử lý', 'Ngày gửi', 'Trạng thái']} rows={ppRequestHistory.map(r => [...r.slice(0, 4), <Tag key="s" v={r[4]} />])} />}
          </div>
        </Panel>

        <Panel title="Thông tin liên hệ" icon="phone">
          <ul className="pp-contactlist">
            {ppContactInfo.map(c => <li key={c.unit}>
                <strong>{c.unit}</strong>
                <span><Icon name="phone" size={13} /> {c.phone}</span>
                <span><Icon name="mail" size={13} /> {c.email}</span>
              </li>)}
            <li>
              <strong>Thời gian làm việc</strong>
              {ppWorkingHours.map(h => <span key={h}><Icon name="clock" size={13} /> {h}</span>)}
            </li>
          </ul>
        </Panel>
      </div>
    </>;
}
