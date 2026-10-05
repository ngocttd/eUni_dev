'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { PageShell, HeroSearch, LinkList, SupportCard, Panel, TileGrid } from "../../../../shared/components/ui/page.jsx";

export function UtilitiesHubPage() {
  const { utilityGroups } = useModuleData('utilities');
  return <PageShell eyebrow="Tiện ích" title="Tiện ích & Dịch vụ" lead="Tổng hợp các công cụ, cổng dịch vụ và tra cứu trực tuyến của Trường Đại học Mỏ - Địa chất." crumbs={[{
    label: 'Tiện ích'
  }]} hero={<HeroSearch placeholder="Tìm công cụ, dịch vụ, tra cứu…" />} sidebar={<>
          <LinkList title="Dùng nhiều nhất" items={[{
      label: 'Lịch công tác',
      to: '/lich-cong-tac'
    }, {
      label: 'Thư viện số',
      to: '/thu-vien-so'
    }, {
      label: 'E-learning & LMS',
      to: '/hoc-tap/e-learning'
    }, {
      label: 'Biểu mẫu',
      to: '/hoc-tap/bieu-mau'
    }, {
      label: 'Webmail',
      to: '/webmail'
    }, {
      label: 'Tra cứu tuyển sinh',
      to: '/hoc-tap/tuyen-sinh'
    }]} />
          <SupportCard title="Trung tâm CNTT" lead="Hỗ trợ tài khoản, hệ thống và dịch vụ số của Nhà trường." phone="024.3838.2010" email="cntt@humg.edu.vn" cta={{
      label: 'Gửi yêu cầu hỗ trợ',
      to: '/lien-he'
    }} />
        </>}>
      {utilityGroups.map(g => <Panel key={g.title} title={g.title} icon="grid">
          <TileGrid items={g.items} cols={3} />
        </Panel>)}
    </PageShell>;
}
