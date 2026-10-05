'use client'
import { staffNav, staffQuickLinks } from '../../../config/static/staff-hub.js'
import { useMemo, useState } from 'react';
import { Link } from '../../../lib/router.jsx';
import Icon from '../../../shared/lib/Icon.jsx';
import { PageShell, SectionNav, Panel, TileGrid, DataTable, FilterBar, DocList, LinkList, SupportCard, NewsMini, HeroSearch, Pagination } from '../../../shared/components/ui/page.jsx';
import { useLanguage } from '../../../i18n/LanguageContext.jsx';

import './staff.css';
export const fileType = meta => (meta.match(/DOCX|XLSX|PDF|PPTX|ZIP/i) || ['Khác'])[0].toUpperCase();
export const yearOf = d => d.slice(-4);
export const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
export const NAV = <SectionNav title="Giảng viên / Cán bộ" items={staffNav} />;
export const shell = props => <PageShell eyebrow="Cổng Giảng viên / Cán bộ" sectionNav={NAV} variant="staff" {...props} />;
export const QUICKLINKS = <LinkList title="Liên kết nhanh" items={staffQuickLinks} />;
export const SUPPORT = <SupportCard title="Phòng Tổ chức – Hành chính" lead="Hỗ trợ giảng viên, cán bộ về nhân sự, chế độ và thủ tục hành chính." phone="024.3838.3801" email="tccb@humg.edu.vn" cta={{
  label: 'Gửi yêu cầu hỗ trợ',
  to: '/lien-he'
}} />;

/* ======================= PG-STAFF-01 — THÔNG TIN DÀNH CHO CÁN BỘ (HUB) ======================= */
