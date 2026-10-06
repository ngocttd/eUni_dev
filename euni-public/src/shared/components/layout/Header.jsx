'use client'
import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate, useLocation } from '../../../lib/router.jsx'
import Brand from '../common/Brand.jsx'
import Icon from '../../lib/Icon.jsx'
import { headerNav, mainNav } from '../../../routes/sitemap.js'
import { useSite } from '../../site/SiteContext.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useLanguage, LANGUAGES } from '../../../i18n/LanguageContext.jsx'
import './Header.css'

/** Menu header từ CMS (nhóm "Menu chính"): mục có con → menu thả xuống, mục không có con → liên kết có icon. Trống/lỗi → menu tĩnh. */
const fromCms = (tree) => (tree || []).map((m) => ({ label: m.label, labelEn: m.labelEn, path: m.path, icon: m.icon || 'chevron-right', newTab: m.newTab,
  mode: m.children.length ? 'menu' : 'link', children: m.children.length ? m.children.map((c) => ({ label: c.label, labelEn: c.labelEn, path: c.path, newTab: c.newTab })) : undefined }))

export default function Header() {
  const { lang, setLang, t } = useLanguage()
  const site = useSite()
  const { user, logout } = useAuth()
  /* Đã đăng nhập: nút chính dẫn vào cổng My eUni của vai trò, kèm nút Đăng xuất */
  const doLogout = async () => { setOpenMobile(false); const r = await logout(); if (!r?.redirected) navigate('/dang-nhap', { replace: true }) }
  const cmsNav = fromCms(site.menus?.header)
  const nav = cmsNav.length ? cmsNav : headerNav
  /* drawer di động: menu CMS + các mục khác của sơ đồ tĩnh (trang chủ, cổng portal…) chưa có trong menu CMS */
  const drawerNav = cmsNav.length ? [mainNav[0], ...cmsNav, ...mainNav.slice(1).filter((m) => !cmsNav.some((c) => c.path === m.path))] : mainNav
  const L = (item) => (lang !== 'vi' && item.labelEn ? item.labelEn : t(item.label))
  const [openMobile, setOpenMobile] = useState(false)
  const [openGroup, setOpenGroup] = useState(null)
  const [openIdx, setOpenIdx] = useState(null) // mega-menu desktop đang mở
  const [showSearch, setShowSearch] = useState(false)
  const [q, setQ] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Đổi route -> đóng mọi dropdown
  useEffect(() => {
    setOpenIdx(null)
    setShowSearch(false)
  }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = openMobile ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [openMobile])

  const submitSearch = (e) => {
    e.preventDefault()
    navigate(`/tim-kiem${q ? `?q=${encodeURIComponent(q)}` : ''}`)
    setShowSearch(false)
    setOpenMobile(false)
  }

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="site-header__bar">
        <div className="site-header__bar-inner">
          <Brand />

          <nav className="site-header__nav" aria-label="Menu chính">
            <ul>
              {nav.map((item, i) => (
                <li
                  key={item.label}
                  className={`${item.children ? 'has-children' : ''} ${openIdx === i ? 'is-open' : ''}`}
                  data-mode={item.mode}
                  onMouseEnter={() => item.children && setOpenIdx(i)}
                  onMouseLeave={() => setOpenIdx(null)}
                  onFocus={() => item.children && setOpenIdx(i)}
                  onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpenIdx(null) }}
                >
                  <NavLink to={item.path} onClick={() => setOpenIdx(null)}>
                    {item.mode === 'link' && <Icon name={item.icon} size={16} />}
                    <span>{L(item)}</span>
                    {item.mode === 'menu' && item.children && (
                      <Icon name="chevron-down" size={13} className="site-header__caret" />
                    )}
                  </NavLink>
                  {item.children && (
                    <div className="site-header__mega" role="menu">
                      <div className="site-header__mega-head">
                        <Icon name={item.icon} size={18} />
                        <span>{L(item)}</span>
                      </div>
                      <ul>
                        {item.children.map((c) => (
                          <li key={c.path + c.label} role="none">
                            <Link role="menuitem" to={c.path} onClick={() => setOpenIdx(null)} {...(c.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                              <Icon name="chevron-right" size={13} />
                              {L(c)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-header__actions">
            <button
              className="site-header__icon-btn"
              type="button"
              aria-label={t('Tìm kiếm toàn trang')}
              aria-expanded={showSearch}
              onClick={() => setShowSearch((s) => !s)}
            >
              <Icon name="search" size={20} />
            </button>
            <span className="site-header__lang">
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
            {user ? <>
              <Link to={user.portal || '/'} className="humg-btn humg-btn--primary site-header__login" title={`${user.name} — ${t('vào My eUni')}`}>
                <Icon name="user" size={15} />
                <span>My eUni</span>
              </Link>
              <button type="button" className="site-header__icon-btn" onClick={doLogout} aria-label={t('Đăng xuất')} title={`${t('Đăng xuất')} (${user.name})`}>
                <Icon name="lock" size={19} />
              </button>
            </> : <Link to="/dang-nhap" className="humg-btn humg-btn--primary site-header__login">
              <Icon name="lock" size={15} />
              <span>{t('Đăng nhập eUni')}</span>
            </Link>}
            <button
              className="site-header__burger"
              type="button"
              aria-label={t('Mở menu')}
              aria-expanded={openMobile}
              onClick={() => setOpenMobile(true)}
            >
              <Icon name="menu" size={22} />
            </button>
          </div>
        </div>

        {showSearch && (
          <div className="site-header__searchbar">
            <form className="humg-container" onSubmit={submitSearch}>
              <Icon name="search" size={18} />
              <input
                autoFocus
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('Tìm kiếm thông tin, tài liệu, dịch vụ…')}
              />
              <button type="submit" className="humg-btn humg-btn--primary">{t('Tìm kiếm')}</button>
            </form>
          </div>
        )}
      </div>

      {/* Drawer mobile — dùng đầy đủ sitemap (11 khối).
         Bọc trong lớp phủ toàn màn hình có overflow:hidden để khi đóng,
         panel trượt ra ngoài KHÔNG tạo thanh cuộn ngang trên di động. */}
      <div className={`site-header__drawer-portal ${openMobile ? 'is-open' : ''}`}>
      <div className={`site-header__drawer ${openMobile ? 'is-open' : ''}`}>
        <div className="site-header__drawer-top">
          <Brand />
          <button type="button" aria-label={t('Đóng menu')} onClick={() => setOpenMobile(false)}>
            <Icon name="x" size={22} />
          </button>
        </div>
        <span className="site-header__drawer-lang">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              className={lang === l.code ? 'is-active' : ''}
              aria-pressed={lang === l.code}
              onClick={() => setLang(l.code)}
            >
              {l.short} · {l.label}
            </button>
          ))}
        </span>
        <form className="site-header__drawer-search" onSubmit={submitSearch}>
          <Icon name="search" size={16} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('Tìm kiếm toàn trang…')}
          />
        </form>
        <nav aria-label="Menu chính (mobile)">
          <ul>
            {drawerNav.map((item, i) => (
              <li key={item.label}>
                <div className="site-header__drawer-row">
                  <NavLink to={item.path} end={item.path === '/'} onClick={() => setOpenMobile(false)}>
                    <Icon name={item.icon || 'chevron-right'} size={16} /> {L(item)}
                  </NavLink>
                  {item.children && (
                    <button
                      type="button"
                      aria-label="Mở nhóm"
                      className={openGroup === i ? 'is-open' : ''}
                      onClick={() => setOpenGroup(openGroup === i ? null : i)}
                    >
                      <Icon name="chevron-down" size={16} />
                    </button>
                  )}
                </div>
                {item.children && openGroup === i && (
                  <ul className="site-header__drawer-sub">
                    {item.children.map((c) => (
                      <li key={c.path + c.label}>
                        <Link to={c.path} onClick={() => setOpenMobile(false)}>{L(c)}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
        {user ? <>
          <Link to={user.portal || '/'} className="humg-btn humg-btn--primary humg-btn--block" onClick={() => setOpenMobile(false)}>
            <Icon name="user" size={15} /> My eUni · {user.name}
          </Link>
          <button type="button" className="humg-btn humg-btn--ghost humg-btn--block" onClick={doLogout} style={{ marginTop: 8 }}>
            <Icon name="lock" size={15} /> {t('Đăng xuất')}
          </button>
        </> : <Link to="/dang-nhap" className="humg-btn humg-btn--primary humg-btn--block" onClick={() => setOpenMobile(false)}>
          <Icon name="lock" size={15} /> {t('Đăng nhập eUni')}
        </Link>}
      </div>
      {openMobile && <div className="site-header__scrim" onClick={() => setOpenMobile(false)} />}
      </div>
    </header>
  )
}
