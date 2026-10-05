'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { Panel, DocList, DataTable, StepList, Faq } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, shell } from "../shared.jsx";
export function ExchangePage() {
  const { exchange } = useModuleData('cooperation');
  return shell({
    title: 'Chương trình trao đổi',
    lead: exchange.intro,
    crumbs: [{
      label: 'Hợp tác',
      to: '/hop-tac'
    }, {
      label: 'Chương trình trao đổi'
    }],
    sidebar: <>
        <Panel title="Tài liệu" icon="file"><DocList items={exchange.docs} /></Panel>
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Các chương trình trao đổi" icon="users" flush>
          <DataTable columns={['Chương trình', 'Đối tác', 'Thời lượng', 'Đối tượng']} rows={exchange.programs.map(p => [p.name, p.partner, p.dur, p.level])} />
        </Panel>
        <Panel title="Quy trình đăng ký" icon="layers"><StepList items={exchange.steps} /></Panel>
        <Panel title="Quyền lợi" icon="award">
          <ul className="coop-check">{exchange.benefits.map((b, i) => <li key={i}><Icon name="check" size={14} /> {b}</li>)}</ul>
        </Panel>
        <Panel title="Điều kiện tham gia" icon="shield">
          <ul className="coop-check">{exchange.eligibility.map((e, i) => <li key={i}><Icon name="check" size={14} /> {e}</li>)}</ul>
        </Panel>
        <Panel title="Câu hỏi thường gặp" icon="headphones"><Faq items={exchange.faqs} /></Panel>
      </>
  });
}
