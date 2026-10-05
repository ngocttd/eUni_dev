'use client'
import { useState } from 'react'
import { useLocation, useNavigate } from '../../lib/router.jsx'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import Icon from '../../shared/lib/Icon.jsx'
import { sso, ssoEndpoints, authMode } from '../../lib/sso/config.js'
import './auth.css'

/**
 * Đăng nhập CMS admin qua Identity Server: tài khoản trường hoặc Microsoft 365 (cùng một người dùng trên IdS).
 * Quyền CMS lấy từ role trong token (cms.admin / cms.editor / cms.reviewer / cms.author) — CMS không quản lý user/role.
 * authMode "mock": form gọi auth-api của euni-api-mock (đóng vai IdS) khi phát triển.
 */
export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const { login, logout, loginWithSso } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const goSso = async (method) => {
    setBusy(true)
    setError('')
    try { await loginWithSso({ method, returnTo: new URLSearchParams(search).get('next') || '/cms' }) } catch (err) { setError(err?.message || 'Không mở được trang đăng nhập SSO.'); setBusy(false) }
  }

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
      <p className="auth-form__sub">Hệ thống quản trị nội dung HUMG · tài khoản trường hoặc Microsoft 365</p>
      {authMode === 'oidc' && sso.schoolAccount ? (
        <button type="button" className="humg-btn humg-btn--primary humg-btn--block" onClick={() => goSso('school')} disabled={busy}><Icon name="user" size={16} /> Đăng nhập bằng tài khoản trường (HUMG ID)</button>
      ) : (
        <form onSubmit={submit}>
          <div className="auth-field">
            <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" placeholder="Tên đăng nhập, email hoặc mã cán bộ" autoComplete="username" required />
          </div>
          <div className="auth-field">
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mật khẩu" autoComplete="current-password" required />
          </div>
          <button disabled={busy} type="submit" className="humg-btn humg-btn--primary humg-btn--block">{busy ? 'Đang đăng nhập...' : 'Đăng nhập bằng tài khoản trường'}</button>
        </form>
      )}
      {error && <p className="auth-note" role="alert">{error}</p>}
      {sso.enabled && (
        <>
          <div className="auth-divider"><span>hoặc</span></div>
          <button type="button" className="auth-sso" onClick={() => goSso('m365')} disabled={busy}><Icon name="microsoft" size={16} /> Đăng nhập với Microsoft 365</button>
          <p className="auth-note"><a href={ssoEndpoints.account} target="_blank" rel="noreferrer">Quản lý tài khoản</a></p>
        </>
      )}
      {authMode === 'mock' && (
        <p className="auth-note" style={{ marginTop: 16 }}>
          Môi trường mock (mật khẩu <code>Humg@2025</code>): <code>tvanminh</code> quản trị · <code>nthoa</code> biên tập · <code>pvloc</code> biên tập Khoa CNTT ·{' '}
          <code>vthuong</code> người duyệt P.Đào tạo · <code>ltmai</code>, <code>dvtung</code> tác giả
        </p>
      )}
    </div>
  )
}
