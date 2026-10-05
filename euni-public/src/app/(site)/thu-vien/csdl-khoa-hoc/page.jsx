import { loadDatasets } from '@/lib/datasets/loaders'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { DatabasesPage } from '@/modules/public/library/pages/DatabasesPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["library"])
  return <DatasetProvider datasets={datasets}><DatabasesPage /></DatasetProvider>
}
