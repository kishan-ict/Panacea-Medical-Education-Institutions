import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader } from '@/components/common/Card'
import { StatusBadge } from '@/components/common/Badge'
import { DemoTag } from '@/components/common/EmptyState'
import { DataTable, type Column } from '@/components/common/DataTable'
import { MiniStats } from '@/components/dashboard/StatCard'
import { Guard } from '@/routes/Guard'
import { useDemo } from '@/store/DemoStore'
import { draftMarks, examAverage, publishedExams } from '@/store/selectors'
import { formatDate, formatPercent } from '@/utils/format'
import type { Exam } from '@/types'

export default function ExaminationsPage() {
  const { state } = useDemo()

  const exams = [...state.exams].sort((a, b) => b.startDate.localeCompare(a.startDate))
  const latest = exams[0]
  const latestStats = latest ? examAverage(state, latest.id) : null

  const enteredFor = (examId: string) => state.marks.filter((mark) => mark.examId === examId).length

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
      key: 'classes',
      header: 'Classes',
      align: 'right',
      sortValue: (exam) => exam.classIds.length,
      sortable: true,
      render: (exam) => <span className="tabular-nums text-ink">{exam.classIds.length}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (exam) => <StatusBadge status={exam.published ? 'published' : 'draft'} />,
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
          <span className={average >= 60 ? 'font-semibold text-success' : average >= 40 ? 'font-semibold text-warn' : 'font-semibold text-danger'}>
            {formatPercent(average)}
          </span>
        )
      },
    },
    {
      key: 'entered',
      header: 'Marks entered',
      align: 'right',
      sortable: true,
      sortValue: (exam) => enteredFor(exam.id),
      render: (exam) => <span className="tabular-nums text-ink">{enteredFor(exam.id)}</span>,
    },
  ]

  const summary = [
    {
      label: 'Published exams',
      value: publishedExams(state).length,
      hint: `${exams.length} configured in total`,
    },
    {
      label: 'Marks recorded',
      value: state.marks.length,
      hint: 'Draft and published entries',
    },
    {
      label: 'Draft marks',
      value: draftMarks(state),
      hint: 'Hidden until published',
    },
    {
      label: 'Students appeared',
      value: latestStats?.appeared ?? 0,
      hint: latest ? latest.shortName : 'No examination yet',
    },
  ]

  return (
    <Guard permission="reports.view">
      <>
        <PageHeader
          title="Examination Reports"
          description="Every configured examination with its window, participating classes, status and recorded results."
          actions={<DemoTag />}
        />

        <div className="space-y-4">
          <MiniStats items={summary} />

          <Card>
            <CardHeader
              title="Examination register"
              description="Averages use published marks only — drafts remain excluded until release."
            />
            <div className="p-4">
              <DataTable
                columns={columns}
                rows={exams}
                getRowKey={(exam) => exam.id}
                searchValue={(exam) => `${exam.name} ${exam.shortName} ${exam.type}`}
                pageSize={8}
                emptyTitle="No examinations configured"
                emptyDescription="Examinations appear here once the academic schedule is set up."
              />
            </div>
          </Card>
        </div>
      </>
    </Guard>
  )
}
