import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { MarksModule } from '@/components/modules/MarksModule'

export default function ExaminationsPage() {
  return (
    <Guard permission="reports.view">
      <>
        <PageHeader
          title="Examination Performance"
          description="Published examination results across classes and subjects — publication remains a Principal capability and is hidden from this portal."
        />
        <MarksModule mode="overview" />
      </>
    </Guard>
  )
}
