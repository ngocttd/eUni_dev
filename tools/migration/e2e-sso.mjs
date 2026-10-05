// Kiểm tra giao diện SSO trên trình duyệt thật: nút M365 chuyển tới Keycloak; callback báo lỗi đúng.
import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
const b = await chromium.launch({ channel: 'msedge', headless: true })
let failed = 0
const step = async (name, fn) => { try { await fn(); console.log('✔', name) } catch (e) { failed++; console.log('✘', name, '\n   ', e.message.split('\n')[0]) } }
for (const [label, base, path] of [['public', 'http://localhost:3002', '/dang-nhap'], ['admin', 'http://localhost:3001', '/dang-nhap']]) {
  await step(`${label}: nút "Đăng nhập với Microsoft 365" chuyển tới Microsoft Entra ID (PKCE, client ID của HUMG)`, async () => {
    const p = await b.newPage()
    const reqs = []
    p.on('request', (r) => { if (r.isNavigationRequest()) reqs.push(r.url()) })
    await p.goto(base + path, { waitUntil: 'networkidle' })
    await p.getByRole('button', { name: /Microsoft 365/ }).click()
    await p.waitForURL(/login\.microsoftonline\.com|sso-demo\.humg\.edu\.vn/, { timeout: 20000 })
    const u = new URL(reqs.find((x) => /\/authorize|\/openid-connect\/auth/.test(x)))
    assert.equal(u.searchParams.get('client_id'), '5a7cce06-4b5c-4612-b1fa-0ef7f0702a27')
    assert.match(u.pathname, /c852d62b-3032-4cdc-96ab-30e4368fabd7/)
    assert.equal(u.searchParams.get('redirect_uri'), `${base}/dang-nhap/sso/callback`)
    assert.equal(u.searchParams.get('code_challenge_method'), 'S256')
    assert.equal(u.searchParams.get('kc_idp_hint'), null)
    await p.waitForTimeout(2500)
    console.log('   → Microsoft trả về:', (await p.title()) || '(không tiêu đề)', '|', (await p.evaluate(() => document.body.innerText)).slice(0, 80).replace(/\n/g, ' '))
    await p.close()
  })
  await step(`${label}: callback có lỗi → hiện thông báo + nút quay lại`, async () => {
    const p = await b.newPage()
    await p.goto(`${base}/dang-nhap/sso/callback?error=access_denied&error_description=Nguoi+dung+tu+choi`, { waitUntil: 'networkidle' })
    await p.waitForSelector('.auth-form [role=alert]')
    assert.match(await p.locator('.auth-form [role=alert]').innerText(), /Nguoi dung tu choi/)
    await p.close()
  })
}
await b.close()
console.log(failed ? `\nCÓ ${failed} LỖI` : '\nGiao diện SSO: OK')
process.exitCode = failed ? 1 : 0
