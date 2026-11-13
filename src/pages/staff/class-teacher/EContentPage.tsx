import { Lock } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Guard } from '@/routes/Guard'
import { useAuth } from '@/store/auth'
import { useDemo } from '@/store/DemoStore'
import { classTeacherOf } from '@/store/selectors'
import { EContentModule } from '@/components/modules/EContentModule'

/** Manage e-content for the single class this class teacher leads. */
export default function EContentPage() {
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
    <Guard permission="econtent.manage">
      <>
        <PageHeader
          title="E-content"
          description="Manage the e-content you publish for your class."
        />
        <EContentModule mode="manage" classIds={[ownClass.id]} />
      </>
    </Guard>
  )
}
