import { loadDatasets } from '@/lib/datasets/loaders'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import HomePage from '@/modules/public/home/HomePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["home"])
  return <DatasetProvider datasets={datasets}><HomePage /></DatasetProvider>
}
