import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { StfTeachingPage } from '@/modules/public/staff-hub/pages/StfTeachingPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["staff-hub"])
  return <DatasetProvider datasets={datasets}><StfTeachingPage /></DatasetProvider>
}
