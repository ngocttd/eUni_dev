import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { ClubListPage } from '@/modules/public/life/pages/ClubListPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["life"])
  return <DatasetProvider datasets={datasets}><ClubListPage /></DatasetProvider>
}
