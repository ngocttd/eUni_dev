import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { MediaPage } from '@/modules/public/content/pages/MediaPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["content"])
  return <DatasetProvider datasets={datasets}><MediaPage /></DatasetProvider>
}
