'use client'
import { PageShell, Panel, NewsMini, SupportCard, TileGrid, DataTable, Faq } from "../../../../shared/components/ui/page.jsx";
import { Link } from '../../../../lib/router.jsx';
import Icon from "../../../../shared/lib/Icon.jsx";
import { PARENT_NAV, parentFaq, parentKeyDates } from "../shared.jsx";
export function ParentGatewayPage() {
  return <PageShell eyebrow="Phụ huynh" title="Thông tin dành cho phụ huynh" lead="Trang thông tin công khai giúp phụ huynh đồng hành cùng con trong quá trình học tập tại HUMG. Đăng nhập My eUni Phụ huynh để xem kết quả học tập, học phí và lịch học của riêng con bạn." crumbs={[{
    label: 'Phụ huynh'
  }]} sectionNav={PARENT_NAV} variant="student" sidebar={<>
          <Panel title="Thông báo" icon="bell" action={<Link to="/tin-tuc" className="humg-link-more">Tất cả <Icon name="arrow-right" size={13} /></Link>}>
            <NewsMini items={[{
        date: '15/08/2026',
        title: 'Kế hoạch đón tân sinh viên K71 và họp phụ huynh đầu khóa',
        to: '/tin-tuc'
      }, {
        date: '05/08/2026',
        title: 'Mức học phí và lộ trình thu năm học 2026 – 2027',
        to: '/tin-tuc'
      }, {
        date: '20/07/2026',
        title: 'Hướng dẫn đăng ký tài khoản My eUni Phụ huynh',
        to: '/tin-tuc'
      }]} />
          </Panel>
          <SupportCard title="Hỗ trợ phụ huynh" lead="Giải đáp về học tập, học phí và đời sống của sinh viên." phone="024.3838.3830" email="ctsv@humg.edu.vn" cta={{
      label: 'Gửi câu hỏi',
      to: '/lien-he'
    }} />
        </>}>
      <Panel title="Truy cập nhanh" icon="grid">
        <TileGrid cols={3} items={[{
        icon: 'award',
        title: 'Kết quả học tập của con',
        desc: 'Cách tra cứu điểm, GPA, rèn luyện',
        to: '/hoc-tap/tra-cuu-ket-qua'
      }, {
        icon: 'file',
        title: 'Học phí & Học bổng',
        desc: 'Mức thu, chính sách, cách nộp',
        to: '/hoc-tap/hoc-phi-hoc-bong'
      }, {
        icon: 'calendar',
        title: 'Lịch học – Lịch thi',
        desc: 'Kế hoạch năm học, lịch thi',
        to: '/hoc-tap/lich-hoc'
      }, {
        icon: 'search',
        title: 'Tuyển sinh',
        desc: 'Chỉ tiêu, ngành, phương thức xét tuyển',
        to: '/hoc-tap/tuyen-sinh'
      }, {
        icon: 'user',
        title: 'My eUni Phụ huynh',
        desc: 'Theo dõi kết quả, học phí của con',
        to: '/dang-nhap-phu-huynh'
      }, {
        icon: 'phone',
        title: 'Liên hệ Nhà trường',
        desc: 'Điện thoại, email các đơn vị',
        to: '/lien-he'
      }]} />
      </Panel>

      <Panel title={`Mốc thời gian năm học · ${parentKeyDates.year}`} icon="calendar" action={<Link to="/hoc-tap/lich-hoc" className="humg-link-more">Kế hoạch đầy đủ <Icon name="arrow-right" size={13} /></Link>}>
        <DataTable columns={['Nội dung', 'Thời gian']} rows={parentKeyDates.rows.map(r => [r[0], r[1]])} />
      </Panel>

      <Panel title="Câu hỏi thường gặp" icon="headphones"><Faq items={parentFaq} /></Panel>
    </PageShell>;
}
