'use client'
import { useState } from 'react'
import { NavLink, Link } from '../../../lib/router.jsx'
import Brand from '../common/Brand.jsx'
import Icon from '../../lib/Icon.jsx'
import ScrollToTop from '../common/ScrollToTop.jsx'
import { useLanguage, LANGUAGES } from '../../../i18n/LanguageContext.jsx'
import './layout.css'

const DEFAULT_NOTIFS = [
  { title: 'Chào mừng bạn đến với MY eUni Portal', time: 'Vừa xong', unread: false },
]

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/)
  const last = parts[parts.length - 1] || '?'
  return last[0].toUpperCase()
}

/**
 * Layout MY eUni PORTAL (POR-*) và CMS (CMS-*):
 * sidebar trái (đầu menu = thương hiệu + thẻ người dùng, nav cuộn riêng) +
 * topbar có chuông thông báo hoạt động + vùng nội dung.
 * Trên mobile sidebar thu lại thành thanh có nút mở/đóng menu (drawer).
 */
export default function PortalLayout({ config, variant = 'portal', children }) {
  const { lang, setLang, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const close = () => setOpen(false)

  const notifs = config.notifications && config.notifications.length ? config.notifications : DEFAULT_NOTIFS
  const unread = notifs.filter((n) => n.unread).length
  const brandLabel = t(variant === 'cms' ? 'HUMG CMS' : 'MY eUni Portal')

  return (
    <div className={`portal-shell portal-shell--${variant} ${open ? 'is-menu-open' : ''}`}>
      <ScrollToTop />
      <aside className="portal-shell__side">
        <div className="portal-shell__side-head">
          <div className="portal-shell__brandrow">
            <Brand compact to="/" />
            <span className="portal-shell__wordmark">{brandLabel}</span>
            <button
              type="button"
              className="portal-shell__menu-toggle"
              aria-expanded={open}
              aria-label={open ? t('Đóng menu') : t('Mở menu')}
              onClick={() => setOpen((v) => !v)}
            >
              <Icon name={open ? 'x' : 'menu'} size={20} />
            </button>
          </div>
          <div className="portal-shell__usercard">
            <span className="portal-shell__usercard-av" aria-hidden="true">{initials(config.user)}</span>
            <span className="portal-shell__usercard-txt">
              <strong>{config.user}</strong>
              <em>{config.meta || t(config.role)}</em>
            </span>
          </div>
        </div>

        <nav aria-label={`Menu ${config.role}`} className="portal-shell__nav">
          <ul>
            {config.items.filter((it) => !it.hidden).map((it) => (
              <li key={it.path || 'index'}>
                <NavLink
                  to={it.path ? `${config.base}/${it.path}` : config.base}
                  end={!it.path}
                  onClick={close}
                >
                  <Icon name={it.icon} size={17} />
                  <span>{t(it.title)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {open && <button type="button" className="portal-shell__scrim" aria-hidden="true" tabIndex={-1} onClick={close} />}

      <div className="portal-shell__body">
        <header className="portal-shell__topbar">
          <span className="portal-shell__topbar-title">{brandLabel} · {t(config.role)}</span>
          <div className="portal-shell__topbar-right">
            {config.topbarExtra}
            <span className="portal-shell__lang">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className={lang === l.code ? 'is-active' : ''}
                  aria-pressed={lang === l.code}
                  title={l.label}
                  onClick={() => setLang(l.code)}
                >
                  {l.short}
                </button>
              ))}
            </span>
            <div className="portal-shell__notifwrap">
              <button
                type="button"
                className="portal-shell__bell"
                aria-label={t('Thông báo')}
                aria-expanded={notifOpen}
                onClick={() => setNotifOpen((v) => !v)}
              >
                <Icon name="bell" size={18} />
                {unread > 0 && <span className="portal-shell__bell-badge">{unread}</span>}
              </button>
              {notifOpen && (
                <>
                  <button type="button" className="portal-shell__notif-scrim" aria-hidden="true" tabIndex={-1} onClick={() => setNotifOpen(false)} />
                  <div className="portal-shell__notif" role="menu">
                    <div className="portal-shell__notif-head">
                      <strong>{t('Thông báo')}</strong>
                      {unread > 0 && <span>{unread} {t('chưa đọc')}</span>}
                    </div>
                    <ul>
                      {notifs.map((n, i) => (
                        <li key={i} className={n.unread ? 'is-unread' : ''}>
                          <p>{n.title}</p>
                          <span>{n.time}</span>
                        </li>
                      ))}
                    </ul>
                    {config.notifTo && (
                      <Link to={config.notifTo} className="portal-shell__notif-foot" onClick={() => setNotifOpen(false)}>
                        {t('Xem tất cả')} <Icon name="arrow-right" size={13} />
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
            <span className="portal-shell__user">
              <span className="portal-shell__avatar" aria-hidden="true">{initials(config.user)}</span>
              <span className="portal-shell__user-meta">
                <strong>{config.user}</strong>
                <em>{config.meta || t(config.role)}</em>
              </span>
            </span>
            <Link to="/" className="portal-shell__exit" onClick={close} title={t('Thoát cổng')}>
              <Icon name="arrow-left" size={16} />
              <span>{t('Thoát cổng')}</span>
            </Link>
          </div>
        </header>
        <div className="portal-shell__content">
          {children}
        </div>
      </div>
    </div>
  )
}
