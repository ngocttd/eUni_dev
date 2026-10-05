'use client'
import { useModuleData } from '@/lib/datasets/useModuleData'
import { Link } from '../../../lib/router.jsx'
import Icon from '../../../shared/lib/Icon.jsx'
import { Panel, DataTable } from '../../../shared/components/ui/page.jsx'
import '../student/portal-student.css'
import './portal-staff.css'


/* ---------- Các loại block khai báo trong portalStaffTools.js ---------- */
function Block({ b }) {
  if (b.kind === 'stats') {
    return (
      <div className="ps-stats ps-stats--4">
        {b.items.map((s) => (
          <div key={s.label} className="ps-stat"><strong>{s.value}</strong><span>{s.label}</span></div>
        ))}
      </div>
    )
  }

  if (b.kind === 'actions') {
    return (
      <div className="ps-payact">
        {b.items.map((a) => {
          const inner = <>{a.icon && <Icon name={a.icon} size={13} />} {a.label}</>
          return a.to
            ? <Link key={a.label} to={a.to} className="humg-btn humg-btn--ghost humg-btn--sm">{inner}</Link>
            : <button key={a.label} type="button" className="humg-btn humg-btn--ghost humg-btn--sm">{inner}</button>
        })}
      </div>
    )
  }

  const body = (() => {
    switch (b.kind) {
      case 'table':
        return (
          <>
            <DataTable columns={b.columns} rows={b.rows} />
            {b.foot && <p className="ps-muted" style={{ marginTop: 12 }}>{b.foot}</p>}
          </>
        )
      case 'kv':
        return (
          <ul className="ps-kv">
            {b.rows.map(([k, v]) => <li key={k}><span>{k}</span><strong>{v}</strong></li>)}
          </ul>
        )
      case 'notice':
        return (
          <ul className="ps-notice">
            {b.items.map((n) => <li key={n.title}><span>{n.date}</span><p>{n.title}</p></li>)}
          </ul>
        )
      case 'tiles':
        return (
          <div className="ps-servicegrid">
            {b.items.map((t) => (
              <div key={t.title} className="ps-service" style={{ cursor: 'default' }}>
                <span className="ps-service__ic"><Icon name={t.icon || 'grid'} size={20} /></span>
                {t.title}{t.meta && <span className="ps-service__meta">{t.meta}</span>}
              </div>
            ))}
          </div>
        )
      case 'text':
        return (Array.isArray(b.body) ? b.body : [b.body]).map((p, i) => (
          <p key={i} style={{ margin: i ? '10px 0 0' : 0, fontSize: 13.5, lineHeight: 1.7 }}>{p}</p>
        ))
      case 'form':
        return (
          <form className="ps-formgrid" onSubmit={(e) => e.preventDefault()}>
            {b.fields.map((f) => (
              <label key={f.label} className={f.wide ? 'ps-formgrid__wide' : ''}>
                {f.label}
                {f.type === 'select' ? (
                  <select>{f.options.map((o) => <option key={o}>{o}</option>)}</select>
                ) : f.type === 'textarea' ? (
                  <textarea rows="4" placeholder={f.placeholder || ''} />
                ) : f.type === 'file' ? (
                  <input type="file" />
                ) : (
                  <input type={f.type === 'date' ? 'date' : 'text'} placeholder={f.placeholder || ''} />
                )}
              </label>
            ))}
            <button type="submit" className="humg-btn humg-btn--primary">{b.submit || 'Lưu'}</button>
          </form>
        )
      default:
        return null
    }
  })()

  if (b.title) return <Panel title={b.title} icon={b.icon}>{body}</Panel>
  return <Panel>{body}</Panel>
}

/**
 * Trang chi tiết cho một "công cụ" trong cổng Giảng viên.
 * Dữ liệu: staffToolMap[toolKey] (src/data/portalStaffTools.js)
 */
export default function PgToolPage({ toolKey }) {
  const { staffToolMap } = useModuleData('portal-staff-tools');
  const t = staffToolMap[toolKey]
  if (!t) {
    return (
      <>
        <div className="ps-head"><div><h1>Không tìm thấy công cụ</h1></div></div>
        <Panel><p style={{ margin: 0 }}>Mục này chưa được cấu hình.</p></Panel>
      </>
    )
  }
  return (
    <>
      {t.back && (
        <Link to={t.back.to} className="humg-link-more" style={{ marginBottom: 4 }}>
          <Icon name="arrow-left" size={13} /> {t.back.label}
        </Link>
      )}
      <div className="ps-head">
        <div>
          <h1>{t.title}</h1>
          {t.sub && <p>{t.sub}</p>}
        </div>
      </div>
      {t.blocks.map((b, i) => <Block key={i} b={b} />)}
    </>
  )
}
