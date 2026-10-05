'use client'
import { useState } from 'react'
import { useLocation, useNavigate } from '../../lib/router.jsx'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import './auth.css'

/** Đăng nhập CMS admin (tài khoản CMS lưu ở cms-api; xác thực qua auth-api). */
export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const { login, logout } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { user } = await login({ username, password })
      if (!String(user.role).startsWith('cms-') || !user.permissions.some((p) => p === 'cms.access' || p === 'cms.*')) {
        await logout()
        throw new Error('Tài khoản không có quyền truy cập CMS.')
      }
      navigate(new URLSearchParams(search).get('next') || '/cms', { replace: true })
    } catch (err) {
      setError(err?.message || 'Đăng nhập không thành công.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-form">
      <h1>Đăng nhập CMS</h1>
      <p className="auth-form__sub">Hệ thống quản trị nội dung HUMG</p>
      <form onSubmit={submit}>
        <div className="auth-field">
          <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" placeholder="Tên đăng nhập hoặc email" autoComplete="username" required />
        </div>
        <div className="auth-field">
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mật khẩu" autoComplete="current-password" required />
        </div>
        {error && <p className="auth-note" role="alert">{error}</p>}
        <button disabled={busy} type="submit" className="humg-btn humg-btn--primary humg-btn--block">{busy ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
      <p className="auth-note" style={{ marginTop: 16 }}>Môi trường mock: <code>tvanminh</code> / <code>Humg@2025</code></p>
    </div>
  )
}
