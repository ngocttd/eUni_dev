import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { JobDetailPage } from '@/modules/public/life/pages/JobDetailPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["life"])
  return <DatasetProvider datasets={datasets}><JobDetailPage /></DatasetProvider>
}
