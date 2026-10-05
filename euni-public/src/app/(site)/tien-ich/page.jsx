import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { UtilitiesHubPage } from '@/modules/public/utilities/pages/UtilitiesHubPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["utilities"])
  return <DatasetProvider datasets={datasets}><UtilitiesHubPage /></DatasetProvider>
}
