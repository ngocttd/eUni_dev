import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { StuPortalPage } from '@/modules/public/student-hub/pages/StuPortalPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["student-hub"])
  return <DatasetProvider datasets={datasets}><StuPortalPage /></DatasetProvider>
}
