'use client'
import { useState } from 'react';
import { Link } from '../../../lib/router.jsx';
import Icon from '../../../shared/lib/Icon.jsx';
import { Panel, DataTable, Pagination } from '../../../shared/components/ui/page.jsx';
import '../student/portal-student.css';
import './portal-parent.css';

export const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
export const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
export const DONUT_COLORS = ['#0a3d91', '#1976d2', '#f59e0b', '#94a3b8', '#ef4444'];
export function Head({
  title,
  sub,
  right
}) {
  return <div className="ps-head"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{right && <div className="ps-head__right">{right}</div>}</div>;
}
export function Stats({
  items
}) {
  return <div className="ps-stats">{items.map(s => <div key={s.label} className="ps-stat"><strong>{s.value}</strong><span>{s.label}</span></div>)}</div>;
}
export function Tag({
  v
}) {
  const s = norm(v);
  const cls = /da thanh toan|thanh cong|hoan thanh|da phan hoi|da xuat|co mat|on dinh|cai thien/.test(s) ? 'ps-tag--done' : /dang xu ly|cho/.test(s) ? 'ps-tag--warn' : /vang|khong phep/.test(s) ? 'ps-tag--cancel' : 'ps-tag--run';
  return <span className={`ps-tag ${cls}`}>{v}</span>;
}
export function Week({
  rows,
  slots
}) {
  return <div className="ps-week-wrap"><div className="ps-week">
      <span className="ps-week__corner">Tiết \ Thứ</span>
      {DAYS.map(d => <span key={d} className="ps-week__head">{d}</span>)}
      {slots.map(slot => <div key={slot} style={{
        display: 'contents'
      }}>
          <span className="ps-week__slot">{slot}</span>
          {DAYS.map(d => {
          const c = rows.find(r => r.day === d && r.slot === slot);
          return <span key={d} className={`ps-week__cell ${c ? 'has' : ''}`}>{c && <><strong>{c.course}</strong><em>{c.room}</em></>}</span>;
        })}
        </div>)}
    </div></div>;
}
export function MultiDonut({
  centerTop,
  centerBottom,
  parts
}) {
  let acc = 0;
  const stops = parts.map((p, i) => {
    const from = acc;
    acc += p.pct;
    return `${DONUT_COLORS[i % DONUT_COLORS.length]} ${from}% ${acc}%`;
  }).join(', ');
  return <div className="pp-donut">
      <span className="pp-donut__ring" style={{
      background: `conic-gradient(${stops})`
    }}>
        <span className="pp-donut__hole"><strong>{centerTop}</strong><em>{centerBottom}</em></span>
      </span>
      <ul className="pp-legend">
        {parts.map((p, i) => <li key={p.label}><span style={{
          background: DONUT_COLORS[i % DONUT_COLORS.length]
        }} />{p.label} · {p.pct}%</li>)}
      </ul>
    </div>;
}
export function LineChart({
  labels,
  points
}) {
  const w = 480,
    h = 150,
    pad = 26;
  const min = Math.min(...points) - 0.2;
  const max = Math.max(...points) + 0.2;
  const x = i => pad + i * (w - pad * 2) / (points.length - 1);
  const y = v => h - pad - (v - min) / (max - min) * (h - pad * 2);
  return <div className="pp-linechart">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Điểm trung bình theo học kỳ">
        <polyline points={points.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke="var(--humg-secondary)" strokeWidth="2" />
        {points.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="var(--humg-primary)" />)}
        {points.map((v, i) => <text key={`t${i}`} x={x(i)} y={y(v) - 9} textAnchor="middle" fontSize="10" fill="var(--humg-text-secondary)">{v.toFixed(2)}</text>)}
      </svg>
      <div className="pp-linechart__labels">{labels.map(l => <span key={l}>{l}</span>)}</div>
    </div>;
}

/* ======================= 13.1 · TỔNG QUAN (DASHBOARD) ======================= */
