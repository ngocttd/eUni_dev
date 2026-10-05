'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useMemo, useState } from "react";

import { LinkList, Panel, StatRow, FilterBar, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import { SUPPORT, cnorm, shell } from "../shared.jsx";
export function PartnerListPage({
  scope = 'all'
}) {
  const { partners, partnerCategories } = useModuleData('cooperation');
  const scoped = useMemo(() => {
    if (scope === 'trong-nuoc') return partners.filter(p => p.type === 'Trong nước');
    if (scope === 'quoc-te') return partners.filter(p => p.type === 'Quốc tế');
    return partners;
  }, [scope]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Tất cả');
  const [country, setCountry] = useState('Tất cả');
  const cats = ['Tất cả', ...partnerCategories.slice(1).filter(c => scoped.some(p => p.category === c))];
  const countries = ['Tất cả', ...Array.from(new Set(scoped.map(p => p.country)))];
  const list = useMemo(() => scoped.filter(p => (cat === 'Tất cả' || p.category === cat) && (country === 'Tất cả' || p.country === country) && (!q || cnorm(`${p.name} ${p.country} ${p.fields.join(' ')}`).includes(cnorm(q)))), [scoped, q, cat, country]);
  const meta = {
    all: {
      title: 'Danh sách đối tác',
      lead: 'Toàn bộ đối tác trong nước và quốc tế của Trường Đại học Mỏ - Địa chất.',
      crumb: 'Danh sách đối tác'
    },
    'trong-nuoc': {
      title: 'Đối tác trong nước',
      lead: 'Các doanh nghiệp, viện nghiên cứu, trường đại học và cơ quan quản lý trong nước.',
      crumb: 'Đối tác trong nước'
    },
    'quoc-te': {
      title: 'Đối tác quốc tế',
      lead: 'Các trường, viện và tổ chức quốc tế từ nhiều quốc gia trên thế giới.',
      crumb: 'Đối tác quốc tế'
    }
  }[scope];
  return shell({
    title: meta.title,
    lead: meta.lead,
    crumbs: [{
      label: 'Hợp tác',
      to: '/hop-tac'
    }, {
      label: meta.crumb
    }],
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={[{
        label: 'Đối tác trong nước',
        to: '/hop-tac/doi-tac-trong-nuoc'
      }, {
        label: 'Đối tác quốc tế',
        to: '/hop-tac/doi-tac-quoc-te'
      }, {
        label: 'Chương trình / Dự án',
        to: '/hop-tac/chuong-trinh-du-an'
      }, {
        label: 'Cơ hội hợp tác',
        to: '/hop-tac/co-hoi-hop-tac'
      }]} />
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Thống kê" icon="award">
          <StatRow items={[{
          value: '128',
          label: 'Tổng số đối tác'
        }, {
          value: String(partners.filter(p => p.type === 'Trong nước').length * 6),
          label: 'Đối tác trong nước'
        }, {
          value: '46',
          label: 'Quốc gia'
        }, {
          value: '24',
          label: 'Chương trình liên kết'
        }]} />
        </Panel>
        <Panel title="Danh sách đối tác" icon="handshake">
          <FilterBar search={q} onSearch={setQ} searchPlaceholder="Tìm theo tên, quốc gia, lĩnh vực…" selects={[{
          label: 'Quốc gia',
          value: country,
          onChange: setCountry,
          options: countries
        }, {
          label: 'Loại đối tác',
          value: cat,
          onChange: setCat,
          options: cats
        }]} count={list.length} total={scoped.length} onReset={() => {
          setQ('');
          setCat('Tất cả');
          setCountry('Tất cả');
        }} />
          <DataTable columns={['#', 'Tên đối tác', 'Quốc gia', 'Loại đối tác', 'Lĩnh vực hợp tác', 'Trạng thái', '']} rows={list.map((p, i) => [String(i + 1), <Link key="t" to={`/hop-tac/doi-tac/${p.id}`}>{p.name}</Link>, p.country, p.category, p.fields.slice(0, 2).join(', '), <span key="s" className="coop-status is-run">Đang hợp tác</span>, <Link key="a" to={`/hop-tac/doi-tac/${p.id}`} className="humg-link-more">Chi tiết</Link>])} />
          {list.length === 0 && <p className="coop-note">Không tìm thấy đối tác phù hợp.</p>}
        </Panel>
      </>
  });
}
