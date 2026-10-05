'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useState } from "react";
import { Panel, DataTable } from "../../../../shared/components/ui/page.jsx";

import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { PageHead } from "../shared.jsx";
export function PsLibrary() {
  const { psLibrary } = useModuleData('portal-student');
  const [tab, setTab] = useState('tv');
  return <>
      <PageHead title="Thư viện & E-learning" />
      <Panel flush>
        <div className="ps-tabs">
          <button type="button" className={tab === 'tv' ? 'is-active' : ''} onClick={() => setTab('tv')}>Thư viện số</button>
          <button type="button" className={tab === 'el' ? 'is-active' : ''} onClick={() => setTab('el')}>E-learning</button>
        </div>
        <div className="ps-tabbody">
          {tab === 'tv' && <>
              <div className="ps-servicegrid">
                {psLibrary.tiles.map(t => <Link key={t.title} to={t.to} className="ps-service">
                    <span className="ps-service__ic"><Icon name={t.icon} size={20} /></span>
                    {t.title}
                  </Link>)}
              </div>
              <h4 className="ps-subhead">Tài liệu đang mượn</h4>
              <DataTable columns={['Tên tài liệu', 'Loại', 'Ngày mượn', 'Hạn trả', 'Còn lại']} rows={psLibrary.borrowing} />
            </>}
          {tab === 'el' && <div className="ps-elgrid">
              {psLibrary.elearning.map(e => {
            const ext = e.href.startsWith('http');
            return <a key={e.title} href={e.href} {...ext ? {
              target: '_blank',
              rel: 'noreferrer'
            } : {}} className="ps-el">
                    <span className="ps-el__ic"><Icon name={e.icon} size={20} /></span>
                    <strong>{e.title}</strong>
                    <span>{e.desc}</span>
                  </a>;
          })}
            </div>}
        </div>
      </Panel>
    </>;
}
