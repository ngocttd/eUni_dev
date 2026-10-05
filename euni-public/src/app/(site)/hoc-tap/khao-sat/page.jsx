import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { SurveyPage } from '@/modules/public/education/pages/SurveyPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["education"])
  return <DatasetProvider datasets={datasets}><SurveyPage /></DatasetProvider>
}
