import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { WebmailPage } from '@/modules/public/utilities/pages/WebmailPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["utilities"])
  return <DatasetProvider datasets={datasets}><WebmailPage /></DatasetProvider>
}
