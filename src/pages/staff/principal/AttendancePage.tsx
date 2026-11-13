import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { AttendanceModule } from '@/components/modules/AttendanceModule'

export default function AttendancePage() {
  return (
    <Guard permission="attendance.analytics">
      <>
        <PageHeader
          title="Attendance Overview"
          description="Institutional attendance trends, class comparisons and subject-level patterns aggregated from submitted sessions in the demonstration dataset."
        />
        <AttendanceModule mode="analytics" />
      </>
    </Guard>
  )
}
