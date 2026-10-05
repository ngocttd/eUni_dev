import { loadDatasets } from '@/lib/datasets/loaders'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { CoopProgramListPage } from '@/modules/public/cooperation/pages/CoopProgramListPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["cooperation"])
  return <DatasetProvider datasets={datasets}><CoopProgramListPage /></DatasetProvider>
}
