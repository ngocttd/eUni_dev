'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel, StepList } from "../../../../shared/components/ui/page.jsx";

import Icon from "../../../../shared/lib/Icon.jsx";
import { crumbs, shell } from "../shared.jsx";
export function AdmMethodsPage() {
  const { admission } = useModuleData('admissions');
  return shell({
    title: 'Phương thức xét tuyển',
    lead: 'HUMG sử dụng 5 phương thức xét tuyển vào hệ đại học chính quy năm 2026.',
    crumbs: crumbs('Phương thức xét tuyển'),
    children: <>
        <Panel title="Các phương thức xét tuyển" icon="layers"><StepList items={admission.methods} /></Panel>
        <Panel title="Lưu ý" icon="bell">
          <ul className="adm-check">
            <li><Icon name="check" size={14} /> Thí sinh được đăng ký nhiều phương thức; hệ thống xét theo phương thức có lợi nhất.</li>
            <li><Icon name="check" size={14} /> Điểm ưu tiên khu vực và đối tượng áp dụng theo Quy chế tuyển sinh hiện hành.</li>
            <li><Icon name="check" size={14} /> Ngưỡng đảm bảo chất lượng đầu vào công bố sau khi có kết quả thi tốt nghiệp THPT.</li>
          </ul>
        </Panel>
      </>
  });
}
