import { loadDatasets } from '@/lib/datasets/loaders'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { VisionPage } from '@/modules/public/about/pages/VisionPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["about"])
  return <DatasetProvider datasets={datasets}><VisionPage /></DatasetProvider>
}
