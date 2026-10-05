'use client'
import PortalShell from '@/shared/portal/PortalShell'

export default function Layout({ children }) {
  return <PortalShell portal="lanh-dao" roles={["leader"]} modules={["portal-leader"]}>{children}</PortalShell>
}
