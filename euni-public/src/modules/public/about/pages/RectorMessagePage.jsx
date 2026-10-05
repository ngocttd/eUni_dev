'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel } from "../../../../shared/components/ui/page.jsx";

import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function RectorMessagePage() {
  const { rectorMessage } = useModuleData('about');
  return shell({
    title: 'Thông điệp của Hiệu trưởng',
    crumbs: [{
      label: 'Giới thiệu HUMG',
      to: '/gioi-thieu'
    }, {
      label: 'Thông điệp Hiệu trưởng'
    }],
    children: <Panel flush>
        <div className="about-message">
          <div className="about-message__aside">
            <span className="about-person__photo humg-ph" data-ratio="4-3"><span>Chân dung Hiệu trưởng</span></span>
            <strong>{rectorMessage.name}</strong>
            <span>{rectorMessage.role}</span>
          </div>
          <div className="about-message__body">
            <Icon name="award" size={24} />
            {rectorMessage.paragraphs.map((t, i) => <p key={i}>{t}</p>)}
            <p className="about-message__sign">{rectorMessage.sign}</p>
            <p className="about-message__name">{rectorMessage.name}</p>
            <div className="about-chips">
              {rectorMessage.values.map(v => <span key={v}>{v}</span>)}
            </div>
          </div>
        </div>
      </Panel>
  });
}
