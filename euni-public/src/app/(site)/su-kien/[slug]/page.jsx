import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { EventDetailPage } from '@/modules/public/content/pages/EventDetailPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["content"])
  return <DatasetProvider datasets={datasets}><EventDetailPage /></DatasetProvider>
}
