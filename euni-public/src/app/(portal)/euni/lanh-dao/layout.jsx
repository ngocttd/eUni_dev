'use client'
import PortalShell from '@/shared/portal/PortalShell'

export default function Layout({ children }) {
  return <PortalShell portal="lanh-dao" roles={["manager"]} modules={["portal-leader"]}>{children}</PortalShell>
}
