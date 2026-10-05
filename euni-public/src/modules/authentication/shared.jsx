'use client'
import { useState } from 'react';
import { Link, useNavigate, useLocation } from '../../lib/router.jsx';
import { useAuth } from '../../shared/auth/AuthContext.jsx';
import { sso, ssoEndpoints } from '../../lib/sso/config.js';
export { authMode } from '../../lib/sso/config.js';
import Icon from '../../shared/lib/Icon.jsx';
import './auth.css';

/* Cổng demo — không xác thực thật, chọn vai trò để vào thẳng portal */
export const DEMO_PORTALS = [{
  label: 'Sinh viên',
  to: '/euni/sinh-vien',
  role: 'student'
}, {
  label: 'Giảng viên',
  to: '/euni/giang-vien',
  role: 'staff'
}, {
  label: 'Phụ huynh',
  to: '/euni/phu-huynh',
  role: 'parent'
}, {
  label: 'Lãnh đạo',
  to: '/euni/lanh-dao',
  role: 'leader'
}];

/* Ô nhập mật khẩu có nút ẩn/hiện */
export function PwInput({
  placeholder, value, onChange
}) {
  const [show, setShow] = useState(false);
  return <div className="auth-field">
      <Icon name="lock" size={17} />
      <input type={show ? 'text' : 'password'} placeholder={placeholder} value={value ?? ''} onChange={onChange} />
      <button type="button" className="auth-field__eye" onClick={() => setShow(s => !s)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
        <Icon name={show ? 'eye-off' : 'eye'} size={17} />
      </button>
    </div>;
}
/**
 * Nút đăng nhập qua Identity Server (docs/design/CMS_DESIGN.md §3):
 *   method="school" — tài khoản trường (form của IdS) · method="m365" — Microsoft 365 (IdS chuyển thẳng sang Entra ID).
 * Hai cách cho cùng một tài khoản (`sub`) trên IdS. App không nhận mật khẩu.
 */
export function SsoButton({
  method = 'm365',
  label,
  returnTo,
  showAccountLink = false
}) {
  const { loginWithSso } = useAuth();
  const { search } = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!sso.enabled || (method === 'school' && !sso.schoolAccount)) return null;
  const go = async () => {
    setBusy(true);
    setError('');
    try {
      await loginWithSso({ method, returnTo: returnTo || new URLSearchParams(search).get('next') || undefined });
    } catch (e) {
      setError(e?.message || 'Không mở được trang đăng nhập.');
      setBusy(false);
    }
  };
  const text = label || (method === 'm365' ? 'Đăng nhập với Microsoft 365' : 'Đăng nhập bằng tài khoản trường (HUMG ID)');
  return <>
      <button type="button" className={method === 'm365' ? 'auth-sso' : 'humg-btn humg-btn--primary humg-btn--block'} onClick={go} disabled={busy}>
        <Icon name={method === 'm365' ? 'microsoft' : 'user'} size={16} /> {busy ? 'Đang chuyển tới trang đăng nhập…' : text}
      </button>
      {error && <p className="auth-note" role="alert">{error}</p>}
      {showAccountLink && <p className="auth-note"><a href={ssoEndpoints.account} target="_blank" rel="noreferrer">Quản lý tài khoản</a></p>}
    </>;
}
export const MsButton = props => <SsoButton method="m365" showAccountLink {...props} />;

/* ======================= AUTH-01 · Đăng nhập chung (SSO) ======================= */
