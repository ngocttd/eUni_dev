import { loadDatasets } from '@/lib/datasets/loaders'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { StuLibraryPage } from '@/modules/public/student-hub/pages/StuLibraryPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["student-hub"])
  return <DatasetProvider datasets={datasets}><StuLibraryPage /></DatasetProvider>
}
