import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileBarChart2,
  GraduationCap,
  IndianRupee,
  LifeBuoy,
  Receipt,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'
import { BarList, ProgressBar } from '@/components/common/Progress'
import { StatCard, StatGrid } from '@/components/dashboard/StatCard'
import { DonutChart, TrendChart } from '@/components/charts/Charts'
import { Guard } from '@/routes/Guard'
import { useDemo } from '@/store/DemoStore'
import {
  attendanceTrend,
  courseDistribution,
  departmentFaculty,
  institutionalStats,
  pendingEventApprovals,
} from '@/store/selectors'
import { INSTITUTION, LEADERSHIP } from '@/data/constants/institution'
import { formatDate, formatMoney, formatPercent } from '@/utils/format'

interface QuickLink {
  to: string
  icon: LucideIcon
  title: string
  description: string
}

const QUICK_LINKS: QuickLink[] = [
  {
    to: '/director/students',
    icon: GraduationCap,
    title: 'Student Statistics',
    description: 'Institution-wide roster with audit-logged record access.',
  },
  {
    to: '/director/faculty',
    icon: Users,
    title: 'Faculty Overview',
    description: 'Teaching staff by department with status controls.',
  },
  {
    to: '/director/reports',
    icon: FileBarChart2,
    title: 'Institutional Reports',
    description: 'Attendance, examination, fee and staffing report cards.',
  },
  {
    to: '/director/assistant',
    icon: Sparkles,
    title: 'AI Institutional Assistant',
    description: 'Ask questions across the demonstration dataset.',
  },
]

export default function OverviewPage() {
  const { state } = useDemo()

  const stats = institutionalStats(state)
  const trend = attendanceTrend(state, { weeks: 8 })
  const courses = courseDistribution(state)
  const departments = departmentFaculty(state)
  const pending = pendingEventApprovals(state)

  return (
    <Guard permission="institutional.overview">
      <>
        <PageHeader
          title="Director Overview"
          description={
            <>
              Welcome back, <span className="font-medium text-ink">{LEADERSHIP[1].name}</span> — Director of{' '}
              {INSTITUTION.name}. Academic session {INSTITUTION.academicYear}.
            </>
          }
          actions={<DemoTag />}
        />

        <div className="space-y-4">
          <StatGrid>
            <StatCard
              label="Active students"
              value={stats.students}
              icon={<GraduationCap className="h-4 w-4" />}
              hint={`${stats.classes} classes across ${stats.courses} programmes`}
            />
            <StatCard
              label="Teaching staff"
              value={stats.teachers}
              icon={<Users className="h-4 w-4" />}
              tone="brand"
              hint={`${stats.departments} departments`}
            />
            <StatCard
              label="Overall attendance"
              value={formatPercent(stats.attendancePct)}
              icon={<CalendarCheck className="h-4 w-4" />}
              tone={stats.attendancePct >= 75 ? 'success' : 'warn'}
              hint={stats.attendancePct >= 75 ? 'Meets the 75% expectation' : 'Below the 75% expectation'}
            />
            <StatCard
              label="Latest exam average"
              value={formatPercent(stats.examPct)}
              icon={<TrendingUp className="h-4 w-4" />}
              tone={stats.examPct >= 60 ? 'success' : 'warn'}
              hint={stats.examName}
            />
            <StatCard
              label="Fee collected"
              value={formatMoney(stats.collected)}
              icon={<IndianRupee className="h-4 w-4" />}
              tone="royal"
              hint={`Expected ${formatMoney(stats.expected)} · outstanding ${formatMoney(stats.outstanding)}`}
            />
            <StatCard
              label="Pending approvals"
              value={stats.pendingApprovals}
              icon={<ClipboardList className="h-4 w-4" />}
              tone={stats.pendingApprovals ? 'warn' : 'success'}
              hint="Events awaiting review"
            />
            <StatCard
              label="Open tickets"
              value={stats.openTickets}
              icon={<LifeBuoy className="h-4 w-4" />}
              tone={stats.openTickets ? 'warn' : 'success'}
              hint="Help desk queue"
            />
            <StatCard
              label="Receipts issued"
              value={stats.receipts}
              icon={<Receipt className="h-4 w-4" />}
              tone="gold"
              hint="Fee receipts recorded"
            />
          </StatGrid>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Attendance trend"
                description="Weekly institutional attendance across the last 8 weeks"
                icon={<CalendarCheck className="h-4 w-4" />}
              />
              <CardBody>
                <TrendChart
                  data={trend}
                  xKey="label"
                  series={[{ key: 'pct', name: 'Attendance %' }]}
                  yDomain={[0, 100]}
                  yFormatter={(value) => `${value}%`}
                  height={250}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Students by programme"
                description="Active roster distribution across the approved courses"
                icon={<GraduationCap className="h-4 w-4" />}
              />
              <CardBody>
                <DonutChart data={courses} centerValue={stats.students} centerLabel="Students" height={250} />
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader
                title="Department strength"
                description="Teaching staff assigned to each department"
                icon={<Building2 className="h-4 w-4" />}
              />
              <CardBody>
                <BarList
                  suffix=""
                  rows={departments.map((dept) => ({
                    label: dept.department,
                    value: dept.faculty,
                    hint: dept.head,
                  }))}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Awaiting approval"
                description="Events submitted for institutional review"
                icon={<CalendarDays className="h-4 w-4" />}
                action={
                  <Link to="/director/events" className="text-xs font-medium text-royal transition hover:underline">
                    Review all
                  </Link>
                }
              />
              <CardBody className="pt-2">
                {pending.length === 0 ? (
                  <EmptyState
                    compact
                    icon={CalendarDays}
                    title="Nothing awaiting approval"
                    description="New event submissions will appear here for your review."
                  />
                ) : (
                  <ul className="divide-y divide-line">
                    {pending.slice(0, 5).map((event) => (
                      <li key={event.id}>
                        <Link
                          to="/director/events"
                          className="flex items-start justify-between gap-3 py-3 transition hover:text-royal"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-ink">{event.title}</p>
                            <p className="mt-0.5 truncate text-[11px] text-ink3">
                              {event.createdByName} · {event.organizer}
                            </p>
                          </div>
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            <Badge tone="warn">Pending</Badge>
                            <span className="text-[11px] tabular-nums text-ink3">{formatDate(event.date)}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Fee collection"
                description={`Collected against expected demand for ${INSTITUTION.academicYear}`}
                icon={<IndianRupee className="h-4 w-4" />}
                action={
                  <Link to="/director/fees" className="text-xs font-medium text-royal transition hover:underline">
                    Open fees
                  </Link>
                }
              />
              <CardBody>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-ink3">Collected</p>
                    <p className="mt-1 font-display text-2xl font-bold text-ink tabular-nums">
                      {formatMoney(stats.collected)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wide text-ink3">Expected</p>
                    <p className="mt-1 text-[15px] font-semibold text-ink tabular-nums">
                      {formatMoney(stats.expected)}
                    </p>
                  </div>
                </div>
                <ProgressBar className="mt-4" value={stats.collected} max={stats.expected} tone="royal" showLabel />
                <p className="mt-3 text-xs text-ink2">
                  Outstanding{' '}
                  <span className="font-medium text-ink">{formatMoney(stats.outstanding)}</span>
                </p>
                <Link
                  to="/director/fees"
                  className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-royal transition hover:underline"
                >
                  Review collection detail
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardBody>
            </Card>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink">Quick links</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group flex items-start gap-3 rounded-panel border border-line bg-panel p-4 shadow-card transition hover:border-royal/40 hover:bg-muted/60"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-royal-soft text-royal">
                    <link.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 text-[13px] font-semibold text-ink">
                      {link.title}
                      <ArrowRight className="h-3.5 w-3.5 text-ink3 transition group-hover:translate-x-0.5 group-hover:text-royal" />
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-ink2">{link.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </>
    </Guard>
  )
}
