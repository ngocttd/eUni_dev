'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import Icon from "../../../../shared/lib/Icon.jsx";

import { Panel, TileGrid } from "../../../../shared/components/ui/page.jsx";
import { shell } from "../shared.jsx";
export function VisionPage() {
  const { vision } = useModuleData('about');
  return shell({
    title: 'Sứ mạng – Tầm nhìn – Giá trị cốt lõi',
    crumbs: [{
      label: 'Giới thiệu HUMG',
      to: '/gioi-thieu'
    }, {
      label: 'Sứ mạng – Tầm nhìn – Giá trị cốt lõi'
    }],
    children: <>
        <div className="about-vision">
          <div className="about-vision__card">
            <span className="about-vision__ic"><Icon name="target" size={22} /></span>
            <h3>Sứ mạng</h3>
            <p>{vision.mission}</p>
          </div>
          <div className="about-vision__card">
            <span className="about-vision__ic"><Icon name="rocket" size={22} /></span>
            <h3>Tầm nhìn</h3>
            <p>{vision.visionText}</p>
          </div>
          <div className="about-vision__card is-accent">
            <span className="about-vision__ic"><Icon name="award" size={22} /></span>
            <h3>Giá trị cốt lõi</h3>
            <p className="about-vision__core">{vision.core}</p>
          </div>
        </div>
        <Panel title="Nguyên tắc hoạt động" icon="layers">
          <TileGrid items={vision.principles.map(p => ({
          icon: p.icon,
          title: p.title,
          desc: p.desc
        }))} cols={3} />
        </Panel>
      </>
  });
}
