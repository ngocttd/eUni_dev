import { loadDatasets } from '@/lib/datasets/loaders'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { LibrarySearchPage } from '@/modules/public/library/pages/LibrarySearchPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["library"])
  return <DatasetProvider datasets={datasets}><LibrarySearchPage /></DatasetProvider>
}
