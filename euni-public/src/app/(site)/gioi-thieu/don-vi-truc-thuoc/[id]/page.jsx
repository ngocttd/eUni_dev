import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { UnitDetailPage } from '@/modules/public/about/pages/UnitDetailPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["about"])
  return <DatasetProvider datasets={datasets}><UnitDetailPage kind="don-vi-truc-thuoc" /></DatasetProvider>
}
