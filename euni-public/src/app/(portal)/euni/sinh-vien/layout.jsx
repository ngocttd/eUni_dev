'use client'
import PortalShell from '@/shared/portal/PortalShell'

export default function Layout({ children }) {
  return <PortalShell portal="sinh-vien" roles={["student"]} modules={["portal-student"]}>{children}</PortalShell>
}
