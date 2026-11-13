import { BookOpen, Lock } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'
import { DataTable, type Column } from '@/components/common/DataTable'
import { useAuth } from '@/store/auth'
import { useDemo } from '@/store/DemoStore'
import { classTeacherOf, subjectAllocationRows } from '@/store/selectors'

type AllocationRow = ReturnType<typeof subjectAllocationRows>[number]

export default function SubjectsPage() {
  const { state } = useDemo()
  const { session } = useAuth()

  const ownClass = classTeacherOf(state, session?.linkedId ?? '')

  if (!ownClass) {
    return (
      <>
        <PageHeader
          title="Subject Allocation"
          description="Subjects taught in the class you lead, with the teacher responsible for each one."
          actions={<DemoTag />}
        />
        <EmptyState
          icon={Lock}
          title="No class allocated to you"
          description="Subject allocations for your class appear once the office of the Principal assigns you as a class teacher."
        />
      </>
    )
  }

  const rows = subjectAllocationRows(state).filter((row) => row.classId === ownClass.id)

  const columns: Column<AllocationRow>[] = [
    {
      key: 'subject',
      header: 'Subject',
      sortable: true,
      sortValue: (row) => row.subject?.name ?? '',
      render: (row) => (
        <div>
          <p className="text-[13px] font-medium text-ink">{row.subject?.name ?? '—'}</p>
          <p className="text-[11px] text-ink3">{row.subject?.type ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      render: (row) => <span className="text-ink2">{row.subject?.code ?? '—'}</span>,
    },
    {
      key: 'teacher',
      header: 'Teacher',
      sortable: true,
      sortValue: (row) => row.teacher?.name ?? '',
      render: (row) => (
        <div>
          <p className="text-[13px] text-ink">{row.teacher?.name ?? '—'}</p>
          <p className="text-[11px] text-ink3">{row.teacher?.designation ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (row) => <span className="text-ink2">{row.teacher?.department ?? '—'}</span>,
    },
    {
      key: 'year',
      header: 'Academic year',
      render: (row) => <span className="text-ink2">{row.academicYear}</span>,
    },
    {
      key: 'lead',
      header: 'Teaching lead',
      align: 'right',
      render: (row) =>
        state.timetable.some(
          (slot) =>
            slot.classId === row.classId && slot.subjectId === row.subjectId && slot.teacherId === row.teacherId,
        ) ? (
          <Badge tone="gold">Lead</Badge>
        ) : (
          <Badge tone="outline">Support</Badge>
        ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Subject Allocation"
        description={`Subjects taught in ${ownClass.name}, with the teacher responsible for each one.`}
        actions={<DemoTag />}
      />

      <div className="space-y-4">
        <Card>
          <CardHeader
            title="Read-only allocations"
            description="Derived live from the institutional subject allocation register"
            icon={<BookOpen className="h-4 w-4" />}
          />
          <div className="p-4">
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id}
              searchValue={(row) => `${row.subject?.name ?? ''} ${row.subject?.code ?? ''} ${row.teacher?.name ?? ''}`}
              searchPlaceholder="Search subject or teacher…"
              pageSize={10}
              emptyTitle="No subjects allocated"
              emptyDescription="Subjects appear here once the Principal allocates teachers to your class."
            />
          </div>
        </Card>

        <p className="rounded-panel border border-line bg-muted px-4 py-3 text-[13px] leading-6 text-ink2">
          Subject allocation changes are made by the Principal from the Subject Allocations page. If a subject or
          teaching lead looks incorrect, please raise the request with the office of the Principal.
        </p>
      </div>
    </>
  )
}
