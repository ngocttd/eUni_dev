'use client'
import { eduNav } from '../../../config/static/education.js'
import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from '../../../lib/router.jsx';
import Icon from '../../../shared/lib/Icon.jsx';
import { PageShell, SectionNav, Panel, TileGrid, DataTable, StatRow, Chips, FilterBar, StepList, Faq, DocList, LinkList, SupportCard, NewsMini, HeroSearch, MetaBar, Pagination } from '../../../shared/components/ui/page.jsx';
export const enorm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
export const WEEK_DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
export const WEEK_SLOTS = ['Tiết 1–3', 'Tiết 4–6', 'Tiết 7–9', 'Tiết 10–12'];
export function WeekGrid({
  rows
}) {
  return <div className="edu-week-wrap">
      <div className="edu-week">
        <span className="edu-week__corner">Tiết \ Thứ</span>
        {WEEK_DAYS.map(d => <span key={d} className="edu-week__head">{d}</span>)}
        {WEEK_SLOTS.map(slot => <div key={slot} className="edu-week__row" style={{
        display: 'contents'
      }}>
            <span className="edu-week__slot">{slot}</span>
            {WEEK_DAYS.map(d => {
          const cell = rows.find(r => r.day === d && r.period === slot);
          return <span key={d} className={`edu-week__cell ${cell ? 'has-class' : ''}`}>
                  {cell && <>
                      <strong>{cell.course}</strong>
                      <em>{cell.room}</em>
                      <em>{cell.time}</em>
                    </>}
                </span>;
        })}
          </div>)}
      </div>
    </div>;
}

import './education.css';
export const NAV = <SectionNav title="Học tập" items={eduNav} />;
export const shell = props => <PageShell eyebrow="Học tập" sectionNav={NAV} accent="#0284c7" {...props} />;
export const SUPPORT = <SupportCard title="Hỗ trợ học tập" lead="Phòng Đào tạo – Bộ phận một cửa" phone="024.3838.2222" email="daotao@humg.edu.vn" cta={{
  label: 'Gửi yêu cầu hỗ trợ',
  to: '/lien-he'
}} />;

/* ======================= TỔNG QUAN HỌC TẬP ======================= */
