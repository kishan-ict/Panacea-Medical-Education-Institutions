import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardBody, CardHeader, KeyValue } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { DemoTag } from '@/components/common/EmptyState'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Guard } from '@/routes/Guard'
import { useDemo } from '@/store/DemoStore'
import { departmentFaculty } from '@/store/selectors'
import { INSTITUTION, NOT_PUBLISHED, PROGRAMMES } from '@/data/constants/institution'

type DepartmentRow = { department: string; head: string; faculty: number }

const DEPARTMENT_COLUMNS: Column<DepartmentRow>[] = [
  {
    key: 'department',
    header: 'Department',
    sortable: true,
    sortValue: (row) => row.department,
    render: (row) => <span className="font-medium text-ink">{row.department}</span>,
  },
  {
    key: 'head',
    header: 'Head of department',
    render: (row) => <span className="text-ink2">{row.head}</span>,
  },
  {
    key: 'faculty',
    header: 'Faculty',
    align: 'right',
    sortable: true,
    sortValue: (row) => row.faculty,
    render: (row) => <span className="font-semibold tabular-nums text-ink">{row.faculty}</span>,
  },
]

export default function DepartmentsPage() {
  const { state } = useDemo()
  const departments = departmentFaculty(state)

  return (
    <Guard permission="staff.view">
      <>
        <PageHeader
          title="Departments & Courses"
          description={`Approved programmes, admission criteria and departmental staffing for the ${INSTITUTION.academicYear} session.`}
          actions={<DemoTag />}
        />

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Programmes offered"
              description="Course facts as published on the official institutional website"
            />
            <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {PROGRAMMES.map((program) => (
                <article key={program.code} className="flex flex-col rounded-xl border border-line bg-muted/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-ink">{program.name}</h3>
                      <p className="mt-0.5 text-xs text-ink2">
                        {program.level} programme · {program.duration}
                      </p>
                    </div>
                    <Badge tone="info" size="md">
                      {program.code}
                    </Badge>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-ink2">{program.description}</p>

                  <div className="mt-3 border-t border-line pt-1">
                    <KeyValue label="Seats" value={program.seats} />
                    <KeyValue label="Eligibility" value={program.eligibility} />
                    <KeyValue label="Age limit" value={program.ageLimit} />
                    <KeyValue label="Entrance test" value={program.entrance} />
                    <KeyValue
                      label="Fee structure"
                      value={<span className="text-ink3">{NOT_PUBLISHED}</span>}
                    />
                  </div>
                </article>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Departments & faculty"
              description="Head of department and teaching strength drawn from the demonstration roster"
            />
            <div className="p-4">
              <DataTable
                columns={DEPARTMENT_COLUMNS}
                rows={departments}
                getRowKey={(row) => row.department}
                searchValue={(row) => `${row.department} ${row.head}`}
                pageSize={10}
                emptyTitle="No departments found"
                emptyDescription="Departments appear here once teaching staff are recorded."
              />
            </div>
          </Card>
        </div>
      </>
    </Guard>
  )
}
