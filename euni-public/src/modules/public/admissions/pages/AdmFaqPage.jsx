'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel, Faq } from "../../../../shared/components/ui/page.jsx";

import { crumbs, shell } from "../shared.jsx";
export function AdmFaqPage() {
  const { admission } = useModuleData('admissions');
  return shell({
    title: 'Câu hỏi thường gặp về tuyển sinh',
    lead: 'Giải đáp các thắc mắc phổ biến về phương thức, hồ sơ, học phí và học bổng tuyển sinh.',
    crumbs: crumbs('Câu hỏi thường gặp'),
    children: <Panel title="Hỏi – Đáp" icon="headphones"><Faq items={admission.faqs} /></Panel>
  });
}
