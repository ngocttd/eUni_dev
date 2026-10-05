import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { StaffDirectoryPage } from '@/modules/public/staff-hub/pages/StaffDirectoryPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["staff-hub"])
  return <DatasetProvider datasets={datasets}><StaffDirectoryPage /></DatasetProvider>
}
