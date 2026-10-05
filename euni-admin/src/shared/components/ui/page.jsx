'use client'
import { useState, useEffect, useCallback } from 'react'
import { Link, NavLink, useLocation } from '../../../lib/router.jsx'
import Breadcrumb from '../common/Breadcrumb.jsx'
import Icon from '../../lib/Icon.jsx'
import { useLanguage } from '../../../i18n/LanguageContext.jsx'
import './page.css'

/* ---------- Khung trang chi tiết: breadcrumb + hero + (nav | nội dung | sidebar) ----------
   Tất cả các khối dùng chung một tông xanh nhẹ (biến --sect khai báo trong page.css);
   tham số `accent` được giữ để tương thích ngược nhưng không còn tô màu riêng từng khối.
   `t()` dịch eyebrow/title/lead/crumbs khi có trong từ điển (src/i18n/dictionary.js);
   nếu chưa có bản dịch thì tự hiển thị lại nguyên văn Tiếng Việt. */
export function PageShell({ eyebrow, title, lead, crumbs = [], hero, sectionNav, sidebar, children, accent, variant }) {
  void accent
  const { t } = useLanguage()
  const mods = ['pg-body']
  if (sectionNav) mods.push('pg-body--nav')
  if (sidebar) mods.push('pg-body--aside')
  return (
    <div className={`pg-shell ${variant ? `pg-shell--${variant}` : ''}`}>
      <section className="pg-hero">
        <div className="humg-container-wide">
          <Breadcrumb items={crumbs.map((c) => ({ ...c, label: t(c.label) }))} />
          {eyebrow && <span className="humg-eyebrow">{t(eyebrow)}</span>}
          <h1>{t(title)}</h1>
          {lead && <p className="pg-hero__lead">{t(lead)}</p>}
          {hero && <div className="pg-hero__extra">{hero}</div>}
        </div>
      </section>
      <section className="humg-section pg-section">
        <div className={`humg-container-wide ${mods.join(' ')}`}>
          {sectionNav}
          <div className="pg-main">{children}</div>
          {sidebar && <aside className="pg-aside">{sidebar}</aside>}
        </div>
      </section>
    </div>
  )
}

/* ---------- Điều hướng trong khối (sidebar trái, thu gọn trên mobile) ---------- */
export function SectionNav({ title, items, groups }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const flat = groups ? groups.flatMap((g) => g.items) : items || []
  const current = flat.find((it) => {
    const deep = it.to.split('/').length > 2
    return deep ? pathname === it.to || pathname.startsWith(it.to + '/') : pathname === it.to
  })

  useEffect(() => { setOpen(false) }, [pathname])

  const renderList = (list) => (
    <ul>
      {list.map((it) => (
        <li key={it.to}>
          <NavLink to={it.to} end={it.to.split('/').length <= 2} onClick={() => setOpen(false)}>
            <Icon name={it.icon || 'chevron-right'} size={16} />
            <span>{t(it.label)}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  )

  return (
    <nav className={`pg-nav ${open ? 'is-open' : ''}`}>
      <button type="button" className="pg-nav__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span><Icon name="menu" size={14} /> {current ? t(current.label) : t(title) || t('Danh mục')}</span>
        <Icon name="chevron-down" size={16} className="pg-nav__toggle-caret" />
      </button>
      {title && <h2 className="pg-nav__title">{t(title)}</h2>}
      <div className="pg-nav__body">
        {groups
          ? groups.map((g) => (
              <div key={g.title} className="pg-nav__group">
                <h3>{t(g.title)}</h3>
                {renderList(g.items)}
              </div>
            ))
          : renderList(items)}
      </div>
    </nav>
  )
}

/* ---------- Ô tìm kiếm trên hero ---------- */
export function HeroSearch({ placeholder = 'Tìm kiếm…', button = 'Tìm kiếm' }) {
  const { t } = useLanguage()
  return (
    <form className="pg-search" onSubmit={(e) => e.preventDefault()}>
      <Icon name="search" size={18} />
      <input type="search" placeholder={t(placeholder)} />
      <button type="submit" className="humg-btn humg-btn--primary">{t(button)}</button>
    </form>
  )
}

/* ---------- Panel (thẻ có tiêu đề) ---------- */
export function Panel({ title, icon, action, children, flush, id }) {
  const { t } = useLanguage()
  return (
    <div className="ui-panel" id={id}>
      {(title || action) && (
        <div className="ui-panel__head">
          <h2>{icon && <span className="ui-panel__ic"><Icon name={icon} size={16} /></span>}{t(title)}</h2>
          {action}
        </div>
      )}
      <div className={`ui-panel__body ${flush ? 'is-flush' : ''}`}>{children}</div>
    </div>
  )
}

/* ---------- Lưới ô chức năng (icon + tiêu đề + mô tả) ---------- */
export function TileGrid({ items, cols = 3 }) {
  const { t } = useLanguage()
  return (
    <div className="ui-tiles" style={{ '--cols': cols }}>
      {items.map((t2) => {
        const inner = (
          <>
            <span className="ui-tile__ic"><Icon name={t2.icon || 'grid'} size={26} /></span>
            <strong>{t(t2.title)}</strong>
            {t2.desc && <span>{t(t2.desc)}</span>}
          </>
        )
        return t2.to
          ? <Link key={t2.title} to={t2.to} className="ui-tile">{inner}</Link>
          : <div key={t2.title} className="ui-tile ui-tile--static">{inner}</div>
      })}
    </div>
  )
}

/* ---------- Danh sách tài liệu tải về ---------- */
export function DocList({ items }) {
  return (
    <ul className="ui-doclist">
      {items.map((d, i) => (
        <li key={i}>
          <span className="ui-doclist__ic"><Icon name="file" size={16} /></span>
          <span className="ui-doclist__name">
            {d.name}
            {d.meta && <em>{d.meta}</em>}
          </span>
          <a href={d.href || '#'} className="ui-doclist__dl" aria-label={`Tải ${d.name}`}>
            <Icon name="download" size={16} />
          </a>
        </li>
      ))}
    </ul>
  )
}

/* ---------- Bảng dữ liệu ---------- */
export function DataTable({ columns, rows }) {
  return (
    <div className="ui-table-wrap">
      <table className="ui-table">
        <thead>
          <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- Danh sách đánh số (phương thức, bước…) ---------- */
export function StepList({ items }) {
  return (
    <ol className="ui-steps">
      {items.map((s, i) => (
        <li key={i}>
          <span className="ui-steps__no">{String(i + 1).padStart(2, '0')}</span>
          <span>
            <strong>{s.title}</strong>
            {s.text && <em>{s.text}</em>}
          </span>
        </li>
      ))}
    </ol>
  )
}

/* ---------- FAQ ---------- */
export function Faq({ items }) {
  const [open, setOpen] = useState(0)
  return (
    <ul className="ui-faq">
      {items.map((f, i) => (
        <li key={i} className={open === i ? 'is-open' : ''}>
          <button type="button" onClick={() => setOpen(open === i ? -1 : i)}>
            <span>{f.q}</span>
            <Icon name="chevron-down" size={16} />
          </button>
          {open === i && <p>{f.a}</p>}
        </li>
      ))}
    </ul>
  )
}

/* ---------- Hàng số liệu ---------- */
export function StatRow({ items }) {
  const { t } = useLanguage()
  return (
    <div className="ui-statrow">
      {items.map((s) => (
        <div key={s.label} className="ui-statrow__item">
          <strong>{s.value}</strong>
          <span>{t(s.label)}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------- Danh sách liên kết (sidebar) ---------- */
export function LinkList({ title, items }) {
  const { t } = useLanguage()
  return (
    <div className="ui-linklist">
      {title && <h3>{t(title)}</h3>}
      <ul>
        {items.map((l, i) => (
          <li key={i}>
            <Link to={l.to || '#'}>
              <Icon name={l.external ? 'external' : 'chevron-right'} size={13} />
              {t(l.label)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- Thẻ hỗ trợ (sidebar) ---------- */
export function SupportCard({ title = 'Hỗ trợ & Tư vấn', lead, phone, email, cta }) {
  const { t } = useLanguage()
  return (
    <div className="ui-support">
      <span className="ui-support__ic"><Icon name="headphones" size={20} /></span>
      <h3>{t(title)}</h3>
      {lead && <p>{t(lead)}</p>}
      {phone && <span className="ui-support__row"><Icon name="phone" size={14} /> {phone}</span>}
      {email && <span className="ui-support__row"><Icon name="mail" size={14} /> {email}</span>}
      {cta && <Link to={cta.to} className="humg-btn humg-btn--primary humg-btn--block">{t(cta.label)}</Link>}
    </div>
  )
}

/* ---------- Hàng meta (ngày, lượt xem, đơn vị…) ---------- */
export function MetaBar({ items }) {
  return (
    <div className="ui-metabar">
      {items.filter(Boolean).map((m, i) => (
        <span key={i}><Icon name={m.icon} size={13} /> {m.text}</span>
      ))}
    </div>
  )
}

/* ---------- Chip lọc ---------- */
export function Chips({ options, value, onChange }) {
  return (
    <div className="ui-chips">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          className={value === o.key ? 'is-active' : ''}
          onClick={() => onChange(o.key)}
        >
          {o.label}{o.count != null && <em>{o.count}</em>}
        </button>
      ))}
    </div>
  )
}

/* ---------- Thanh lọc chi tiết: ô tìm + nhiều bộ lọc + sắp xếp ---------- */
export function FilterBar({
  search, onSearch, searchPlaceholder = 'Tìm theo tên…',
  selects = [], sort, onSort, sortOptions,
  count, total, onReset,
}) {
  const dirty = (search && search.length > 0)
    || selects.some((s) => s.value && s.value !== s.options[0])
  return (
    <div className="ui-filterbar">
      <div className="ui-filterbar__row">
        <label className="ui-filterbar__search">
          <Icon name="search" size={15} />
          <input
            type="search"
            value={search}
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch(e.target.value)}
          />
        </label>
        {selects.map((s) => (
          <label key={s.label} className="ui-filterbar__sel">
            <span>{s.label}</span>
            <select value={s.value} onChange={(e) => s.onChange(e.target.value)}>
              {s.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        ))}
        {sortOptions && (
          <label className="ui-filterbar__sel">
            <span>Sắp xếp</span>
            <select value={sort} onChange={(e) => onSort(e.target.value)}>
              {sortOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="ui-filterbar__foot">
        <span>
          {count != null && total != null
            ? <>Hiển thị <strong>{count}</strong> / {total} kết quả</>
            : count != null ? <><strong>{count}</strong> kết quả</> : null}
        </span>
        {dirty && onReset && (
          <button type="button" className="ui-filterbar__reset" onClick={onReset}>
            <Icon name="x" size={13} /> Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  )
}

/* ---------- Phân trang (chỉ hiển thị) ---------- */
export function Pagination({ page = 1, total = 1 }) {
  if (total <= 1) return null
  const shown = Array.from({ length: Math.min(total, 5) }, (_, i) => i + 1)
  return (
    <div className="ui-pagination">
      <button type="button" aria-label="Trang trước" disabled={page <= 1}><Icon name="chevron-left" size={16} /></button>
      {shown.map((p) => (
        <button key={p} type="button" className={p === page ? 'is-active' : ''}>{p}</button>
      ))}
      {total > 5 && <><span>…</span><button type="button">{total}</button></>}
      <button type="button" aria-label="Trang sau"><Icon name="chevron-right" size={16} /></button>
    </div>
  )
}

/* ---------- Hàng bài viết trong danh sách ---------- */
export function ArticleRow({ to, tag, title, excerpt, meta = [], thumb = '16:9' }) {
  return (
    <article className="ui-arow">
      <Link to={to} className="humg-ph ui-arow__thumb" data-ratio="16-9"><span>{thumb}</span></Link>
      <div className="ui-arow__body">
        {tag && <span className="humg-tag">{tag}</span>}
        <h3><Link to={to}>{title}</Link></h3>
        {excerpt && <p>{excerpt}</p>}
        {meta.length > 0 && <MetaBar items={meta} />}
      </div>
    </article>
  )
}

/* ---------- Thẻ media ---------- */
export function MediaCard({ to, kind, title, meta, badge }) {
  const ic = kind === 'podcast' ? 'headphones' : kind === 'video' ? 'play' : 'image'
  return (
    <Link to={to} className="ui-mcard">
      <span className="humg-ph ui-mcard__thumb" data-ratio="16-9">
        <span className="ui-mcard__play"><Icon name={ic} size={20} /></span>
      </span>
      {badge && <span className="ui-mcard__badge">{badge}</span>}
      <strong>{title}</strong>
      {meta && <em>{meta}</em>}
    </Link>
  )
}

/* ---------- Thanh chia sẻ ---------- */
export function ShareBar() {
  return (
    <div className="ui-share">
      <span>Chia sẻ:</span>
      {['facebook', 'linkedin', 'zalo', 'external'].map((n) => (
        <button key={n} type="button" aria-label={`Chia sẻ (${n})`}><Icon name={n} size={15} /></button>
      ))}
    </div>
  )
}

/* ---------- Nội dung bài viết (blocks) ---------- */
export function ArticleBody({ blocks }) {
  return (
    <div className="ui-article">
      {blocks.map((b, i) => {
        if (typeof b === 'string') return <p key={i}>{b}</p>
        if (b.type === 'h2') return <h2 key={i}>{b.text}</h2>
        if (b.type === 'quote') return <blockquote key={i}>{b.text}</blockquote>
        if (b.type === 'list') return <ul key={i}>{b.items.map((x, j) => <li key={j}>{x}</li>)}</ul>
        if (b.type === 'img') {
          return (
            <figure key={i}>
              <span className="humg-ph" data-ratio="16-9"><span>{b.label}</span></span>
              {b.caption && <figcaption>{b.caption}</figcaption>}
            </figure>
          )
        }
        return null
      })}
    </div>
  )
}

/* ---------- Lightbox xem ảnh (phóng to + next/prev + phím) ---------- */
export function Lightbox({ photos, startIndex = 0, onClose }) {
  const [i, setI] = useState(startIndex)
  const prev = useCallback(() => setI((v) => (v - 1 + photos.length) % photos.length), [photos.length])
  const next = useCallback(() => setI((v) => (v + 1) % photos.length), [photos.length])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, prev, next])

  const p = photos[i]
  return (
    <div className="lb" role="dialog" aria-modal="true" onClick={onClose}>
      <button className="lb__close" type="button" onClick={onClose} aria-label="Đóng">
        <Icon name="x" size={22} />
      </button>
      <button
        className="lb__nav lb__nav--prev" type="button" aria-label="Ảnh trước"
        onClick={(e) => { e.stopPropagation(); prev() }}
      >
        <Icon name="chevron-left" size={26} />
      </button>
      <figure className="lb__stage" onClick={(e) => e.stopPropagation()}>
        <span className="lb__ph humg-ph"><span>{p.label}</span></span>
        <figcaption>{p.label}</figcaption>
      </figure>
      <button
        className="lb__nav lb__nav--next" type="button" aria-label="Ảnh sau"
        onClick={(e) => { e.stopPropagation(); next() }}
      >
        <Icon name="chevron-right" size={26} />
      </button>
      <div className="lb__counter">{i + 1} / {photos.length}</div>
      <div className="lb__thumbs" onClick={(e) => e.stopPropagation()}>
        {photos.map((ph, k) => (
          <button
            key={k} type="button" className={k === i ? 'is-active' : ''}
            onClick={() => setI(k)} aria-label={`Ảnh ${k + 1}`}
          >
            <span className="humg-ph" data-ratio="1-1"><span>{k + 1}</span></span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- Danh sách tin (sidebar / nội dung) ---------- */
export function NewsMini({ items }) {
  return (
    <ul className="ui-newsmini">
      {items.map((n, i) => (
        <li key={i}>
          <Link to={n.to || '#'}>
            <span className="ui-newsmini__date"><Icon name="calendar" size={12} /> {n.date}</span>
            <strong>{n.title}</strong>
          </Link>
        </li>
      ))}
    </ul>
  )
}
