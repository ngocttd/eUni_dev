import { loadDatasets } from '@/lib/datasets/server'
import { DatasetProvider } from '@/lib/datasets/useModuleData'
import { LecturerDetailPage } from '@/modules/public/about/pages/LecturerDetailPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const datasets = await loadDatasets(["about"])
  return <DatasetProvider datasets={datasets}><LecturerDetailPage /></DatasetProvider>
}
