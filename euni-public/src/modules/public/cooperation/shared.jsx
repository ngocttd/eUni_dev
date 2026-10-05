'use client'
import { coopNav } from '../../../config/static/cooperation.js'
import { useMemo, useState } from 'react';
import { Link, useParams } from '../../../lib/router.jsx';
import Icon from '../../../shared/lib/Icon.jsx';
import { PageShell, SectionNav, Panel, TileGrid, DataTable, StatRow, Chips, FilterBar, StepList, Faq, DocList, LinkList, SupportCard, NewsMini, HeroSearch, MetaBar, Pagination } from '../../../shared/components/ui/page.jsx';
import { useLanguage } from '../../../i18n/LanguageContext.jsx';
export const cnorm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

import './cooperation.css';
export const NAV = <SectionNav title="Hợp tác" items={coopNav} />;
export const shell = props => <PageShell eyebrow="Hợp tác" sectionNav={NAV} accent="#0f766e" {...props} />;
export const SUPPORT = <SupportCard title="Phòng Hợp tác quốc tế" lead="Đầu mối hợp tác trong nước và quốc tế của HUMG." phone="024.3838.3831" email="htqt@humg.edu.vn" cta={{
  label: 'Gửi đề xuất hợp tác',
  to: '/lien-he'
}} />;
export function StatusTag({
  status
}) {
  const map = {
    'Đang thực hiện': 'is-run',
    'Đang tuyển sinh': 'is-run',
    'Đã nghiệm thu': 'is-done'
  };
  return <span className={`coop-status ${map[status] || ''}`}>{status}</span>;
}
export function mono(name) {
  return name.replace(/[^A-Za-zÀ-ỹ ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/* ======================= TỔNG QUAN HỢP TÁC ======================= */
