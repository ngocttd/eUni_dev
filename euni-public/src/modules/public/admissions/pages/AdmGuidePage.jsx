'use client'
import { Panel, StepList, DocList } from "../../../../shared/components/ui/page.jsx";
import { crumbs, shell } from "../shared.jsx";
export function AdmGuidePage() {
  return shell({
    title: 'Hướng dẫn đăng ký xét tuyển',
    lead: 'Quy trình đăng ký xét tuyển trực tuyến trên Cổng tuyển sinh HUMG và Cổng của Bộ GD&ĐT.',
    crumbs: crumbs('Hướng dẫn đăng ký'),
    children: <>
        <Panel title="Quy trình đăng ký trực tuyến" icon="check">
          <StepList items={[{
          title: 'Tạo tài khoản trên Cổng tuyển sinh HUMG',
          text: 'Dùng số CCCD và email cá nhân; xác thực qua mã OTP.'
        }, {
          title: 'Khai hồ sơ & tải minh chứng',
          text: 'Nhập thông tin cá nhân, kết quả học tập; tải học bạ, chứng chỉ, giấy tờ ưu tiên.'
        }, {
          title: 'Chọn ngành / phương thức & nộp lệ phí',
          text: 'Sắp xếp nguyện vọng theo thứ tự ưu tiên; nộp lệ phí xét tuyển trực tuyến.'
        }, {
          title: 'Đăng ký nguyện vọng trên Cổng Bộ GD&ĐT',
          text: 'Với phương thức dùng điểm thi THPT, đăng ký trong thời gian Bộ quy định.'
        }, {
          title: 'Theo dõi kết quả & xác nhận nhập học',
          text: 'Nhận thông báo qua email/tài khoản; xác nhận nhập học trực tuyến đúng hạn.'
        }]} />
        </Panel>
        <Panel title="Tài liệu hướng dẫn" icon="file">
          <DocList items={[{
          name: 'Hướng dẫn đăng ký xét tuyển trực tuyến',
          meta: 'PDF · 1.5 MB'
        }, {
          name: 'Video hướng dẫn khai hồ sơ trên Cổng HUMG',
          meta: 'MP4 · 12 phút'
        }, {
          name: 'Mẫu đơn đăng ký xét tuyển',
          meta: 'DOCX · 256 KB'
        }]} />
        </Panel>
      </>
  });
}
