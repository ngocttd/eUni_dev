'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { Panel, DocList, SupportCard, StatRow, DataTable, StepList, TileGrid, Faq } from "../../../../shared/components/ui/page.jsx";
import { shell } from "../shared.jsx";
export function IntlStudentsPage() {
  const { intlStudents } = useModuleData('cooperation');
  return shell({
    title: 'Sinh viên quốc tế',
    lead: intlStudents.intro,
    crumbs: [{
      label: 'Hợp tác',
      to: '/hop-tac'
    }, {
      label: 'Sinh viên quốc tế'
    }],
    sidebar: <>
        <Panel title="Tài liệu" icon="file"><DocList items={intlStudents.docs} /></Panel>
        <SupportCard title="Văn phòng Sinh viên quốc tế" lead="Hỗ trợ tuyển sinh, nhập học và đời sống." phone={intlStudents.contact.phone} email={intlStudents.contact.email} cta={{
        label: 'Liên hệ',
        to: '/lien-he'
      }} />
      </>,
    children: <>
        <Panel title="Số liệu" icon="award"><StatRow items={intlStudents.stats} /></Panel>
        <Panel title="Các hình thức học tập" icon="graduation" flush>
          <DataTable columns={['Hình thức', 'Thời lượng', 'Ghi chú']} rows={intlStudents.programs.map(p => [p.name, p.dur, p.note])} />
        </Panel>
        <Panel title="Quy trình nhập học" icon="layers"><StepList items={intlStudents.steps} /></Panel>
        <Panel title="Dịch vụ hỗ trợ" icon="heart">
          <TileGrid items={intlStudents.support.map(s => ({
          icon: s.icon,
          title: s.title,
          desc: s.text
        }))} cols={2} />
        </Panel>
        <Panel title="Câu hỏi thường gặp" icon="headphones"><Faq items={intlStudents.faqs} /></Panel>
      </>
  });
}
