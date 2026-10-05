'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel, StatRow } from "../../../../shared/components/ui/page.jsx";

import { BarChart, shell } from "../shared.jsx";
export function NumbersPage() {
  const { numbers } = useModuleData('about');
  return shell({
    title: 'HUMG qua các con số',
    lead: 'Những số liệu phản ánh quy mô, chất lượng và sự phát triển của Nhà trường.',
    crumbs: [{
      label: 'Giới thiệu HUMG',
      to: '/gioi-thieu'
    }, {
      label: 'HUMG qua các con số'
    }],
    children: <>
        <Panel title="Tổng quan" icon="award"><StatRow items={numbers.big} /></Panel>
        <Panel title="Quy mô sinh viên qua các năm" icon="users"><BarChart data={numbers.enrollment} /></Panel>
        <Panel title="Công bố khoa học (2019 – 2024)" icon="flask"><BarChart data={numbers.publications} /></Panel>
        <Panel title="Đội ngũ giảng viên theo trình độ" icon="graduation">
          <div className="about-pct">
            {numbers.faculty.map(f => <div key={f.label} className="about-pct__row">
                <span className="about-pct__label">{f.label}</span>
                <span className="about-pct__track"><span style={{
                width: `${f.value}%`
              }} /></span>
                <span className="about-pct__val">{f.value}%</span>
              </div>)}
          </div>
        </Panel>
      </>
  });
}
