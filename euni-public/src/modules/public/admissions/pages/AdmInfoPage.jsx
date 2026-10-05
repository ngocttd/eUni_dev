'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel, DataTable, DocList } from "../../../../shared/components/ui/page.jsx";

import { crumbs, shell } from "../shared.jsx";
export function AdmInfoPage() {
  const { admission, admissionCombos } = useModuleData('admissions');
  return shell({
    title: 'Thông tin tuyển sinh 2026',
    lead: 'Chỉ tiêu dự kiến, ngành đào tạo và tổ hợp xét tuyển năm 2026.',
    crumbs: crumbs('Thông tin tuyển sinh'),
    children: <>
        <Panel title="Chỉ tiêu dự kiến năm 2026" icon="book" flush>
          <DataTable columns={admission.quota.columns} rows={admission.quota.rows} />
        </Panel>
        <Panel title="Ngành đào tạo & tổ hợp xét tuyển" icon="graduation" flush>
          <DataTable columns={admissionCombos.columns} rows={admissionCombos.rows} />
        </Panel>
        <Panel title="Tài liệu tuyển sinh" icon="file"><DocList items={admission.docs} /></Panel>
      </>
  });
}
