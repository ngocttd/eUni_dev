'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { useMemo, useState } from 'react';
import { Link } from '../../../lib/router.jsx';
import Icon from '../../../shared/lib/Icon.jsx';
import { Panel, DataTable, FilterBar, Pagination } from '../../../shared/components/ui/page.jsx';
import '../student/portal-student.css';
import './portal-leader.css';

export const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
export const DONUT_COLORS = ['#0a3d91', '#1976d2', '#2e7d32', '#f59e0b', '#7b3fe4', '#94a3b8'];

/* ============================ Helpers ============================ */
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
export function Delta({
  v,
  down
}) {
  if (!v) return null;
  const isDown = down || String(v).trim().startsWith('-');
  return <span className={`pl-delta ${isDown ? 'is-down' : 'is-up'}`}>{isDown ? '▼' : '▲'} {String(v).replace('-', '')}</span>;
}
export function KpiGrid({
  items,
  cols
}) {
  return <div className="pl-kpis" style={cols ? {
    gridTemplateColumns: `repeat(${cols}, 1fr)`
  } : undefined}>
      {items.map(s => <div key={s.label} className="pl-kpi">
          {s.icon && <span className="pl-kpi__ic"><Icon name={s.icon} size={16} /></span>}
          <strong>{s.value}</strong>
          <span>{s.label}</span>
          <Delta v={s.delta} down={s.down} />
        </div>)}
    </div>;
}
export function Donut({
  total,
  unit,
  parts
}) {
  let acc = 0;
  const stops = parts.map((p, i) => {
    const from = acc;
    acc += p.pct;
    return `${DONUT_COLORS[i % DONUT_COLORS.length]} ${from}% ${acc}%`;
  }).join(', ');
  return <div className="pl-donut">
      <span className="pl-donut__ring" style={{
      background: `conic-gradient(${stops})`
    }}>
        <strong>{total}{unit && <em> {unit}</em>}</strong>
      </span>
      <ul className="pl-legend">
        {parts.map((p, i) => <li key={p.label}><span style={{
          background: DONUT_COLORS[i % DONUT_COLORS.length]
        }} />{p.label} · {p.pct}%</li>)}
      </ul>
    </div>;
}
export function BarChart({
  data,
  total,
  delta
}) {
  const max = Math.max(...data.map(d => d.value));
  return <>
      <div className="pl-bars">
        {data.map(d => <div key={d.label} className="pl-bar">
            <span className="pl-bar__col"><span className="pl-bar__fill" style={{
            height: `${d.value / max * 100}%`
          }} /></span>
            <span className="pl-bar__val">{d.value}</span>
            <span className="pl-bar__label">{d.label}</span>
          </div>)}
      </div>
      {total && <p className="pl-barnote">Tổng: <strong>{total}</strong> {delta && <Delta v={delta} />}</p>}
    </>;
}
export function LineChart({
  labels,
  series
}) {
  const w = 520,
    h = 170,
    pad = 30;
  const all = series.flatMap(s => s.points);
  const min = Math.min(...all) - 3;
  const max = Math.max(...all) + 3;
  const x = i => pad + i * (w - pad * 2) / (labels.length - 1);
  const y = v => h - pad - (v - min) / (max - min) * (h - pad * 2);
  const stroke = ['var(--humg-secondary)', 'var(--humg-accent)'];
  return <div className="pl-line">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Xu hướng chỉ số theo thời gian">
        {series.map((s, si) => <g key={s.name}>
            <polyline points={s.points.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke={stroke[si % 2]} strokeWidth="2" />
            {s.points.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={stroke[si % 2]} />)}
          </g>)}
      </svg>
      <div className="pl-line__labels">{labels.map(l => <span key={l}>{l}</span>)}</div>
      <ul className="pl-line__legend">
        {series.map((s, si) => <li key={s.name}><span style={{
          background: stroke[si % 2]
        }} />{s.name}</li>)}
      </ul>
    </div>;
}
export function Sel({
  label,
  value,
  onChange,
  options
}) {
  return <label>
      <span>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>;
}
export function Filters({
  year,
  setYear,
  term,
  setTerm,
  unit,
  setUnit
}) {
  const { plYears, plTerms, plUnits } = useModuleData('portal-leader');
  return <form className="ps-filter" onSubmit={e => e.preventDefault()}>
      <Sel label="Năm học" value={year} onChange={setYear} options={plYears} />
      {setTerm ? <Sel label="Học kỳ" value={term} onChange={setTerm} options={plTerms} /> : null}
      {setUnit ? <Sel label="Đơn vị" value={unit} onChange={setUnit} options={plUnits} /> : null}
    </form>;
}
export function SeverityTag({
  v
}) {
  const cls = v === 'Cao' ? 'ps-tag--cancel' : v === 'Trung bình' ? 'ps-tag--warn' : 'ps-tag--run';
  return <span className={`ps-tag ${cls}`}>{v}</span>;
}

/* ============================ 12.1 · TỔNG QUAN ĐIỀU HÀNH ============================ */
export /* ============================ 12.4 · PHÊ DUYỆT & CẢNH BÁO ============================ */
const APPROVAL_FILTERS = ['Tất cả', 'Chờ duyệt', 'Đã duyệt', 'Từ chối'];
