import { Lock } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Guard } from '@/routes/Guard'
import { useAuth } from '@/store/auth'
import { useDemo } from '@/store/DemoStore'
import { classTeacherOf } from '@/store/selectors'
import { MarksModule } from '@/components/modules/MarksModule'

/** Enter marks for the single class this class teacher leads. */
export default function MarksPage() {
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
    <Guard permission="marks.enter">
      <>
        <PageHeader
          title="Marks entry"
          description="Enter and submit marks for the subjects you teach in your class."
        />
        <MarksModule
          mode="entry"
          teacherId={session?.linkedId ?? undefined}
          classIds={[ownClass.id]}
        />
      </>
    </Guard>
  )
}
