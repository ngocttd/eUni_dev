'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useMemo, useState } from 'react';
import { Link } from '../../../lib/router.jsx';
import Icon from '../../../shared/lib/Icon.jsx';
import { Panel, DataTable, FilterBar, Pagination } from '../../../shared/components/ui/page.jsx';
import '../student/portal-student.css';
import './portal-staff.css';

export const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
export function Head({
  title,
  sub,
  right
}) {
  return <div className="ps-head">
      <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      {right && <div className="ps-head__right">{right}</div>}
    </div>;
}
export function Stats({
  items,
  four
}) {
  return <div className={`ps-stats ${four ? 'ps-stats--4' : ''}`}>
      {items.map(s => <div key={s.label} className="ps-stat"><strong>{s.value}</strong><span>{s.label}</span></div>)}
    </div>;
}

/* Lịch dạng lưới thời gian (dùng .ps-cal* của portal-student.css) */
export function StaffCalendar({
  data
}) {
  const { pgSchedule } = useModuleData('portal-staff');
  const HOURS = pgSchedule.hours;
  const H = 46;
  const first = HOURS[0];
  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
  return <div className="ps-cal-wrap">
      <div className="ps-cal">
        <div className="ps-cal__corner" />
        {days.map((d, i) => <div key={d} className="ps-cal__dayhead"><strong>{d}</strong><span>{pgSchedule.dayDates[i]}</span></div>)}
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
                <span>{e.group} · {e.room}</span>
              </div>)}
          </div>)}
      </div>
    </div>;
}

/* Lịch tháng thu nhỏ */
export function MiniCal({
  label,
  firstDow = 3,
  days = 31,
  today
}) {
  const cells = [...Array(firstDow).fill(null), ...Array.from({
    length: days
  }, (_, i) => i + 1)];
  return <div className="ps-minical">
      <div className="ps-minical__head">{label}</div>
      <div className="ps-minical__grid">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <span key={d} className="ps-minical__dow">{d}</span>)}
        {cells.map((c, i) => <span key={i} className={`ps-minical__day ${c === today ? 'is-today' : ''} ${c == null ? 'is-empty' : ''}`}>{c}</span>)}
      </div>
    </div>;
}
export function ToolGrid({
  items
}) {
  return <div className="ps-servicegrid">
      {items.map(t => {
      const inner = <>
            <span className="ps-service__ic"><Icon name={t.icon} size={20} /></span>
            {t.title}{t.meta && <span className="ps-service__meta">{t.meta}</span>}
          </>;
      return t.to ? <Link key={t.title} to={t.to} className="ps-service">{inner}</Link> : <button key={t.title} type="button" className="ps-service">{inner}</button>;
    })}
    </div>;
}
export function Tag({
  v
}) {
  const done = /nghiệm thu|hoàn thành|đúng/i.test(v);
  const warn = /chậm|chưa|tạm/i.test(v);
  return <span className={`ps-tag ${done ? 'ps-tag--done' : warn ? 'ps-tag--warn' : 'ps-tag--run'}`}>{v}</span>;
}

/* ======================= 11.1 · TỔNG QUAN (DASHBOARD) ======================= */
export function ClassStatusPill({
  v
}) {
  const live = /đang diễn ra/i.test(v);
  return <span className={`ps-clspill ${live ? 'is-live' : 'is-soon'}`}>{v}</span>;
}
export /* ======================= 11.5 · QUẢN LÝ NGHIÊN CỨU KHOA HỌC ======================= */
const RESEARCH_TABS = [{
  key: 'dt',
  label: 'Đề tài – Dự án',
  data: 'projects',
  cols: ['STT', 'Tên đề tài / Dự án', 'Vai trò', 'Cấp', 'Năm', 'Trạng thái', 'Thao tác']
}, {
  key: 'bb',
  label: 'Bài báo',
  data: 'papers',
  cols: ['STT', 'Tên bài báo', 'Vai trò', 'Nơi công bố', 'Năm', 'Trạng thái', 'Thao tác']
}, {
  key: 'ht',
  label: 'Hội thảo',
  data: 'conferences',
  cols: ['STT', 'Tên hội thảo', 'Vai trò', 'Địa điểm', 'Năm', 'Trạng thái', 'Thao tác']
}, {
  key: 'sc',
  label: 'Sáng chế',
  data: 'patents',
  cols: ['STT', 'Tên sáng chế / GPHI', 'Vai trò', 'Loại', 'Năm', 'Trạng thái', 'Thao tác']
}, {
  key: 'sg',
  label: 'Sách – Giáo trình',
  data: 'books',
  cols: ['STT', 'Tên sách / Giáo trình', 'Vai trò', 'Nhà xuất bản', 'Năm', 'Trạng thái', 'Thao tác']
}];
export function ProgBar({
  pct
}) {
  const done = pct >= 100;
  return <span className={`ps-progbar ${done ? 'is-done' : ''}`}>
      <span className="ps-progbar__track"><span className="ps-progbar__fill" style={{
        width: `${Math.min(pct, 100)}%`
      }} /></span>
      <em>{pct}%</em>
    </span>;
}

/* ======================= HƯỚNG DẪN ĐỒ ÁN / LUẬN VĂN (POR-18.1) ======================= */
export const SUP_SORTS = ['Tiến độ cao → thấp', 'Tiến độ thấp → cao', 'Tên sinh viên A → Z'];
export /* ======================= 11.4 · KẾT QUẢ HỌC TẬP (QUẢN LÝ ĐIỂM) ======================= */
function GradeTag({
  v
}) {
  const cls = v === 'Giỏi' ? 'ps-tag--done' : v === 'Trung bình' || v === 'Yếu' ? 'ps-tag--warn' : 'ps-tag--run';
  return <span className={`ps-tag ${cls}`}>{v}</span>;
}
export /* ======================= 11.6 · CÔNG TÁC – HÀNH CHÍNH ======================= */
function TaskTag({
  v
}) {
  const cls = /hoàn thành|đã nhận/i.test(v) ? 'ps-tag--done' : /đang thực hiện/i.test(v) ? 'ps-tag--run' : /chờ duyệt/i.test(v) ? 'ps-tag--warn' : 'ps-tag--cancel';
  return <span className={`ps-tag ${cls}`}>{v}</span>;
}
export /* ======================= TICKET HỖ TRỢ ======================= */
function TicketTag({
  v
}) {
  const cls = v === 'Đã hoàn thành' ? 'ps-tag--done' : v === 'Chờ phản hồi' ? 'ps-tag--warn' : v === 'Đã đóng' ? 'ps-tag--cancel' : 'ps-tag--run';
  return <span className={`ps-tag ${cls}`}>{v}</span>;
}
