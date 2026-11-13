import { Link } from 'react-router-dom'
import { CalendarCheck, CalendarDays, ClipboardCheck, Lock, Megaphone, Users } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardBody, CardHeader, KeyValue } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'
import { StatCard, StatGrid } from '@/components/dashboard/StatCard'
import { useAuth } from '@/store/auth'
import { useDemo } from '@/store/DemoStore'
import {
  classAttendance,
  classTeacherOf,
  draftMarks,
  noticesFor,
  pendingEventApprovals,
  pendingMarks,
  programName,
  studentsOfClass,
} from '@/store/selectors'
import { formatPercent, relativeTime } from '@/utils/format'

export default function OverviewPage() {
  const { state } = useDemo()
  const { session } = useAuth()

  const ownClass = classTeacherOf(state, session?.linkedId ?? '')

  if (!ownClass) {
    return (
      <>
        <PageHeader
          title="Class Teacher Overview"
          description="Your class-teacher workspace for the current academic session."
          actions={<DemoTag />}
        />
        <EmptyState
          icon={Lock}
          title="You are not a class teacher yet"
          description="Class-teacher responsibilities are allocated in the office of the Principal. Please contact the office of the Principal to be assigned a class, then return to this overview."
        />
      </>
    )
  }

  const tally = classAttendance(state, ownClass.id)
  const students = studentsOfClass(state, ownClass.id)
  const marksPending = pendingMarks(state, session?.linkedId ?? undefined)
  const draftCount = draftMarks(state, session?.linkedId ?? undefined)
  const approvals = pendingEventApprovals(state, [ownClass.id])
  const notices = noticesFor(state, { role: 'classTeacher', classId: ownClass.id }).slice(0, 4)

  const attention: { key: string; text: string; tone: 'warn' | 'gold' | 'danger'; to: string; cta: string }[] = []
  if (draftCount > 0) {
    attention.push({
      key: 'drafts',
      text: `${draftCount} mark${draftCount === 1 ? '' : 's'} saved as draft — publish them once verification is complete.`,
      tone: 'gold',
      to: '/staff/class-teacher/marks',
      cta: 'Open marks',
    })
  }
  if (approvals.length > 0) {
    attention.push({
      key: 'approvals',
      text: `${approvals.length} event submission${approvals.length === 1 ? '' : 's'} from your class await your approval.`,
      tone: 'warn',
      to: '/staff/class-teacher/events',
      cta: 'Review events',
    })
  }
  if (tally.pct < 75) {
    attention.push({
      key: 'attendance',
      text: `Class attendance is ${formatPercent(tally.pct)} — below the 75% expectation for the session.`,
      tone: 'danger',
      to: '/staff/class-teacher/attendance',
      cta: 'Open attendance',
    })
  }

  return (
    <>
      <PageHeader
        title={`Welcome back, ${session?.displayName ?? 'Teacher'}`}
        description={`${ownClass.name} · class-teacher workspace for the academic session ${ownClass.academicYear}.`}
        actions={<DemoTag />}
      />

      <div className="space-y-4">
        <StatGrid>
          <StatCard
            label="Class attendance"
            value={formatPercent(tally.pct)}
            icon={<CalendarCheck className="h-4 w-4" />}
            tone={tally.pct >= 75 ? 'success' : 'warn'}
            hint={tally.pct >= 75 ? 'Meets the 75% expectation' : 'Below the 75% expectation'}
          />
          <StatCard
            label="Students in class"
            value={students.length}
            icon={<Users className="h-4 w-4" />}
            tone="brand"
            hint={`${ownClass.code} · room ${ownClass.room}`}
          />
          <StatCard
            label="Marks pending entry"
            value={marksPending}
            icon={<ClipboardCheck className="h-4 w-4" />}
            tone="gold"
            hint="Slots not yet entered for the next examination"
          />
          <StatCard
            label="Event approvals"
            value={approvals.length}
            icon={<CalendarDays className="h-4 w-4" />}
            tone={approvals.length ? 'warn' : 'success'}
            hint="Submissions from your class"
          />
        </StatGrid>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader
              title="Class at a glance"
              description="The class record you are accountable for"
              icon={<Users className="h-4 w-4" />}
            />
            <CardBody className="divide-y divide-line">
              <KeyValue label="Class teacher" value={session?.displayName ?? '—'} />
              <KeyValue label="Programme" value={programName(ownClass.programCode)} />
              <KeyValue label="Academic year" value={ownClass.academicYear} />
              <KeyValue label="Room" value={ownClass.room} />
              <KeyValue label="Students" value={students.length} />
              <KeyValue label="Attendance" value={formatPercent(tally.pct)} />
            </CardBody>
          </Card>

          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader
                title="Needs your attention"
                description="Draft marks, pending approvals and attendance standing for your class"
                icon={<ClipboardCheck className="h-4 w-4" />}
              />
              <CardBody className="pt-2">
                {attention.length === 0 ? (
                  <EmptyState
                    compact
                    icon={CalendarCheck}
                    title="Nothing needs your attention"
                    description="Draft marks are published, no events await approval and attendance meets the expectation."
                  />
                ) : (
                  <ul className="divide-y divide-line">
                    {attention.map((item) => (
                      <li key={item.key}>
                        <div className="flex items-start justify-between gap-3 py-3">
                          <p className="min-w-0 text-[13px] leading-5 text-ink2">
                            <span
                              className={
                                item.tone === 'gold'
                                  ? 'font-semibold text-gold'
                                  : item.tone === 'warn'
                                    ? 'font-semibold text-warn'
                                    : 'font-semibold text-danger'
                              }
                            >
                              {item.text}
                            </span>
                          </p>
                          <Link
                            to={item.to}
                            className="shrink-0 text-[13px] font-medium text-royal transition hover:underline"
                          >
                            {item.cta}
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Recent notices"
                description="Circulars addressed to your class"
                icon={<Megaphone className="h-4 w-4" />}
                action={
                  <Link
                    to="/staff/class-teacher/notices"
                    className="text-xs font-medium text-royal transition hover:underline"
                  >
                    Open notices
                  </Link>
                }
              />
              <CardBody className="pt-2">
                {notices.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Megaphone}
                    title="No notices for your class"
                    description="Circulars published to your class or programme will appear here."
                  />
                ) : (
                  <ul className="divide-y divide-line">
                    {notices.map((notice) => (
                      <li key={notice.id}>
                        <Link
                          to="/staff/class-teacher/notices"
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
  )
}
