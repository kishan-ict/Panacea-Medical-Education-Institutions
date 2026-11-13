import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { ClassTeacherAssignment } from '@/components/modules/AssignmentModule'

export default function ClassAssignmentPage() {
  return (
    <Guard permission="staff.assign">
      <>
        <PageHeader
          title="Class Teacher Assignment"
          description="Allocate exactly one accountable class teacher to every class. Changes are validated against the demonstration store and applied immediately."
        />
        <ClassTeacherAssignment />
      </>
    </Guard>
  )
}
