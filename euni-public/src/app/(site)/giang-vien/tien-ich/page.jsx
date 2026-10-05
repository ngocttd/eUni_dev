import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { StfUtilitiesPage } from '@/modules/public/staff-hub/pages/StfUtilitiesPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["staff-hub"])
  return <DatasetProvider datasets={datasets}><StfUtilitiesPage /></DatasetProvider>
}
