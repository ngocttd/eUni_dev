'use client'
import { studentNavGroups, studentQuickLinks } from '../../../config/static/student-hub.js'
import { useMemo, useState } from 'react';
import { Link } from '../../../lib/router.jsx';
import Icon from '../../../shared/lib/Icon.jsx';
import { PageShell, SectionNav, Panel, TileGrid, DataTable, Chips, FilterBar, StepList, Faq, DocList, LinkList, SupportCard, NewsMini, HeroSearch } from '../../../shared/components/ui/page.jsx';
import { useLanguage } from '../../../i18n/LanguageContext.jsx';
export const fileType = meta => (meta.match(/DOCX|XLSX|PDF|PPTX|ZIP/i) || ['Khác'])[0].toUpperCase();
export const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

import './student.css';
export const NAV = <SectionNav title="Sinh viên" groups={studentNavGroups} />;
export const shell = props => <PageShell eyebrow="Cổng Sinh viên" sectionNav={NAV} variant="student" {...props} />;
export const QUICKLINKS = <LinkList title="Liên kết nhanh" items={studentQuickLinks} />;
export const SUPPORT = <SupportCard title="Trung tâm Hỗ trợ sinh viên" lead="Đồng hành cùng sinh viên trong học tập và đời sống." phone="024.3838.3830" email="htsv@humg.edu.vn" cta={{
  label: 'Gửi yêu cầu hỗ trợ',
  to: '/lien-he'
}} />;

/* ======================= PG-STU-01 — CỔNG SINH VIÊN (HUB) ======================= */
