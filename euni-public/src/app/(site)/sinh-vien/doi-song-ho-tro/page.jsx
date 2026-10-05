import { loadDatasets } from '@/lib/datasets/loaders'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { StuLifePage } from '@/modules/public/student-hub/pages/StuLifePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["student-hub"])
  return <DatasetProvider datasets={datasets}><StuLifePage /></DatasetProvider>
}
