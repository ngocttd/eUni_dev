import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { StuFaqPage } from '@/modules/public/student-hub/pages/StuFaqPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["student-hub"])
  return <DatasetProvider datasets={datasets}><StuFaqPage /></DatasetProvider>
}
