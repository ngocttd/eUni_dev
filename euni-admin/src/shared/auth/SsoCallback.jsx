'use client'
import { useEffect, useState } from 'react'
import { useNavigate } from '../../lib/router.jsx'
import { useAuth } from './AuthContext.jsx'
import authService from '../services/authService.js'
import { completeLogin } from '../../lib/sso/oidc.js'

// Mã `code` chỉ dùng được một lần: dùng chung một promise cho cả hai lần chạy effect của React StrictMode.
let inflight = null
const once = () => (inflight ||= completeLogin().finally(() => setTimeout(() => { inflight = null }, 2000)))

/**
 * Trang đích sau khi đăng nhập SSO (/dang-nhap/sso/callback): đổi code lấy token, lưu phiên, chuyển tới trang cần vào.
 * requireCms: dùng ở CMS admin — chỉ chấp nhận tài khoản có quyền CMS.
 */
export default function SsoCallback({ defaultTo = '/', requireCms = false }) {
  const navigate = useNavigate()
  const { refreshSession, logout } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    once()
      .then(async ({ session, returnTo }) => {
        if (requireCms && !/^cms-/.test(session.user.role)) {
          authService.setSsoSession(session)
          setError('Tài khoản SSO này chưa được cấp quyền truy cập CMS. Vui lòng liên hệ quản trị hệ thống.')
          return
        }
        authService.setSsoSession(session)
        await refreshSession()
        if (alive) navigate(returnTo && returnTo !== '/' ? returnTo : session.user.portal || defaultTo, { replace: true })
      })
      .catch((e) => alive && setError(e.message || 'Đăng nhập SSO không thành công.'))
    return () => { alive = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!error) return <div className="auth-form"><h1>Đang đăng nhập…</h1><p className="auth-form__sub">Đang xác thực với hệ thống SSO HUMG.</p></div>
  return (
    <div className="auth-form">
      <h1>Đăng nhập không thành công</h1>
      <p className="auth-note" role="alert">{error}</p>
      <button type="button" className="humg-btn humg-btn--primary humg-btn--block" onClick={() => (requireCms ? logout() : navigate('/dang-nhap', { replace: true }))}>
        {requireCms ? 'Đăng xuất SSO' : 'Quay lại đăng nhập'}
      </button>
    </div>
  )
}
