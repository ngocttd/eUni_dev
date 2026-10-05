'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Panel, Faq } from "../../../../shared/components/ui/page.jsx";

import Icon from "../../../../shared/lib/Icon.jsx";
import { Link } from '../../../../lib/router.jsx';
import { QUICKLINKS, SUPPORT, shell } from "../shared.jsx";
export function StuFaqPage() {
  const { stuFaq } = useModuleData('student-hub');
  return shell({
    title: 'Hỏi – Đáp dành cho sinh viên',
    lead: 'Giải đáp các thắc mắc thường gặp về tài khoản, đăng ký học phần, kết quả học tập, học phí và đời sống.',
    crumbs: [{
      label: 'Sinh viên',
      to: '/sinh-vien'
    }, {
      label: 'Hỏi – Đáp (FAQ)'
    }],
    sidebar: <>
        {QUICKLINKS}
        {SUPPORT}
      </>,
    children: <>
        <Panel title="Câu hỏi thường gặp" icon="headphones"><Faq items={stuFaq} /></Panel>
        <Panel title="Không tìm thấy câu trả lời?" icon="phone">
          <p className="stu-note"><Icon name="headphones" size={14} /> Gửi câu hỏi tới Trung tâm Hỗ trợ sinh viên qua <Link to="/lien-he">trang Liên hệ</Link> hoặc hộp thư htsv@humg.edu.vn — bạn sẽ nhận phản hồi trong 3 – 5 ngày làm việc.</p>
        </Panel>
      </>
  });
}
