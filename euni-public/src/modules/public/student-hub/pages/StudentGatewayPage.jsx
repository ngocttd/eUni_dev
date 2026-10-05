'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useLanguage } from "../../../../i18n/LanguageContext.jsx";
import { Panel, TileGrid, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";

import { SUPPORT, shell } from "../shared.jsx";
export function StudentGatewayPage() {
  const { studentHub } = useModuleData('student-hub');
  const {
    t
  } = useLanguage();
  return shell({
    title: 'Cổng Sinh viên',
    lead: 'Lối vào nhanh các trang thông tin dành cho sinh viên. Đăng nhập My eUni để xem lịch học, điểm và học phí cá nhân.',
    crumbs: [{
      label: 'Sinh viên'
    }],
    sidebar: <>
        <Panel title="Thông báo" icon="bell" action={<Link to="/tin-tuc" className="humg-link-more">{t('Tất cả')} <Icon name="arrow-right" size={13} /></Link>}>
          <ul className="stu-notice">
            {studentHub.notices.slice(0, 4).map(n => <li key={n.title}>
                <span className="stu-notice__date">{n.date}{n.tag && <em>{n.tag}</em>}</span>
                <Link to="/tin-tuc">{n.title}</Link>
              </li>)}
          </ul>
        </Panel>
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Truy cập nhanh" icon="grid"><TileGrid items={studentHub.publicTools} cols={3} /></Panel>

        <Panel title={`${t('Mốc thời gian học kỳ ·')} ${t(studentHub.keyDates.year)}`} icon="calendar" action={<Link to="/hoc-tap/lich-hoc" className="humg-link-more">{t('Kế hoạch đầy đủ')} <Icon name="arrow-right" size={13} /></Link>}>
          <DataTable columns={['Nội dung', 'Thời gian']} rows={studentHub.keyDates.rows.map(r => [r[0], r[1]])} />
        </Panel>

        <p className="stu-note">
          <Icon name="compass" size={14} /> Mới nhập học? Xem <Link to="/sinh-vien/tan-sinh-vien">Sổ tay tân sinh viên</Link>
          &nbsp;và <Link to="/sinh-vien/faq">Hỏi – Đáp</Link>.
        </p>
      </>
  });
}
