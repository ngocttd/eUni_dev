'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel, DocList } from "../../../../shared/components/ui/page.jsx";

import Icon from "../../../../shared/lib/Icon.jsx";
import { crumbs, shell } from "../shared.jsx";
export function AdmRegulationsPage() {
  const { admissionRegulations } = useModuleData('admissions');
  return shell({
    title: 'Quy chế tuyển sinh',
    lead: 'Đề án tuyển sinh, quy chế và các văn bản liên quan đến tuyển sinh đại học chính quy.',
    crumbs: crumbs('Quy chế tuyển sinh'),
    children: <>
        <Panel title="Văn bản, đề án" icon="file"><DocList items={admissionRegulations} /></Panel>
        <Panel title="Nội dung chính" icon="shield">
          <ul className="adm-check">
            <li><Icon name="check" size={14} /> Đối tượng, điều kiện dự tuyển và chính sách ưu tiên.</li>
            <li><Icon name="check" size={14} /> Các phương thức xét tuyển và nguyên tắc xét tuyển.</li>
            <li><Icon name="check" size={14} /> Quy đổi điểm chứng chỉ ngoại ngữ, chứng chỉ quốc tế.</li>
            <li><Icon name="check" size={14} /> Quy trình xử lý nguyện vọng, lọc ảo và công nhận trúng tuyển.</li>
          </ul>
        </Panel>
      </>
  });
}
