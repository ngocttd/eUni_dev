/**
 * Cấu hình đăng nhập SSO Microsoft 365. Hai chế độ (NEXT_PUBLIC_SSO_PROVIDER):
 *
 *  - "entra"    (mặc định) — đăng nhập TRỰC TIẾP với Microsoft Entra ID (tenant HUMG) bằng OIDC + PKCE,
 *                app đăng ký trên Azure với Application (client) ID bên dưới, loại nền tảng "Single-page application",
 *                Redirect URI: {origin}/dang-nhap/sso/callback (đăng ký cho cả website và CMS admin).
 *  - "keycloak" — đăng nhập qua Keycloak HUMG (realm humg-euni) liên kết Microsoft 365 (IdP "entra-public"),
 *                cần client OIDC public/PKCE đăng ký trong realm.
 */
const trim = (s) => String(s || '').replace(/\/+$/, '')
const provider = process.env.NEXT_PUBLIC_SSO_PROVIDER === 'keycloak' ? 'keycloak' : 'entra'

const ENTRA_TENANT = process.env.NEXT_PUBLIC_SSO_TENANT_ID || 'c852d62b-3032-4cdc-96ab-30e4368fabd7'
const KEYCLOAK_ISSUER = trim(process.env.NEXT_PUBLIC_SSO_ISSUER || 'https://sso-demo.humg.edu.vn/realms/humg-euni')

export const sso = Object.freeze({
  enabled: process.env.NEXT_PUBLIC_SSO_ENABLED !== 'false',
  provider,
  clientId: process.env.NEXT_PUBLIC_SSO_CLIENT_ID || (provider === 'entra' ? '5a7cce06-4b5c-4612-b1fa-0ef7f0702a27' : 'humg-euni-web'),
  tenantId: ENTRA_TENANT,
  issuer: provider === 'entra' ? `https://login.microsoftonline.com/${ENTRA_TENANT}/v2.0` : KEYCLOAK_ISSUER,
  idpHint: process.env.NEXT_PUBLIC_SSO_IDP_HINT ?? 'entra-public', // chỉ Keycloak
  /** Scope API của backend (vd. api://<app-id>/access_as_user). Trống → dùng id_token làm Bearer. */
  apiScope: process.env.NEXT_PUBLIC_SSO_API_SCOPE || '',
  scope: ['openid', 'profile', 'email', ...(provider === 'entra' ? ['offline_access'] : []), process.env.NEXT_PUBLIC_SSO_API_SCOPE].filter(Boolean).join(' '),
})

export const ssoEndpoints = Object.freeze(provider === 'entra'
  ? {
      auth: `https://login.microsoftonline.com/${ENTRA_TENANT}/oauth2/v2.0/authorize`,
      token: `https://login.microsoftonline.com/${ENTRA_TENANT}/oauth2/v2.0/token`,
      logout: `https://login.microsoftonline.com/${ENTRA_TENANT}/oauth2/v2.0/logout`,
      /** Trang quản lý tài khoản Microsoft của người dùng */
      account: 'https://myaccount.microsoft.com/',
    }
  : {
      auth: `${KEYCLOAK_ISSUER}/protocol/openid-connect/auth`,
      token: `${KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
      logout: `${KEYCLOAK_ISSUER}/protocol/openid-connect/logout`,
      userinfo: `${KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`,
      account: `${KEYCLOAK_ISSUER}/account`,
    })
