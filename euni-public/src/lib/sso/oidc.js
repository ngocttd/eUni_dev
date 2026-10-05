/**
 * Đăng nhập SSO Microsoft 365 — OpenID Connect Authorization Code + PKCE (client công khai, không có secret ở trình duyệt).
 * Hai chế độ (xem config.js): Microsoft Entra ID trực tiếp (mặc định) hoặc Keycloak HUMG liên kết Microsoft 365.
 *
 *   startLogin()        → chuyển hướng tới nhà cung cấp danh tính
 *   completeLogin(url)  → /dang-nhap/sso/callback: đổi code lấy token, dựng phiên đăng nhập
 *   refreshSession(s)   → làm mới token bằng refresh_token
 *   logoutUrl(s)        → URL đăng xuất tập trung
 *
 * Đăng ký Redirect URI (loại SPA với Entra; client public/PKCE với Keycloak): {origin}/dang-nhap/sso/callback
 * và Post-logout redirect URI: {origin}/
 */
import { sso, ssoEndpoints } from './config.js'

const TX_KEY = 'humg-sso-tx'

const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const random = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)))
const sha256 = async (s) => b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))
const decodeJwt = (jwt) => {
  const payload = String(jwt).split('.')[1] || ''
  const json = decodeURIComponent(escape(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))))
  return JSON.parse(json)
}

export const redirectUri = () => `${window.location.origin}/dang-nhap/sso/callback`

/** Vai trò FE từ claim của token (realm_access / resource_access / groups). Chỉnh ở đây nếu realm đặt tên role khác. */
const ROLE_RULES = [
  ['cms-admin', /cms[-_]?admin|super[-_]?admin/],
  ['cms-editor', /cms[-_]?(editor|author)|editor/],
  ['leader', /leader|lanh[-_]?dao|rector|hieu[-_]?truong/],
  ['staff', /staff|lecturer|giang[-_]?vien|can[-_]?bo|teacher|employee/],
  ['parent', /parent|phu[-_]?huynh/],
  ['student', /student|sinh[-_]?vien/],
]
const PORTAL = { student: '/euni/sinh-vien', staff: '/euni/giang-vien', parent: '/euni/phu-huynh', leader: '/euni/lanh-dao', 'cms-admin': '/cms', 'cms-editor': '/cms' }

export function mapSsoUser(claims) {
  const roles = [
    ...(claims.realm_access?.roles || []),
    ...Object.values(claims.resource_access || {}).flatMap((r) => r.roles || []),
    ...(claims.groups || []),
    ...(Array.isArray(claims.roles) ? claims.roles : []),
  ].map((r) => String(r).toLowerCase())
  const hit = ROLE_RULES.find(([, re]) => roles.some((r) => re.test(r)))
  const role = hit ? hit[0] : (process.env.NEXT_PUBLIC_SSO_DEFAULT_ROLE || 'student')
  const permissions = role === 'cms-admin' ? ['cms.access', 'cms.*'] : role === 'cms-editor' ? ['cms.access'] : [`portal.${role}.view`]
  return {
    id: claims.sub,
    username: claims.preferred_username || claims.email || claims.sub,
    name: claims.name || [claims.given_name, claims.family_name].filter(Boolean).join(' ') || claims.preferred_username || 'Người dùng HUMG',
    email: claims.email || null,
    role,
    roles,
    permissions,
    portal: PORTAL[role] || '/',
    sso: true,
  }
}

export async function startLogin({ returnTo = '/' } = {}) {
  const verifier = random(48)
  const tx = { state: random(16), nonce: random(16), verifier, returnTo }
  window.sessionStorage.setItem(TX_KEY, JSON.stringify(tx))
  const params = new URLSearchParams({
    client_id: sso.clientId,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: sso.scope,
    state: tx.state,
    nonce: tx.nonce,
    code_challenge: await sha256(verifier),
    code_challenge_method: 'S256',
  })
  if (sso.provider === 'keycloak' && sso.idpHint) params.set('kc_idp_hint', sso.idpHint) // vào thẳng Microsoft 365
  if (sso.provider === 'entra') params.set('response_mode', 'query')
  window.location.assign(`${ssoEndpoints.auth}?${params}`)
}

async function tokenRequest(body) {
  const res = await fetch(ssoEndpoints.token, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: sso.clientId, ...(sso.provider === 'entra' ? { scope: sso.scope } : {}), ...body }) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error_description || data.error || `SSO lỗi HTTP ${res.status}`)
  return data
}

const toSession = (t, claims, prev) => ({
  sso: true,
  // Entra không có API scope → access_token là token Graph (backend không kiểm tra được) nên dùng id_token làm Bearer
  accessToken: sso.provider === 'entra' && !sso.apiScope ? (t.id_token || prev?.idToken) : t.access_token,
  refreshToken: t.refresh_token || prev?.refreshToken || null,
  idToken: t.id_token || prev?.idToken || null,
  expiresAt: Date.now() + (Number(t.expires_in) || 300) * 1000,
  user: mapSsoUser(claims),
})

/** Xử lý trang callback: trả { session, returnTo } hoặc ném lỗi. */
export async function completeLogin(href = window.location.href) {
  const url = new URL(href)
  const err = url.searchParams.get('error')
  if (err) throw new Error(url.searchParams.get('error_description') || err)
  const code = url.searchParams.get('code')
  const tx = JSON.parse(window.sessionStorage.getItem(TX_KEY) || 'null')
  window.sessionStorage.removeItem(TX_KEY)
  if (!code || !tx) throw new Error('Phiên đăng nhập SSO không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.')
  if (url.searchParams.get('state') !== tx.state) throw new Error('Sai tham số state — có thể bị giả mạo yêu cầu đăng nhập.')
  const t = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(), code_verifier: tx.verifier })
  const claims = decodeJwt(t.id_token || t.access_token)
  if (claims.nonce && claims.nonce !== tx.nonce) throw new Error('Sai nonce — token không khớp yêu cầu đăng nhập.')
  return { session: toSession(t, { ...(sso.provider === 'keycloak' ? decodeJwt(t.access_token) : {}), ...claims }), returnTo: tx.returnTo }
}

export async function refreshSession(session) {
  if (!session?.refreshToken) throw new Error('Không có refresh token')
  const t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: session.refreshToken })
  return toSession(t, { ...(sso.provider === 'keycloak' ? decodeJwt(t.access_token) : {}), ...(t.id_token ? decodeJwt(t.id_token) : {}) }, session)
}

export function logoutUrl(session) {
  const p = new URLSearchParams({ post_logout_redirect_uri: `${window.location.origin}/` })
  if (sso.provider === 'keycloak') {
    p.set('client_id', sso.clientId)
    if (session?.idToken) p.set('id_token_hint', session.idToken)
  } else if (session?.user?.username) {
    p.set('logout_hint', session.user.username)
  }
  return `${ssoEndpoints.logout}?${p}`
}
