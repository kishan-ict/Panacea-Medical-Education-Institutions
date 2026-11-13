import { Lock } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Guard } from '@/routes/Guard'
import { useAuth } from '@/store/auth'
import { useDemo } from '@/store/DemoStore'
import { classTeacherOf } from '@/store/selectors'
import { AttendanceModule } from '@/components/modules/AttendanceModule'

/** Marks attendance for the single class this class teacher leads. */
export default function AttendancePage() {
  const { state } = useDemo()
  const { session } = useAuth()

  const ownClass = classTeacherOf(state, session?.linkedId ?? '')

  if (!ownClass) {
    return (
      <EmptyState
        icon={Lock}
        title="No class assigned yet"
        description="You are not the class teacher of any class in this demo. The Principal assigns class leadership from Teacher assignments."
      />
    )
  }

  return (
    <Guard permission="attendance.mark">
      <>
        <PageHeader
          title="Class attendance"
          description="Take the register for your class and review recent attendance history."
        />
        <AttendanceModule
          mode="marking"
          teacherId={session?.linkedId ?? undefined}
          classIds={[ownClass.id]}
        />
      </>
    </Guard>
  )
}
