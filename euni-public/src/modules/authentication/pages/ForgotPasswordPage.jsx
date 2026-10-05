'use client'
import Icon from "../../../shared/lib/Icon.jsx";
import { Link } from '../../../lib/router.jsx';
export function ForgotPasswordPage() {
  return <div className="auth-form">
      <h1>Quên mật khẩu</h1>
      <p className="auth-form__sub">Nhập email để nhận hướng dẫn đặt lại mật khẩu</p>
      <form onSubmit={e => e.preventDefault()}>
        <div className="auth-field">
          <Icon name="mail" size={17} />
          <input type="email" placeholder="Email đã đăng ký" />
        </div>
        <button type="submit" className="humg-btn humg-btn--primary humg-btn--block">Gửi yêu cầu</button>
      </form>
      <div className="auth-divider"><span>hoặc</span></div>
      <Link to="/dang-nhap" className="auth-back-link"><Icon name="arrow-left" size={15} /> Quay lại đăng nhập</Link>
      <div className="auth-hint">
        <Icon name="bell" size={16} />
        <span>Hệ thống sẽ gửi link đặt lại mật khẩu về email bạn đã dùng để đăng ký tài khoản.</span>
      </div>
    </div>;
}
