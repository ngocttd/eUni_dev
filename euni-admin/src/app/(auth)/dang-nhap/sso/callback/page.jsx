import SsoCallback from '../../../../../shared/auth/SsoCallback.jsx'

export const metadata = { title: 'Đăng nhập SSO' }

export default function Page() {
  return <SsoCallback defaultTo="/cms" requireCms />
}
