'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useMemo, useState } from 'react';
import { Link } from '../../../lib/router.jsx';
import Icon from '../../../shared/lib/Icon.jsx';
import { Panel, DataTable, FilterBar, Pagination } from '../../../shared/components/ui/page.jsx';

import './portal-student.css';
export const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
export function PageHead({
  title,
  sub,
  right
}) {
  return <div className="ps-head">
      <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      {right && <div className="ps-head__right">{right}</div>}
    </div>;
}
export function Donut({
  pct,
  caption
}) {
  return <div className="ps-donut" style={{
    '--pct': pct
  }}>
      <span className="ps-donut__ring"><strong>{pct}%</strong></span>
      {caption && <span className="ps-donut__cap">{caption}</span>}
    </div>;
}

/* ======================= 10.1 · TỔNG QUAN (DASHBOARD) ======================= */
export /* ======================= 10.2 · THỜI KHÓA BIỂU ======================= */
function CalendarGrid({
  data
}) {
  const { psSchedule } = useModuleData('portal-student');
  const HOURS = psSchedule.hours;
  const H = 46;
  const first = HOURS[0];
  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
  return <div className="ps-cal-wrap">
      <div className="ps-cal">
        <div className="ps-cal__corner" />
        {days.map((d, i) => <div key={d} className="ps-cal__dayhead"><strong>{d}</strong><span>{psSchedule.dayDates[i]}</span></div>)}
        <div className="ps-cal__timecol">
          {HOURS.map(h => <div key={h} className="ps-cal__hour" style={{
          height: H
        }}>{String(h).padStart(2, '0')}:00</div>)}
        </div>
        {days.map((d, di) => <div key={d} className="ps-cal__daycol" style={{
        height: HOURS.length * H
      }}>
            {HOURS.map(h => <div key={h} className="ps-cal__slot" style={{
          height: H
        }} />)}
            {data.filter(e => e.day === di).map((e, k) => <div key={k} className={`ps-cal__event is-${e.type}`} style={{
          top: (e.start - first) * H,
          height: (e.end - e.start) * H
        }}>
                <strong>{e.course}</strong>
                <span>{e.room}</span>
              </div>)}
          </div>)}
      </div>
    </div>;
}
export /* ======================= 10.5 · HỒ SƠ CÁ NHÂN ======================= */
const PROFILE_SECTIONS = ['Thông tin cá nhân', 'Thông tin liên hệ', 'Thông tin gia đình', 'Quá trình học tập', 'Giấy tờ – Minh chứng', 'Cài đặt bảo mật'];
export /* ======================= 10.7 · TICKET HỖ TRỢ ======================= */
function TicketTag({
  v
}) {
  const cls = v === 'Đã hoàn thành' ? 'ps-tag--done' : v === 'Chờ phản hồi' ? 'ps-tag--warn' : v === 'Đã đóng' ? 'ps-tag--cancel' : 'ps-tag--run';
  return <span className={`ps-tag ${cls}`}>{v}</span>;
}
export /* ======================= CONDITION CHECK (dùng chung 3 trang đăng ký) ======================= */
function ConditionCheck({
  items
}) {
  const pass = items.every(c => c.ok);
  return <>
      <div className={`ps-cond ${pass ? 'is-ok' : 'is-block'}`}>
        <Icon name={pass ? 'check' : 'shield'} size={16} />
        {pass ? 'Bạn đã đủ điều kiện đăng ký.' : 'Bạn chưa đủ điều kiện — chưa thể đăng ký. Hãy hoàn tất các mục còn thiếu.'}
      </div>
      <ul className="ps-condlist">
        {items.map(c => <li key={c.label} className={c.ok ? 'is-ok' : 'is-fail'}>
            <Icon name={c.ok ? 'check' : 'x'} size={14} />
            <span><strong>{c.label}</strong>{c.detail && <em>{c.detail}</em>}</span>
          </li>)}
      </ul>
    </>;
}

/* ======================= ĐĂNG KÝ HỌC PHẦN (POR-02.1) ======================= */
