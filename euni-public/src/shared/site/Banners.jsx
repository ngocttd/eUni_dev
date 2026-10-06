'use client'
/**
 * Banner do CMS quản lý (màn Banner / Slider của admin), theo vị trí:
 *   home_slider   dải banner quảng bá trên trang chủ (dưới slide đầu trang)
 *   home_popup    cửa sổ nổi khi mở trang chủ (đóng thì không hiện lại trong phiên)
 *   sidebar_right khối ở cột phải trang tin tức
 *   footer        dải thông báo ngay trên chân trang, mọi trang
 * API chỉ trả banner đang hiển thị và trong khoảng ngày; không có banner thì không render gì.
 */
import { useEffect, useState } from 'react'
import { Link } from '../../lib/router.jsx'
import Icon from '../lib/Icon.jsx'
import { mediaUrl } from '../../lib/api/media.js'
import { useSite } from './SiteContext.jsx'
import './site.css'

const ofPos = (banners, pos) => (banners || []).filter((b) => b.position === pos)
const isExternal = (u) => /^https?:\/\//.test(u || '')

function BannerLink({ b, className, children }) {
  if (!b.linkUrl) return <div className={className}>{children}</div>
  return isExternal(b.linkUrl)
    ? <a className={className} href={b.linkUrl} target="_blank" rel="noopener noreferrer">{children}</a>
    : <Link className={className} to={b.linkUrl}>{children}</Link>
}

function BannerCard({ b, compact }) {
  return (
    <BannerLink b={b} className={`site-banner ${compact ? 'is-compact' : ''} ${b.imageUrl ? 'has-image' : ''}`}>
      {b.imageUrl && <img src={mediaUrl(b.imageUrl)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
      <span className="site-banner__text">
        <strong>{b.title}</strong>
        {b.subtitle && <em>{b.subtitle}</em>}
      </span>
      {b.linkUrl && <span className="site-banner__go" aria-hidden="true"><Icon name="arrow-right" size={16} /></span>}
    </BannerLink>
  )
}

/** Dải banner (home_slider, footer) */
export function BannerStrip({ position, label = 'Thông tin nổi bật' }) {
  const list = ofPos(useSite().banners, position)
  if (!list.length) return null
  return (
    <section className={`site-banners site-banners--${position}`} aria-label={label}>
      <div className="humg-container site-banners__row">
        {list.map((b) => <BannerCard key={b.id} b={b} compact={position === 'footer'} />)}
      </div>
    </section>
  )
}

/** Khối banner cột phải */
export function BannerSide() {
  const list = ofPos(useSite().banners, 'sidebar_right')
  if (!list.length) return null
  return <div className="site-banners--side">{list.map((b) => <BannerCard key={b.id} b={b} compact />)}</div>
}

/** Popup trang chủ: hiện banner đầu tiên ở vị trí home_popup, đóng thì nhớ trong phiên */
export function BannerPopup() {
  const b = ofPos(useSite().banners, 'home_popup')[0]
  const key = b ? `humg-popup-${b.id}` : null
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!key) return
    try { setOpen(sessionStorage.getItem(key) !== 'closed') } catch { setOpen(true) }
  }, [key])
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  if (!b || !open) return null
  function close() { setOpen(false); try { sessionStorage.setItem(key, 'closed') } catch { /* bỏ qua */ } }
  return (
    <div className="site-popup" role="dialog" aria-modal="true" aria-labelledby={`popup-${b.id}`} onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="site-popup__box">
        <button type="button" className="site-popup__close" onClick={close} aria-label="Đóng thông báo"><Icon name="x" size={18} /></button>
        {b.imageUrl && <img src={mediaUrl(b.imageUrl)} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
        <h2 id={`popup-${b.id}`}>{b.title}</h2>
        {b.subtitle && <p>{b.subtitle}</p>}
        {b.linkUrl && (isExternal(b.linkUrl)
          ? <a className="humg-btn humg-btn--primary" href={b.linkUrl} target="_blank" rel="noopener noreferrer" onClick={close}>Xem chi tiết</a>
          : <Link className="humg-btn humg-btn--primary" to={b.linkUrl} onClick={close}>Xem chi tiết</Link>)}
      </div>
    </div>
  )
}
