'use client'
import { Link, useNavigate } from '../lib/router.jsx'
import Icon from '../shared/lib/Icon.jsx'
import './NotFound.css'

/* Minh hoạ 404 — cửa sổ trình duyệt + biển chỉ đường (tông xanh HUMG) */
function ErrorArt() {
  return (
    <svg className="sys-error__art" viewBox="0 0 360 220" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="180" cy="196" rx="132" ry="12" fill="#0a3d91" opacity="0.08" />
      <rect x="96" y="44" width="200" height="132" rx="10" fill="#eef4fc" stroke="#1976d2" strokeWidth="3" />
      <path d="M96 66h200" stroke="#1976d2" strokeWidth="3" />
      <circle cx="112" cy="55" r="3.5" fill="#1976d2" />
      <circle cx="124" cy="55" r="3.5" fill="#90b4e6" />
      <circle cx="136" cy="55" r="3.5" fill="#90b4e6" />
      <circle cx="196" cy="118" r="26" fill="#fff" stroke="#0a3d91" strokeWidth="3" />
      <circle cx="188" cy="112" r="2.6" fill="#0a3d91" />
      <circle cx="204" cy="112" r="2.6" fill="#0a3d91" />
      <path d="M187 130c4-5 14-5 18 0" stroke="#0a3d91" strokeWidth="3" strokeLinecap="round" />
      <circle cx="238" cy="150" r="15" fill="none" stroke="#ff9800" strokeWidth="4" />
      <path d="M249 161l12 12" stroke="#ff9800" strokeWidth="4" strokeLinecap="round" />
      <rect x="60" y="96" width="8" height="80" rx="2" fill="#0a3d91" />
      <path d="M68 104h40l10 9-10 9H68z" fill="#1976d2" />
      <path d="M64 128H28l-10 9 10 9h36z" fill="#90b4e6" />
      <path d="M300 150l10 26h-20z" fill="#ff9800" />
      <rect x="298" y="176" width="24" height="6" rx="2" fill="#ffcc80" />
    </svg>
  )
}

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <section className="sys-error">
      <div className="sys-error__inner">
        <p className="sys-error__code">404</p>
        <h1 className="sys-error__title">Trang không tồn tại!</h1>
        <p className="sys-error__desc">
          Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển hoặc xóa bỏ.
        </p>
        <ErrorArt />
        <div className="sys-error__actions">
          <Link to="/" className="humg-btn humg-btn--primary">
            <Icon name="home" size={16} /> Về trang chủ
          </Link>
          <button type="button" className="humg-btn humg-btn--ghost" onClick={() => navigate(-1)}>
            <Icon name="arrow-left" size={16} /> Quay lại trang trước
          </button>
        </div>
        <Link to="/sitemap" className="sys-error__sitemap">
          <Icon name="layers" size={14} /> Sitemap
        </Link>
      </div>
    </section>
  )
}
