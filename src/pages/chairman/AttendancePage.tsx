import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { AttendanceModule } from '@/components/modules/AttendanceModule'

export default function AttendancePage() {
  return (
    <Guard permission="attendance.analytics">
      <>
        <PageHeader
          title="Attendance Analytics"
          description="Institutional attendance trends, class comparisons and subject-level patterns for the current session."
        />
        <AttendanceModule mode="analytics" />
      </>
    </Guard>
  )
}
