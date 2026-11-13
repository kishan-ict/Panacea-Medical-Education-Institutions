import { useSearchParams } from 'react-router-dom'
import { Guard } from '@/routes/Guard'
import { PageHeader } from '@/components/common/PageHeader'
import { DemoTag } from '@/components/common/EmptyState'
import { StudentDirectory } from '@/components/modules/StudentDirectory'
import { useAuth } from '@/store/auth'
import { useDemo } from '@/store/DemoStore'
import { classesForTeacher } from '@/store/selectors'

/**
 * Students in this teacher's allocated classes. Deep-linked with
 * `?student=<id>` (attendance drill-down preselects a student).
 */
export default function StudentsPage() {
  const { session } = useAuth()
  const { state } = useDemo()
  const [searchParams] = useSearchParams()

  const classIds = classesForTeacher(state, session?.linkedId ?? '').map((row) => row.id)
  const initialStudentId = searchParams.get('student')

  return (
    <Guard permission="students.directory">
      <>
        <PageHeader
          title="My Students"
          description="The roster of the classes you teach this session."
          actions={<DemoTag />}
        />
        <StudentDirectory
          scope="class"
          classIds={classIds}
          title="My Students"
          description="Demonstration roster for your allocated classes, with attendance and examination context."
          initialStudentId={initialStudentId}
          emptyTitle="No students in your classes"
          emptyDescription="Student records appear here once admissions are recorded against your allocated classes."
        />
      </>
    </Guard>
  )
}
