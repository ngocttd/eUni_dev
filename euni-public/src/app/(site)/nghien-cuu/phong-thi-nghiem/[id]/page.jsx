import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { LabDetailPage } from '@/modules/public/research/pages/LabDetailPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["research"])
  return <DatasetProvider datasets={datasets}><LabDetailPage /></DatasetProvider>
}
