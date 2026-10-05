'use client'
import { libraryGuide } from '../../../../config/static/library.js'

import { Panel, DataTable, StepList, Faq, DocList } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { SUPPORT, shell } from "../shared.jsx";
export function LibraryGuidePage() {
  return shell({
    title: 'Hướng dẫn sử dụng thư viện',
    lead: libraryGuide.intro,
    crumbs: [{
      label: 'Thư viện',
      to: '/thu-vien'
    }, {
      label: 'Hướng dẫn sử dụng'
    }],
    sidebar: <>
        <Panel title="Giờ mở cửa" icon="clock" flush>
          <DataTable columns={['Thời gian', 'Giờ phục vụ']} rows={libraryGuide.hours} />
        </Panel>
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Các bước sử dụng thư viện" icon="layers"><StepList items={libraryGuide.steps} /></Panel>
        <Panel title="Câu hỏi thường gặp" icon="headphones"><Faq items={libraryGuide.faqs} /></Panel>
        <Panel title="Nội quy thư viện" icon="shield">
          <ul className="lib-check">
            {libraryGuide.rules.map((r, i) => <li key={i}><Icon name="check" size={14} /> {r}</li>)}
          </ul>
        </Panel>
        <Panel title="Tài liệu hướng dẫn" icon="file"><DocList items={libraryGuide.downloads} /></Panel>
      </>
  });
}
