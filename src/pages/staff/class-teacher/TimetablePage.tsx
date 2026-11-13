import { Lock } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Guard } from '@/routes/Guard'
import { useAuth } from '@/store/auth'
import { useDemo } from '@/store/DemoStore'
import { classTeacherOf } from '@/store/selectors'
import { TimetableModule } from '@/components/modules/TimetableModule'

/** Timetable for the single class this class teacher leads. */
export default function TimetablePage() {
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
    <Guard permission="timetable.view">
      <>
        <PageHeader
          title="Class timetable"
          description="The weekly timetable for your class."
        />
        <TimetableModule classIds={[ownClass.id]} />
      </>
    </Guard>
  )
}
