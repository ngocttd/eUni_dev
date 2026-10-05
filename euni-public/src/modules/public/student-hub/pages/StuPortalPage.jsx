'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import Icon from "../../../../shared/lib/Icon.jsx";
import { Link } from '../../../../lib/router.jsx';
import { QUICKLINKS, SUPPORT, shell } from "../shared.jsx";
export function StuPortalPage() {
  const { stuPortal } = useModuleData('student-hub');
  return shell({
    title: 'My eUni Sinh viên',
    lead: stuPortal.intro,
    crumbs: [{
      label: 'Sinh viên',
      to: '/sinh-vien'
    }, {
      label: 'My eUni Sinh viên'
    }],
    sidebar: <>
        {QUICKLINKS}
        {SUPPORT}
      </>,
    children: <div className="stu-portal">
        <div className="stu-portal__art"><Icon name="user" size={40} /></div>
        <div className="stu-portal__body">
          <h2>Đăng nhập cổng eUni Sinh viên</h2>
          <ul className="stu-check">
            {stuPortal.benefits.map((b, i) => <li key={i}><Icon name="check" size={14} /> {b}</li>)}
          </ul>
          <div className="stu-portal__actions">
            <Link to={stuPortal.loginTo} className="humg-btn humg-btn--primary">Đăng nhập ngay <Icon name="arrow-right" size={15} /></Link>
            <Link to={stuPortal.guideTo} className="humg-btn humg-btn--ghost">Xem hướng dẫn</Link>
          </div>
        </div>
      </div>
  });
}
