'use client'
import { useEffect, useState } from 'react'
import authNotice, { AUTH_NOTICE_TEXT } from '../../../shared/services/authNotice.js'
import { useLocation, useNavigate, Link } from '../../../lib/router.jsx'
import Icon from '../../../shared/lib/Icon.jsx'
import { useAuth } from '../../../shared/auth/AuthContext.jsx'
import { DEMO_PORTALS, SsoButton, PwInput, authMode } from '../shared.jsx'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginAs } = useAuth()
  const [username, setUsername] = useState('2151000123')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  /* thông báo sau khi đăng xuất / hết phiên (đọc một lần) */
  const [notice, setNotice] = useState('')
  useEffect(() => { setNotice(AUTH_NOTICE_TEXT[authNotice.take()] || '') }, [])

  const afterLogin = (result) => {
    const from = new URLSearchParams(location.search).get('next')
    navigate(from || result?.user?.portal || '/euni/sinh-vien', { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const result = await login({ username, password })
      afterLogin(result)
    } catch (err) {
      setError(err?.message || 'Đăng nhập không thành công.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDemo = async (demo) => {
    setSubmitting(true)
    setError('')
    try {
      const result = await loginAs(demo.role)
      navigate(result?.user?.portal || demo.to)
    } catch (err) {
      setError(err?.message || 'Không thể mở cổng demo.')
    } finally {
      setSubmitting(false)
    }
  }

  /* Đăng nhập qua Identity Server: tài khoản trường hoặc Microsoft 365 — cùng một tài khoản (sub) trên IdS.
     authMode "mock" (dev): "Tài khoản trường" là form gọi auth-api của euni-api-mock (đóng vai IdS). */
  return <div className="auth-form">
    <h1>Đăng nhập</h1>
    <p className="auth-form__sub">Dùng tài khoản trường (HUMG ID) hoặc tài khoản Microsoft 365 của trường</p>
    {notice && !error && <p className="auth-note auth-note--ok" role="status">{notice}</p>}
    {authMode === 'oidc' ? <SsoButton method="school" /> : <form onSubmit={handleSubmit}>
      <div className="auth-field">
        <Icon name="user" size={17} />
        <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" placeholder="Tên đăng nhập / Email / Mã SV / Mã CB" />
      </div>
      <PwInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" />
      <div className="auth-row">
        <label className="auth-check"><input type="checkbox" /> Ghi nhớ đăng nhập</label>
        <Link to="/quen-mat-khau">Quên mật khẩu?</Link>
      </div>
      {error && <p className="auth-note" role="alert">{error}</p>}
      <button disabled={submitting} type="submit" className="humg-btn humg-btn--primary humg-btn--block">
        {submitting ? 'Đang đăng nhập...' : 'Đăng nhập bằng tài khoản trường'}
      </button>
    </form>}

    <div className="auth-divider"><span>hoặc</span></div>
    <SsoButton method="m365" showAccountLink />

    {authMode === 'mock' && <>
      <div className="auth-divider"><span>môi trường phát triển · vào cổng demo</span></div>
      <div className="auth-demo">
        {DEMO_PORTALS.map(d => <button disabled={submitting} key={d.to} type="button" className={`humg-btn humg-btn--ghost${d.to === '/cms' ? ' auth-demo__wide' : ''}`} onClick={() => handleDemo(d)}>
          {d.label}
        </button>)}
      </div>
      <p className="auth-note">Chế độ mock: form trên gọi auth-api của euni-api-mock. Đặt NEXT_PUBLIC_AUTH_MODE=oidc để mọi đăng nhập đi qua Identity Server.</p>
    </>}
  </div>
}
