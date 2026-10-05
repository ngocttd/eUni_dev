'use client'
import { useState } from 'react'
import { Link } from '../../../lib/router.jsx'
import { useLanguage } from '../../../i18n/LanguageContext.jsx'

/**
 * Logo + tên trường (dùng ở Header, Footer, Auth, Portal).
 * Ảnh thật đặt tại: public/brand/logo-humg.png, public/brand/logo-60-nam.png
 * Nếu chưa có file, tự động fallback (SVG vẽ / ẩn).
 */
function CrestFallback({ light }) {
  const fg = light ? 'var(--humg-primary)' : '#fff'
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <circle cx="32" cy="32" r="31" fill={light ? '#fff' : 'var(--humg-primary)'} />
      <path d="M7 40 C 22 49 42 49 57 36" fill="none" stroke="var(--humg-secondary)" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M7 44 C 22 53 42 53 57 40" fill="none" stroke="var(--humg-accent)" strokeWidth="3" strokeLinecap="round" />
      <text
        x="32" y="40" textAnchor="middle"
        fontFamily="Inter, Arial, sans-serif" fontSize="26" fontWeight="800"
        fill={fg}
      >
        60
      </text>
    </svg>
  )
}

export default function Brand({
  to = '/',
  variant = 'dark',
  compact = false,
  subtitle = true,
  anniversary = false,
}) {
  const light = variant === 'light'
  const [imgOk, setImgOk] = useState(true)
  const { t } = useLanguage()

  return (
    <Link to={to} className={`brand ${light ? 'brand--light' : ''}`} aria-label={t('TRƯỜNG ĐẠI HỌC MỎ - ĐỊA CHẤT')}>
      <span className="brand__crest" aria-hidden="true">
        {imgOk ? (
          <img
            src="/brand/logo-60-nam.png"
            alt=""
            onError={() => setImgOk(false)}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <CrestFallback light={light} />
        )}
      </span>
      {!compact && (
        <span className="brand__text">
          <strong>{t('TRƯỜNG ĐẠI HỌC MỎ - ĐỊA CHẤT')}</strong>
          {subtitle && <em>{t('Tri thức - Bản lĩnh - Sáng tạo - Hội nhập')}</em>}
        </span>
      )}
      {anniversary && (
        <img
          className="brand__anniv"
          src="/brand/logo-60-nam.png"
          alt="60 năm HUMG (1966 - 2026)"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      )}
    </Link>
  )
}
