import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { StudentGatewayPage } from '@/modules/public/student-hub/pages/StudentGatewayPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["student-hub"])
  return <DatasetProvider datasets={datasets}><StudentGatewayPage /></DatasetProvider>
}
