import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { FacultyModule } from '@/components/modules/FacultyModule'

export default function FacultyPage() {
  return (
    <Guard permission="staff.view">
      <>
        <PageHeader
          title="Faculty Overview"
          description="Teaching staff by department with designations, employment status and class-teacher allocations. As Director you also hold staff.manage, so records can be edited here."
        />
        <FacultyModule canManage />
      </>
    </Guard>
  )
}
