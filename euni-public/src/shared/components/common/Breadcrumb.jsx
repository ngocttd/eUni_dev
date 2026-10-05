'use client'
import { Link } from '../../../lib/router.jsx'
import Icon from '../../lib/Icon.jsx'
import { useLanguage } from '../../../i18n/LanguageContext.jsx'
import './Breadcrumb.css'

/** items: [{ label, to? }] — phần tử cuối là trang hiện tại */
export default function Breadcrumb({ items = [] }) {
  const { t } = useLanguage()
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <div className="humg-container-wide breadcrumb__inner">
        <Link to="/"><Icon name="home" size={14} /> {t('Trang chủ')}</Link>
        {items.map((it, i) => (
          <span key={i} className="breadcrumb__seg">
            <Icon name="chevron-right" size={13} />
            {it.to && i < items.length - 1 ? <Link to={it.to}>{it.label}</Link> : <strong>{it.label}</strong>}
          </span>
        ))}
      </div>
    </nav>
  )
}
