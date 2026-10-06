// Kiểm thử luồng OIDC (Authorization Code + PKCE) với nhà cung cấp GIẢ LẬP — không cần tài khoản M365.
//   node sso-test.mjs                                                   (Entra trực tiếp)
//   NEXT_PUBLIC_SSO_PROVIDER=keycloak node sso-test.mjs                 (Keycloak)
//   NEXT_PUBLIC_SSO_PROVIDER=ids NEXT_PUBLIC_SSO_ISSUER=https://id.humg.test node sso-test.mjs   (Identity Server, discovery)
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const origin = 'http://localhost:3002'
const PROVIDER = ['keycloak', 'ids'].includes(process.env.NEXT_PUBLIC_SSO_PROVIDER) ? process.env.NEXT_PUBLIC_SSO_PROVIDER : 'entra'
const ISSUER = process.env.NEXT_PUBLIC_SSO_ISSUER || 'https://id.humg.test'
const EXPECT = PROVIDER === 'keycloak'
  ? { auth: 'https://sso-demo.humg.edu.vn/realms/humg-euni/protocol/openid-connect/auth', clientId: 'humg-euni-web', logout: /openid-connect\/logout$/, hint: ['kc_idp_hint', 'entra-public'] }
  : PROVIDER === 'ids'
    ? { auth: `${ISSUER}/connect/authorize-from-discovery`, clientId: 'humg-euni-web', logout: /connect\/endsession$/, hint: ['acr_values', 'idp:Microsoft'] }
    : { auth: 'https://login.microsoftonline.com/c852d62b-3032-4cdc-96ab-30e4368fabd7/oauth2/v2.0/authorize', clientId: '5a7cce06-4b5c-4612-b1fa-0ef7f0702a27', logout: /oauth2\/v2\.0\/logout$/, hint: null }
console.log('Provider:', PROVIDER)
const store = new Map()
let navigated = null
globalThis.window = {
  location: { origin, href: '', assign: (u) => { navigated = u } },
  sessionStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
}

const jwt = (claims) => `h.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.s`
let tokenCalls = []
globalThis.fetch = async (url, init) => {
  // discovery của Identity Server (chế độ ids)
  if (String(url).endsWith('/.well-known/openid-configuration')) {
    return new Response(JSON.stringify({ issuer: ISSUER, authorization_endpoint: EXPECT.auth, token_endpoint: `${ISSUER}/connect/token`, end_session_endpoint: `${ISSUER}/connect/endsession` }), { status: 200 })
  }
  const body = Object.fromEntries(new URLSearchParams(init.body))
  tokenCalls.push({ url: String(url), body })
  if (body.grant_type === 'authorization_code') {
    // Keycloak giả: kiểm tra PKCE đúng với code_challenge đã gửi
    const challenge = createHash('sha256').update(body.code_verifier).digest('base64url')
    if (challenge !== globalThis.__challenge) return new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'PKCE verification failed' }), { status: 400 })
    const claims = { sub: 'u-1', preferred_username: 'nguyenvana@humg.edu.vn', email: 'nguyenvana@humg.edu.vn', name: 'Nguyễn Văn A', nonce: globalThis.__nonce, realm_access: { roles: ['offline_access', 'giang-vien'] } }
    return new Response(JSON.stringify({ access_token: jwt(claims), id_token: jwt(claims), refresh_token: 'r1', expires_in: 300 }), { status: 200 })
  }
  return new Response(JSON.stringify({ access_token: jwt({ sub: 'u-1', preferred_username: 'x', realm_access: { roles: ['student'] } }), refresh_token: 'r2', expires_in: 300 }), { status: 200 })
}

const base = pathToFileURL(resolve('../../euni-public/src/lib/sso/')).href + '/'
const { startLogin, completeLogin, refreshSession, logoutUrl, mapSsoUser } = await import(base + 'oidc.js')
let failed = 0
const step = async (name, fn) => { try { await fn(); console.log('✔', name) } catch (e) { failed++; console.log('✘', name, '\n   ', e.message) } }

let state
await step('startLogin "tài khoản trường": không gợi ý IdP (IdS hiện form của nó)', async () => {
  await startLogin({ returnTo: '/', method: 'school' })
  const u = new URL(navigated)
  assert.equal(u.origin + u.pathname, EXPECT.auth)
  assert.equal(u.searchParams.get('kc_idp_hint'), null)
  assert.equal(u.searchParams.get('acr_values'), null)
})

await step('startLogin "Microsoft 365": PKCE S256, state, nonce, gợi ý IdP (kc_idp_hint=entra-public với Keycloak)', async () => {
  await startLogin({ returnTo: '/euni/sinh-vien/lich-hoc', method: 'm365' })
  const u = new URL(navigated)
  assert.equal(u.origin + u.pathname, EXPECT.auth)
  assert.equal(u.searchParams.get('client_id'), EXPECT.clientId)
  assert.equal(u.searchParams.get('response_type'), 'code')
  assert.equal(u.searchParams.get('code_challenge_method'), 'S256')
  if (EXPECT.hint) assert.equal(u.searchParams.get(EXPECT.hint[0]), EXPECT.hint[1])
  else assert.equal(u.searchParams.get('kc_idp_hint') ?? u.searchParams.get('acr_values'), null)
  assert.equal(u.searchParams.get('redirect_uri'), `${origin}/dang-nhap/sso/callback`)
  assert.match(u.searchParams.get('scope'), /openid/)
  state = u.searchParams.get('state')
  globalThis.__challenge = u.searchParams.get('code_challenge')
  globalThis.__nonce = u.searchParams.get('nonce')
})

await step('completeLogin: đổi code → phiên SSO, vai trò lecturer, returnTo giữ nguyên', async () => {
  const { session, returnTo } = await completeLogin(`${origin}/dang-nhap/sso/callback?code=abc&state=${state}`)
  assert.equal(returnTo, '/euni/sinh-vien/lich-hoc')
  assert.equal(session.sso, true)
  assert.equal(session.user.role, 'lecturer')
  assert.equal(session.user.portal, '/euni/giang-vien')
  assert.equal(session.user.name, 'Nguyễn Văn A')
  assert.equal(session.refreshToken, 'r1')
  assert.equal(tokenCalls.at(-1).body.client_id, EXPECT.clientId)
  if (PROVIDER === 'entra') assert.match(tokenCalls.at(-1).body.scope, /offline_access/)
  assert.ok(session.expiresAt > Date.now())
  globalThis.__session = session
})

await step('refreshSession: dùng refresh_token, giữ idToken cũ; vai trò theo claim mới (Keycloak) hoặc giữ người dùng cũ khi token mới không có claim (Entra)', async () => {
  const next = await refreshSession(globalThis.__session)
  assert.equal(tokenCalls.at(-1).body.grant_type, 'refresh_token')
  assert.equal(next.refreshToken, 'r2')
  assert.equal(next.idToken, globalThis.__session.idToken)
  // access token làm mới mang realm_access=student: IdS/Keycloak đọc claim của access token; Entra chỉ tin id_token → giữ nguyên người dùng
  assert.equal(next.user.role, PROVIDER === 'entra' ? 'lecturer' : 'student')
})

await step('completeLogin: sai state bị từ chối', async () => {
  await startLogin(); globalThis.__challenge = new URL(navigated).searchParams.get('code_challenge')
  await assert.rejects(() => completeLogin(`${origin}/dang-nhap/sso/callback?code=abc&state=SAI`), /state/)
})

await step('completeLogin: lỗi từ Keycloak (vd. access_denied) được báo ra', async () => {
  await assert.rejects(() => completeLogin(`${origin}/dang-nhap/sso/callback?error=access_denied&error_description=Tu+choi`), /Tu choi/)
})

await step('completeLogin: không có phiên đăng nhập đang chờ → báo lỗi', async () => {
  await assert.rejects(() => completeLogin(`${origin}/dang-nhap/sso/callback?code=abc&state=x`), /không hợp lệ|hết hạn/)
})

await step('completeLogin: PKCE sai (verifier không khớp) bị Keycloak từ chối', async () => {
  await startLogin(); globalThis.__challenge = 'khac'; const st = new URL(navigated).searchParams.get('state')
  await assert.rejects(() => completeLogin(`${origin}/dang-nhap/sso/callback?code=abc&state=${st}`), /PKCE/)
})

await step('logoutUrl: end_session kèm id_token_hint và post_logout_redirect_uri', async () => {
  const u = new URL(logoutUrl({ idToken: 'abc' }))
  assert.match(u.pathname, EXPECT.logout)
  if (PROVIDER !== 'entra') assert.equal(u.searchParams.get('id_token_hint'), 'abc')
  assert.equal(u.searchParams.get('post_logout_redirect_uri'), `${origin}/`)
})

await step('mapSsoUser: ánh xạ vai trò CMS / realm role (manager, lecturer, staff, parent) / mặc định', async () => {
  const role = (roles) => mapSsoUser({ sub: 's', realm_access: { roles } }).role
  assert.equal(role(['cms-admin']), 'cms-admin')
  assert.equal(role(['cms.editor']), 'cms-editor')
  assert.equal(role(['cms.viewer']), 'cms-editor')
  assert.equal(role(['lanh-dao']), 'manager')
  assert.equal(role(['manager', 'lecturer']), 'manager')
  assert.equal(role(['staff']), 'staff')
  assert.equal(role(['lecturer']), 'lecturer')
  assert.equal(role(['qlns.hr-officer']), 'student') // client role của app khác không quyết định cổng
  assert.equal(role(['phu-huynh']), 'parent')
  assert.equal(mapSsoUser({ sub: 's', roles: ['CMS-Admin'] }).role, 'cms-admin') // app role của Entra
  assert.equal(role([]), 'student')
  assert.deepEqual(mapSsoUser({ sub: 's', realm_access: { roles: ['cms-admin'] } }).permissions, ['cms.access', 'cms.*'])
  // claim chuẩn của Identity Server: role (chuỗi hoặc mảng), tenant, unit, staff_code
  const ids = mapSsoUser({ sub: 's', role: ['cms.editor', 'staff'], tenant: ['humg', 'cntt'], unit: 'BM-KHMT', staff_code: 'GV0123' })
  assert.equal(ids.role, 'cms-editor'); assert.equal(ids.tenants, undefined); // tenant: tầng 3, CMS tự phân
   assert.deepEqual(ids.units, ['BM-KHMT']); assert.equal(ids.staffCode, 'GV0123')
  assert.equal(mapSsoUser({ sub: 's', role: 'cms.admin' }).role, 'cms-admin')
  assert.equal(mapSsoUser({ sub: 's', role: 'cms.reviewer' }).role, 'cms-editor')
})

console.log(failed ? `\nCÓ ${failed} LỖI` : `\nSSO (OIDC + PKCE, ${PROVIDER} giả lập): tất cả đạt`)
process.exitCode = failed ? 1 : 0
