'use client'
import { useState } from 'react'
import { useLocation, useNavigate, Link } from '../../../lib/router.jsx'
import Icon from '../../../shared/lib/Icon.jsx'
import { useAuth } from '../../../shared/auth/AuthContext.jsx'
import { DEMO_PORTALS, MsButton, PwInput } from '../shared.jsx'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginAs } = useAuth()
  const [username, setUsername] = useState('2151000123')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  return <div className="auth-form">
    <h1>Đăng nhập</h1>
    <p className="auth-form__sub">Sử dụng tài khoản HUMG (SSO)</p>
    <form onSubmit={handleSubmit}>
      <div className="auth-field">
        <Icon name="user" size={17} />
        <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" placeholder="Tên đăng nhập / Email / Mã số" />
      </div>
      <PwInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" />
      <div className="auth-row">
        <label className="auth-check"><input type="checkbox" /> Ghi nhớ đăng nhập</label>
        <Link to="/quen-mat-khau">Quên mật khẩu?</Link>
      </div>
      {error && <p className="auth-note" role="alert">{error}</p>}
      <button disabled={submitting} type="submit" className="humg-btn humg-btn--primary humg-btn--block">
        {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </form>

    <div className="auth-divider"><span>hoặc vào cổng demo</span></div>
    <div className="auth-demo">
      {DEMO_PORTALS.map(d => <button disabled={submitting} key={d.to} type="button" className={`humg-btn humg-btn--ghost${d.to === '/cms' ? ' auth-demo__wide' : ''}`} onClick={() => handleDemo(d)}>
        {d.label}
      </button>)}
    </div>
    <p className="auth-note">Ở chế độ mock có thể vào thẳng từng vai trò. Khi VITE_AUTH_MODE=api, form sẽ gọi API thật.</p>

    <div className="auth-divider"><span>hoặc đăng nhập bằng</span></div>
    <MsButton />
  </div>
}
