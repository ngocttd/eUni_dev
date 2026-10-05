import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { StfRegulationsPage } from '@/modules/public/staff-hub/pages/StfRegulationsPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["staff-hub"])
  return <DatasetProvider datasets={datasets}><StfRegulationsPage /></DatasetProvider>
}
