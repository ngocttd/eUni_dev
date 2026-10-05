'use client'
import Icon from "../../../shared/lib/Icon.jsx";
import { Link } from '../../../lib/router.jsx';
import { PwInput } from "../shared.jsx";
export function ChangePasswordPage() {
  return <div className="auth-form">
      <h1>Đổi mật khẩu</h1>
      <p className="auth-form__sub">Cập nhật mật khẩu mới để bảo mật tài khoản</p>
      <form onSubmit={e => e.preventDefault()}>
        <PwInput placeholder="Mật khẩu hiện tại" />
        <PwInput placeholder="Mật khẩu mới" />
        <PwInput placeholder="Xác nhận mật khẩu mới" />
        <div className="auth-req">
          <strong>Yêu cầu mật khẩu:</strong>
          <ul>
            <li><Icon name="check" size={13} /> Tối thiểu 8 ký tự</li>
            <li><Icon name="check" size={13} /> Bao gồm chữ hoa và chữ thường</li>
            <li><Icon name="check" size={13} /> Bao gồm số và ký tự đặc biệt</li>
          </ul>
        </div>
        <button type="submit" className="humg-btn humg-btn--primary humg-btn--block">Cập nhật mật khẩu</button>
        <Link to="/dang-nhap" className="humg-btn humg-btn--ghost humg-btn--block">Hủy bỏ</Link>
      </form>
    </div>;
}
