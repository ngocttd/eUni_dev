'use client'
import { useState } from 'react';
import { Link } from '../../../lib/router.jsx';
import Icon from '../../../shared/lib/Icon.jsx';
import { PageShell, SectionNav, Panel, TileGrid, DataTable, SupportCard, NewsMini, Faq } from '../../../shared/components/ui/page.jsx';
import './audience.css';

/* ======================= PHỤ HUYNH — CỔNG THÔNG TIN (PG-PAR-01) ======================= */
export const PARENT_NAV = <SectionNav title="Phụ huynh" items={[{
  label: 'Thông tin cho phụ huynh',
  to: '/phu-huynh',
  icon: 'home'
}, {
  label: 'Tuyển sinh',
  to: '/hoc-tap/tuyen-sinh',
  icon: 'search'
}, {
  label: 'Chương trình đào tạo',
  to: '/hoc-tap/chuong-trinh-dao-tao',
  icon: 'book'
}, {
  label: 'Học phí & Học bổng',
  to: '/hoc-tap/hoc-phi-hoc-bong',
  icon: 'award'
}, {
  label: 'Tin tức & Sự kiện',
  to: '/tin-tuc',
  icon: 'newspaper'
}, {
  label: 'Liên hệ nhà trường',
  to: '/lien-he',
  icon: 'phone'
}, {
  label: 'My eUni Phụ huynh',
  to: '/dang-nhap-phu-huynh',
  icon: 'external'
}]} />;
export const parentKeyDates = {
  year: 'Năm học 2026 – 2027',
  rows: [['Nhập học & tuần sinh hoạt công dân', '18/08 – 24/08/2026', ''], ['Khai giảng & bắt đầu học kỳ I', '25/08/2026', ''], ['Nộp học phí học kỳ I', 'Trước 30/09/2026', 'Chuyển khoản / thu hộ ngân hàng'], ['Thi kết thúc học kỳ I', '30/12/2026 – 18/01/2027', ''], ['Công bố kết quả & xét học bổng học kỳ I', 'Tháng 02/2027', '']]
};
export const parentFaq = [{
  q: 'Phụ huynh có tài khoản riêng để theo dõi kết quả học tập của con không?',
  a: 'Có. Nhà trường cấp tài khoản My eUni Phụ huynh liên kết với hồ sơ sinh viên; phụ huynh đăng nhập tại trang "Đăng nhập phụ huynh" để xem kết quả học tập, học phí, lịch học và thông báo.'
}, {
  q: 'Làm thế nào để nộp học phí cho con?',
  a: 'Học phí nộp qua chuyển khoản hoặc thu hộ tại ngân hàng liên kết theo thông báo mỗi học kỳ; sinh viên/phụ huynh cũng có thể thanh toán trực tuyến trên My eUni. Xem chi tiết ở mục Học phí & Học bổng.'
}, {
  q: 'Con tôi thuộc diện chính sách, cần làm gì để được miễn giảm học phí?',
  a: 'Nộp đơn theo mẫu kèm giấy tờ minh chứng về Phòng Công tác chính trị – Sinh viên trong thời hạn thông báo mỗi học kỳ.'
}, {
  q: 'Khi cần trao đổi với Nhà trường về tình hình của con, liên hệ ở đâu?',
  a: 'Liên hệ cố vấn học tập của lớp, Phòng Công tác chính trị – Sinh viên (024.3838.3830) hoặc gửi phản hồi qua trang Liên hệ.'
}];
export /* ======================= CỰU SINH VIÊN — CỔNG THÔNG TIN ======================= */
const ALUMNI_NAV = <SectionNav title="Cựu sinh viên" items={[{
  label: 'Tổng quan',
  to: '/cuu-sinh-vien',
  icon: 'home'
}, {
  label: 'Việc làm & Khởi nghiệp',
  to: '/doi-song/viec-lam-khoi-nghiep',
  icon: 'rocket'
}, {
  label: 'Tin tức & Sự kiện',
  to: '/tin-tuc',
  icon: 'newspaper'
}, {
  label: 'Hỗ trợ sinh viên',
  to: '/doi-song/ho-tro-sinh-vien',
  icon: 'headphones'
}, {
  label: 'Liên hệ Nhà trường',
  to: '/lien-he',
  icon: 'phone'
}]} />;
export const alumniConnect = [{
  icon: 'user',
  title: 'Cập nhật hồ sơ cựu sinh viên',
  desc: 'Đăng ký thông tin để nhận bản tin, thư mời sự kiện và cơ hội nghề nghiệp.',
  to: '/cuu-sinh-vien'
}, {
  icon: 'users',
  title: 'Ban liên lạc theo khóa / khoa',
  desc: 'Kết nối với ban liên lạc cựu sinh viên của khóa và khoa bạn.',
  to: '/lien-he'
}, {
  icon: 'briefcase',
  title: 'Tuyển dụng & giới thiệu việc làm',
  desc: 'Đăng tin tuyển dụng, tìm ứng viên và kết nối doanh nghiệp với sinh viên HUMG.',
  to: '/doi-song/viec-lam-khoi-nghiep'
}, {
  icon: 'headphones',
  title: 'Mentoring & hỗ trợ sinh viên',
  desc: 'Tham gia cố vấn nghề nghiệp, chia sẻ kinh nghiệm với sinh viên đang học.',
  to: '/doi-song/ho-tro-sinh-vien'
}];
export const alumniContribute = [{
  icon: 'award',
  title: 'Quỹ học bổng cựu sinh viên',
  desc: 'Đóng góp học bổng tiếp sức cho sinh viên vượt khó, học giỏi.'
}, {
  icon: 'graduation',
  title: 'Thỉnh giảng & đồng hướng dẫn',
  desc: 'Tham gia giảng dạy chuyên đề thực tế, hướng dẫn đồ án, khóa luận.'
}, {
  icon: 'rocket',
  title: 'Hiến kế phát triển Trường',
  desc: 'Góp ý chương trình đào tạo, kết nối hợp tác doanh nghiệp – nhà trường.'
}];
