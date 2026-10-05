import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { PartnerListPage } from '@/modules/public/cooperation/pages/PartnerListPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["cooperation"])
  return <DatasetProvider datasets={datasets}><PartnerListPage scope="trong-nuoc" /></DatasetProvider>
}
