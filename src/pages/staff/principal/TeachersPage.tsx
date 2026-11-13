import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { FacultyModule } from '@/components/modules/FacultyModule'

export default function TeachersPage() {
  return (
    <Guard permission="staff.view">
      <>
        <PageHeader
          title="Teacher Management"
          description="Teaching staff records, department coverage, designations and class-teacher responsibilities across the institution."
        />
        <FacultyModule canManage />
      </>
    </Guard>
  )
}
