import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { ExpertListPage } from '@/modules/public/research/pages/ExpertListPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["research"])
  return <DatasetProvider datasets={datasets}><ExpertListPage /></DatasetProvider>
}
