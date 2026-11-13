import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { ReportsModule } from '@/components/modules/ReportsModule'

export default function ReportsPage() {
  return (
    <Guard permission="reports.view">
      <>
        <PageHeader
          title="Institutional Reports"
          description="Report cards for rosters, attendance, examinations, fees, faculty and events — prepared from the live demonstration dataset."
        />
        <ReportsModule audience="director" />
      </>
    </Guard>
  )
}
