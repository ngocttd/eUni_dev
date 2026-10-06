/**
 * Cấu hình đăng nhập (docs/design/CMS_DESIGN.md §3).
 *
 * NEXT_PUBLIC_AUTH_MODE
 *   - "oidc": mọi đăng nhập đi qua nhà cung cấp OIDC bên dưới; app KHÔNG nhận mật khẩu.
 *   - "mock" (mặc định khi dev): "Tài khoản trường" dùng form gọi auth-api của euni-api-mock (đóng vai IdS).
 *
 * NEXT_PUBLIC_SSO_PROVIDER
 *   - "ids"      — Identity Server của HUMG (khuyến nghị). Trang đăng nhập của IdS có cả tài khoản trường và Microsoft 365
 *                  (federation); hai cách cho cùng một `sub`. Endpoint lấy từ {issuer}/.well-known/openid-configuration.
 *                  Nút "Microsoft 365" gửi kèm gợi ý nhà cung cấp (mặc định Duende: acr_values=idp:<scheme>).
 *   - "keycloak" — Keycloak HUMG, gợi ý IdP bằng kc_idp_hint.
 *   - "entra"    — (cũ) đăng nhập thẳng Microsoft Entra ID; chỉ có lựa chọn Microsoft 365.
 * Redirect URI cần đăng ký: {origin}/dang-nhap/sso/callback · Post-logout: {origin}/dang-nhap
 */
const trim = (s) => String(s || '').replace(/\/+$/, '')
const env = (k, d = '') => process.env[k] ?? d

const ISSUER = trim(env('NEXT_PUBLIC_SSO_ISSUER'))
const provider = ['ids', 'keycloak', 'entra'].includes(env('NEXT_PUBLIC_SSO_PROVIDER')) ? env('NEXT_PUBLIC_SSO_PROVIDER') : ISSUER ? 'ids' : 'entra'
const ENTRA_TENANT = env('NEXT_PUBLIC_SSO_TENANT_ID', 'c852d62b-3032-4cdc-96ab-30e4368fabd7')
const KEYCLOAK_ISSUER = ISSUER || 'https://sso-demo.humg.edu.vn/realms/humg-euni'

export const authMode = env('NEXT_PUBLIC_AUTH_MODE') === 'oidc' ? 'oidc' : 'mock'

export const sso = Object.freeze({
  enabled: env('NEXT_PUBLIC_SSO_ENABLED') !== 'false',
  provider,
  clientId: env('NEXT_PUBLIC_SSO_CLIENT_ID') || (provider === 'entra' ? '5a7cce06-4b5c-4612-b1fa-0ef7f0702a27' : 'humg-euni-web'),
  tenantId: ENTRA_TENANT,
  issuer: provider === 'entra' ? `https://login.microsoftonline.com/${ENTRA_TENANT}/v2.0` : provider === 'keycloak' ? KEYCLOAK_ISSUER : ISSUER,
  /** Gợi ý chuyển thẳng sang Microsoft 365 khi bấm nút M365 (ids: tham số + giá trị; keycloak: alias IdP) */
  m365Param: env('NEXT_PUBLIC_SSO_M365_PARAM', provider === 'keycloak' ? 'kc_idp_hint' : 'acr_values'),
  m365Value: env('NEXT_PUBLIC_SSO_M365_VALUE', provider === 'keycloak' ? env('NEXT_PUBLIC_SSO_IDP_HINT', 'entra-public') : 'idp:Microsoft'),
  /** Scope API của backend (vd. cms-api). Trống → dùng id_token làm Bearer (chỉ nên dùng khi thử nghiệm). */
  apiScope: env('NEXT_PUBLIC_SSO_API_SCOPE'),
  scope: ['openid', 'profile', 'email', 'offline_access', ...(provider === 'ids' ? ['roles'] : []), env('NEXT_PUBLIC_SSO_API_SCOPE')].filter(Boolean).join(' '),
  /** Có lựa chọn "Tài khoản trường" qua OIDC không (Entra trực tiếp thì không) */
  schoolAccount: provider !== 'entra',
})

/** Endpoint tĩnh (entra/keycloak). Với "ids" endpoint lấy qua discovery — xem oidc.js `endpoints()`. */
export const ssoEndpoints = Object.freeze(provider === 'entra'
  ? {
      auth: `https://login.microsoftonline.com/${ENTRA_TENANT}/oauth2/v2.0/authorize`,
      token: `https://login.microsoftonline.com/${ENTRA_TENANT}/oauth2/v2.0/token`,
      logout: `https://login.microsoftonline.com/${ENTRA_TENANT}/oauth2/v2.0/logout`,
      account: 'https://myaccount.microsoft.com/',
    }
  : provider === 'keycloak'
    ? {
        auth: `${KEYCLOAK_ISSUER}/protocol/openid-connect/auth`,
        token: `${KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
        logout: `${KEYCLOAK_ISSUER}/protocol/openid-connect/logout`,
        account: `${KEYCLOAK_ISSUER}/account`,
      }
    : {
        // mặc định theo Duende IdentityServer / OpenIddict; ghi đè bằng discovery khi chạy
        auth: `${ISSUER}/connect/authorize`,
        token: `${ISSUER}/connect/token`,
        logout: `${ISSUER}/connect/endsession`,
        account: env('NEXT_PUBLIC_SSO_ACCOUNT_URL', ISSUER || '#'),
      })
