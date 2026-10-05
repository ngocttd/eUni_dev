'use client'
import { aboutNav } from '../../../config/static/about.js'
import { useMemo, useState } from 'react';
import { Link, useParams } from '../../../lib/router.jsx';
import Icon from '../../../shared/lib/Icon.jsx';
import { PageShell, SectionNav, Panel, TileGrid, DataTable, StatRow, Chips, FilterBar, LinkList, SupportCard, MetaBar, NewsMini } from '../../../shared/components/ui/page.jsx';
import { useLanguage } from '../../../i18n/LanguageContext.jsx';

import './about.css';
export const anorm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
export const NAV = <SectionNav title="Giới thiệu HUMG" items={aboutNav} />;
export const DEFAULT_ASIDE = <>
    <LinkList title="Xem nhanh" items={[{
    label: 'HUMG qua các con số',
    to: '/gioi-thieu/con-so'
  }, {
    label: 'Ban Giám hiệu',
    to: '/gioi-thieu/ban-giam-hieu'
  }, {
    label: 'Danh sách chuyên gia & hồ sơ khoa học',
    to: '/nghien-cuu/chuyen-gia'
  }, {
    label: 'Danh bạ đơn vị & số máy nội bộ',
    to: '/giang-vien/danh-ba'
  }]} />
    <SupportCard title="Liên hệ Nhà trường" lead="Phòng Hành chính – Tổng hợp" phone="024.3838.3806" email="humg@humg.edu.vn" cta={{
    label: 'Trang liên hệ',
    to: '/lien-he'
  }} />
  </>;
export const shell = props => <PageShell eyebrow="Giới thiệu HUMG" sectionNav={NAV} accent="#1e40af" sidebar={DEFAULT_ASIDE} {...props} />;

/* ---------- Thẻ nhân sự ---------- */
export function PersonCard({
  p,
  big
}) {
  return <div className={`about-person ${big ? 'is-big' : ''}`}>
      <span className="about-person__photo humg-ph" data-ratio="1-1"><span>Ảnh</span></span>
      <div className="about-person__body">
        <strong>{p.name}</strong>
        <span className="about-person__role">{p.role}</span>
        {p.bio && <p>{p.bio}</p>}
        {(p.email || p.phone) && <div className="about-person__contact">
            {p.phone && <span><Icon name="phone" size={13} /> {p.phone}</span>}
            {p.email && <span><Icon name="mail" size={13} /> {p.email}</span>}
          </div>}
      </div>
    </div>;
}

/* ---------- Biểu đồ cột ---------- */
export function BarChart({
  data
}) {
  const max = Math.max(...data.map(d => d.value));
  return <div className="about-bars">
      {data.map(d => <div key={d.year} className="about-bars__item">
          <span className="about-bars__col" style={{
        height: `${d.value / max * 100}%`
      }}>
            <em>{d.value.toLocaleString('vi-VN')}</em>
          </span>
          <span className="about-bars__label">{d.year}</span>
        </div>)}
    </div>;
}

/* ======================= 3.1 TỔNG QUAN ======================= */
export /* ======================= HỒ SƠ GIẢNG VIÊN ======================= */
const GV_EDU = ['Tiến sĩ chuyên ngành phù hợp – đào tạo trong nước / nước ngoài.', 'Thạc sĩ và Kỹ sư / Cử nhân tại Trường Đại học Mỏ - Địa chất hoặc cơ sở đào tạo uy tín.', 'Thường xuyên tham gia bồi dưỡng chuyên môn, nghiệp vụ sư phạm và hội thảo khoa học.'];
