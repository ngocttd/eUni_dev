import { loadDatasets } from '@/lib/datasets/loaders'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { ItemDetailPage } from '@/modules/public/library/pages/ItemDetailPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["library"])
  return <DatasetProvider datasets={datasets}><ItemDetailPage /></DatasetProvider>
}
