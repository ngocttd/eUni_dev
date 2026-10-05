import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { AdmBenchmarkPage } from '@/modules/public/admissions/pages/AdmBenchmarkPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["admissions"])
  return <DatasetProvider datasets={datasets}><AdmBenchmarkPage /></DatasetProvider>
}
