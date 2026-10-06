/**
 * Thông báo một lần cho trang đăng nhập sau khi rời phiên: 'logged_out' (bấm Đăng xuất) | 'expired' (phiên hết hạn, API trả 401).
 * Lưu sessionStorage để còn sau khi đi vòng qua trang đăng xuất của SSO.
 */
const KEY = 'humg-auth-notice'
export const authNotice = {
  set(kind) { try { window.sessionStorage.setItem(KEY, kind) } catch { /* private mode */ } },
  /** Đọc rồi xóa */
  take() { try { const v = window.sessionStorage.getItem(KEY); window.sessionStorage.removeItem(KEY); return v } catch { return null } },
}
export const AUTH_NOTICE_TEXT = {
  logged_out: 'Bạn đã đăng xuất. Đăng nhập lại để tiếp tục.',
  expired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
}
/** Sự kiện client.js phát ra khi API trả 401 cho một request có gửi token */
export const AUTH_EXPIRED_EVENT = 'humg:auth-expired'
export default authNotice
