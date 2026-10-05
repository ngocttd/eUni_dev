/**
 * Hai ứng dụng Next.js độc lập (mỗi repo một app):
 *   public → website công khai + My eUni Portal (/euni/*) + đăng nhập   (euni-public, mặc định :3002)
 *   admin  → CMS quản trị (/cms/*)                                      (euni-admin,  mặc định :3001)
 *
 * Giao diện vẫn viết link kiểu `/tin-tuc`, `/euni/sinh-vien`, `/cms`… Lớp router (lib/router.jsx) dùng
 * `externalUrl()` để biến link thuộc app khác thành URL tuyệt đối sang đúng app đó.
 */
import { SELF } from './self.js'

const trim = (s) => String(s || '').replace(/\/+$/, '')

export const APP_URLS = Object.freeze({
  public: trim(process.env.NEXT_PUBLIC_PUBLIC_URL || 'http://localhost:3002'),
  admin: trim(process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'),
})

/** app sở hữu một đường dẫn nội bộ (đăng nhập của CMS nằm trong admin, các trang đăng nhập khác thuộc public) */
export function ownerOf(path) {
  if (/^\/cms(\/|\?|#|$)/.test(path)) return 'admin'
  if (SELF === 'admin' && /^\/dang-nhap(\/|\?|#|$)/.test(path)) return 'admin'
  return 'public'
}

/** URL tuyệt đối nếu `path` thuộc app khác, ngược lại null (điều hướng nội bộ). */
export function externalUrl(path) {
  if (typeof path !== 'string' || !path.startsWith('/')) return null
  const owner = ownerOf(path)
  return owner === SELF ? null : `${APP_URLS[owner]}${path}`
}
