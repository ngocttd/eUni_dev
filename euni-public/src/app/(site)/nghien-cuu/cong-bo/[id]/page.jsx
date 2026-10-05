import { loadDatasets } from '@/lib/datasets/loaders'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { PublicationDetailPage } from '@/modules/public/research/pages/PublicationDetailPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["research"])
  return <DatasetProvider datasets={datasets}><PublicationDetailPage /></DatasetProvider>
}
