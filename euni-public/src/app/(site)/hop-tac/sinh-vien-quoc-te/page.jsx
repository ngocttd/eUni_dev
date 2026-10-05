import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { IntlStudentsPage } from '@/modules/public/cooperation/pages/IntlStudentsPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["cooperation"])
  return <DatasetProvider datasets={datasets}><IntlStudentsPage /></DatasetProvider>
}
