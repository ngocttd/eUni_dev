import { loadDatasets } from '@/lib/datasets/loaders'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { ResearchGroupDetailPage } from '@/modules/public/research/pages/ResearchGroupDetailPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["research"])
  return <DatasetProvider datasets={datasets}><ResearchGroupDetailPage /></DatasetProvider>
}
