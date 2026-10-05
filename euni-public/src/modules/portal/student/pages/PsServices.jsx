'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";

import Icon from "../../../../shared/lib/Icon.jsx";
import { PageHead } from "../shared.jsx";
export function PsServices() {
  const { psServices } = useModuleData('portal-student');
  return <>
      <PageHead title="Dịch vụ nội bộ" />
      <Panel title="Dịch vụ" icon="grid">
        <div className="ps-servicegrid">
          {psServices.tiles.map(t => <button key={t.title} type="button" className="ps-service">
              <span className="ps-service__ic"><Icon name={t.icon} size={20} /></span>
              {t.title}
            </button>)}
        </div>
      </Panel>
      <Panel title="Yêu cầu của tôi" icon="file">
        <DataTable columns={['Mã yêu cầu', 'Dịch vụ', 'Ngày tạo', 'Trạng thái']} rows={psServices.requests.map(r => [r[0], r[1], r[2], <span key="s" className={`ps-tag ${r[3] === 'Đã hoàn thành' ? 'ps-tag--done' : r[3] === 'Đã hủy' ? 'ps-tag--cancel' : 'ps-tag--run'}`}>{r[3]}</span>])} />
      </Panel>
    </>;
}
