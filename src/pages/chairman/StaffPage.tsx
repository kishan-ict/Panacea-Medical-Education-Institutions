import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/common/Badge'
import { Guard } from '@/routes/Guard'
import { FacultyModule } from '@/components/modules/FacultyModule'

export default function StaffPage() {
  return (
    <Guard permission="staff.view">
      <>
        <PageHeader
          title="Staff Management"
          description="Teaching staff directory, departments and class-teacher responsibilities across the institution."
          actions={<Badge tone="outline">Read-only · staff.view</Badge>}
        />
        <FacultyModule canManage={false} />
        <p className="mt-4 rounded-panel border border-line bg-muted/60 px-4 py-3 text-xs leading-5 text-ink2">
          The Chairman holds the <span className="font-semibold text-ink">staff.view</span> permission only — this view is
          read-only. Creating, editing and activating staff records is a Director / Principal capability.
        </p>
      </>
    </Guard>
  )
}
