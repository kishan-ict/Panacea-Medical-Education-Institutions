import { Lock } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Guard } from '@/routes/Guard'
import { useAuth } from '@/store/auth'
import { useDemo } from '@/store/DemoStore'
import { classTeacherOf } from '@/store/selectors'
import { NoticesModule } from '@/components/modules/NoticesModule'

/** Notices scoped to the single class this class teacher leads. */
export default function NoticesPage() {
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
    <Guard permission="notices.view">
      <>
        <PageHeader
          title="Class notices"
          description="Notices published for your class."
        />
        <NoticesModule mode="view" audience={{ classId: ownClass.id }} />
      </>
    </Guard>
  )
}
