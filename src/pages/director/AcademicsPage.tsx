import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'
import { BarList } from '@/components/common/Progress'
import { DataTable, type Column } from '@/components/common/DataTable'
import { StatCard, StatGrid } from '@/components/dashboard/StatCard'
import { BarSeriesChart } from '@/components/charts/Charts'
import { Guard } from '@/routes/Guard'
import { useDemo } from '@/store/DemoStore'
import {
  classAttendanceSeries,
  examAverage,
  institutionalStats,
  overallAttendance,
  publishedExams,
  subjectPerformance,
} from '@/store/selectors'
import { formatDate, formatPercent } from '@/utils/format'
import { BookOpenCheck, CalendarCheck, GraduationCap, Layers, TrendingUp } from 'lucide-react'
import type { Exam } from '@/types'

export default function AcademicsPage() {
  const { state } = useDemo()

  const stats = institutionalStats(state)
  const attendance = overallAttendance(state)
  const classSeries = classAttendanceSeries(state)
  const exams = publishedExams(state)
  const latest = [...exams].sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
  const latestPerformance = latest ? subjectPerformance(state, latest.id) : []

  const columns: Column<Exam>[] = [
    {
      key: 'name',
      header: 'Examination',
      sortable: true,
      sortValue: (exam) => exam.name,
      render: (exam) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{exam.name}</p>
          <p className="truncate text-[11px] text-ink3">{exam.type}</p>
        </div>
      ),
    },
    {
      key: 'window',
      header: 'Window',
      sortable: true,
      sortValue: (exam) => exam.startDate,
      render: (exam) => (
        <span className="whitespace-nowrap text-ink2">
          {formatDate(exam.startDate)} – {formatDate(exam.endDate)}
        </span>
      ),
    },
    {
      key: 'average',
      header: 'Average',
      align: 'right',
      sortable: true,
      sortValue: (exam) => examAverage(state, exam.id).percentage,
      render: (exam) => {
        const average = examAverage(state, exam.id).percentage
        if (!average) return <span className="text-ink3">—</span>
        return (
          <span
            className={
              average >= 60
                ? 'font-semibold text-success'
                : average >= 40
                  ? 'font-semibold text-warn'
                  : 'font-semibold text-danger'
            }
          >
            {formatPercent(average)}
          </span>
        )
      },
    },
    {
      key: 'appeared',
      header: 'Appeared',
      align: 'right',
      sortable: true,
      sortValue: (exam) => examAverage(state, exam.id).appeared,
      render: (exam) => <span className="tabular-nums text-ink">{examAverage(state, exam.id).appeared}</span>,
    },
    {
      key: 'records',
      header: 'Mark records',
      align: 'right',
      sortable: true,
      sortValue: (exam) => examAverage(state, exam.id).records,
      render: (exam) => <span className="tabular-nums text-ink2">{examAverage(state, exam.id).records}</span>,
    },
  ]

  return (
    <Guard permission="academics.manage">
      <>
        <PageHeader
          title="Academic Reports"
          description={`Class attendance, subject performance and published examination averages for the ${stats.classes}-class academic structure.`}
          actions={<DemoTag />}
        />

        <div className="space-y-4">
          <StatGrid>
            <StatCard
              label="Active students"
              value={stats.students}
              icon={<GraduationCap className="h-4 w-4" />}
              hint={`${stats.courses} programmes in session`}
            />
            <StatCard
              label="Classes running"
              value={stats.classes}
              icon={<Layers className="h-4 w-4" />}
              tone="brand"
              hint="Sections across all programme years"
            />
            <StatCard
              label="Published exams"
              value={exams.length}
              icon={<TrendingUp className="h-4 w-4" />}
              tone="royal"
              hint="Results released to students"
            />
            <StatCard
              label="Overall attendance"
              value={formatPercent(attendance.pct)}
              icon={<CalendarCheck className="h-4 w-4" />}
              tone={attendance.pct >= 75 ? 'success' : 'warn'}
              hint={`${attendance.present} present of ${attendance.total} marks`}
            />
          </StatGrid>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Attendance by class"
                description="Current attendance percentage for every class in the institution"
                icon={<CalendarCheck className="h-4 w-4" />}
              />
              <CardBody>
                {classSeries.length === 0 ? (
                  <EmptyState
                    compact
                    icon={CalendarCheck}
                    title="No classes recorded"
                    description="Class attendance appears once classes are configured."
                  />
                ) : (
                  <BarSeriesChart
                    data={classSeries}
                    xKey="code"
                    bars={[{ key: 'pct', name: 'Attendance %' }]}
                    yFormatter={(value) => `${value}%`}
                    height={260}
                  />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Subject performance"
                description={latest ? `${latest.name} — published subject averages` : 'Latest published examination'}
                icon={<BookOpenCheck className="h-4 w-4" />}
              />
              <CardBody>
                {latestPerformance.length === 0 ? (
                  <EmptyState
                    compact
                    icon={BookOpenCheck}
                    title="No published subject results"
                    description="Subject averages appear once an examination has been published."
                  />
                ) : (
                  <BarList rows={latestPerformance.map((row) => ({ label: row.name, value: row.pct }))} />
                )}
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Published examinations"
              description="Averages use published marks only — drafts remain excluded until release."
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <div className="p-4">
              <DataTable
                columns={columns}
                rows={exams}
                getRowKey={(exam) => exam.id}
                searchValue={(exam) => `${exam.name} ${exam.shortName} ${exam.type}`}
                pageSize={8}
                emptyTitle="No published examinations"
                emptyDescription="Published examinations appear here once results are released."
              />
            </div>
          </Card>
        </div>
      </>
    </Guard>
  )
}
