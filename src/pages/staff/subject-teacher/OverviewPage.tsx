import { Link } from 'react-router-dom'
import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Lock,
  Megaphone,
  Save,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Badge, type BadgeTone } from '@/components/common/Badge'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'
import { DataTable, type Column } from '@/components/common/DataTable'
import { StatCard, StatGrid } from '@/components/dashboard/StatCard'
import { useAuth } from '@/store/auth'
import { useDemo } from '@/store/DemoStore'
import {
  classCode,
  classesForTeacher,
  draftMarks,
  noticesFor,
  overallAttendance,
  pendingMarks,
  subjectName,
  subjectsForTeacher,
  type TeacherSubjectRow,
} from '@/store/selectors'
import { WEEK_DAYS, formatPercent, relativeTime } from '@/utils/format'

const NOTICE_PRIORITY: Record<'high' | 'normal' | 'low', { tone: BadgeTone; label: string }> = {
  high: { tone: 'danger', label: 'High' },
  normal: { tone: 'info', label: 'Normal' },
  low: { tone: 'neutral', label: 'Low' },
}

/**
 * Subject teacher overview — allocations, today's teaching load, pending
 * marks and the notices visible to this role. Every figure is read through
 * `@/store/selectors` so it can never disagree with the modules below it.
 */
export default function OverviewPage() {
  const { session } = useAuth()
  const { state } = useDemo()

  const teacherId = session?.linkedId ?? ''
  const classes = classesForTeacher(state, teacherId)
  const allocations = subjectsForTeacher(state, teacherId)
  const attendance = overallAttendance(state, { classIds: classes.map((cls) => cls.id) })
  const pending = pendingMarks(state, teacherId)
  const drafts = draftMarks(state, teacherId)
  const todayName = WEEK_DAYS[(new Date().getDay() + 6) % 7]
  const todaySlots = state.timetable
    .filter((slot) => slot.teacherId === teacherId && slot.day === todayName)
    .sort((a, b) => a.period - b.period)
  const notices = noticesFor(state, { role: 'subjectTeacher' }).slice(0, 4)

  const columns: Column<TeacherSubjectRow>[] = [
    {
      key: 'class',
      header: 'Class',
      sortable: true,
      sortValue: (row) => row.cls.code,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink">{row.cls.code}</p>
          <p className="truncate text-[11px] text-ink3">{row.cls.name}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      sortable: true,
      sortValue: (row) => row.subject.name,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink">{row.subject.name}</p>
          <p className="truncate text-[11px] text-ink3">{row.subject.code}</p>
        </div>
      ),
    },
    {
      key: 'lead',
      header: 'Timetable',
      render: (row) =>
        row.isLead ? <Badge tone="brand">Lead</Badge> : <Badge tone="outline">Assigned</Badge>,
    },
  ]

  if (classes.length === 0) {
    return (
      <>
        <PageHeader
          title="Teaching Overview"
          description="Your allocated classes, subjects and teaching load for the current academic session."
          actions={<DemoTag />}
        />
        <EmptyState
          icon={Lock}
          title="No allocations yet"
          description="No class or subject is allocated to your account. Ask the office of the Principal to allocate a class or subject to you."
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Teaching Overview"
        description={`Allocated classes, subjects, marks and today's teaching load for ${
          session?.displayName ?? 'your account'
        }.`}
        actions={<DemoTag />}
      />

      <div className="space-y-4">
        <StatGrid>
          <StatCard
            label="Classes taught"
            value={classes.length}
            icon={<GraduationCap className="h-4 w-4" />}
            hint="classes you teach this session"
          />
          <StatCard
            label="Subjects taught"
            value={allocations.length}
            icon={<BookOpen className="h-4 w-4" />}
            tone="brand"
            hint="subject–class allocations"
          />
          <StatCard
            label="Pending marks"
            value={pending}
            icon={<ClipboardList className="h-4 w-4" />}
            tone="gold"
            hint="entries not yet saved for the open exam"
          />
          <StatCard
            label="Draft marks"
            value={drafts}
            icon={<Save className="h-4 w-4" />}
            tone={drafts > 0 ? 'warn' : 'default'}
            hint="saved but not published"
          />
          <StatCard
            label="Class attendance"
            value={formatPercent(attendance.pct)}
            icon={<CalendarCheck className="h-4 w-4" />}
            tone={attendance.pct >= 75 ? 'success' : 'warn'}
            hint="across your allocated classes"
          />
        </StatGrid>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="My allocations"
              description="Subjects and classes assigned to you for the current session"
              icon={<BookOpen className="h-4 w-4" />}
            />
            <CardBody>
              <DataTable
                columns={columns}
                rows={allocations}
                getRowKey={(row) => row.assignmentId}
                searchValue={(row) => `${row.cls.code} ${row.cls.name} ${row.subject.name} ${row.subject.code}`}
                pageSize={8}
                dense
                emptyTitle="No subject allocations"
                emptyDescription="Allocations appear here once the office of the Principal assigns them to your account."
              />
            </CardBody>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader
                title="Today's classes"
                description="Periods scheduled for you on the current day"
                icon={<CalendarDays className="h-4 w-4" />}
              />
              <CardBody className="pt-2">
                {todaySlots.length === 0 ? (
                  <EmptyState
                    compact
                    icon={CalendarDays}
                    title="No classes today"
                    description="Your next scheduled period appears here when the timetable places one on today's date."
                  />
                ) : (
                  <ul className="divide-y divide-line">
                    {todaySlots.map((slot) => (
                      <li key={slot.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-ink">
                            Period {slot.period} · {subjectName(state, slot.subjectId)}
                          </p>
                          <p className="truncate text-[11px] text-ink3">
                            {classCode(state, slot.classId)} · {slot.room}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] tabular-nums text-ink2">
                          {slot.startTime}–{slot.endTime}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Notices"
                description="Circulars relevant to your role"
                icon={<Megaphone className="h-4 w-4" />}
                action={
                  <Link
                    to="/staff/subject-teacher/notices"
                    className="text-xs font-medium text-royal transition hover:underline"
                  >
                    Open
                  </Link>
                }
              />
              <CardBody className="pt-2">
                {notices.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Megaphone}
                    title="No notices yet"
                    description="Circulars published to your role appear here."
                  />
                ) : (
                  <ul className="divide-y divide-line">
                    {notices.map((notice) => (
                      <li key={notice.id}>
                        <Link
                          to="/staff/subject-teacher/notices"
                          className="flex items-start justify-between gap-3 py-3 transition hover:text-royal"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-ink">{notice.title}</p>
                            <p className="mt-0.5 truncate text-[11px] text-ink3">
                              {notice.category} · {relativeTime(notice.publishedAt)}
                            </p>
                          </div>
                          <Badge tone={NOTICE_PRIORITY[notice.priority].tone}>
                            {NOTICE_PRIORITY[notice.priority].label}
                          </Badge>
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
