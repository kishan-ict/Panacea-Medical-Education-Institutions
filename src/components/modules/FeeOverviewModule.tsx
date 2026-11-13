import { useMemo } from 'react'
import { AlertTriangle, Receipt, TrendingUp, Wallet } from 'lucide-react'
import type { Student } from '@/types'
import { useDemo } from '@/store/DemoStore'
import { classCode, feeByCategory, feeSummary, feeTrend, todayReceipts } from '@/store/selectors'
import { PROGRAMMES } from '@/data/constants/institution'
import { formatMoney, formatPercent, percent } from '@/utils/format'
import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { DataTable, type Column } from '@/components/common/DataTable'
import { DemoTag } from '@/components/common/EmptyState'
import { ProgressBar } from '@/components/common/Progress'
import { StatCard, StatGrid } from '@/components/dashboard/StatCard'
import { BarSeriesChart, CHART_COLORS, TrendChart } from '@/components/charts/Charts'

/** Long fee category names are abbreviated for the axis of the demo chart. */
const CATEGORY_LABEL: Record<string, string> = {
  'Tuition Fee': 'Tuition',
  'Admission Fee': 'Admission',
  'Examination Fee': 'Examination',
  'Library Fee': 'Library',
  'Hostel Fee': 'Hostel',
}

interface OutstandingRow {
  student: Student
  due: number
  pendingRecords: number
}

/**
 * Institutional fee analytics — read-only for the Chairman and Director.
 * Every figure is derived from the demonstration dataset in the browser.
 */
export function FeeOverviewModule() {
  const { state } = useDemo()

  const summary = feeSummary(state)
  const today = todayReceipts(state)
  const collectionPct = percent(summary.collected, summary.expected)

  const trend = feeTrend(state)

  const byCategory = feeByCategory(state).map((row) => ({
    name: CATEGORY_LABEL[row.category] ?? row.category.replace(/\s+Fee$/i, ''),
    collected: row.collected,
    expected: row.expected,
  }))

  const byProgramme = useMemo(
    () =>
      PROGRAMMES.map((programme) => {
        const students = state.students.filter((student) => student.programCode === programme.code)
        const ids = new Set(students.map((student) => student.id))
        const fees = state.feeRecords.filter((fee) => ids.has(fee.studentId))
        const expected = fees.reduce((sum, fee) => sum + fee.amount, 0)
        const collected = fees.reduce((sum, fee) => sum + fee.paidAmount, 0)
        return {
          code: programme.code,
          short: programme.short,
          name: programme.name,
          students: students.length,
          expected,
          collected,
          outstanding: Math.max(0, expected - collected),
        }
      }),
    [state.students, state.feeRecords],
  )

  const outstanding = useMemo<OutstandingRow[]>(
    () =>
      state.students
        .map((student) => {
          const fees = state.feeRecords.filter((fee) => fee.studentId === student.id)
          const due = fees.reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0)
          return { student, due, pendingRecords: fees.filter((fee) => fee.status !== 'paid').length }
        })
        .sort((a, b) => b.due - a.due)
        .slice(0, 10),
    [state.students, state.feeRecords],
  )

  const columns: Column<OutstandingRow>[] = [
    {
      key: 'student',
      header: 'Student',
      sortable: true,
      sortValue: (row) => row.student.name,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.student.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{row.student.name}</p>
            <p className="truncate text-[11px] text-ink3">{row.student.admissionNo}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class',
      sortable: true,
      sortValue: (row) => classCode(state, row.student.classId),
      render: (row) => <span className="text-[13px] text-ink2">{classCode(state, row.student.classId)}</span>,
    },
    {
      key: 'due',
      header: 'Due',
      align: 'right',
      sortable: true,
      sortValue: (row) => row.due,
      render: (row) => (
        <span className="font-semibold tabular-nums text-ink">{formatMoney(row.due)}</span>
      ),
    },
    {
      key: 'records',
      header: 'Pending records',
      align: 'right',
      sortable: true,
      sortValue: (row) => row.pendingRecords,
      render: (row) => <span className="tabular-nums text-ink2">{row.pendingRecords}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) =>
        row.pendingRecords === 0 ? (
          <Badge tone="success">Settled</Badge>
        ) : (
          <Badge tone="warn">Outstanding</Badge>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold text-ink">Fee overview</h2>
            <DemoTag />
          </div>
          <p className="mt-0.5 text-[13px] text-ink2">
            Collection position across the institution for the academic session 2026-27.
          </p>
        </div>
      </div>

      <StatGrid>
        <StatCard
          label="Total expected"
          value={formatMoney(summary.expected)}
          icon={<Wallet className="h-4 w-4" />}
          showDemoTag
          hint={`${summary.records} fee records on file`}
        />
        <StatCard
          label="Collected"
          value={formatMoney(summary.collected)}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="success"
          delta={{ value: formatPercent(collectionPct), direction: 'flat' }}
          hint="collected against expected fees"
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(summary.outstanding)}
          icon={<AlertTriangle className="h-4 w-4" />}
          tone="warn"
          hint={`${summary.pendingRecords} fee records not fully paid`}
        />
        <StatCard
          label="Receipts issued"
          value={state.receipts.length}
          icon={<Receipt className="h-4 w-4" />}
          tone="royal"
          hint={`today: ${today.length}`}
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Collection trend" description="Amount received, grouped by month" compact />
          <CardBody>
            <TrendChart
              data={trend}
              xKey="month"
              series={[{ key: 'amount', name: 'Amount collected' }]}
              yFormatter={(value) => formatMoney(value)}
              area
              height={240}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Category-wise collection"
            description="Expected against collected, by fee category"
            compact
          />
          <CardBody>
            <BarSeriesChart
              data={byCategory}
              xKey="name"
              bars={[
                { key: 'expected', name: 'Expected', color: CHART_COLORS[3] },
                { key: 'collected', name: 'Collected', color: CHART_COLORS[1] },
              ]}
              yFormatter={(value) => formatMoney(value)}
              horizontal={false}
              height={240}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Collection by programme"
          description="Billed, collected and outstanding per programme"
          compact
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left" style={{ minWidth: '720px' }}>
              <thead>
                <tr className="border-b border-line bg-muted/70">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink3">Programme</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-ink3">
                    Students
                  </th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-ink3">
                    Expected
                  </th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-ink3">
                    Collected
                  </th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-ink3">
                    Outstanding
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink3">Progress</th>
                </tr>
              </thead>
              <tbody>
                {byProgramme.map((row) => (
                  <tr key={row.code} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-ink">{row.short}</p>
                      <p className="text-[11px] text-ink3">{row.name}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] tabular-nums text-ink">{row.students}</td>
                    <td className="px-4 py-3 text-right text-[13px] tabular-nums text-ink2">
                      {formatMoney(row.expected)}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-semibold tabular-nums text-success">
                      {formatMoney(row.collected)}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] tabular-nums text-warn">
                      {formatMoney(row.outstanding)}
                    </td>
                    <td className="px-4 py-3">
                      <ProgressBar
                        value={row.collected}
                        max={row.expected}
                        tone="auto"
                        showLabel
                        className="min-w-[8rem]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-ink">Highest outstanding accounts</h3>
          <p className="text-xs text-ink2">Top 10 by outstanding balance</p>
        </div>
        <DataTable
          columns={columns}
          rows={outstanding}
          getRowKey={(row) => row.student.id}
          searchValue={(row) => `${row.student.name} ${row.student.admissionNo}`}
          searchPlaceholder="Search student or admission number…"
          pageSize={10}
          emptyTitle="No outstanding accounts"
          emptyDescription="Every demonstration student has settled their fee records."
        />
      </div>

      <p className="text-xs leading-5 text-ink3">
        Figures are calculated from the demonstration dataset; no payment gateway or banking service is connected.
      </p>
    </div>
  )
}

export default FeeOverviewModule
