import { Lock } from 'lucide-react'
import { Guard } from '@/routes/Guard'
import { PageHeader } from '@/components/common/PageHeader'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'
import { MarksModule } from '@/components/modules/MarksModule'
import { useAuth } from '@/store/auth'
import { useDemo } from '@/store/DemoStore'
import { classesForTeacher } from '@/store/selectors'

/** Enter internal marks for this teacher's subjects. */
export default function MarksPage() {
  const { session } = useAuth()
  const { state } = useDemo()

  const teacherId = session?.linkedId ?? ''
  const classIds = classesForTeacher(state, teacherId).map((row) => row.id)

  return (
    <Guard permission="marks.enter">
      <>
        <PageHeader
          title="Marks Entry"
          description="Enter and save internal marks for the subjects you teach."
          actions={<DemoTag />}
        />
        {classIds.length === 0 ? (
          <EmptyState
            icon={Lock}
            title="No classes allocated"
            description="Marks entry opens once the office of the Principal allocates a class and subject to your account."
          />
        ) : (
          <MarksModule mode="entry" teacherId={teacherId || undefined} classIds={classIds} />
        )}
      </>
    </Guard>
  )
}
