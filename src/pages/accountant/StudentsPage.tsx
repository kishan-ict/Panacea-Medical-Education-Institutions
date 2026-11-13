import { Link, useSearchParams } from 'react-router-dom'
import { Receipt as ReceiptIcon } from 'lucide-react'
import { Guard } from '@/routes/Guard'
import { Button } from '@/components/common/Button'
import { StudentDirectory } from '@/components/modules/StudentDirectory'

/**
 * Student search for the counter — find the record first, then issue the
 * receipt. Supports the `?student=` deep link used by global search.
 */
export default function StudentsPage() {
  const [params] = useSearchParams()
  const initialStudentId = params.get('student')

  return (
    <Guard permission="students.directory">
      <StudentDirectory
        scope="institution"
        title="Student Search"
        description="Find a student before issuing a receipt — open a record to review fee context."
        initialStudentId={initialStudentId}
        actions={
          <Link to="/accountant/new-receipt">
            <Button icon={<ReceiptIcon className="h-4 w-4" />}>New receipt</Button>
          </Link>
        }
      />
    </Guard>
  )
}
