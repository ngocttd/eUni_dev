'use client'
import { useState } from 'react';
import { Link, useNavigate, useLocation } from '../../lib/router.jsx';
import { useAuth } from '../../shared/auth/AuthContext.jsx';
import { sso, ssoEndpoints } from '../../lib/sso/config.js';
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
export function MsButton({
  label = 'Đăng nhập với Microsoft 365',
  returnTo
}) {
  const { loginWithSso } = useAuth();
  const { search } = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!sso.enabled) return null;
  const go = async () => {
    setBusy(true);
    setError('');
    try {
      await loginWithSso({ returnTo: returnTo || new URLSearchParams(search).get('next') || undefined });
    } catch (e) {
      setError(e?.message || 'Không mở được trang đăng nhập SSO.');
      setBusy(false);
    }
  };
  return <>
      <button type="button" className="auth-sso" onClick={go} disabled={busy}>
        <Icon name="microsoft" size={16} /> {busy ? 'Đang chuyển tới SSO…' : label}
      </button>
      {error && <p className="auth-note" role="alert">{error}</p>}
      <p className="auth-note"><a href={ssoEndpoints.account} target="_blank" rel="noreferrer">Quản lý tài khoản SSO</a></p>
    </>;
}

/* ======================= AUTH-01 · Đăng nhập chung (SSO) ======================= */
