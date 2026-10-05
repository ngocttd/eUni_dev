// Kiểm thử luồng OIDC (Authorization Code + PKCE) với Keycloak GIẢ LẬP — không cần tài khoản M365.
//   node sso-test.mjs
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const origin = 'http://localhost:3002'
const PROVIDER = process.env.NEXT_PUBLIC_SSO_PROVIDER === 'keycloak' ? 'keycloak' : 'entra'
const EXPECT = PROVIDER === 'keycloak'
  ? { auth: 'https://sso-demo.humg.edu.vn/realms/humg-euni/protocol/openid-connect/auth', clientId: 'humg-euni-web', logout: /openid-connect\/logout$/ }
  : { auth: 'https://login.microsoftonline.com/c852d62b-3032-4cdc-96ab-30e4368fabd7/oauth2/v2.0/authorize', clientId: '5a7cce06-4b5c-4612-b1fa-0ef7f0702a27', logout: /oauth2\/v2\.0\/logout$/ }
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
await step('startLogin: chuyển tới Keycloak với PKCE S256, state, nonce, kc_idp_hint=entra-public', async () => {
  await startLogin({ returnTo: '/euni/sinh-vien/lich-hoc' })
  const u = new URL(navigated)
  assert.equal(u.origin + u.pathname, EXPECT.auth)
  assert.equal(u.searchParams.get('client_id'), EXPECT.clientId)
  assert.equal(u.searchParams.get('response_type'), 'code')
  assert.equal(u.searchParams.get('code_challenge_method'), 'S256')
  assert.equal(u.searchParams.get('kc_idp_hint'), PROVIDER === 'keycloak' ? 'entra-public' : null)
  assert.equal(u.searchParams.get('redirect_uri'), `${origin}/dang-nhap/sso/callback`)
  assert.match(u.searchParams.get('scope'), /openid/)
  state = u.searchParams.get('state')
  globalThis.__challenge = u.searchParams.get('code_challenge')
  globalThis.__nonce = u.searchParams.get('nonce')
})

await step('completeLogin: đổi code → phiên SSO, vai trò staff, returnTo giữ nguyên', async () => {
  const { session, returnTo } = await completeLogin(`${origin}/dang-nhap/sso/callback?code=abc&state=${state}`)
  assert.equal(returnTo, '/euni/sinh-vien/lich-hoc')
  assert.equal(session.sso, true)
  assert.equal(session.user.role, 'staff')
  assert.equal(session.user.portal, '/euni/giang-vien')
  assert.equal(session.user.name, 'Nguyễn Văn A')
  assert.equal(session.refreshToken, 'r1')
  assert.equal(tokenCalls.at(-1).body.client_id, EXPECT.clientId)
  if (PROVIDER === 'entra') assert.match(tokenCalls.at(-1).body.scope, /offline_access/)
  assert.ok(session.expiresAt > Date.now())
  globalThis.__session = session
})

await step('refreshSession: dùng refresh_token, giữ idToken cũ', async () => {
  const next = await refreshSession(globalThis.__session)
  assert.equal(tokenCalls.at(-1).body.grant_type, 'refresh_token')
  assert.equal(next.refreshToken, 'r2')
  assert.equal(next.idToken, globalThis.__session.idToken)
  assert.equal(next.user.role, 'student')
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
  if (PROVIDER === 'keycloak') assert.equal(u.searchParams.get('id_token_hint'), 'abc')
  assert.equal(u.searchParams.get('post_logout_redirect_uri'), `${origin}/`)
})

await step('mapSsoUser: ánh xạ vai trò CMS / leader / parent / mặc định', async () => {
  const role = (roles) => mapSsoUser({ sub: 's', realm_access: { roles } }).role
  assert.equal(role(['cms-admin']), 'cms-admin')
  assert.equal(role(['editor']), 'cms-editor')
  assert.equal(role(['lanh-dao']), 'leader')
  assert.equal(role(['phu-huynh']), 'parent')
  assert.equal(mapSsoUser({ sub: 's', roles: ['CMS-Admin'] }).role, 'cms-admin') // app role của Entra
  assert.equal(role([]), 'student')
  assert.deepEqual(mapSsoUser({ sub: 's', realm_access: { roles: ['cms-admin'] } }).permissions, ['cms.access', 'cms.*'])
})

console.log(failed ? `\nCÓ ${failed} LỖI` : '\nSSO (OIDC + PKCE, Keycloak giả lập): tất cả đạt')
process.exitCode = failed ? 1 : 0
