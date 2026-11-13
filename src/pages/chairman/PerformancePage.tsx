import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { MarksModule } from '@/components/modules/MarksModule'

export default function PerformancePage() {
  return (
    <Guard permission="reports.view">
      <>
        <PageHeader
          title="Academic Performance"
          description="Examination performance across classes and subjects — published results only. Publication remains a Principal capability."
        />
        <MarksModule mode="overview" />
      </>
    </Guard>
  )
}
