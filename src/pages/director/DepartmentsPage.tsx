import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardBody, CardHeader, KeyValue } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'
import { DataTable, type Column } from '@/components/common/DataTable'
import { StatCard, StatGrid } from '@/components/dashboard/StatCard'
import { BarSeriesChart } from '@/components/charts/Charts'
import { Guard } from '@/routes/Guard'
import { useDemo } from '@/store/DemoStore'
import { departmentFaculty } from '@/store/selectors'
import { DEPARTMENTS, NOT_PUBLISHED, PROGRAMMES } from '@/data/constants/institution'
import { Building2, GraduationCap, Layers, Users } from 'lucide-react'

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
  const chartRows = departments.map((dept) => ({ name: dept.department, faculty: dept.faculty }))

  return (
    <Guard permission="academics.manage">
      <>
        <PageHeader
          title="Department Analytics"
          description={`Teaching strength by department, programme capacity and class coverage for the ${DEPARTMENTS.length}-department academic structure.`}
          actions={<DemoTag />}
        />

        <div className="space-y-4">
          <StatGrid>
            <StatCard
              label="Departments"
              value={DEPARTMENTS.length}
              icon={<Building2 className="h-4 w-4" />}
              hint="Constituted teaching departments"
            />
            <StatCard
              label="Teaching faculty"
              value={state.teachers.length}
              icon={<Users className="h-4 w-4" />}
              tone="brand"
              hint={`${state.teachers.filter((t) => t.status === 'active').length} active on the roster`}
            />
            <StatCard
              label="Programmes"
              value={PROGRAMMES.length}
              icon={<GraduationCap className="h-4 w-4" />}
              tone="royal"
              hint="GNM, B.Sc. Nursing and ANM"
            />
            <StatCard
              label="Classes running"
              value={state.classes.length}
              icon={<Layers className="h-4 w-4" />}
              tone="gold"
              hint="Sections across all programme years"
            />
          </StatGrid>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Faculty by department"
                description="Teaching strength of each department from the demonstration roster"
                icon={<Users className="h-4 w-4" />}
              />
              <CardBody>
                {chartRows.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Building2}
                    title="No departments recorded"
                    description="Departmental strength appears once teaching staff are recorded."
                  />
                ) : (
                  <BarSeriesChart
                    data={chartRows}
                    xKey="name"
                    bars={[{ key: 'faculty', name: 'Faculty' }]}
                    horizontal
                    height={Math.max(220, chartRows.length * 46)}
                  />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Department register"
                description="Head of department and assigned faculty count"
                icon={<Building2 className="h-4 w-4" />}
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

          <Card>
            <CardHeader
              title="Programme capacity"
              description="Seats, duration and eligibility as published on the official institutional website"
              icon={<GraduationCap className="h-4 w-4" />}
            />
            <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {PROGRAMMES.map((program) => (
                <article key={program.code} className="flex flex-col rounded-xl border border-line bg-muted/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-ink">{program.name}</h3>
                      <p className="mt-0.5 text-xs text-ink2">
                        {program.level} · {program.duration}
                      </p>
                    </div>
                    <Badge tone="info" size="md">
                      {program.code}
                    </Badge>
                  </div>

                  <div className="mt-2 border-t border-line pt-1">
                    <KeyValue label="Seats" value={program.seats} />
                    <KeyValue label="Duration" value={program.duration} />
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
        </div>
      </>
    </Guard>
  )
}
