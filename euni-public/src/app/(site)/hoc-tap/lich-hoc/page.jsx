import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { AcademicCalendarPage } from '@/modules/public/education/pages/AcademicCalendarPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["education"])
  return <DatasetProvider datasets={datasets}><AcademicCalendarPage /></DatasetProvider>
}
