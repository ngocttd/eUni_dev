import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { DormPage } from '@/modules/public/life/pages/DormPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["life"])
  return <DatasetProvider datasets={datasets}><DormPage /></DatasetProvider>
}
