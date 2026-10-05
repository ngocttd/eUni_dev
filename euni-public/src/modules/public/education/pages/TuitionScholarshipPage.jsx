'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel, DocList, SupportCard, DataTable, StepList, Faq } from "../../../../shared/components/ui/page.jsx";

import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function TuitionScholarshipPage() {
  const { tuition } = useModuleData('education');
  return shell({
    title: 'Học phí & Học bổng',
    lead: 'Mức học phí, phương thức nộp, các loại học bổng và chính sách miễn giảm học phí.',
    crumbs: [{
      label: 'Học tập',
      to: '/hoc-tap'
    }, {
      label: 'Học phí & Học bổng'
    }],
    sidebar: <>
        <Panel title="Tài liệu" icon="file"><DocList items={tuition.docs} /></Panel>
        <SupportCard title="Phòng Kế hoạch – Tài chính" lead="Hỗ trợ về học phí, hóa đơn, gia hạn." phone="024.3838.3833" email="tckt@humg.edu.vn" cta={{
        label: 'Liên hệ',
        to: '/lien-he'
      }} />
      </>,
    children: <>
        <Panel title="Mức học phí năm học 2025 – 2026" icon="file" flush>
          <DataTable columns={tuition.table.columns} rows={tuition.table.rows} />
        </Panel>
        <Panel title="Phương thức & thời hạn nộp học phí" icon="clock">
          <StepList items={tuition.payment} />
        </Panel>
        <Panel title="Các loại học bổng" icon="award">
          <div className="edu-scholar">
            {tuition.scholarships.map(s => <div key={s.name} className="edu-scholar__item">
                <span className="edu-scholar__ic"><Icon name="award" size={18} /></span>
                <strong>{s.name}</strong>
                <span className="edu-scholar__value">{s.value}</span>
                <em>{s.cond}</em>
              </div>)}
          </div>
        </Panel>
        <Panel title="Đối tượng được miễn / giảm học phí" icon="shield">
          <ul className="edu-check">{tuition.waiver.map((w, i) => <li key={i}><Icon name="check" size={14} /> {w}</li>)}</ul>
        </Panel>
        <Panel title="Câu hỏi thường gặp" icon="headphones"><Faq items={tuition.faqs} /></Panel>
      </>
  });
}
