import { loadDatasets } from '@/lib/datasets/loaders'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { DigitalLibraryPage } from '@/modules/public/utilities/pages/DigitalLibraryPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["utilities"])
  return <DatasetProvider datasets={datasets}><DigitalLibraryPage /></DatasetProvider>
}
