'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel, DocList, MetaBar } from "../../../../shared/components/ui/page.jsx";

import { Link } from '../../../../lib/router.jsx';
import { SUPPORT, shell } from "../shared.jsx";
export function SurveyPage() {
  const { surveys } = useModuleData('education');
  return shell({
    title: 'Khảo sát & Đánh giá',
    lead: 'Khảo sát lấy ý kiến người học, cựu người học và nhà tuyển dụng phục vụ cải tiến chất lượng đào tạo.',
    crumbs: [{
      label: 'Học tập',
      to: '/hoc-tap'
    }, {
      label: 'Khảo sát & Đánh giá'
    }],
    sidebar: <>
        <Panel title="Báo cáo khảo sát" icon="file"><DocList items={surveys.closed} /></Panel>
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Khảo sát đang mở" icon="check">
          <div className="edu-surveys">
            {surveys.open.map(s => <div key={s.name} className="edu-survey">
                <div>
                  <strong>{s.name}</strong>
                  <MetaBar items={[{
                icon: 'users',
                text: s.audience
              }, {
                icon: 'clock',
                text: `Hạn: ${s.deadline}`
              }]} />
                </div>
                <Link to="/lien-he" className="humg-btn humg-btn--primary">Tham gia</Link>
              </div>)}
          </div>
        </Panel>
        <Panel title="Về hoạt động khảo sát" icon="layers">
          <p style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.75
        }}>{surveys.about}</p>
        </Panel>
        <Panel title="Kết quả khảo sát gần đây" icon="award">
          <div className="edu-pct">
            {surveys.results.map(r => <div key={r.label} className="edu-pct__row">
                <span className="edu-pct__label">{r.label}</span>
                <span className="edu-pct__track"><span style={{
                width: `${r.value}%`
              }} /></span>
                <span className="edu-pct__val">{r.value}%</span>
              </div>)}
          </div>
        </Panel>
      </>
  });
}
