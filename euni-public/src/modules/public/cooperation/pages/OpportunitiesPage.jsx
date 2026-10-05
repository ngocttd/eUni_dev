'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { LinkList, SupportCard, Panel, TileGrid, StepList } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { shell } from "../shared.jsx";
export function OpportunitiesPage() {
  const { opportunities } = useModuleData('cooperation');
  return shell({
    title: 'Cơ hội hợp tác',
    lead: opportunities.intro,
    crumbs: [{
      label: 'Hợp tác',
      to: '/hop-tac'
    }, {
      label: 'Cơ hội hợp tác'
    }],
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={[{
        label: 'Danh sách đối tác',
        to: '/hop-tac/doi-tac'
      }, {
        label: 'Chương trình / Dự án',
        to: '/hop-tac/chuong-trinh-du-an'
      }, {
        label: 'Mẫu đề xuất hợp tác',
        to: '/hoc-tap/bieu-mau'
      }]} />
        <SupportCard title="Đề xuất hợp tác" lead="Gửi đề xuất tới Phòng Hợp tác quốc tế." phone={opportunities.contact.phone} email={opportunities.contact.email} cta={{
        label: 'Gửi đề xuất',
        to: '/lien-he'
      }} />
      </>,
    children: <>
        <Panel title="Các hình thức hợp tác" icon="grid">
          <TileGrid items={opportunities.forms.map(f => ({
          icon: f.icon,
          title: f.title,
          desc: f.text
        }))} cols={2} />
        </Panel>
        <Panel title="Lĩnh vực ưu tiên" icon="target">
          <ul className="coop-check">{opportunities.priorities.map((p, i) => <li key={i}><Icon name="check" size={14} /> {p}</li>)}</ul>
        </Panel>
        <Panel title="Cam kết của HUMG" icon="shield">
          <ul className="coop-check">{opportunities.commitments.map((c, i) => <li key={i}><Icon name="check" size={14} /> {c}</li>)}</ul>
        </Panel>
        <Panel title="Quy trình đề xuất & ký kết" icon="layers"><StepList items={opportunities.steps} /></Panel>
      </>
  });
}
