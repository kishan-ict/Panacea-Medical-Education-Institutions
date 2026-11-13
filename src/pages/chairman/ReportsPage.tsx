import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { ReportsModule } from '@/components/modules/ReportsModule'

export default function ReportsPage() {
  return (
    <Guard permission="reports.view">
      <>
        <PageHeader
          title="Institutional Reports"
          description="Report cards for attendance, examinations, fees, staffing and events — prepared from the demonstration dataset."
        />
        <ReportsModule audience="chairman" />
      </>
    </Guard>
  )
}
