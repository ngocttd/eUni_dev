'use client'
import { lifeNav } from '../../../config/static/life.js'
import { useMemo, useState } from 'react';
import { Link, useParams } from '../../../lib/router.jsx';
import Icon from '../../../shared/lib/Icon.jsx';
import { PageShell, SectionNav, Panel, TileGrid, DataTable, StatRow, Chips, FilterBar, StepList, Faq, DocList, LinkList, SupportCard, NewsMini, HeroSearch, MetaBar } from '../../../shared/components/ui/page.jsx';
import { useLanguage } from '../../../i18n/LanguageContext.jsx';
export const lnorm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
export const datePast = d => {
  const [dd, mm, yy] = d.split('/').map(Number);
  return new Date(yy, mm - 1, dd) < new Date(2026, 8, 1);
};

import './life.css';
export const ACCENT = '#0a3d91';
export const NAV = <SectionNav title="Đời sống" items={lifeNav} />;
export const shell = props => <PageShell eyebrow="Đời sống" sectionNav={NAV} accent={ACCENT} {...props} />;
export const SUPPORT = <SupportCard title="Trung tâm Hỗ trợ sinh viên" lead="Đồng hành cùng sinh viên trong học tập và đời sống." phone="024.3838.3830" email="htsv@humg.edu.vn" cta={{
  label: 'Gửi yêu cầu hỗ trợ',
  to: '/lien-he'
}} />;

/* ======================= ĐỜI SỐNG HUMG (HUB) ======================= */
