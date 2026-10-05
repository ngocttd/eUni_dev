'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'

import { LinkList, Panel, TileGrid } from "../../../../shared/components/ui/page.jsx";
import Icon from "../../../../shared/lib/Icon.jsx";
import { Link } from '../../../../lib/router.jsx';
import { SUPPORT, shell } from "../shared.jsx";
export function StuLearningPage() {
  const { stuLearning } = useModuleData('student-hub');
  return shell({
    title: 'Học tập & Đào tạo',
    lead: stuLearning.intro,
    crumbs: [{
      label: 'Sinh viên',
      to: '/sinh-vien'
    }, {
      label: 'Học tập & Đào tạo'
    }],
    sidebar: <>
        <LinkList title="Liên kết nhanh" items={stuLearning.quickLinks} />
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Nội dung học tập" icon="book"><TileGrid items={stuLearning.tiles} cols={3} /></Panel>
        <Panel title="Có thể bạn cần" icon="compass">
          <ul className="stu-check">
            <li><Icon name="check" size={14} /> Xem <Link to="/hoc-tap/chuong-trinh-dao-tao">khung chương trình đào tạo</Link> theo ngành và khóa của bạn.</li>
            <li><Icon name="check" size={14} /> Theo dõi <Link to="/hoc-tap/lich-hoc">lịch học – lịch thi</Link> và đăng ký học phần đúng hạn.</li>
            <li><Icon name="check" size={14} /> Tra <Link to="/hoc-tap/tra-cuu-ket-qua">kết quả học tập</Link> và điểm rèn luyện mỗi cuối học kỳ.</li>
          </ul>
        </Panel>
      </>
  });
}
