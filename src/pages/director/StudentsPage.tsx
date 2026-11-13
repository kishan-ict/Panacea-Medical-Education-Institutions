import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { StudentDirectory } from '@/components/modules/StudentDirectory'

export default function StudentsPage() {
  const [searchParams] = useSearchParams()
  const initialStudentId = searchParams.get('student')

  return (
    <Guard permission="students.directory">
      <>
        <PageHeader
          title="Student Statistics"
          description="Institution-wide student statistics across every programme and class. Opening an individual record is audit-logged with your reason for access."
        />
        <StudentDirectory
          scope="institution"
          title="Student Statistics"
          description="Demonstration roster with attendance, examination and fee context for the current session."
          initialStudentId={initialStudentId}
        />
      </>
    </Guard>
  )
}
