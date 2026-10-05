'use client'
import { forms } from '../../../config/static/utilities.js'
import { eduNav } from '../../../config/static/education.js'
import { useMemo, useState } from 'react';
import { Link } from '../../../lib/router.jsx';
import Icon from '../../../shared/lib/Icon.jsx';
import { PageShell, SectionNav, HeroSearch, Panel, TileGrid, DocList, DataTable, FilterBar, StepList, Faq, StatRow, LinkList, SupportCard, NewsMini } from '../../../shared/components/ui/page.jsx';


import './utilities.css';
export const EDU_NAV = <SectionNav title="Học tập" items={eduNav} />;
export const fileType = meta => (meta.match(/DOCX|XLSX|PDF|PPTX|ZIP/i) || ['Khác'])[0].toUpperCase();
export const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
export const allForms = forms.categories.flatMap(c => c.docs.map(d => ({
  ...d,
  category: c.name
})));

/* ======================= /tien-ich ======================= */
