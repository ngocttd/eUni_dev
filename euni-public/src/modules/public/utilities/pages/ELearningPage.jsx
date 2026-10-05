'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { PageShell, Panel, DocList, SupportCard, TileGrid } from "../../../../shared/components/ui/page.jsx";

import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { EDU_NAV } from "../shared.jsx";
export function ELearningPage() {
  const { elearning } = useModuleData('utilities');
  return <PageShell sectionNav={EDU_NAV} accent="#0284c7" eyebrow="Học tập" title="E-learning & Hệ thống LMS" lead="Nền tảng học tập trực tuyến của HUMG: lớp học phần, khóa học, học liệu số và các công cụ dạy – học từ xa." crumbs={[{
    label: 'Học tập',
    to: '/hoc-tap'
  }, {
    label: 'E-learning & LMS'
  }]} sidebar={<>
          <Panel title="Hướng dẫn sử dụng" icon="file"><DocList items={elearning.docs} /></Panel>
          <SupportCard title="Hỗ trợ kỹ thuật" lead="Sự cố đăng nhập, lớp học, tài khoản LMS." phone="024.3838.2020" email="elearning@humg.edu.vn" cta={{
      label: 'Gửi yêu cầu hỗ trợ',
      to: '/lien-he'
    }} />
        </>}>
      <Panel title="Công cụ học tập" icon="grid">
        <TileGrid items={elearning.tiles} cols={2} />
      </Panel>
      <Panel title="Truy cập nhanh" icon="external">
        <div className="util-systems">
          {elearning.systems.map(s => <Link key={s.name} to={s.to} className="util-system">
              <span className="util-system__ic"><Icon name="external" size={18} /></span>
              <strong>{s.name}</strong>
              <span>{s.desc}</span>
            </Link>)}
        </div>
      </Panel>
      <Panel title="Khóa học nổi bật" icon="book" action={<Link to="/hoc-tap" className="humg-link-more">Xem tất cả <Icon name="arrow-right" size={14} /></Link>}>
        <ul className="util-courselist">
          {elearning.courses.map(c => <li key={c.title}>
              <span className="util-courselist__ic"><Icon name="play" size={16} /></span>
              <span><strong>{c.title}</strong><em>{c.meta}</em></span>
              <Link to="/hoc-tap/e-learning" className="humg-btn humg-btn--ghost">Vào học</Link>
            </li>)}
        </ul>
      </Panel>
    </PageShell>;
}
