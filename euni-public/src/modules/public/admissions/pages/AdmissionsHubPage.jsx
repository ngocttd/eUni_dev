'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useLanguage } from "../../../../i18n/LanguageContext.jsx";
import { Panel, StatRow, StepList, NewsMini, DocList } from "../../../../shared/components/ui/page.jsx";

import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { crumbs, shell } from "../shared.jsx";
export function AdmissionsHubPage() {
  const { admissionCombos, admission, admissionTimeline } = useModuleData('admissions');
  const {
    t
  } = useLanguage();
  return shell({
    title: 'Tuyển sinh đại học chính quy',
    lead: 'Thông tin tuyển sinh hệ đại học chính quy của HUMG: chỉ tiêu, phương thức xét tuyển, ngành đào tạo, hồ sơ, thời gian và hướng dẫn đăng ký.',
    crumbs: crumbs(),
    children: <>
        <Panel title="Tuyển sinh 2026 trong những con số" icon="award">
          <StatRow items={[{
          value: '2.850',
          label: 'Chỉ tiêu ĐH chính quy 2026'
        }, {
          value: String(admissionCombos.rows.length),
          label: 'Ngành đào tạo'
        }, {
          value: String(admission.methods.length),
          label: 'Phương thức xét tuyển'
        }, {
          value: '20/08/2026',
          label: 'Dự kiến công bố điểm chuẩn'
        }]} />
        </Panel>

        <Panel title="Phương thức xét tuyển năm 2026" icon="layers" action={<Link to="/hoc-tap/tuyen-sinh/phuong-thuc" className="humg-link-more">{t('Chi tiết')} <Icon name="arrow-right" size={14} /></Link>}>
          <StepList items={admission.methods} />
        </Panel>

        <Panel title="Mốc thời gian quan trọng" icon="calendar" action={<Link to="/hoc-tap/tuyen-sinh/thoi-gian" className="humg-link-more">{t('Lịch đầy đủ')} <Icon name="arrow-right" size={14} /></Link>}>
          <ol className="adm-timeline">
            {admissionTimeline.slice(0, 5).map(t => <li key={t.phase}>
                <span className="adm-timeline__time">{t.time}</span>
                <span className="adm-timeline__body">
                  <strong>{t.phase}</strong>
                  {t.note && <em>{t.note}</em>}
                </span>
              </li>)}
          </ol>
        </Panel>

        <Panel title="Tin tức & Thông báo tuyển sinh" icon="newspaper" action={<Link to="/tin-tuc" className="humg-link-more">{t('Xem tất cả')} <Icon name="arrow-right" size={14} /></Link>}>
          <NewsMini items={admission.news} />
        </Panel>

        <Panel title="Tài liệu tuyển sinh" icon="file"><DocList items={admission.docs} /></Panel>
      </>
  });
}
