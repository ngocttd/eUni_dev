'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { Panel, StepList, DocList } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { QUICKLINKS, SUPPORT, shell } from "../shared.jsx";
export function StuOnboardingPage() {
  const { stuOnboarding } = useModuleData('student-hub');
  return shell({
    title: 'Sổ tay tân sinh viên',
    lead: stuOnboarding.intro,
    crumbs: [{
      label: 'Sinh viên',
      to: '/sinh-vien'
    }, {
      label: 'Sổ tay tân sinh viên'
    }],
    sidebar: <>
        {QUICKLINKS}
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Việc cần làm khi nhập học" icon="compass"><StepList items={stuOnboarding.steps} /></Panel>
        <Panel title="Danh mục kiểm tra nhanh" icon="check">
          <ul className="stu-check">
            {stuOnboarding.checklist.map((c, i) => <li key={i}><Icon name="check" size={14} /> {c}</li>)}
          </ul>
        </Panel>
        <Panel title="Tài liệu tải về" icon="file"><DocList items={stuOnboarding.downloads} /></Panel>
      </>
  });
}
