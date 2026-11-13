import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { useDemo } from '@/store/DemoStore'
import { useAuth } from '@/store/auth'
import { attendanceTrend, studentAttendance, subjectsOfClass } from '@/store/selectors'
import { StatCard, StatGrid } from '@/components/dashboard/StatCard'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { TrendChart } from '@/components/charts/Charts'
import { formatPercent } from '@/utils/format'
import { DemoTag } from '@/components/common/EmptyState'

export default function OverviewPage() {
  const { state } = useDemo()
  const { session } = useAuth()
  const sid = session?.linkedId ?? ''
  const tally = studentAttendance(state, sid)
  const subjects = subjectsOfClass(state, state.students.find((s) => s.id === sid)?.classId ?? '')
  return (
    <Guard permission="attendance.analytics">
      <div className="space-y-6">
        <PageHeader
          title="Student overview"
          description="Your attendance, subjects and recent activity."
          actions={<DemoTag />}
        />
        <StatGrid>
          <StatCard label="Attendance" value={formatPercent(tally.pct)} hint={`${tally.present}/${tally.total} classes`} />
          <StatCard label="Subjects" value={subjects.length} />
        </StatGrid>
        <Card>
          <CardHeader title="Attendance trend" />
          <CardBody>
            <TrendChart
              data={attendanceTrend(state)}
              xKey="label"
              yDomain={[0, 100]}
              series={[{ key: 'pct', name: 'Attendance %', color: 'var(--c-chart-1)' }]}
            />
          </CardBody>
        </Card>
      </div>
    </Guard>
  )
}
