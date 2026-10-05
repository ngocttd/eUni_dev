import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { ActivityDetailPage } from '@/modules/public/life/pages/ActivityDetailPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["life"])
  return <DatasetProvider datasets={datasets}><ActivityDetailPage /></DatasetProvider>
}
