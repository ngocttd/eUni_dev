'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { PageShell, HeroSearch, Panel, NewsMini, SupportCard, Pagination } from "../../../../shared/components/ui/page.jsx";

import { EventRow } from "../shared.jsx";
export function EventListPage() {
  const { events } = useModuleData('content');
  return <PageShell eyebrow="Trang chủ" title="Sự kiện sắp diễn ra" lead="Lịch hội thảo, hội nghị, sự kiện học thuật và hoạt động của Trường Đại học Mỏ - Địa chất." crumbs={[{
    label: 'Sự kiện'
  }]} hero={<HeroSearch placeholder="Tìm sự kiện…" />} sidebar={<>
          <Panel title="Lịch tháng" icon="calendar">
            <NewsMini items={events.map(e => ({
        date: `${e.day}/${e.month.replace('THG ', '').padStart(2, '0')}`,
        title: e.title,
        to: `/su-kien/${e.slug}`
      }))} />
          </Panel>
          <SupportCard title="Nhận thông báo sự kiện" lead="Đăng ký để không bỏ lỡ hội thảo, hội nghị của HUMG." cta={{
      label: 'Đăng ký',
      to: '/lien-he'
    }} />
        </>}>
      <Panel title="Tất cả sự kiện" icon="calendar">
        <div className="content-eventlist">
          {events.map(e => <EventRow key={e.slug} e={e} />)}
        </div>
      </Panel>
      <Pagination page={1} total={3} />
    </PageShell>;
}
