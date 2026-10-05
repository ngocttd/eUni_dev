import { loadDatasets } from '@/lib/datasets/loaders'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { ContactPage } from '@/modules/public/utilities/pages/ContactPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["utilities"])
  return <DatasetProvider datasets={datasets}><ContactPage /></DatasetProvider>
}
