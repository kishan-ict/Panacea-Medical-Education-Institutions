import { Link } from 'react-router-dom'
import { CalendarCheck, CalendarDays, ClipboardList, GraduationCap, Megaphone, UserCog, Users } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'
import { DataTable, type Column } from '@/components/common/DataTable'
import { StatCard, StatGrid } from '@/components/dashboard/StatCard'
import { Guard } from '@/routes/Guard'
import { useDemo } from '@/store/DemoStore'
import {
  classRosterSummary,
  draftMarks,
  institutionalStats,
  noticesFor,
  overallAttendance,
  pendingEventApprovals,
  unassignedClasses,
} from '@/store/selectors'
import { formatDate, formatPercent, relativeTime } from '@/utils/format'

type RosterRow = ReturnType<typeof classRosterSummary>[number]

export default function OverviewPage() {
  const { state } = useDemo()

  const stats = institutionalStats(state)
  const unassigned = unassignedClasses(state)
  const drafts = draftMarks(state)
  const pending = pendingEventApprovals(state)
  const attendance = overallAttendance(state)
  const roster = classRosterSummary(state)
  const latestNotices = noticesFor(state, { role: 'principal' }).slice(0, 4)

  const rosterColumns: Column<RosterRow>[] = [
    {
      key: 'class',
      header: 'Class',
      sortable: true,
      sortValue: (row) => row.cls.name,
      render: (row) => (
        <div>
          <p className="text-[13px] font-medium text-ink">{row.cls.name}</p>
          <p className="text-[11px] text-ink3">
            {row.cls.code} · {row.cls.academicYear}
          </p>
        </div>
      ),
    },
    {
      key: 'strength',
      header: 'Strength',
      align: 'right',
      sortable: true,
      sortValue: (row) => row.students,
      render: (row) => <span className="tabular-nums text-ink">{row.students}</span>,
    },
    {
      key: 'teacher',
      header: 'Class teacher',
      render: (row) =>
        row.teacher ? (
          <span className="text-[13px] text-ink">{row.teacher.name}</span>
        ) : (
          <Badge tone="gold">Unassigned</Badge>
        ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (row) => (
        <Link
          to="/staff/principal/class-assignment"
          className="text-[13px] font-medium text-royal transition hover:underline"
        >
          {row.teacher ? 'Manage' : 'Assign'}
        </Link>
      ),
    },
  ]

  return (
    <Guard permission="institutional.overview">
      <>
        <PageHeader
          title="Principal Overview"
          description="Institution-wide standing for the current academic session — roster, staffing, approvals and attendance at a glance."
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
              label="Active teachers"
              value={stats.teachers}
              icon={<Users className="h-4 w-4" />}
              tone="brand"
              hint={`${stats.departments} departments represented`}
            />
            <StatCard
              label="Unassigned classes"
              value={unassigned.length}
              icon={<UserCog className="h-4 w-4" />}
              tone={unassigned.length ? 'warn' : 'success'}
              hint={unassigned[0] ? `${unassigned[0].name} needs a class teacher` : 'Every class has a class teacher'}
            />
            <StatCard
              label="Marks awaiting publication"
              value={drafts}
              icon={<ClipboardList className="h-4 w-4" />}
              tone="gold"
              hint="Saved as draft, not yet released"
            />
            <StatCard
              label="Pending approvals"
              value={pending.length}
              icon={<CalendarDays className="h-4 w-4" />}
              tone={pending.length ? 'warn' : 'success'}
              hint="Events awaiting institutional review"
            />
            <StatCard
              label="Overall attendance"
              value={formatPercent(attendance.pct)}
              icon={<CalendarCheck className="h-4 w-4" />}
              tone={attendance.pct >= 75 ? 'success' : 'warn'}
              hint={attendance.pct >= 75 ? 'Meets the 75% expectation' : 'Below the 75% expectation'}
            />
          </StatGrid>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Class roster"
                description="Every class with its strength and accountable class teacher"
                icon={<Users className="h-4 w-4" />}
                action={
                  <Link
                    to="/staff/principal/class-assignment"
                    className="text-xs font-medium text-royal transition hover:underline"
                  >
                    Assign teachers
                  </Link>
                }
              />
              <div className="p-4">
                <DataTable
                  columns={rosterColumns}
                  rows={roster}
                  getRowKey={(row) => row.cls.id}
                  searchValue={(row) => `${row.cls.name} ${row.cls.code} ${row.teacher?.name ?? ''}`}
                  searchPlaceholder="Search class or teacher…"
                  pageSize={8}
                  emptyTitle="No classes configured"
                  emptyDescription="Classes appear here once the academic structure is created."
                />
              </div>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader
                  title="Awaiting approval"
                  description="Events submitted for institutional review"
                  icon={<CalendarDays className="h-4 w-4" />}
                  action={
                    <Link
                      to="/staff/principal/events"
                      className="text-xs font-medium text-royal transition hover:underline"
                    >
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
                      {pending.slice(0, 4).map((event) => (
                        <li key={event.id}>
                          <Link
                            to="/staff/principal/events"
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
                  description="Most recent circulars published to the institution"
                  icon={<Megaphone className="h-4 w-4" />}
                  action={
                    <Link
                      to="/staff/principal/notices"
                      className="text-xs font-medium text-royal transition hover:underline"
                    >
                      Open notices
                    </Link>
                  }
                />
                <CardBody className="pt-2">
                  {latestNotices.length === 0 ? (
                    <EmptyState
                      compact
                      icon={Megaphone}
                      title="No notices published"
                      description="Circulars you publish from the notices page will be listed here."
                    />
                  ) : (
                    <ul className="divide-y divide-line">
                      {latestNotices.map((notice) => (
                        <li key={notice.id}>
                          <Link
                            to="/staff/principal/notices"
                            className="flex items-start justify-between gap-3 py-3 transition hover:text-royal"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-ink">{notice.title}</p>
                              <p className="mt-0.5 truncate text-[11px] text-ink3">
                                {notice.category} · {notice.author}
                              </p>
                            </div>
                            <span className="flex shrink-0 flex-col items-end gap-1">
                              {notice.pinned && <Badge tone="gold">Pinned</Badge>}
                              <span className="text-[11px] tabular-nums text-ink3">
                                {relativeTime(notice.publishedAt)}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </>
    </Guard>
  )
}
