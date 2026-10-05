'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { SupportCard, LinkList, Panel, TileGrid, StepList, Faq } from "../../../../shared/components/ui/page.jsx";
import { shell } from "../shared.jsx";
export function StudentSupportPage() {
  const { studentSupport } = useModuleData('life');
  return shell({
    title: 'Hỗ trợ sinh viên',
    lead: studentSupport.intro,
    crumbs: [{
      label: 'Đời sống',
      to: '/doi-song'
    }, {
      label: 'Hỗ trợ sinh viên'
    }],
    sidebar: <>
        <SupportCard title="Đường dây hỗ trợ" lead={studentSupport.hotline} cta={{
        label: 'Gửi yêu cầu',
        to: '/lien-he'
      }} />
        <LinkList title="Liên kết nhanh" items={[{
        label: 'Học phí & Học bổng',
        to: '/hoc-tap/hoc-phi-hoc-bong'
      }, {
        label: 'Hướng dẫn học tập',
        to: '/hoc-tap/huong-dan'
      }, {
        label: 'Việc làm – Khởi nghiệp',
        to: '/doi-song/viec-lam-khoi-nghiep'
      }]} />
      </>,
    children: <>
        <Panel title="Các kênh hỗ trợ" icon="grid">
          <TileGrid items={studentSupport.channels} cols={2} />
        </Panel>
        <Panel title="Quy trình tiếp nhận & xử lý" icon="layers"><StepList items={studentSupport.steps} /></Panel>
        <Panel title="Câu hỏi thường gặp" icon="headphones"><Faq items={studentSupport.faqs} /></Panel>
      </>
  });
}
