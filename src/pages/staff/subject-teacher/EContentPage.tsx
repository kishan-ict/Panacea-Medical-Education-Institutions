import { Lock } from 'lucide-react'
import { Guard } from '@/routes/Guard'
import { PageHeader } from '@/components/common/PageHeader'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'
import { EContentModule } from '@/components/modules/EContentModule'
import { useAuth } from '@/store/auth'
import { useDemo } from '@/store/DemoStore'
import { classesForTeacher } from '@/store/selectors'

/** Upload and manage e-content for this teacher's subjects. */
export default function EContentPage() {
  const { session } = useAuth()
  const { state } = useDemo()

  const classIds = classesForTeacher(state, session?.linkedId ?? '').map((row) => row.id)

  return (
    <Guard permission="econtent.manage">
      <>
        <PageHeader
          title="E-Content"
          description="Upload notes, PDFs and links for the classes you teach."
          actions={<DemoTag />}
        />
        {classIds.length === 0 ? (
          <EmptyState
            icon={Lock}
            title="No classes allocated"
            description="E-content publishing opens once the office of the Principal allocates a class and subject to your account."
          />
        ) : (
          <EContentModule mode="manage" classIds={classIds} />
        )}
      </>
    </Guard>
  )
}
