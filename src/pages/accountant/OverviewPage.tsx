import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, IndianRupee, Receipt as ReceiptIcon, TrendingUp } from 'lucide-react'
import type { Receipt } from '@/types'
import { useDemo } from '@/store/DemoStore'
import { feeByCategory, feeSummary, feeTrend, todayReceipts } from '@/store/selectors'
import { formatMoney, formatPercent, percent } from '@/utils/format'
import { Guard } from '@/routes/Guard'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { DemoTag } from '@/components/common/EmptyState'
import { StatCard, StatGrid } from '@/components/dashboard/StatCard'
import { BarSeriesChart, TrendChart } from '@/components/charts/Charts'
import { ReceiptPreview, ReceiptTable } from '@/components/modules/StudentFeesModule'

/** Accountant landing page — collection position at a glance. */
export default function OverviewPage() {
  const { state } = useDemo()
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  const summary = feeSummary(state)
  const today = todayReceipts(state)
  const collectedPct = percent(summary.collected, summary.expected)
  const todayCollected = today.reduce((sum, row) => sum + row.amount, 0)
  const nameMap = Object.fromEntries(
    state.students.map((student) => [student.id, student.name] as const),
  )

  return (
    <Guard permission="fees.overview">
      <PageHeader
        title="Accounts overview"
        description="Fee collection position for the academic session — every figure is derived from the demonstration dataset held in this browser."
        actions={
          <>
            <DemoTag label={`${state.receipts.length} demo receipts`} />
            <Link to="/accountant/new-receipt">
              <Button icon={<ReceiptIcon className="h-4 w-4" />}>Create receipt</Button>
            </Link>
          </>
        }
      />

      <div className="space-y-4">
        <StatGrid>
          <StatCard
            label="Total expected"
            value={formatMoney(summary.expected)}
            icon={<IndianRupee className="h-4 w-4" />}
            hint={`${summary.records} fee records on file`}
          />
          <StatCard
            label="Collected"
            value={formatMoney(summary.collected)}
            icon={<TrendingUp className="h-4 w-4" />}
            tone="success"
            hint={`${formatPercent(collectedPct)} of expected collected`}
          />
          <StatCard
            label="Outstanding"
            value={formatMoney(summary.outstanding)}
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="warn"
            hint={`${summary.pendingRecords} fee records not fully paid`}
          />
          <StatCard
            label="Receipts today"
            value={today.length}
            icon={<ReceiptIcon className="h-4 w-4" />}
            tone="royal"
            hint={formatMoney(todayCollected)}
          />
        </StatGrid>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Collection trend"
              description="Amount received, grouped by month"
              compact
            />
            <CardBody>
              <TrendChart
                data={feeTrend(state)}
                xKey="month"
                series={[{ key: 'amount', name: 'Collected', color: 'var(--c-chart-2)' }]}
                yFormatter={(value) => formatMoney(value)}
                area
                height={240}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="By fee head"
              description="Expected against collected, per fee head"
              compact
            />
            <CardBody>
              <BarSeriesChart
                data={feeByCategory(state)}
                xKey="category"
                bars={[
                  { key: 'expected', name: 'Expected', color: 'var(--c-chart-4)' },
                  { key: 'collected', name: 'Collected', color: 'var(--c-chart-2)' },
                ]}
                yFormatter={(value) => formatMoney(value)}
                horizontal
                height={260}
              />
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Recent receipts"
            description="Latest receipts issued by the accounts office — open a row to preview and print it."
          />
          <div className="p-4">
            <ReceiptTable
              receipts={state.receipts.slice(0, 6)}
              showStudent
              studentNames={nameMap}
              onOpen={setReceipt}
            />
          </div>
        </Card>

        <ReceiptPreview receipt={receipt} onClose={() => setReceipt(null)} />
      </div>
    </Guard>
  )
}
