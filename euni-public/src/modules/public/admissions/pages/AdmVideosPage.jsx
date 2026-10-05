'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel, MediaCard } from "../../../../shared/components/ui/page.jsx";

import { crumbs, shell } from "../shared.jsx";
export function AdmVideosPage() {
  const { admissionVideos } = useModuleData('admissions');
  return shell({
    title: 'Video giới thiệu ngành',
    lead: 'Tìm hiểu các ngành đào tạo và đời sống sinh viên HUMG qua video.',
    crumbs: crumbs('Video giới thiệu ngành'),
    children: <Panel title="Thư viện video" icon="play">
        <div className="adm-videos">
          {admissionVideos.map(v => <MediaCard key={v.title} kind="video" to="/media" title={v.title} meta={v.meta} badge="Video" />)}
        </div>
      </Panel>
  });
}
