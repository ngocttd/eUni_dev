import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { ProgramListPage } from '@/modules/public/education/pages/ProgramListPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["education"])
  return <DatasetProvider datasets={datasets}><ProgramListPage /></DatasetProvider>
}
