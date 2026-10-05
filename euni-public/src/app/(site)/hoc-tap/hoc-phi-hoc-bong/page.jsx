import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { TuitionScholarshipPage } from '@/modules/public/education/pages/TuitionScholarshipPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["education"])
  return <DatasetProvider datasets={datasets}><TuitionScholarshipPage /></DatasetProvider>
}
