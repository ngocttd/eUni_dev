'use client'
import PortalShell from '@/shared/portal/PortalShell'

export default function Layout({ children }) {
  return <PortalShell portal="phu-huynh" roles={["parent"]} modules={["portal-parent"]}>{children}</PortalShell>
}
