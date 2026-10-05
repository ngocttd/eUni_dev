import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { EventListPage } from '@/modules/public/content/pages/EventListPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["content"])
  return <DatasetProvider datasets={datasets}><EventListPage /></DatasetProvider>
}
