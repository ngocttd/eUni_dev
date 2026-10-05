import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { StuFormsPage } from '@/modules/public/student-hub/pages/StuFormsPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["student-hub"])
  return <DatasetProvider datasets={datasets}><StuFormsPage /></DatasetProvider>
}
