/**
 * Đăng nhập OIDC — Authorization Code + PKCE (client công khai, không có secret ở trình duyệt).
 * Nhà cung cấp: Identity Server HUMG (mặc định khi có NEXT_PUBLIC_SSO_ISSUER), Keycloak, hoặc Entra ID trực tiếp (xem config.js).
 *
 *   startLogin({ method })  → chuyển hướng tới IdS. method: 'school' (tài khoản trường) | 'm365' (gợi ý đi thẳng Microsoft 365)
 *   completeLogin(url)      → /dang-nhap/sso/callback: đổi code lấy token, dựng phiên đăng nhập
 *   refreshSession(s)       → làm mới token bằng refresh_token
 *   logoutUrl(s)            → URL đăng xuất tập trung
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

/* Endpoint: IdS lấy qua discovery (cache trong phiên), nhà cung cấp khác dùng bảng tĩnh */
let discovered = null
async function endpoints() {
  if (sso.provider !== 'ids') return ssoEndpoints
  if (discovered) return discovered
  try {
    const res = await fetch(`${sso.issuer}/.well-known/openid-configuration`)
    const d = await res.json()
    discovered = { ...ssoEndpoints, auth: d.authorization_endpoint, token: d.token_endpoint, logout: d.end_session_endpoint || ssoEndpoints.logout }
  } catch {
    discovered = ssoEndpoints
  }
  return discovered
}

const asList = (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v])

/**
 * Vai trò chính để FE điều hướng, suy từ role trên SSO (docs/design/CMS_DESIGN.md §5.1):
 *  - Tầng 1, realm role: student · lecturer · staff · manager · parent · applicant · alumni (Keycloak: realm_access.roles)
 *  - Tầng 2, client role có tiền tố: cms.viewer · cms.author · cms.reviewer · cms.editor · cms.admin, euni.*, edusoft.* …
 *    (Keycloak: resource_access.{client}.roles)
 *  - Tầng 3 (phạm vi theo trang/đơn vị/chuyên mục) KHÔNG nằm trong token — app tự phân (CMS: grants).
 * Vẫn nhận claim `role`/`roles` của IdS và groups / app roles (Entra). Role không có tiền tố client được so khớp đúng tên.
 */
const ROLE_RULES = [
  ['cms-admin', /^cms[-_.]admin$|^super[-_]?admin$/],
  ['cms-editor', /^cms[-_.](editor|reviewer|author|viewer)$/],
  ['manager', /^(manager|lanh[-_]?dao)$/],
  ['lecturer', /^(lecturer|giang[-_]?vien)$/],
  ['staff', /^(staff|can[-_]?bo)$/],
  ['student', /^(student|sinh[-_]?vien)$/],
  ['parent', /^(parent|phu[-_]?huynh)$/],
  ['applicant', /^(applicant|thi[-_]?sinh)$/],
  ['alumni', /^(alumni|cuu[-_]?sinh[-_]?vien)$/],
]
/** Cán bộ (staff) dùng chung cổng với giảng viên; thí sinh, cựu người học chưa có cổng riêng → trang chủ */
const PORTAL = { student: '/euni/sinh-vien', lecturer: '/euni/giang-vien', staff: '/euni/giang-vien', manager: '/euni/lanh-dao', parent: '/euni/phu-huynh', 'cms-admin': '/cms', 'cms-editor': '/cms' }

export function mapSsoUser(claims) {
  const roles = [
    ...asList(claims.role),
    ...asList(claims.roles),
    ...(claims.realm_access?.roles || []),
    ...Object.values(claims.resource_access || {}).flatMap((r) => r.roles || []),
    ...asList(claims.groups),
  ].map((r) => String(r).toLowerCase())
  const hit = ROLE_RULES.find(([, re]) => roles.some((r) => re.test(r)))
  const role = hit ? hit[0] : (process.env.NEXT_PUBLIC_SSO_DEFAULT_ROLE || 'student')
  const permissions = role === 'cms-admin' ? ['cms.access', 'cms.*'] : role === 'cms-editor' ? ['cms.access'] : [`portal.${role}.view`]
  return {
    id: claims.sub,
    sub: claims.sub,
    username: claims.preferred_username || claims.email || claims.sub,
    name: claims.name || [claims.given_name, claims.family_name].filter(Boolean).join(' ') || claims.preferred_username || 'Người dùng HUMG',
    email: claims.email || null,
    role,
    roles,
    permissions,
    // trang (tenant) được quản trị không lấy từ token — CMS trả về qua /api/v1/me/context (tầng 3)
    units: asList(claims.unit ?? claims.units),
    staffCode: claims.staff_code || null,
    studentCode: claims.student_code || null,
    portal: PORTAL[role] || '/',
    sso: true,
  }
}

export async function startLogin({ returnTo = '/', method = 'school' } = {}) {
  const ep = await endpoints()
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
  // Microsoft 365: gợi ý IdS chuyển thẳng sang Entra ID; tài khoản trường: để IdS hiện form của nó
  if (method === 'm365' && sso.provider !== 'entra' && sso.m365Param && sso.m365Value) params.set(sso.m365Param, sso.m365Value)
  if (sso.provider === 'entra') params.set('response_mode', 'query')
  window.location.assign(`${ep.auth}?${params}`)
}

async function tokenRequest(body) {
  const ep = await endpoints()
  const res = await fetch(ep.token, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: sso.clientId, ...(sso.provider === 'entra' ? { scope: sso.scope } : {}), ...body }) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error_description || data.error || `SSO lỗi HTTP ${res.status}`)
  return data
}

/* Claim nằm ở access token (IdS/Keycloak có thể đặt role, tenant, unit ở đó) và id token */
const claimsOf = (t) => ({ ...(sso.provider !== 'entra' && t.access_token && String(t.access_token).split('.').length === 3 ? decodeJwt(t.access_token) : {}), ...(t.id_token ? decodeJwt(t.id_token) : {}) })

const toSession = (t, claims, prev) => ({
  sso: true,
  // Entra không có API scope → access_token là token Graph (backend không kiểm tra được) nên dùng id_token làm Bearer
  accessToken: sso.provider === 'entra' && !sso.apiScope ? (t.id_token || prev?.idToken) : t.access_token,
  refreshToken: t.refresh_token || prev?.refreshToken || null,
  idToken: t.id_token || prev?.idToken || null,
  expiresAt: Date.now() + (Number(t.expires_in) || 300) * 1000,
  user: claims.sub ? mapSsoUser(claims) : prev?.user,
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
  const claims = claimsOf(t)
  if (claims.nonce && claims.nonce !== tx.nonce) throw new Error('Sai nonce — token không khớp yêu cầu đăng nhập.')
  return { session: toSession(t, claims), returnTo: tx.returnTo }
}

export async function refreshSession(session) {
  if (!session?.refreshToken) throw new Error('Không có refresh token')
  const t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: session.refreshToken })
  return toSession(t, claimsOf(t), session)
}

export function logoutUrl(session) {
  const ep = discovered || ssoEndpoints
  const p = new URLSearchParams({ post_logout_redirect_uri: `${window.location.origin}/` })
  if (sso.provider === 'entra') {
    if (session?.user?.username) p.set('logout_hint', session.user.username)
  } else {
    p.set('client_id', sso.clientId)
    if (session?.idToken) p.set('id_token_hint', session.idToken)
  }
  return `${ep.logout}?${p}`
}
