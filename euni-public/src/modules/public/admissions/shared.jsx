'use client'
import { eduNav } from '../../../config/static/education.js'
import { admissionsNav } from '../../../config/static/admissions.js'
import { useState } from 'react';
import { Link } from '../../../lib/router.jsx';
import Icon from '../../../shared/lib/Icon.jsx';
import { PageShell, SectionNav, Panel, DataTable, StatRow, StepList, Faq, DocList, LinkList, SupportCard, NewsMini, MediaCard } from '../../../shared/components/ui/page.jsx';
import { useLanguage } from '../../../i18n/LanguageContext.jsx';


import './admissions.css';
export const NAV = <SectionNav title="Học tập" items={eduNav} />;
export const SUB = <LinkList title="Mục tuyển sinh" items={admissionsNav} />;
export const SUPPORT = <SupportCard title="Tư vấn tuyển sinh" lead="Hotline 08:00 – 21:00 hằng ngày." phone="0888 123 456" email="tuyensinh@humg.edu.vn" cta={{
  label: 'Đăng ký tư vấn',
  to: '/hoc-tap/tuyen-sinh/tu-van'
}} />;
export const crumbs = label => [{
  label: 'Học tập',
  to: '/hoc-tap'
}, {
  label: 'Tuyển sinh',
  to: '/hoc-tap/tuyen-sinh'
}, ...(label ? [{
  label
}] : [])];
export const shell = props => <PageShell sectionNav={NAV} accent="#0284c7" eyebrow="Học tập" sidebar={<>{SUB}{SUPPORT}</>} {...props} />;

/* ======================= TỔNG QUAN TUYỂN SINH ======================= */
