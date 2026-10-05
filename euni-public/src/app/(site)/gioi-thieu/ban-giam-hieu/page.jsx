import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { BoardPage } from '@/modules/public/about/pages/BoardPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["about"])
  return <DatasetProvider datasets={datasets}><BoardPage /></DatasetProvider>
}
