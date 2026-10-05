'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useLanguage } from "../../../../i18n/LanguageContext.jsx";
import { Panel, TileGrid, DataTable } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";

import { SUPPORT, shell } from "../shared.jsx";
export function StaffGatewayPage() {
  const { staffHub } = useModuleData('staff-hub');
  const {
    t
  } = useLanguage();
  return shell({
    title: 'Cổng Giảng viên / Cán bộ',
    lead: 'Lối vào nhanh các hệ thống dùng chung và thông tin điều hành. Đăng nhập My eUni để xem lịch giảng dạy, hồ sơ và nhiệm vụ cá nhân.',
    crumbs: [{
      label: 'Giảng viên / Cán bộ'
    }],
    sidebar: <>
        <Panel title="Thông báo" icon="bell" action={<Link to="/tin-tuc" className="humg-link-more">{t('Tất cả')} <Icon name="arrow-right" size={13} /></Link>}>
          <ul className="stf-notice">
            {staffHub.notices.slice(0, 4).map(n => <li key={n.title}>
                <span className="stf-notice__date">{n.date}</span>
                <Link to="/tin-tuc">{n.title}</Link>
              </li>)}
          </ul>
        </Panel>
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Truy cập nhanh" icon="grid"><TileGrid items={staffHub.quickTools} cols={3} /></Panel>

        <Panel title={`${t('Mốc thời gian năm học ·')} ${t(staffHub.keyDates.year)}`} icon="calendar" action={<Link to="/hoc-tap/lich-hoc?vaitro=giang-vien" className="humg-link-more">{t('Kế hoạch đầy đủ')} <Icon name="arrow-right" size={13} /></Link>}>
          <DataTable columns={['Nội dung', 'Thời gian']} rows={staffHub.keyDates.rows.map(r => [r[0], r[1]])} />
        </Panel>
      </>
  });
}
