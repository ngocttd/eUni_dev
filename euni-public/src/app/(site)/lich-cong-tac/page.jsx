import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { WorkCalendarPage } from '@/modules/public/utilities/pages/WorkCalendarPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["utilities"])
  return <DatasetProvider datasets={datasets}><WorkCalendarPage /></DatasetProvider>
}
