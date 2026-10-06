'use client'
import { Link } from '../../../lib/router.jsx'
import Brand from '../common/Brand.jsx'
import Icon from '../../lib/Icon.jsx'
import { footerColumns } from '../../../routes/sitemap.js'
import { useLanguage } from '../../../i18n/LanguageContext.jsx'
import { useSite } from '../../site/SiteContext.jsx'
import './Footer.css'

/* Dự phòng khi chưa đọc được Cấu hình từ cms-api */
const FALLBACK = { siteName: 'Trường Đại học Mỏ – Địa chất', address: '18 Phố Viên, Đức Thắng, Bắc Từ Liêm, Hà Nội', phone: '024.3838.3806', email: 'humg@humg.edu.vn' }
const SOCIALS = [
  { key: 'facebook', icon: 'facebook', label: 'Facebook', cls: 'is-fb' },
  { key: 'youtube', icon: 'youtube', label: 'YouTube', cls: 'is-yt' },
  { key: 'linkedin', icon: 'linkedin', label: 'LinkedIn', cls: 'is-li' },
  { key: 'zalo', icon: 'zalo', label: 'Zalo', cls: 'is-zl' },
]

export default function Footer() {
  const { t, lang } = useLanguage()
  const { settings, menus } = useSite()
  /* Cấu hình → Thông tin chung / SEO & Mạng xã hội trong CMS */
  const g = { ...FALLBACK, ...Object.fromEntries(Object.entries(settings?.general || {}).filter(([, v]) => v)) }
  const seo = settings?.seo || {}
  const socials = SOCIALS.filter((x) => seo[x.key]).map((x) => ({ ...x, href: seo[x.key] }))
  /* Menu chân trang: mỗi mục gốc là một cột, mục con là liên kết */
  const L = (item) => (lang !== 'vi' && item.labelEn ? item.labelEn : t(item.label))
  const columns = menus?.footer?.length
    ? menus.footer.map((c) => ({ title: L(c), links: c.children.map((l) => ({ label: L(l), path: l.path, newTab: l.newTab })) }))
    : footerColumns.map((c) => ({ title: t(c.title), links: c.links.map((l) => ({ label: t(l.label), path: l.path })) }))
  const bottomLinks = menus?.utility?.length ? menus.utility.map((u) => ({ label: L(u), path: u.path, newTab: u.newTab })) : [{ label: t('Sơ đồ trang'), path: '/sitemap' }, { label: t('Liên hệ'), path: '/lien-he' }]
  const tel = String(g.phone).replace(/[^\d+]/g, '')
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div className="site-footer__about">
          <Brand variant="light" />
          <ul className="site-footer__contact">
            <li><Icon name="map-pin" size={16} /> {g.address}</li>
            <li><Icon name="phone" size={16} /> <a href={`tel:${tel}`}>{g.phone}</a></li>
            <li><Icon name="mail" size={16} /> <a href={`mailto:${g.email}`}>{g.email}</a></li>
            <li><Icon name="globe" size={16} /> www.humg.edu.vn</li>
          </ul>
        </div>

        {columns.map((col) => (
          <nav key={col.title} className="site-footer__col" aria-label={col.title}>
            <h3>{col.title}</h3>
            <ul>
              {col.links.map((l) => (
                <li key={l.label + l.path}>
                  <Link to={l.path} {...(l.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}><Icon name="chevron-right" size={12} /> {l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="site-footer__col">
          {socials.length > 0 && <h3>{t('Kết nối với HUMG')}</h3>}
          {socials.length > 0 && <div className="site-footer__socials">
            {socials.map((s) => (
              <a key={s.label} href={s.href} aria-label={`${s.label} của ${g.siteName}`} title={s.label} className={s.cls} target="_blank" rel="noopener noreferrer">
                <Icon name={s.icon} size={18} />
              </a>
            ))}
          </div>}
          <h3 style={{ marginTop: socials.length ? 20 : 0 }}>{t('Tải ứng dụng HUMG eUni')}</h3>
          <div className="site-footer__apps">
            <div className="site-footer__stores">
              <span className="site-footer__store"><Icon name="external" size={15} /> App Store</span>
              <span className="site-footer__store"><Icon name="external" size={15} /> Google Play</span>
            </div>
            <span className="site-footer__qr" aria-hidden="true">QR</span>
          </div>
        </div>
      </div>

      <div className="site-footer__bottom">
        <div className="site-footer__bottom-inner">
          <span>© {new Date().getFullYear()} {g.siteName}. All rights reserved.</span>
          <span className="site-footer__bottom-links">
            {bottomLinks.map((l) => <Link key={l.label + l.path} to={l.path} {...(l.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{l.label}</Link>)}
          </span>
        </div>
      </div>
    </footer>
  )
}
