import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { StudentSupportPage } from '@/modules/public/life/pages/StudentSupportPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["life"])
  return <DatasetProvider datasets={datasets}><StudentSupportPage /></DatasetProvider>
}
