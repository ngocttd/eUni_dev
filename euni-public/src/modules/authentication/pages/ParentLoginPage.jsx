'use client'
import { useState } from 'react'
import Icon from '../../../shared/lib/Icon.jsx'
import { Link, useNavigate } from '../../../lib/router.jsx'
import { useAuth } from '../../../shared/auth/AuthContext.jsx'
import { SsoButton, PwInput, authMode } from '../shared.jsx'

export function ParentLoginPage() {
  const navigate = useNavigate()
  const { loginAs, login } = useAuth()
  const [email, setEmail] = useState('phuhuynh')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const result = await login({ username: email, password, role: 'parent' })
      navigate(result?.user?.portal || '/euni/phu-huynh')
    } catch (err) {
      setError(err?.message || 'Đăng nhập không thành công.')
    }
  }

  return <div className="auth-form">
    <h1>Đăng nhập phụ huynh</h1>
    <p className="auth-form__sub">Dành cho phụ huynh / người giám hộ</p>
    {/* Phụ huynh có tài khoản cục bộ trên Identity Server (không có Microsoft 365) */}
    {authMode === 'oidc' ? <SsoButton method="school" label="Đăng nhập tài khoản phụ huynh" /> : <form onSubmit={submit}>
      <div className="auth-field">
        <Icon name="mail" size={17} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="text" placeholder="Email đã đăng ký" />
      </div>
      <PwInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" />
      <div className="auth-row">
        <label className="auth-check"><input type="checkbox" /> Ghi nhớ đăng nhập</label>
        <Link to="/quen-mat-khau">Quên mật khẩu?</Link>
      </div>
      {error && <p className="auth-note" role="alert">{error}</p>}
      <button type="submit" className="humg-btn humg-btn--primary humg-btn--block">Đăng nhập</button>
    </form>}
    {authMode === 'mock' && <><div className="auth-divider"><span>môi trường phát triển</span></div>
    <button type="button" className="humg-btn humg-btn--ghost humg-btn--block" onClick={async () => { const r = await loginAs('parent'); navigate(r?.user?.portal || '/euni/phu-huynh') }}>
      Vào cổng phụ huynh demo
    </button></>}
    <p className="auth-note">Chưa có tài khoản? <Link to="/lien-he">Liên hệ nhà trường</Link></p>
  </div>
}
