import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { StuJobsPage } from '@/modules/public/student-hub/pages/StuJobsPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["student-hub"])
  return <DatasetProvider datasets={datasets}><StuJobsPage /></DatasetProvider>
}
