import { loadDatasets } from '@/lib/datasets/loaders'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { CollectionsPage } from '@/modules/public/library/pages/CollectionsPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["library"])
  return <DatasetProvider datasets={datasets}><CollectionsPage /></DatasetProvider>
}
