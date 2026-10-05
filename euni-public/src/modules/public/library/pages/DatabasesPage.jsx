'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useMemo, useState } from "react";

import { LinkList, Panel, FilterBar } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, lnorm, shell } from "../shared.jsx";
export function DatabasesPage() {
  const { databaseGroups, libraryHub } = useModuleData('library');
  const flat = useMemo(() => databaseGroups.flatMap(g => g.items.map(d => ({
    ...d,
    group: g.group
  }))), []);
  const [q, setQ] = useState('');
  const [grp, setGrp] = useState('Tất cả');
  const [acc, setAcc] = useState('Tất cả');
  const groups = ['Tất cả', ...databaseGroups.map(g => g.group)];
  const accs = ['Tất cả', ...Array.from(new Set(flat.map(d => d.access)))];
  const reset = () => {
    setQ('');
    setGrp('Tất cả');
    setAcc('Tất cả');
  };
  const list = useMemo(() => flat.filter(d => (grp === 'Tất cả' || d.group === grp) && (acc === 'Tất cả' || d.access === acc) && (!q || lnorm(`${d.name} ${d.desc}`).includes(lnorm(q)))), [flat, q, grp, acc]);
  return shell({
    title: 'CSDL khoa học & liên kết',
    lead: 'Danh mục cơ sở dữ liệu khoa học trong nước và quốc tế mà bạn đọc HUMG được quyền khai thác.',
    crumbs: [{
      label: 'Thư viện',
      to: '/thu-vien'
    }, {
      label: 'CSDL khoa học'
    }],
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={libraryHub.quickLinks} />
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Cơ sở dữ liệu khoa học" icon="library">
          <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo tên hoặc mô tả CSDL…" selects={[{
          label: 'Nhóm',
          value: grp,
          onChange: setGrp,
          options: groups
        }, {
          label: 'Quyền truy cập',
          value: acc,
          onChange: setAcc,
          options: accs
        }]} count={list.length} total={flat.length} onReset={reset} />
          <div className="lib-db">
            {list.map(d => <div key={d.name} className="lib-db__item">
                <span className="lib-db__ic"><Icon name="library" size={16} /></span>
                <div className="lib-db__main">
                  <strong>{d.name}</strong>
                  <p>{d.desc}</p>
                  <span className="lib-db__access"><Icon name="lock" size={11} /> {d.access} · {d.group}</span>
                </div>
                <a href="#" className="humg-btn humg-btn--ghost humg-btn--sm" aria-label={`Truy cập ${d.name}`}>Truy cập <Icon name="external" size={13} /></a>
              </div>)}
          </div>
          {list.length === 0 && <p className="lib-note">Không tìm thấy CSDL phù hợp.</p>}
        </Panel>
        <Panel title="Truy cập từ xa" icon="shield">
          <p className="lib-note">
            <Icon name="shield" size={14} />
            Các CSDL có phí giới hạn theo dải IP của Trường. Khi ở ngoài trường, hãy kết nối VPN HUMG
            hoặc dùng tài khoản truy cập từ xa do Thư viện cấp. Xem “Hướng dẫn truy cập từ xa (VPN)” trong mục Hướng dẫn sử dụng.
          </p>
        </Panel>
      </>
  });
}
