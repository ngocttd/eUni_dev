'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState, useMemo } from "react";

import { PageShell, LinkList, SupportCard, Panel, TileGrid, FilterBar, StatRow } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { norm } from "../shared.jsx";
export function DigitalLibraryPage() {
  const { digilib } = useModuleData('utilities');
  const [q, setQ] = useState('');
  const [dtype, setDtype] = useState('Tất cả');
  const [dyear, setDyear] = useState('Tất cả');
  const dtypes = ['Tất cả', ...Array.from(new Set(digilib.latest.map(d => d.type)))];
  const dyears = ['Tất cả', ...Array.from(new Set(digilib.latest.map(d => String(d.year)))).sort().reverse()];
  const latest = useMemo(() => digilib.latest.filter(d => (dtype === 'Tất cả' || d.type === dtype) && (dyear === 'Tất cả' || String(d.year) === dyear) && (!q || norm(`${d.title} ${d.author}`).includes(norm(q)))), [q, dtype, dyear]);
  return <PageShell eyebrow="Thư viện" title="Thư viện số HUMG" lead="Kho tài nguyên tri thức số phục vụ học tập, giảng dạy, nghiên cứu khoa học và phát triển học thuật." crumbs={[{
    label: 'Thư viện',
    to: '/thu-vien'
  }, {
    label: 'Thư viện số'
  }]} sidebar={<>
          <LinkList title="Hỗ trợ nhanh" items={digilib.help} />
          <SupportCard lead="Liên hệ qua email, điện thoại hoặc chat trực tuyến." phone="024.3838.3060" email="thuvien@humg.edu.vn" cta={{
      label: 'Liên hệ ngay',
      to: '/lien-he'
    }} />
        </>}>
      <Panel title="Truy cập theo loại tài nguyên" icon="grid">
        <TileGrid items={digilib.access} cols={3} />
      </Panel>
      <Panel title="Tài nguyên nổi bật" icon="layers" action={<Link to="/thu-vien" className="humg-link-more">Xem tất cả <Icon name="arrow-right" size={14} /></Link>}>
        <div className="util-resgrid">
          {digilib.resources.map(r => <div key={r.name} className="util-res">
              <span className="util-res__badge">CSDL</span>
              <strong>{r.name}</strong>
              <span>{r.meta}</span>
            </div>)}
        </div>
      </Panel>
      <Panel title="Tài liệu mới cập nhật" icon="book">
        <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo tên tài liệu hoặc tác giả…" selects={[{
        label: 'Loại',
        value: dtype,
        onChange: setDtype,
        options: dtypes
      }, {
        label: 'Năm',
        value: dyear,
        onChange: setDyear,
        options: dyears
      }]} count={latest.length} total={digilib.latest.length} onReset={() => {
        setQ('');
        setDtype('Tất cả');
        setDyear('Tất cả');
      }} />
        <ul className="util-courselist">
          {latest.map(d => <li key={d.title}>
              <span className="util-courselist__ic"><Icon name="file" size={16} /></span>
              <span><strong>{d.title}</strong><em>{d.author} · {d.year} · {d.type}</em></span>
              <a href="#" className="ui-doclist__dl" aria-label="Tải xuống"><Icon name="download" size={16} /></a>
            </li>)}
        </ul>
        {latest.length === 0 && <p className="util-muted">Không tìm thấy tài liệu phù hợp.</p>}
      </Panel>
      <Panel title="Thống kê thư viện" icon="award"><StatRow items={digilib.stats} /></Panel>
    </PageShell>;
}
