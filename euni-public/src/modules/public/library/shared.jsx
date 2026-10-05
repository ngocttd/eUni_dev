'use client'
import { libraryNav, libraryGuide } from '../../../config/static/library.js'
import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from '../../../lib/router.jsx';
import Icon from '../../../shared/lib/Icon.jsx';
import { PageShell, SectionNav, Panel, DataTable, StatRow, Chips, FilterBar, StepList, Faq, DocList, LinkList, SupportCard, NewsMini, HeroSearch, MetaBar, Pagination } from '../../../shared/components/ui/page.jsx';
import { useLanguage } from '../../../i18n/LanguageContext.jsx';
export const lnorm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

import './library.css';
export const NAV = <SectionNav title="Thư viện" items={libraryNav} />;
export const shell = props => <PageShell eyebrow="Thư viện" sectionNav={NAV} {...props} />;
export const SUPPORT = <SupportCard title="Trung tâm Thông tin – Thư viện" lead="Hỗ trợ tra cứu, mượn – trả và khai thác tài nguyên số." phone={libraryGuide.contact.phone} email={libraryGuide.contact.email} cta={{
  label: 'Gửi yêu cầu hỗ trợ',
  to: '/lien-he'
}} />;
export const TYPE_ICON = {
  'Sách': 'book',
  'Tạp chí': 'newspaper',
  'Luận văn': 'graduation',
  'Tài liệu số': 'layers',
  'Khác': 'file'
};
export function CopyState({
  copies
}) {
  if (!copies) return null;
  const cls = copies.available > 0 ? 'is-ok' : 'is-out';
  return <span className={`lib-avail ${cls}`}>
      {copies.available > 0 ? `Còn ${copies.available}/${copies.total} bản` : 'Hết bản in – có thể đặt mượn'}
    </span>;
}

/* ======================= TỔNG QUAN THƯ VIỆN (PG-LIB-01) ======================= */
