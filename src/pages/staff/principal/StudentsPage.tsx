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
          title="Student Directory"
          description="Institution-wide student records across every programme and class, with attendance, examination and fee context for the current session."
        />
        <StudentDirectory
          scope="institution"
          title="Student Directory"
          description="Demonstration roster with attendance, examination and fee context for the current session."
          initialStudentId={initialStudentId}
        />
      </>
    </Guard>
  )
}
