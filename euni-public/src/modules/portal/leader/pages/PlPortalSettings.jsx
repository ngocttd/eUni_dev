'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { useState } from "react";
import Icon from "../../../../shared/lib/Icon.jsx";
import { Panel } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import { Head } from "../shared.jsx";
export function PlPortalSettings() {
  const { plPortalSettings } = useModuleData('portal-leader');
  const s = plPortalSettings;
  const [tab, setTab] = useState(s.tabs[0]);
  const [theme, setTheme] = useState(s.themes[0]);
  const [color, setColor] = useState(s.colors[0]);
  const [display, setDisplay] = useState(() => Object.fromEntries(s.display.map(d => [d.key, d.on])));
  return <>
      <Head title="Cài đặt cổng thông tin" right={<div className="ps-head__right">
          <button type="button" className="humg-btn humg-btn--ghost humg-btn--sm"><Icon name="eye" size={13} /> Xem trước</button>
          <button type="button" className="humg-btn humg-btn--primary humg-btn--sm">Lưu thay đổi</button>
        </div>} />
      <Panel flush>
        <div className="ps-tabs ps-tabs--wrap">
          {s.tabs.map(t => <button key={t} type="button" className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>{t}</button>)}
        </div>
        <div className="ps-tabbody">
          {tab === 'Giao diện' ? <>
              <h4 className="ps-subhead">Chọn giao diện</h4>
              <div className="pl-themes">
                {s.themes.map(th => <button key={th} type="button" className={`pl-theme ${theme === th ? 'is-active' : ''}`} onClick={() => setTheme(th)}>
                    <span className="pl-theme__preview" />
                    {th}
                  </button>)}
              </div>
              <h4 className="ps-subhead">Màu chủ đạo</h4>
              <div className="pl-colors">
                {s.colors.map(c => <button key={c} type="button" aria-label={c} className={`pl-color ${color === c ? 'is-active' : ''}`} style={{
              background: c
            }} onClick={() => setColor(c)} />)}
              </div>
              <div className="pl-setgrid">
                <div>
                  <h4 className="ps-subhead">Tùy chọn hiển thị</h4>
                  <ul className="pl-checks">
                    {s.display.map(d => <li key={d.key}>
                        <label>
                          <input type="checkbox" checked={display[d.key]} onChange={() => setDisplay(v => ({
                      ...v,
                      [d.key]: !v[d.key]
                    }))} />
                          {d.label}
                        </label>
                      </li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="ps-subhead">Logo & Banner</h4>
                  <div className="pl-brandset">
                    <div><span className="humg-ph" data-ratio="3-2"><span>Logo HUMG</span></span><button type="button" className="humg-btn humg-btn--ghost humg-btn--sm">Thay đổi</button></div>
                    <div><span className="humg-ph" data-ratio="16-9"><span>Banner trang chủ</span></span><button type="button" className="humg-btn humg-btn--ghost humg-btn--sm">Thay đổi</button></div>
                  </div>
                </div>
              </div>
            </> : <p className="ps-muted" style={{
          padding: 12
        }}>Cấu hình “{tab}” — dùng chung trình biên tập với khối CMS.
              {' '}<Link to="/cms/cau-hinh" className="humg-link-more">Mở CMS <Icon name="arrow-right" size={13} /></Link>
            </p>}
        </div>
      </Panel>
    </>;
}
