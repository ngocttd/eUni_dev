import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { LibraryHubPage } from '@/modules/public/library/pages/LibraryHubPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["library"])
  return <DatasetProvider datasets={datasets}><LibraryHubPage /></DatasetProvider>
}
