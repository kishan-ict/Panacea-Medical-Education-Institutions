import { useSearchParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Guard } from '@/routes/Guard'
import { StudentDirectory } from '@/components/modules/StudentDirectory'
import { useAuth } from '@/store/auth'
import { useDemo } from '@/store/DemoStore'
import { classTeacherOf } from '@/store/selectors'

export default function StudentsPage() {
  const [searchParams] = useSearchParams()
  const initialStudentId = searchParams.get('student')
  const { state } = useDemo()
  const { session } = useAuth()

  const ownClass = classTeacherOf(state, session?.linkedId ?? '')

  if (!ownClass) {
    return (
      <Guard permission="students.directory">
        <>
          <PageHeader
            title="My Students"
            description="The roster of the class you are accountable for as class teacher."
          />
          <EmptyState
            icon={Lock}
            title="No class allocated to you"
            description="The student roster opens once the office of the Principal assigns you as a class teacher. Please contact the Principal's office."
          />
        </>
      </Guard>
    )
  }

  return (
    <Guard permission="students.directory">
      <>
        <PageHeader
          title="My Students"
          description={`The roster of ${ownClass.name} — attendance, examination and fee context for the current session.`}
        />
        <StudentDirectory
          scope="class"
          classIds={[ownClass.id]}
          title="My Students"
          description="Demonstration roster for the class you lead, with attendance, examination and fee context."
          initialStudentId={initialStudentId}
          emptyTitle="No students in this class"
          emptyDescription="Student records appear here once admissions are recorded against your class."
        />
      </>
    </Guard>
  )
}
