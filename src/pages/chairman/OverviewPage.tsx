import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileBarChart2,
  GraduationCap,
  IndianRupee,
  LifeBuoy,
  Megaphone,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Badge, type BadgeTone } from '@/components/common/Badge'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'
import { StatCard, StatGrid } from '@/components/dashboard/StatCard'
import { DonutChart, TrendChart } from '@/components/charts/Charts'
import { Guard } from '@/routes/Guard'
import { useDemo } from '@/store/DemoStore'
import {
  attendanceTrend,
  courseDistribution,
  institutionalStats,
  noticesFor,
  pendingEventApprovals,
} from '@/store/selectors'
import { INSTITUTION, LEADERSHIP } from '@/data/constants/institution'
import { formatDate, formatMoney, formatPercent, relativeTime } from '@/utils/format'
import type { Notice } from '@/types'

const NOTICE_PRIORITY: Record<Notice['priority'], { tone: BadgeTone; label: string }> = {
  high: { tone: 'danger', label: 'High' },
  normal: { tone: 'info', label: 'Normal' },
  low: { tone: 'neutral', label: 'Low' },
}

interface QuickLink {
  to: string
  icon: LucideIcon
  title: string
  description: string
}

const QUICK_LINKS: QuickLink[] = [
  {
    to: '/chairman/students',
    icon: GraduationCap,
    title: 'Student Management',
    description: 'Institution-wide roster with audit-logged record access.',
  },
  {
    to: '/chairman/reports',
    icon: FileBarChart2,
    title: 'Institutional Reports',
    description: 'Attendance, examination, fee and staffing report cards.',
  },
  {
    to: '/chairman/assistant',
    icon: Sparkles,
    title: 'AI Institutional Assistant',
    description: 'Ask questions across the demonstration dataset.',
  },
  {
    to: '/chairman/helpdesk',
    icon: LifeBuoy,
    title: 'Developer Help Desk',
    description: 'Track tickets raised against this prototype.',
  },
  {
    to: '/chairman/fees',
    icon: IndianRupee,
    title: 'Fee Overview',
    description: 'Collection, outstanding demand and the monthly trend.',
  },
  {
    to: '/chairman/notices',
    icon: Megaphone,
    title: 'Notices',
    description: 'Publish institutional circulars to programmes and classes.',
  },
]

export default function OverviewPage() {
  const { state } = useDemo()

  const stats = institutionalStats(state)
  const trend = attendanceTrend(state, { weeks: 8 })
  const courses = courseDistribution(state)
  const pending = pendingEventApprovals(state)
  const notices = noticesFor(state, { role: 'chairman' }).slice(0, 5)

  return (
    <Guard permission="institutional.overview">
      <>
        <PageHeader
          title="Chairman Overview"
          description={
            <>
              Welcome back, <span className="font-medium text-ink">{LEADERSHIP[0].name}</span> — Chairman of{' '}
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
              hint={`Outstanding ${formatMoney(stats.outstanding)}`}
            />
            <StatCard
              label="Pending approvals"
              value={stats.pendingApprovals}
              icon={<ClipboardList className="h-4 w-4" />}
              tone={stats.pendingApprovals ? 'warn' : 'success'}
              hint="Events awaiting review"
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
                <DonutChart
                  data={courses}
                  centerValue={stats.students}
                  centerLabel="Students"
                  height={250}
                />
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Awaiting approval"
                description="Events submitted for institutional review"
                icon={<CalendarDays className="h-4 w-4" />}
                action={
                  <Link to="/chairman/events" className="text-xs font-medium text-royal transition hover:underline">
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
                          to="/chairman/events"
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
                title="Latest notices"
                description="Most recent circulars visible to the Chairman"
                icon={<Megaphone className="h-4 w-4" />}
                action={
                  <Link to="/chairman/notices" className="text-xs font-medium text-royal transition hover:underline">
                    Open notices
                  </Link>
                }
              />
              <CardBody className="pt-2">
                {notices.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Megaphone}
                    title="No notices published"
                    description="Institutional circulars appear here once they are published."
                  />
                ) : (
                  <ul className="divide-y divide-line">
                    {notices.map((notice) => (
                      <li key={notice.id}>
                        <Link
                          to="/chairman/notices"
                          className="flex items-start justify-between gap-3 py-3 transition hover:text-royal"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-ink">{notice.title}</p>
                            <p className="mt-0.5 truncate text-[11px] text-ink3">
                              {notice.category} · {notice.author} · {relativeTime(notice.publishedAt)}
                            </p>
                          </div>
                          <Badge tone={NOTICE_PRIORITY[notice.priority].tone}>{NOTICE_PRIORITY[notice.priority].label}</Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink">Quick links</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
