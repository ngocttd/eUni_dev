'use client'
import { resNav } from '../../../config/static/research.js'
import { useMemo, useState } from 'react';
import { Link, useParams } from '../../../lib/router.jsx';
import Icon from '../../../shared/lib/Icon.jsx';
import { PageShell, SectionNav, Panel, TileGrid, DataTable, StatRow, Chips, FilterBar, StepList, Faq, DocList, LinkList, SupportCard, NewsMini, HeroSearch, MetaBar, Pagination } from '../../../shared/components/ui/page.jsx';
import { useLanguage } from '../../../i18n/LanguageContext.jsx';
export const rnorm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
export const NOW_YEAR = 2026;
export const projectPct = p => {
  if (p.status === 'Đã nghiệm thu') return 100;
  if (p.status === 'Kêu gọi hợp tác' || p.status === 'Đang tuyển sinh') return 0;
  const span = p.endYear - p.startYear || 1;
  return Math.max(10, Math.min(95, Math.round((NOW_YEAR - p.startYear + 0.5) / span * 100)));
};

import './research.css';
export const NAV = <SectionNav title="Nghiên cứu" items={resNav} />;
export const shell = props => <PageShell eyebrow="Nghiên cứu" sectionNav={NAV} accent="#6d28d9" {...props} />;
export const SUPPORT = <SupportCard title="Phòng Khoa học – Công nghệ" lead="Hỗ trợ đề tài, công bố, sở hữu trí tuệ và chuyển giao." phone="024.3838.3829" email="khcn@humg.edu.vn" cta={{
  label: 'Gửi yêu cầu',
  to: '/lien-he'
}} />;
export function StatusTag({
  status
}) {
  const map = {
    'Đang thực hiện': 'is-run',
    'Đã nghiệm thu': 'is-done',
    'Tạm dừng': 'is-hold',
    'Sắp diễn ra': 'is-run',
    'Đã tổ chức': 'is-done'
  };
  return <span className={`res-status ${map[status] || ''}`}>{status}</span>;
}

/* ======================= TỔNG QUAN KH&CN ======================= */
export /* ======================= DANH SÁCH CHUYÊN GIA ======================= */
const degreeOf = name => (name.match(/GS\.TS|PGS\.TS|TS|ThS/) || ['Khác'])[0];
export /* ======================= HỘI NGHỊ / HỘI THẢO ======================= */
const MONTHS_VI = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
export /* ============================================================ TRANG CHI TIẾT ============================================================ */
const GENERIC_EDU = ['Tiến sĩ — chuyên ngành phù hợp (đào tạo trong nước / nước ngoài)', 'Thạc sĩ — Trường Đại học Mỏ - Địa chất', 'Kỹ sư / Cử nhân — Trường Đại học Mỏ - Địa chất'];
export const GENERIC_FOCUS = ['Nghiên cứu cơ bản định hướng ứng dụng', 'Phát triển công nghệ và giải pháp kỹ thuật', 'Đào tạo sau đại học, bồi dưỡng nhóm nghiên cứu trẻ'];
export const GENERIC_ACHI = ['Chủ trì nhiều đề tài cấp Bộ, cấp Nhà nước', 'Hàng chục công bố ISI/Scopus trong 5 năm gần đây', 'Hợp tác nghiên cứu với đối tác quốc tế và doanh nghiệp'];
export const GENERIC_MEMBERS = [{
  name: 'PGS.TS. Trần Văn A',
  role: 'Trưởng nhóm'
}, {
  name: 'TS. Nguyễn Thị B',
  role: 'Thành viên chủ chốt'
}, {
  name: 'TS. Lê Văn C',
  role: 'Thành viên'
}, {
  name: 'ThS. Phạm Thị D',
  role: 'Nghiên cứu viên'
}, {
  name: 'KS. Hoàng Văn E',
  role: 'Nghiên cứu viên'
}];

/* ---------- Chi tiết chuyên gia ---------- */
