import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { PodcastDetailPage } from '@/modules/public/content/pages/PodcastDetailPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["content"])
  return <DatasetProvider datasets={datasets}><PodcastDetailPage /></DatasetProvider>
}
