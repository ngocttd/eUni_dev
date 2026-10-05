'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import Icon from "../../../../shared/lib/Icon.jsx";
import { Link } from '../../../../lib/router.jsx';
import { QUICKLINKS, SUPPORT, shell } from "../shared.jsx";
export function StfPortalPage() {
  const { stfPortal } = useModuleData('staff-hub');
  return shell({
    title: 'My eUni Giảng viên',
    lead: stfPortal.intro,
    crumbs: [{
      label: 'Giảng viên / Cán bộ',
      to: '/giang-vien'
    }, {
      label: 'My eUni Giảng viên'
    }],
    sidebar: <>
        {QUICKLINKS}
        {SUPPORT}
      </>,
    children: <div className="stf-portal">
        <div className="stf-portal__art"><Icon name="user" size={40} /></div>
        <div className="stf-portal__body">
          <h2>Đăng nhập cổng eUni Giảng viên</h2>
          <ul className="stf-check">
            {stfPortal.benefits.map((b, i) => <li key={i}><Icon name="check" size={14} /> {b}</li>)}
          </ul>
          <div className="stf-portal__actions">
            <Link to={stfPortal.loginTo} className="humg-btn humg-btn--primary">Đăng nhập ngay <Icon name="arrow-right" size={15} /></Link>
            <Link to={stfPortal.guideTo} className="humg-btn humg-btn--ghost">Xem hướng dẫn</Link>
          </div>
        </div>
      </div>
  });
}
