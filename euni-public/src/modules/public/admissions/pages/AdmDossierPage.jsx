'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";

import Icon from "../../../../shared/lib/Icon.jsx";
import { crumbs, shell } from "../shared.jsx";
export function AdmDossierPage() {
  const { admissionDossier } = useModuleData('admissions');
  return shell({
    title: 'Hồ sơ & Giấy tờ',
    lead: 'Danh mục hồ sơ cần chuẩn bị khi đăng ký xét tuyển vào HUMG.',
    crumbs: crumbs('Hồ sơ & Giấy tờ'),
    children: <>
        <Panel title="Hồ sơ chung" icon="file">
          <ul className="adm-check">
            {admissionDossier.common.map(x => <li key={x}><Icon name="check" size={14} /> {x}</li>)}
          </ul>
        </Panel>
        <Panel title="Hồ sơ theo phương thức đặc thù" icon="layers" flush>
          <DataTable columns={['Phương thức', 'Giấy tờ bổ sung']} rows={admissionDossier.bySpecial} />
        </Panel>
        <Panel title="Nơi nộp hồ sơ" icon="map-pin">
          <p className="adm-prose">{admissionDossier.submit}</p>
        </Panel>
      </>
  });
}
