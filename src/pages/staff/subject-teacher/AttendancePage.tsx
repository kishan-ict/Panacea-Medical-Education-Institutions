import { Lock } from 'lucide-react'
import { Guard } from '@/routes/Guard'
import { PageHeader } from '@/components/common/PageHeader'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'
import { AttendanceModule } from '@/components/modules/AttendanceModule'
import { useAuth } from '@/store/auth'
import { useDemo } from '@/store/DemoStore'
import { classesForTeacher } from '@/store/selectors'

/** Mark period attendance for this teacher's allocated classes. */
export default function AttendancePage() {
  const { session } = useAuth()
  const { state } = useDemo()

  const teacherId = session?.linkedId ?? ''
  const classIds = classesForTeacher(state, teacherId).map((row) => row.id)

  return (
    <Guard permission="attendance.mark">
      <>
        <PageHeader
          title="Attendance"
          description="Take the register for the classes allocated to you this session."
          actions={<DemoTag />}
        />
        {classIds.length === 0 ? (
          <EmptyState
            icon={Lock}
            title="No classes allocated"
            description="Attendance marking opens once the office of the Principal allocates a class to your account."
          />
        ) : (
          <AttendanceModule mode="marking" teacherId={teacherId || undefined} classIds={classIds} />
        )}
      </>
    </Guard>
  )
}
