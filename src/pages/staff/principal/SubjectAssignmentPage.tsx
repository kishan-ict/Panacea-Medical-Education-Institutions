import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { SubjectAllocation } from '@/components/modules/AssignmentModule'

export default function SubjectAssignmentPage() {
  return (
    <Guard permission="academics.manage">
      <>
        <PageHeader
          title="Subject Allocations"
          description="Which teacher takes which subject, class by class, for the academic session. Add or remove allocations as the teaching timetable is finalised."
        />
        <SubjectAllocation />
      </>
    </Guard>
  )
}
