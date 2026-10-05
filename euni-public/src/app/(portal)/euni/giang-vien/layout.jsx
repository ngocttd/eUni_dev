'use client'
import PortalShell from '@/shared/portal/PortalShell'

export default function Layout({ children }) {
  return <PortalShell portal="giang-vien" roles={["staff","lecturer"]} modules={["portal-staff","portal-staff-tools"]}>{children}</PortalShell>
}
