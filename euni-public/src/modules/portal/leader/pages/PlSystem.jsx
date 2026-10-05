'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { Panel } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { Link } from '../../../../lib/router.jsx';
import { Head } from "../shared.jsx";
export function PlSystem() {
  const { plSystem } = useModuleData('portal-leader');
  return <>
      <Head title="Quản lý hệ thống" sub="Quản trị người dùng, cấu hình và tích hợp hệ thống" />
      {plSystem.groups.map(g => <Panel key={g.title} title={g.title} icon="grid">
          <div className="pl-sysgrid">
            {g.items.map(it => {
          const inner = <>
                  <span className="pl-sysitem__ic"><Icon name={it.icon} size={18} /></span>
                  <strong>{it.title}</strong>
                  <span>{it.desc}</span>
                </>;
          return it.to ? <Link key={it.title} to={it.to} className="pl-sysitem">{inner}</Link> : <button key={it.title} type="button" className="pl-sysitem">{inner}</button>;
        })}
          </div>
        </Panel>)}
      <Panel title="Thông tin hệ thống" icon="lock">
        <ul className="ps-kv">
          {plSystem.info.map(([k, v]) => <li key={k}><span>{k}</span><strong>{v}</strong></li>)}
        </ul>
      </Panel>
    </>;
}
